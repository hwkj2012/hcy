// 检测开发者工具打开并跳转 https://www.yuanshen.com/
(function() {
    "use strict";
    const GENSHIN_URL = "https://www.yuanshen.com/";

    // 1. 拦截快捷键
    document.addEventListener('keydown', function(e) {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
            (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
        ) {
            e.preventDefault();
            window.location.href = GENSHIN_URL;
        }
    });

    // 2. 禁用右键菜单
    document.addEventListener('contextmenu', e => e.preventDefault());

    // 3. 优化的调试器检测（减少误判）
    let checkTimer = null;
    const CHECK_INTERVAL = 1500; // 降低频率，减少性能开销

    const checkDebugger = () => {
        const start = performance.now();
        debugger;
        const elapsed = performance.now() - start;
        if (elapsed > 100) {
            window.location.href = GENSHIN_URL;
        }
    };

    // 页面可见时才检测，不可见时暂停
    const handleVisibility = () => {
        if (document.hidden) {
            if (checkTimer) {
                clearInterval(checkTimer);
                checkTimer = null;
            }
        } else {
            if (!checkTimer) {
                checkTimer = setInterval(checkDebugger, CHECK_INTERVAL);
            }
        }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    handleVisibility(); // 初始调用
})();
