/**
 * 史莱姆区块查询模块（完整稳定版）
 * - 固定单元格大小，坐标清晰可读
 * - 同步创建网格占位，分帧计算着色
 * - 鼠标悬浮显示完整坐标信息
 * - 关闭弹窗时自动销毁网格释放内存
 */
(function() {
    'use strict';

    var resultCache = {};

    function isSlimeChunk(chunkX, chunkZ, worldSeed) {
        function imul32(a, b) { return Math.imul(a | 0, b | 0); }
        var x = chunkX | 0, z = chunkZ | 0;
        var t1 = imul32(imul32(x, x), 0x4C1906);
        var t2 = imul32(x, 0x5AC0DB);
        var t3 = imul32(imul32(z, z), 0x4307A7);
        var t4 = imul32(z, 0x5F24F);
        var seed = BigInt(worldSeed);
        var sum = seed + BigInt(t1) + BigInt(t2) + BigInt(t3) + BigInt(t4);
        var n = sum ^ 0x3AD8025Fn;
        var state = (n ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n);
        state = (state * 0x5DEECE66Dn + 0xBn) & ((1n << 48n) - 1n);
        return (Number(state >> 17n) % 10) === 0;
    }

    function renderGrid(seed, startX, startZ, endX, endZ, startY, endY) {
        var grid = document.getElementById('slime-grid');
        var loading = document.getElementById('slime-loading');
        var statsEl = document.getElementById('slime-stats');
        if (!grid) return;

        var oldProg = document.getElementById('slime-progress');
        if (oldProg) oldProg.remove();

        grid.innerHTML = '';
        grid.style.display = 'block';
        if (loading) loading.style.display = 'none';

        var minX = Math.min(startX, endX);
        var maxX = Math.max(startX, endX);
        var minZ = Math.min(startZ, endZ);
        var maxZ = Math.max(startZ, endZ);
        var cols = maxX - minX + 1;
        var rows = maxZ - minZ + 1;
        var total = cols * rows;

        var key = seed + '_' + minX + '_' + maxX + '_' + minZ + '_' + maxZ;
        if (resultCache[key]) {
            grid.innerHTML = resultCache[key].html;
            if (statsEl) statsEl.textContent = resultCache[key].stats;
            return;
        }

        var maxW = Math.min(600, window.innerWidth - 140);
        var cellSize = Math.max(32, Math.min(52, Math.floor(maxW / cols)));
        if (cols * (cellSize + 1) > maxW) {
            cellSize = Math.max(32, Math.floor(maxW / cols));
        }

        var slimeCount = 0;
        var processed = 0;
        var BATCH = Math.max(50, Math.min(400, Math.floor(2000 / cols)));

        var table = document.createElement('div');
        table.style.cssText = 'display:inline-grid;grid-template-columns:repeat(' + cols + ',' + cellSize + 'px);grid-template-rows:repeat(' + rows + ',' + cellSize + 'px);gap:1px;background:#d1d5db;border:1px solid #9ca3af;border-radius:4px;overflow:hidden;';
        grid.appendChild(table);

        var progEl = document.createElement('div');
        progEl.id = 'slime-progress';
        progEl.style.cssText = 'text-align:center;padding:8px 0;color:#64748b;font-size:13px;font-family:sans-serif;';
        progEl.textContent = '计算中 0 / ' + total + ' (0%)';
        grid.parentNode.insertBefore(progEl, grid.nextSibling);

        var cells = [];
        for (var dz = minZ; dz <= maxZ; dz++) {
            for (var dx = minX; dx <= maxX; dx++) {
                var div = document.createElement('div');
                div.style.cssText = 'width:' + cellSize + 'px;height:' + cellSize + 'px;background-color:#e5e7eb;border:1px solid #d1d5db;display:flex;align-items:center;justify-content:center;font-size:9px;font-family:monospace;color:#9ca3af;overflow:hidden;position:relative;';
                if (cellSize >= 28) div.textContent = dx + ',' + dz;
                div.dataset.cx = dx;
                div.dataset.cz = dz;
                table.appendChild(div);
                cells.push({ el: div, x: dx, z: dz });
            }
        }

        function processBatch() {
            var startT = performance.now();
            var count = 0;

            while (processed < total) {
                var cell = cells[processed];
                var dx = cell.x, dz = cell.z;
                var isSlime = isSlimeChunk(dx, dz, seed);
                var isCenter = (dx === 0 && dz === 0);
                if (isSlime) slimeCount++;

                var bgColor, borderColor;
                if (isCenter) { bgColor = '#fde68a'; borderColor = '#f59e0b'; }
                else if (isSlime) { bgColor = '#34d399'; borderColor = '#059669'; }
                else { bgColor = '#f3f4f6'; borderColor = '#e5e7eb'; }

                var el = cell.el;
                el.style.backgroundColor = bgColor;
                el.style.borderColor = borderColor;
                el.style.color = '#374151';
                el.className = 'slime-cell';
                el.style.cursor = 'pointer';

                var tip = document.createElement('div');
                tip.className = 'slime-tip';
                tip.style.cssText = 'position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:6px;padding:6px 10px;background:#1f2937;color:white;font-size:11px;border-radius:6px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3);opacity:0;visibility:hidden;transition:all 0.2s;z-index:100;pointer-events:none;font-family:sans-serif;border:1px solid #374151;line-height:1.6;text-align:left;';
                tip.innerHTML = '区块 (' + dx + ', ' + dz + ')<br>方块 ' + (dx*16) + '~' + (dx*16+15) + ', ' + (dz*16) + '~' + (dz*16+15) + (isSlime ? ' <span style="color:#34d399;">✓ 史莱姆</span>' : ' <span style="color:#9ca3af;">普通</span>');
                el.appendChild(tip);

                el.onmouseenter = function() {
                    this.style.boxShadow = 'inset 0 0 0 2px #22d3ee';
                    var t = this.querySelector('.slime-tip');
                    if (t) { t.style.opacity = '1'; t.style.visibility = 'visible'; }
                };
                el.onmouseleave = function() {
                    this.style.boxShadow = 'none';
                    var t = this.querySelector('.slime-tip');
                    if (t) { t.style.opacity = '0'; t.style.visibility = 'hidden'; }
                };

                processed++;
                count++;
                if (count >= BATCH || (performance.now() - startT) > 15) break;
            }

            var pct = ((processed / total) * 100).toFixed(1);
            if (progEl) progEl.textContent = window.t('slime_progress', { done: processed, total: total, pct: pct });

            if (processed >= total) {
                if (progEl) progEl.remove();
                if (statsEl) {
                    var p = (slimeCount / total * 100).toFixed(1);
                    var yDisp = (startY || 40) + (endY && endY !== startY ? '~' + endY : '');
                    var txt = window.t('slime_stats', { minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ, y: yDisp, total: total, slime: slimeCount, pct: p });
                    statsEl.textContent = txt;
                    resultCache[key] = { html: grid.innerHTML, stats: txt };
                    var ks = Object.keys(resultCache);
                    if (ks.length > 5) delete resultCache[ks[0]];
                }
            } else {
                setTimeout(processBatch, 10);
            }
        }

        setTimeout(processBatch, 10);
    }

    function init() {
        var seedInput = document.getElementById('slime-seed');
        var queryBtn = document.getElementById('slime-query-btn');
        if (!seedInput || !queryBtn) return;

        queryBtn.addEventListener('click', function() {
            var seed = seedInput.value.trim();
            var sx = parseInt(document.getElementById('slime-start-x').value) || -8;
            var sy = parseInt(document.getElementById('slime-start-y').value) || 40;
            var sz = parseInt(document.getElementById('slime-start-z').value) || -8;
            var ex = parseInt(document.getElementById('slime-end-x').value) || 8;
            var ey = parseInt(document.getElementById('slime-end-y').value) || 40;
            var ez = parseInt(document.getElementById('slime-end-z').value) || 8;

            if (!seed) {
                if (window.Utils) { Utils.showToast('请先填写世界种子'); }
                seedInput.focus();
                return;
            }
            if (isNaN(parseInt(seed))) {
                if (window.Utils) { Utils.showToast('请输入有效的数字种子'); }
                return;
            }

            var oldP = document.getElementById('slime-progress');
            if (oldP) oldP.remove();

            var loading = document.getElementById('slime-loading');
            var grid = document.getElementById('slime-grid');
            if (loading) {
                loading.style.display = 'flex';
                var est = (Math.abs(ex - sx) + 1) * (Math.abs(ez - sz) + 1);
                loading.innerHTML = '<i class="fas fa-spinner fa-spin text-2xl mr-3"></i><span class="text-lg">计算 ' + est + ' 个区块...</span>';
            }
            if (grid) grid.style.display = 'none';
            setTimeout(function() { renderGrid(seed, sx, sz, ex, ez, sy, ey); }, 50);
        });

        seedInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') queryBtn.click();
        });

        // ★★★ 关闭弹窗时销毁网格，释放内存 ★★★
        var utilityModal = document.getElementById('utility-modal');
        if (utilityModal) {
            var observer = new MutationObserver(function() {
                if (utilityModal.classList.contains('invisible') || utilityModal.classList.contains('opacity-0')) {
                    var grid = document.getElementById('slime-grid');
                    if (grid && grid.innerHTML) {
                        grid.innerHTML = '';
                        grid.style.display = 'none';
                    }
                    var loading = document.getElementById('slime-loading');
                    if (loading) {
                        loading.style.display = 'flex';
                        loading.innerHTML = '<i class="fas fa-spinner fa-spin text-2xl mr-3"></i><span class="text-lg">点击查询按钮生成区块地图</span>';
                    }
                    var statsEl = document.getElementById('slime-stats');
                    if (statsEl) statsEl.textContent = '';
                    resultCache = {};
                }
            });
            observer.observe(utilityModal, { attributes: true, attributeFilter: ['class'] });
        }

        setTimeout(function() { queryBtn.click(); }, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
