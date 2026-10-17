(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // 回到顶部
        var backToTop = document.getElementById('backToTop');
        if (backToTop) {
            window.addEventListener('scroll', function() {
                backToTop.style.opacity = window.pageYOffset > 300 ? '1' : '0';
                backToTop.style.visibility = window.pageYOffset > 300 ? 'visible' : 'hidden';
            }, { passive: true });
            backToTop.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // 锚点平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(function(a) {
            a.addEventListener('click', function(e) {
                e.preventDefault();
                var t = document.querySelector(this.getAttribute('href'));
                if (t) t.scrollIntoView({ behavior: 'smooth' });
            });
        });

        // 移动端菜单
        var menuBtn = document.getElementById('mobile-menu-btn');
        var mobileMenu = document.getElementById('mobile-menu');
        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', function() {
                mobileMenu.classList.toggle('hidden');
                var icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.className = mobileMenu.classList.contains('hidden')
                        ? 'fas fa-bars text-2xl text-primary'
                        : 'fas fa-times text-2xl text-primary';
                }
            });
            mobileMenu.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', function() {
                    mobileMenu.classList.add('hidden');
                    var icon = menuBtn.querySelector('i');
                    if (icon) icon.className = 'fas fa-bars text-2xl text-primary';
                });
            });
        }
    });

})();
