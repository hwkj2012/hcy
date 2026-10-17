/**
 * 黑白主题切换模块
 * 支持 localStorage 持久化、双按钮同步、暗色模式切换
 */
(function() {
    'use strict';

    var THEME_KEY = '4u4n_theme';

    /**
     * 获取当前保存的主题
     * @returns {string} 'light' 或 'dark'
     */
    function getTheme() {
        return localStorage.getItem(THEME_KEY) || 'light';
    }

    /**
     * 保存主题到 localStorage
     * @param {string} theme - 'light' 或 'dark'
     */
    function saveTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
    }

    /**
     * 应用主题到页面
     * @param {string} theme - 'light' 或 'dark'
     */
    function applyTheme(theme) {
        var html = document.documentElement;
        var desktopIcon = document.getElementById('theme-icon-desktop');
        var mobileIcon = document.getElementById('theme-icon-mobile');

        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            if (desktopIcon) desktopIcon.className = 'fas fa-sun';
            if (mobileIcon) mobileIcon.className = 'fas fa-sun';
        } else {
            html.removeAttribute('data-theme');
            if (desktopIcon) desktopIcon.className = 'fas fa-moon';
            if (mobileIcon) mobileIcon.className = 'fas fa-moon';
        }
    }

    /**
     * 切换主题
     */
    function toggleTheme() {
        var current = getTheme();
        var newTheme = current === 'dark' ? 'light' : 'dark';
        saveTheme(newTheme);
        applyTheme(newTheme);
    }

    // 暴露到全局，兼容 onclick 调用
    window.toggleTheme = toggleTheme;

    /**
     * 初始化主题系统
     */
    function init() {
        // 应用已保存的主题
        var saved = getTheme();
        applyTheme(saved);

        // 绑定桌面端切换按钮
        var desktopBtn = document.getElementById('theme-toggle-desktop');
        if (desktopBtn) {
            desktopBtn.addEventListener('click', toggleTheme);
        }

        // 绑定移动端切换按钮
        var mobileBtn = document.getElementById('theme-toggle-mobile');
        if (mobileBtn) {
            mobileBtn.addEventListener('click', toggleTheme);
        }
    }

    // DOM 就绪后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
