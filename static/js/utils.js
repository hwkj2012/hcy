(function() {
    'use strict';

    window.Utils = {
        showToast: function(msg, duration) {
            var toast = document.getElementById('command-toast');
            if (!toast) return;
            toast.textContent = msg;
            toast.classList.add('show');
            clearTimeout(toast._timer);
            toast._timer = setTimeout(function() { toast.classList.remove('show'); }, duration || 1500);
        },

        copyText: async function(text) {
            try {
                await navigator.clipboard.writeText(text);
            } catch(e) {
                var ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed;opacity:0;';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
        },

        showModal: function(id) {
            var m = document.getElementById(id);
            if (!m) return;
            m.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        hideModal: function(id) {
            var m = document.getElementById(id);
            if (!m) return;
            m.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

})();
