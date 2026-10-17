(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        var slides = document.querySelectorAll('.carousel-slide');
        var indicators = document.querySelectorAll('.carousel-indicator');
        if (!slides.length) return;

        var cur = 0, timer = null;

        function show(idx) {
            slides.forEach(function(s) { s.classList.remove('opacity-100'); s.classList.add('opacity-0'); });
            indicators.forEach(function(i) { i.classList.remove('opacity-100'); i.classList.add('opacity-50'); });
            slides[idx].classList.remove('opacity-0');
            slides[idx].classList.add('opacity-100');
            indicators[idx].classList.remove('opacity-50');
            indicators[idx].classList.add('opacity-100');
            cur = idx;
        }

        function next() { show((cur + 1) % slides.length); }

        function start(delay) {
            if (timer) clearInterval(timer);
            timer = setInterval(next, delay || 5000);
        }

        start(window.innerWidth < 768 ? 6000 : 5000);

        indicators.forEach(function(ind, i) {
            ind.addEventListener('click', function() {
                clearInterval(timer);
                show(i);
                start(window.innerWidth < 768 ? 6000 : 5000);
            });
        });

        var resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                start(window.innerWidth < 768 ? 6000 : 5000);
            }, 300);
        });
    });

})();
