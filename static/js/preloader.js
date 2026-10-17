/**
 * 高级加载界面控制模块
 * 管理加载进度条动画、提示文字轮播、自动隐藏
 */
(function() {
    'use strict';

    var preloader = document.getElementById('preloader');
    if (!preloader) return;

    // 若是从文档页（terms.html / docs）返回，跳过加载动画直接进入首页
    try {
        if (sessionStorage.getItem('skip_preloader') === '1') {
            sessionStorage.removeItem('skip_preloader');
            preloader.classList.add('hidden');
            preloader.style.display = 'none';
            document.body.style.overflow = '';
            return;
        }
    } catch (e) { /* 隐私模式忽略 */ }

    var bar = document.getElementById('preloader-bar');
    var tipEl = document.getElementById('preloader-tip');

    // 8 条 Minecraft 主题提示文字
    var tips = [
        'preload_tip_0', 'preload_tip_1', 'preload_tip_2', 'preload_tip_3',
        'preload_tip_4', 'preload_tip_5', 'preload_tip_6', 'preload_tip_7'
    ];

    var tipIndex = 0;
    var progress = 0;

    /**
     * 更新提示文字
     */
    function updateTip() {
        if (!tipEl) return;
        var key = tips[tipIndex % tips.length];
        tipEl.textContent = (window.t && window.t(key)) ? window.t(key) : key;
        tipIndex++;
    }

    /**
     * 推进进度条
     */
    function advanceProgress() {
        if (progress < 85) {
            progress += Math.random() * 8 + 2;
            if (progress > 85) progress = 85;
        } else if (progress < 99) {
            progress += Math.random() * 1.5 + 0.3;
            if (progress > 99) progress = 99;
        }
        if (bar) bar.style.width = progress + '%';
    }

    // 启动动画
    var tipTimer = setInterval(updateTip, 800);
    var progTimer = setInterval(advanceProgress, 200);

    /**
     * 完成加载，隐藏加载界面
     */
    function finishLoading() {
        if (bar) bar.style.width = '100%';
        if (tipEl) tipEl.textContent = window.t ? window.t('preload_done') : '✓ 加载完成';

        clearInterval(tipTimer);
        clearInterval(progTimer);

        setTimeout(function() {
            preloader.classList.add('hidden');
            setTimeout(function() {
                preloader.style.display = 'none';
                document.body.style.overflow = '';
            }, 500);
        }, 300);
    }

    /**
     * 检测页面是否加载完成
     */
    function checkReady() {
        if (document.readyState === 'complete') {
            finishLoading();
        } else {
            setTimeout(checkReady, 100);
        }
    }

    // 先运行 1.5 秒动画再检查
    setTimeout(function() {
        checkReady();
    }, 1500);

    // 兜底：最多 3.5 秒强制结束
    setTimeout(function() {
        if (!preloader.classList.contains('hidden')) {
            finishLoading();
        }
    }, 3500);

    // 显示第一条提示
    updateTip();

})();
