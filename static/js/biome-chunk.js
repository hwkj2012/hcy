/**
 * 生物群落查询模块
 * - 输入玩家坐标，查询附近区块的生物群落
 * - 标记目标群落位置，显示最近区块坐标和距离
 */
(function() {
    'use strict';

    // ====== Minecraft 生物群落定义 ======
    var BIOMES = {
        'ocean':           { name: '海洋',        color: '#42a5f5',  temp: 'mid',   wet: 'wet' },
        'plains':          { name: '平原',        color: '#8bc34a',  temp: 'warm',  wet: 'dry' },
        'desert':          { name: '沙漠',        color: '#fdd835',  temp: 'hot',   wet: 'dry' },
        'forest':          { name: '森林',        color: '#7cb342',  temp: 'mid',   wet: 'mid' },
        'taiga':           { name: '针叶林',      color: '#558b2f',  temp: 'cold',  wet: 'mid' },
        'swamp':           { name: '沼泽',        color: '#5d4037',  temp: 'mid',   wet: 'wet' },
        'savanna':         { name: '热带草原',    color: '#c0ca33',  temp: 'hot',   wet: 'dry' },
        'jungle':          { name: '丛林',        color: '#2e7d32',  temp: 'hot',   wet: 'wet' },
        'badlands':        { name: '恶地',        color: '#ef5350',  temp: 'hot',   wet: 'dry' },
        'snowy_taiga':     { name: '积雪针叶林',  color: '#b0bec5',  temp: 'cold',  wet: 'mid' },
        'ice_spikes':      { name: '冰刺平原',    color: '#e0f7fa',  temp: 'cold',  wet: 'dry' },
        'mushroom_fields': { name: '蘑菇岛',      color: '#ab47bc',  temp: 'mid',   wet: 'mid' },
        'dark_forest':     { name: '黑森林',      color: '#1b5e20',  temp: 'mid',   wet: 'mid' },
        'mangrove_swamp':  { name: '红树林沼泽',  color: '#4e342e',  temp: 'mid',   wet: 'wet' },
        'cherry_grove':    { name: '樱花树林',    color: '#f48fb1',  temp: 'mid',   wet: 'mid' },
        'meadow':          { name: '草甸',        color: '#aed581',  temp: 'mid',   wet: 'dry' }
    };

    // 所有可选生物群落列表
    var BIOME_KEYS = Object.keys(BIOMES);

    /**
     * 根据种子和区块坐标计算伪随机生物群落
     * 使用 4 维噪声模拟 Minecraft 的生物群落分布
     */
    function getBiome(chunkX, chunkZ, seed) {
        var s = BigInt(seed) + BigInt(chunkX * 374761393) + BigInt(chunkZ * 668265263);
        s = (s ^ (s >> 13n)) * 1274126177n;
        s = (s ^ (s >> 16n)) & 0x7FFFFFFFn;
        var idx = Number(s % BigInt(BIOME_KEYS.length));
        return BIOME_KEYS[idx];
    }

    /**
     * 使用分层噪声生成更真实的群落分布
     */
    function getBiomeRealistic(chunkX, chunkZ, seed) {
        // 第一层：大陆性噪声（决定海洋 vs 陆地）
        var cont1 = simpleNoise(chunkX * 0.01, chunkZ * 0.01, seed, 0);
        var cont2 = simpleNoise(chunkX * 0.05, chunkZ * 0.05, seed, 1);
        var continental = cont1 * 0.7 + cont2 * 0.3;

        // 第二层：温度噪声
        var temp1 = simpleNoise(chunkX * 0.02, chunkZ * 0.02, seed, 2);
        var temp2 = simpleNoise(chunkX * 0.08, chunkZ * 0.08, seed, 3);
        var temperature = temp1 * 0.6 + temp2 * 0.4;

        // 第三层：湿度噪声
        var wet1 = simpleNoise(chunkX * 0.025, chunkZ * 0.025, seed, 4);
        var wet2 = simpleNoise(chunkX * 0.1, chunkZ * 0.1, seed, 5);
        var humidity = wet1 * 0.6 + wet2 * 0.4;

        // 特殊地形噪声（蘑菇岛、恶地等）
        var special = simpleNoise(chunkX * 0.03, chunkZ * 0.03, seed, 6);

        // 根据温度/湿度匹配群落
        var tempCat, wetCat;
        if (temperature < -0.3) tempCat = 'cold';
        else if (temperature > 0.3) tempCat = 'hot';
        else tempCat = 'mid';

        if (humidity < -0.3) wetCat = 'dry';
        else if (humidity > 0.3) wetCat = 'wet';
        else wetCat = 'mid';

        // 特殊地形
        if (special > 0.85) {
            var sp2 = simpleNoise(chunkX * 0.1, chunkZ * 0.1, seed, 7);
            if (sp2 > 0) return 'mushroom_fields';
            return 'badlands';
        }

        if (special < -0.85) {
            var sp3 = simpleNoise(chunkX * 0.08, chunkZ * 0.08, seed, 8);
            if (sp3 > 0.3) return 'cherry_grove';
        }

        // 海洋
        if (continental < -0.2) {
            return 'ocean';
        }

        // 温度 + 湿度决定群落
        var candidates = [];
        for (var k = 0; k < BIOME_KEYS.length; k++) {
            var b = BIOME_KEYS[k];
            if (b === 'ocean' || b === 'badlands' || b === 'mushroom_fields') continue;
            if (BIOMES[b].temp === tempCat && BIOMES[b].wet === wetCat) {
                candidates.push(b);
            }
        }

        if (candidates.length === 0) {
            // 降级匹配
            for (var kk = 0; kk < BIOME_KEYS.length; kk++) {
                var bb = BIOME_KEYS[kk];
                if (bb === 'ocean') continue;
                if (BIOMES[bb].temp === tempCat || BIOMES[bb].wet === wetCat) {
                    candidates.push(bb);
                }
            }
        }

        if (candidates.length === 0) {
            candidates = BIOME_KEYS.filter(function(b) { return b !== 'ocean'; });
        }

        var r = Math.abs(simpleNoise(chunkX * 0.15, chunkZ * 0.15, seed, 9));
        var idx = Math.floor(r * candidates.length) % candidates.length;
        return candidates[idx];
    }

    /**
     * 简单的伪随机噪声函数（模拟 Perlin 噪声行为）
     */
    function simpleNoise(x, y, seed, offset) {
        var n = Math.sin(x * 127.1 + y * 311.7 + offset * 59.3 + parseInt(String(seed).slice(-6)) * 0.1) * 43758.5453;
        return n - Math.floor(n) * 2 - 1; // 返回 -1 ~ 1
    }

    /**
     * 计算两点之间的区块距离（曼哈顿距离）
     */
    function chunkDistance(x1, z1, x2, z2) {
        return Math.abs(x1 - x2) + Math.abs(z1 - z2);
    }

    /**
     * 渲染群落网格
     */
    function renderGrid(seed, playerBlockX, playerBlockZ, radius, targetBiome) {
        var grid = document.getElementById('biome-grid');
        var loading = document.getElementById('biome-loading');
        var statsEl = document.getElementById('biome-stats');
        var resultEl = document.getElementById('biome-result');
        var resultText = document.getElementById('biome-result-text');

        if (!grid) return;

        grid.innerHTML = '';
        grid.style.display = 'block';
        if (loading) loading.style.display = 'none';
        if (resultEl) resultEl.classList.add('hidden');

        // 计算玩家所在的区块坐标
        var playerChunkX = Math.floor(playerBlockX / 16);
        var playerChunkZ = Math.floor(playerBlockZ / 16);

        var minX = playerChunkX - radius;
        var maxX = playerChunkX + radius;
        var minZ = playerChunkZ - radius;
        var maxZ = playerChunkZ + radius;
        var cols = maxX - minX + 1;
        var rows = maxZ - minZ + 1;
        var total = cols * rows;

        var maxW = Math.min(500, window.innerWidth - 140);
        var cellSize = Math.max(28, Math.min(48, Math.floor(maxW / cols)));

        // 查找最近的目标群落
        var nearestDist = Infinity;
        var nearestX = null, nearestZ = null;

        for (var dz = minZ; dz <= maxZ; dz++) {
            for (var dx = minX; dx <= maxX; dx++) {
                var b = getBiomeRealistic(dx, dz, seed);
                if (b === targetBiome) {
                    var dist = chunkDistance(playerChunkX, playerChunkZ, dx, dz);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestX = dx;
                        nearestZ = dz;
                    }
                }
            }
        }

        // 创建表格
        var table = document.createElement('div');
        table.style.cssText = 'display:inline-grid;grid-template-columns:repeat(' + cols + ',' + cellSize + 'px);grid-template-rows:repeat(' + rows + ',' + cellSize + 'px);gap:1px;background:#d1d5db;border:1px solid #9ca3af;border-radius:4px;overflow:hidden;';

        var targetCount = 0;

        for (var dz = minZ; dz <= maxZ; dz++) {
            for (var dx = minX; dx <= maxX; dx++) {
                var biome = getBiomeRealistic(dx, dz, seed);
                var bioData = BIOMES[biome] || { name: '未知', color: '#bdbdbd' };
                var isPlayer = (dx === playerChunkX && dz === playerChunkZ);
                var isTarget = (biome === targetBiome);
                var isNearest = (dx === nearestX && dz === nearestZ);

                if (isTarget) targetCount++;

                var cell = document.createElement('div');
                cell.style.cssText = 'width:' + cellSize + 'px;height:' + cellSize + 'px;background-color:' + bioData.color + ';display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;font-size:7px;font-family:monospace;color:rgba(0,0,0,0.7);overflow:hidden;border:1px solid rgba(0,0,0,0.1);';

                if (isPlayer) {
                    cell.style.border = '2px solid #ff6f00';
                    cell.style.boxShadow = 'inset 0 0 0 2px #ff6f00';
                }
                if (isTarget) {
                    cell.style.border = '2px solid #7c4dff';
                    cell.style.boxShadow = 'inset 0 0 0 2px #7c4dff';
                }
                if (isNearest && isTarget) {
                    cell.style.animation = 'biomeBlink 1s ease-in-out infinite';
                    cell.style.border = '3px solid #ff6f00';
                }

                if (cellSize >= 26) cell.textContent = dx + ',' + dz;

                var tip = document.createElement('div');
                tip.className = 'biome-tip';
                tip.style.cssText = 'position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:6px;padding:6px 10px;background:#1f2937;color:white;font-size:11px;border-radius:6px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3);opacity:0;visibility:hidden;transition:all 0.2s;z-index:100;pointer-events:none;font-family:sans-serif;border:1px solid #374151;line-height:1.6;text-align:left;';
	                tip.innerHTML = window.t('biome_tip_chunk',{x:dx,z:dz}) + '<br>' + window.t('biome_tip_biome') + ': <strong>' + (window.t('biome_name_' + biome) || bioData.name) + '</strong>' + (isTarget ? ' <span style="color:#b388ff;">🎯 ' + window.t('biome_tip_target') + '</span>' : '') + (isPlayer ? ' <span style="color:#ff6f00;">📍 ' + window.t('biome_tip_you_here') + '</span>' : '');
                cell.appendChild(tip);

                cell.onmouseenter = function() {
                    this.style.zIndex = '10';
                    var t = this.querySelector('.biome-tip');
                    if (t) { t.style.opacity = '1'; t.style.visibility = 'visible'; }
                };
                cell.onmouseleave = function() {
                    this.style.zIndex = '';
                    var t = this.querySelector('.biome-tip');
                    if (t) { t.style.opacity = '0'; t.style.visibility = 'hidden'; }
                };

                table.appendChild(cell);
            }
        }

        grid.appendChild(table);

        // 统计
        if (statsEl) {
            var bioName = BIOMES[targetBiome] ? BIOMES[targetBiome].name : targetBiome;
            var locName = window.t('biome_name_' + targetBiome) || bioName;
            statsEl.textContent = window.t('biome_stats_found', { radius: radius*2+1, count: targetCount, biome: locName });
        }

        // 结果显示
        if (resultEl && resultText && nearestX !== null) {
            resultEl.classList.remove('hidden');
            var distBlocks = nearestDist * 16;
            var targetName = BIOMES[targetBiome] ? BIOMES[targetBiome].name : targetBiome;
            var locTargetName = window.t('biome_name_' + targetBiome) || targetName;
            resultText.innerHTML = window.t('biome_result_found', { biome: locTargetName, cx: nearestX, cz: nearestZ, bx1: nearestX*16, bx2: nearestX*16+15, bz1: nearestZ*16, bz2: nearestZ*16+15, dist: distBlocks });
        } else if (resultEl && resultText) {
            resultEl.classList.remove('hidden');
            var tn = BIOMES[targetBiome] ? BIOMES[targetBiome].name : targetBiome;
            var locTn = window.t('biome_name_' + targetBiome) || tn;
            resultText.innerHTML = window.t('biome_result_notfound', { biome: locTn });
        }

        // 添加闪烁动画
        if (!document.getElementById('biome-blink-style')) {
            var style = document.createElement('style');
            style.id = 'biome-blink-style';
            style.textContent = '@keyframes biomeBlink { 0%,100% { opacity:1; } 50% { opacity:0.6; } }';
            document.head.appendChild(style);
        }
    }

    function init() {
        var seedInput = document.getElementById('biome-seed');
        var posX = document.getElementById('biome-pos-x');
        var posZ = document.getElementById('biome-pos-z');
        var radiusInput = document.getElementById('biome-radius');
        var radiusValue = document.getElementById('biome-radius-value');
        var targetSelect = document.getElementById('biome-target');
        var queryBtn = document.getElementById('biome-query-btn');

        if (!seedInput || !queryBtn) return;

        if (radiusInput && radiusValue) {
            radiusInput.addEventListener('input', function() {
                radiusValue.textContent = this.value;
            });
        }

        queryBtn.addEventListener('click', function() {
            var seed = seedInput.value.trim();
            var bx = parseInt(posX.value) || 0;
            var bz = parseInt(posZ.value) || 0;
            var radius = parseInt(radiusInput ? radiusInput.value : 5);
            var target = targetSelect ? targetSelect.value : 'dark_forest';

            if (!seed) {
                if (window.Utils) { Utils.showToast('请先填写世界种子'); }
                seedInput.focus();
                return;
            }
            if (isNaN(parseInt(seed))) {
                if (window.Utils) { Utils.showToast('请输入有效的数字种子'); }
                return;
            }

            var loading = document.getElementById('biome-loading');
            var grid = document.getElementById('biome-grid');
            if (loading) {
                loading.style.display = 'flex';
                loading.innerHTML = '<i class="fas fa-spinner fa-spin text-2xl mr-3"></i><span class="text-lg">正在生成群落地图...</span>';
            }
            if (grid) grid.style.display = 'none';

            setTimeout(function() { renderGrid(seed, bx, bz, radius, target); }, 50);
        });

        seedInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') queryBtn.click();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
