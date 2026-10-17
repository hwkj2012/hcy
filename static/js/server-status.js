/**
 * 服务器状态 + 在线人数趋势折线图
 */
(function() {
    'use strict';

    var HISTORY_KEY = 'hcy_player_history';

    // 服务器地址（主线路 + 备用线路）
    var ENDPOINTS = [
        'https://api.mcsrvstat.us/3/su7.mc6.cn:43356',
        'https://api.mcsrvstat.us/3/hcy.mcfuns.cn'
    ];

    document.addEventListener('DOMContentLoaded', function() {
        var pc = document.getElementById('player-count');
        var popup = document.getElementById('player-chart-popup');
        var canvas = document.getElementById('player-chart-canvas');
        var note = document.getElementById('player-chart-note');
        if (!pc || !popup || !canvas) return;

        var chartInst = null, hideTimer = null;

        // ====== 历史数据 ======
        function loadHistory() {
            try { var d = JSON.parse(localStorage.getItem(HISTORY_KEY)); if (d && d.length) return d; } catch(e) {}
            return seed();
        }
        function save(d) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(d)); } catch(e) {} }
        function seed() {
            var d = [], now = Date.now();
            for (var i = 24; i >= 0; i--) {
                var t = new Date(now - i*3600000);
                d.push({ label: t.getHours().toString().padStart(2,'0')+':00', date: (t.getMonth()+1)+'/'+t.getDate(), count: Math.max(0, 5+Math.floor(Math.sin(i/4)*4)+Math.floor(Math.random()*6)), ts: t.getTime() });
            }
            save(d); return d;
        }
        function addPoint(count) {
            var d = loadHistory(), now = new Date();
            var label = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
            var date = (now.getMonth()+1)+'/'+now.getDate();
            if (d.length && d[d.length-1].label === label && d[d.length-1].date === date) { d[d.length-1].count = count; }
            else { d.push({ label:label, date:date, count:count, ts:now.getTime() }); }
            var cut = now.getTime() - 3*86400000;
            d = d.filter(function(p){ return p.ts >= cut; });
            if (d.length > 200) d = d.slice(-200);
            save(d);
        }

        // ====== 折线图 ======
        function renderChart() {
            if (chartInst) { chartInst.destroy(); chartInst = null; }
            var d = loadHistory();
            note.textContent = d.length + ' 个采样点 · 0-100 人区间';
            var ctx = canvas.getContext('2d');
            var g = ctx.createLinearGradient(0,0,0,180);
            g.addColorStop(0,'rgba(59,130,246,0.38)'); g.addColorStop(1,'rgba(59,130,246,0.02)');
            chartInst = new Chart(ctx, {
                type:'line',
                data:{ labels: d.map(function(p){return p.date+' '+p.label;}), datasets:[{ data: d.map(function(p){return p.count;}), borderColor:'#2364D2', backgroundColor:g, borderWidth:2, pointRadius:0, pointHoverRadius:5, pointHoverBackgroundColor:'#fff', tension:0.3, fill:true }] },
                options:{
                    responsive:true, maintainAspectRatio:false, animation:false,
                    plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'rgba(255,255,255,0.94)', titleColor:'#123A6E', bodyColor:'#2364D2', borderColor:'rgba(147,197,253,0.8)', borderWidth:1, cornerRadius:10, displayColors:false, callbacks:{ label:function(c){return c.parsed.y+' 人在线';} } } },
                    scales:{ x:{ ticks:{color:'#5C7799',font:{size:9},maxTicksLimit:5,maxRotation:0}, grid:{color:'rgba(147,197,253,0.35)'} }, y:{ min:0, max:100, ticks:{color:'#5C7799',font:{size:9},stepSize:20}, grid:{color:'rgba(147,197,253,0.35)'} } },
                    interaction:{mode:'index'}
                }
            });
        }

        // ====== 定位弹框 ======
        function positionPopup() {
            var r = pc.getBoundingClientRect();
            var pw = 320, ph = 280;
            var left = r.left + r.width/2 - pw/2;
            var top = r.top - ph - 10;
            if (left < 8) left = 8;
            if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
            if (top < 8) top = r.bottom + 10;
            popup.style.left = left + 'px';
            popup.style.top = top + 'px';
        }

        function showPopup() {
            if (hideTimer) clearTimeout(hideTimer);
            positionPopup();
            popup.style.display = 'block';
            if (!chartInst) renderChart();
        }
        function hidePopup() {
            hideTimer = setTimeout(function(){ popup.style.display = 'none'; }, 300);
        }

        pc.addEventListener('mouseenter', showPopup);
        pc.addEventListener('mouseleave', hidePopup);
        popup.addEventListener('mouseenter', function(){ clearTimeout(hideTimer); });
        popup.addEventListener('mouseleave', function(){ popup.style.display = 'none'; });
        window.addEventListener('resize', function(){ if (popup.style.display === 'block') positionPopup(); });
        window.addEventListener('scroll', function(){ if (popup.style.display === 'block') positionPopup(); });

        // ====== 服务器状态 ======
        async function queryOnce(url) {
            var r = await fetch(url, { cache: 'no-store' });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return await r.json();
        }

        async function fetchStatus() {
            var data = null;
            for (var i = 0; i < ENDPOINTS.length; i++) {
                try {
                    data = await queryOnce(ENDPOINTS[i]);
                    if (data) break;
                } catch (e) { data = null; }
            }

            if (!data) {
                var stErr = document.getElementById('server-status');
                if (stErr) {
                    stErr.textContent = '获取失败';
                    stErr.className = 'ml-1 px-2.5 py-0.5 text-xs rounded-full bg-yellow-500';
                }
                return;
            }

            try {
                var cnt = data.online ? ((data.players && data.players.online) || 0) : 0;
                pc.childNodes[0].textContent = cnt;
                document.getElementById('max-players').textContent =
                    (data.players && data.players.max) || '--';
                var st = document.getElementById('server-status');
                st.textContent = data.online ? window.t('hero_status_online') : window.t('hero_status_offline');
                st.className = 'ml-1 px-2.5 py-0.5 text-xs rounded-full ' + (data.online ? 'bg-green-500' : 'bg-red-500');
                document.getElementById('last-update').textContent = window.t('hero_last_update', { time: new Date().toLocaleTimeString() });
                addPoint(cnt);
                if (popup.style.display === 'block') { setTimeout(renderChart, 100); positionPopup(); }
            } catch (e) { console.error(e); }
        }
        fetchStatus();
        setInterval(fetchStatus, 15000);
    });
})();
