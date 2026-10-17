/**
 * 音乐播放器 — 精选歌目（自定义控件）↔ 云歌单（iframe）
 */
(function() {
    'use strict';

    var SONG_LIST = [
        { file: 'music/1.mp3', name: '小曲一响，闪亮登场' },
        { file: 'music/2.mp3', name: '曲目 2' },
        { file: 'music/3.mp3', name: '曲目 3' },
        { file: 'music/4.mp3', name: '曲目 4' }
    ];

    document.addEventListener('DOMContentLoaded', function() {
        var audio = document.getElementById('bg-music');
        var playBtn = document.getElementById('music-play-btn');
        var nextBtn = document.getElementById('music-next-btn');
        var prevBtn = document.getElementById('music-prev-btn');
        var playIcon = document.getElementById('music-play-icon');
        var vol = document.getElementById('music-volume');
        var nameEl = document.getElementById('music-song-name');
        var panel = document.getElementById('music-panel');
        var toggleBtn = document.getElementById('music-toggle-btn');
        var closePanel = document.getElementById('music-close-panel');
        var progressBar = document.getElementById('music-progress-bar');
        var progressTrack = document.getElementById('music-progress-track');
        var currentTimeEl = document.getElementById('music-current-time');
        var durationEl = document.getElementById('music-duration');
        var modeBtn = document.getElementById('music-mode-btn');
        var modeIcon = document.getElementById('music-mode-icon');
        var playlistToggle = document.getElementById('music-playlist-toggle');
        var playlist = document.getElementById('music-playlist');
        var playlistArrow = document.getElementById('playlist-arrow');
        var playlistItems = document.getElementById('music-playlist-items');
        var coverEl = document.getElementById('music-cover');
        var volumeBtn = document.getElementById('music-volume-btn');
        var volumeIcon = document.getElementById('music-volume-icon');
        if (!audio || !playBtn) return;

        // 动态度生成本地 source
        SONG_LIST.forEach(function(song) {
            var src = document.createElement('source');
            src.src = song.file; src.type = 'audio/mpeg'; src.dataset.name = song.name;
            audio.appendChild(src);
        });
        var sources = Array.from(audio.querySelectorAll('source'));
        var currentIdx = parseInt(localStorage.getItem('bgMusicIndex')) || 0;
        var playMode = localStorage.getItem('bgMusicMode') || 'loop';
        var isPanelOpen = false, isPlaylistOpen = false;
        var musicSource = localStorage.getItem('bgMusicSource') || 'local';
        if (musicSource === 'netease' || musicSource === 'netcase') { musicSource = 'local'; localStorage.setItem('bgMusicSource','local'); }

        // ====== 创建独立的云歌单容器（在 #music-player 内、panel 外） ======
        var player = document.getElementById('music-player');
        var cloudBox = document.createElement('div');
        cloudBox.id = 'music-cloud-box';
        cloudBox.style.cssText = 'display:none;position:absolute;bottom:0;right:0;width:320px;background:rgba(15,23,42,0.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(55,65,81,0.5);border-radius:16px;overflow:hidden;color:#f1f5f9;box-shadow:0 20px 60px rgba(0,0,0,0.5);';
        cloudBox.innerHTML =
            '<div class="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"></div>' +
            '<div class="flex items-center justify-between px-4 py-2">' +
                '<span class="text-xs text-gray-400">☁️ 云歌单 · 网易云</span>' +
                '<div class="flex items-center gap-2">' +
                    '<button id="cloud-back-local" class="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition">← 精选歌目</button>' +
                    '<button id="cloud-close" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>' +
                '</div>' +
            '</div>' +
            '<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" ' +
                'style="width:100%;height:380px;display:block;" ' +
                'src="https://music.163.com/outchain/player?type=0&id=2144281377&auto=0&height=430"></iframe>';
        player.appendChild(cloudBox);

        // 云歌单按钮事件
        cloudBox.querySelector('#cloud-back-local').addEventListener('click', function() {
            switchToLocal();
        });
        cloudBox.querySelector('#cloud-close').addEventListener('click', function() {
            cloudBox.style.display = 'none';
            if (toggleBtn) toggleBtn.classList.remove('hidden');
        });

        // ====== 切换逻辑（简单粗暴：显示/隐藏 panel 或 cloudBox） ======
        function switchToLocal() {
            musicSource = 'local';
            localStorage.setItem('bgMusicSource', 'local');
            cloudBox.style.display = 'none';
            panel.classList.remove('opacity-0','invisible','scale-95');
            panel.classList.add('scale-100');
            if (toggleBtn) toggleBtn.classList.add('hidden');
            updateSrcBtns();
            if (!audio.src || audio.src === window.location.href) {
                var s = sources[currentIdx];
                if (s) { audio.src = s.src; if (nameEl) nameEl.textContent = s.dataset.name || '歌曲'; }
            }
            audio.play().catch(function(){});
            updatePlayIcon(true);
        }

        function switchToCloud() {
            musicSource = 'cloud';
            localStorage.setItem('bgMusicSource', 'cloud');
            audio.pause();
            panel.classList.add('opacity-0','invisible','scale-95');
            panel.classList.remove('scale-100');
            cloudBox.style.display = '';
            if (toggleBtn) toggleBtn.classList.add('hidden');
            updateSrcBtns();
        }

        function hideAll() {
            panel.classList.add('opacity-0','invisible','scale-95');
            panel.classList.remove('scale-100');
            cloudBox.style.display = 'none';
            if (toggleBtn) toggleBtn.classList.remove('hidden');
        }

        // 源切换按钮
        function updateSrcBtns() {
            document.querySelectorAll('.music-src-btn').forEach(function(b) {
                b.classList.toggle('active', b.dataset.src === musicSource);
            });
        }
        updateSrcBtns();
        document.querySelectorAll('.music-src-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (this.dataset.src === musicSource) return;
                if (this.dataset.src === 'local') switchToLocal();
                else switchToCloud();
            });
        });

        // ====== 面板开关（本地/云歌单统一入口） ======
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                if (musicSource === 'cloud') {
                    if (cloudBox.style.display === 'none') {
                        switchToCloud();
                    } else {
                        hideAll();
                    }
                } else {
                    if (panel.classList.contains('opacity-0')) {
                        panel.classList.remove('opacity-0','invisible','scale-95');
                        panel.classList.add('scale-100');
                        toggleBtn.classList.add('hidden');
                    } else {
                        hideAll();
                    }
                }
            });
        }
        if (closePanel) closePanel.addEventListener('click', hideAll);

        // ====== 本地播放器逻辑（完全不变） ======
        function buildPlaylist() {
            if (!playlistItems) return;
            playlistItems.innerHTML = '';
            sources.forEach(function(s, i) {
                var item = document.createElement('div');
                item.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm ' + (i === currentIdx ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:text-white hover:bg-gray-800/50');
                item.dataset.index = i;
                item.innerHTML = '<i class="fas fa-music text-xs ' + (i === currentIdx ? 'text-cyan-400' : 'text-gray-600') + '"></i><span class="truncate flex-1">' + (s.dataset.name || '未知') + '</span>';
                item.addEventListener('click', function() { playTrack(parseInt(this.dataset.index)); });
                playlistItems.appendChild(item);
            });
        }

        function playTrack(index) {
            if (index < 0 || index >= sources.length) return;
            currentIdx = index;
            var s = sources[currentIdx];
            audio.src = s.src;
            if (nameEl) nameEl.textContent = s.dataset.name || '歌曲';
            if (coverEl) coverEl.classList.add('music-cover-pulse');
            audio.play().catch(function() { if (typeof Utils !== 'undefined') Utils.showModal('music-tip-modal'); });
            updatePlayIcon(true);
            try { localStorage.setItem('bgMusicIndex', currentIdx); } catch(e) {}
        }

        function updatePlayIcon(isPlaying) {
            if (!playIcon) return;
            playIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }

        function formatTime(s) {
            if (isNaN(s) || !isFinite(s)) return '0:00';
            var m = Math.floor(s / 60), sec = Math.floor(s % 60);
            return m + ':' + (sec < 10 ? '0' : '') + sec;
        }

        function updateProgress() {
            if (!progressBar) return;
            var pct = audio.duration ? (audio.currentTime / audio.duration * 100) : 0;
            progressBar.style.width = pct + '%';
            if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
            if (durationEl) durationEl.textContent = formatTime(audio.duration);
        }

        function getNextIndex() {
            if (playMode === 'shuffle') { var n; do { n = Math.floor(Math.random() * sources.length); } while (n === currentIdx && sources.length > 1); return n; }
            else if (playMode === 'loop-one') return currentIdx;
            else return (currentIdx + 1) % sources.length;
        }
        function getPrevIndex() { return (currentIdx - 1 + sources.length) % sources.length; }

        function updateModeIcon() {
            if (!modeIcon) return;
            if (playMode === 'loop-one') { modeIcon.className = 'fas fa-repeat'; if (modeBtn) modeBtn.title = '单曲循环'; }
            else if (playMode === 'shuffle') { modeIcon.className = 'fas fa-random'; if (modeBtn) modeBtn.title = '随机播放'; }
            else { modeIcon.className = 'fas fa-repeat'; if (modeBtn) modeBtn.title = '列表循环'; }
            try { localStorage.setItem('bgMusicMode', playMode); } catch(e) {}
        }

        function updateVolumeIcon(v) {
            if (!volumeIcon) return;
            volumeIcon.className = v === 0 ? 'fas fa-volume-mute text-sm' : v < 0.5 ? 'fas fa-volume-down text-sm' : 'fas fa-volume-up text-sm';
        }

        // 初始化本地
        if (sources[currentIdx]) { audio.src = sources[currentIdx].src; if (nameEl) nameEl.textContent = sources[currentIdx].dataset.name || '歌曲'; }
        var sv = localStorage.getItem('bgMusicVolume');
        if (sv) { audio.volume = parseFloat(sv); if (vol) vol.value = sv; updateVolumeIcon(parseFloat(sv)); }
        updateModeIcon();
        buildPlaylist();

        // 播放控制
        playBtn.addEventListener('click', function() {
            if (audio.paused) { audio.play().catch(function() { if (typeof Utils !== 'undefined') Utils.showModal('music-tip-modal'); }); updatePlayIcon(true); if (coverEl) coverEl.classList.add('music-cover-pulse'); }
            else { audio.pause(); updatePlayIcon(false); if (coverEl) coverEl.classList.remove('music-cover-pulse'); }
        });
        if (nextBtn) nextBtn.addEventListener('click', function() { playTrack(getNextIndex()); });
        if (prevBtn) prevBtn.addEventListener('click', function() { if (audio.currentTime > 3) audio.currentTime = 0; else playTrack(getPrevIndex()); });
        if (modeBtn) modeBtn.addEventListener('click', function() { var modes = ['loop','loop-one','shuffle']; playMode = modes[(modes.indexOf(playMode)+1)%modes.length]; updateModeIcon(); audio.loop = (playMode==='loop-one'); });
        if (vol) vol.addEventListener('input', function() { audio.volume = parseFloat(this.value); updateVolumeIcon(parseFloat(this.value)); });
        if (volumeBtn) volumeBtn.addEventListener('click', function() {
            if (audio.volume > 0) { try { localStorage.setItem('bgMusicVolumeCache', audio.volume); } catch(e) {} audio.volume = 0; if (vol) vol.value = '0'; updateVolumeIcon(0); }
            else { var c = parseFloat(localStorage.getItem('bgMusicVolumeCache')) || 0.08; audio.volume = c; if (vol) vol.value = c; updateVolumeIcon(c); }
        });
        if (progressTrack) progressTrack.addEventListener('click', function(e) { if (!audio.duration) return; audio.currentTime = ((e.clientX - this.getBoundingClientRect().left) / this.offsetWidth) * audio.duration; });
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', function() { if (durationEl) durationEl.textContent = formatTime(audio.duration); });
        audio.addEventListener('ended', function() { if (playMode === 'loop-one') { audio.currentTime = 0; audio.play(); } else playTrack(getNextIndex()); });
        audio.addEventListener('play', function() { updatePlayIcon(true); if (coverEl) coverEl.classList.add('music-cover-pulse'); });
        audio.addEventListener('pause', function() { updatePlayIcon(false); if (coverEl) coverEl.classList.remove('music-cover-pulse'); });
        if (playlistToggle) playlistToggle.addEventListener('click', function() { isPlaylistOpen = !isPlaylistOpen; if (playlist) playlist.classList.toggle('hidden', !isPlaylistOpen); if (playlistArrow) playlistArrow.style.transform = isPlaylistOpen ? 'rotate(180deg)' : ''; });

        if (localStorage.getItem('bgMusicPlaying') === 'true') { audio.play().catch(function(){}); }

        // 初始状态
        if (musicSource === 'cloud') {
            panel.classList.add('opacity-0','invisible','scale-95');
            panel.classList.remove('scale-100');
        }

        // ====== 存储 ======
        window.addEventListener('beforeunload', function() {
            try { localStorage.setItem('bgMusicVolume', audio.volume); } catch(e) {}
            try { localStorage.setItem('bgMusicPlaying', !audio.paused); } catch(e) {}
            try { localStorage.setItem('bgMusicIndex', currentIdx); } catch(e) {}
            try { localStorage.setItem('bgMusicSource', musicSource); } catch(e) {}
        });

        // ====== 拖拽 ======
        enableDrag();
    });

    function enableDrag() {
        var player = document.getElementById('music-player');
        if (!player) return;
        var posKey = 'musicPlayerOffset', isDragging = false, startX, startY, offsetX = 0, offsetY = 0;
        try { var d = JSON.parse(localStorage.getItem(posKey)); offsetX = d.x || 0; offsetY = d.y || 0; player.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px)'; } catch(e) {}

        function constrain() {
            var r = player.getBoundingClientRect(), bw = window.innerWidth, bh = window.innerHeight;
            if (r.left < 0) offsetX -= r.left;
            if (r.top < 0) offsetY -= r.top;
            if (r.right > bw) offsetX -= (r.right - bw);
            if (r.bottom > bh) offsetY -= (r.bottom - bh);
            player.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px)';
            try { localStorage.setItem(posKey, JSON.stringify({x:offsetX, y:offsetY})); } catch(e) {}
        }

        player.addEventListener('mousedown', function(e) {
            if (e.target.closest('button, input, a, iframe')) return;
            isDragging = true; startX = e.clientX; startY = e.clientY;
            player.style.cursor = 'grabbing'; player.style.transition = 'none'; e.preventDefault();
        });
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            player.style.transform = 'translate(' + (offsetX + e.clientX - startX) + 'px, ' + (offsetY + e.clientY - startY) + 'px)';
        });
        document.addEventListener('mouseup', function(e) {
            if (!isDragging) return;
            isDragging = false; offsetX += e.clientX - startX; offsetY += e.clientY - startY;
            player.style.cursor = ''; player.style.transition = '';
            try { localStorage.setItem(posKey, JSON.stringify({x:offsetX, y:offsetY})); } catch(e) {}; constrain();
        });
        window.addEventListener('resize', constrain);
        setTimeout(constrain, 300);
    }
})();
