(function() {
    'use strict';

    document.addEventListener('click', function(e) {
        // 关闭弹窗按钮
        var closeBtn = e.target.closest('.modal-close-btn');
        if (closeBtn && closeBtn.dataset.modal) {
            Utils.hideModal(closeBtn.dataset.modal);
            return;
        }

        // 点击背景关闭
        var mask = e.target.closest('.modal-mask');
        if (mask && e.target === mask) {
            Utils.hideModal(mask.id);
            return;
        }

        // data-action 导航按钮
        var actionEl = e.target.closest('[data-action]');
        if (actionEl) {
            var map = {
                'help': 'help-modal',
                'announcement': 'announcement-modal',
                'qq': 'qq-group-modal',
                'utility': 'utility-modal',
                'level-guide': 'level-guide-modal'
            };
            var id = map[actionEl.dataset.action];
            if (id) Utils.showModal(id);
            return;
        }

        // 复制按钮
        var copyBtn = e.target.closest('.copy-btn');
        if (copyBtn && copyBtn.dataset.target) {
            var el = document.getElementById(copyBtn.dataset.target);
            if (el) {
                Utils.copyText(el.textContent.trim()).then(function() {
                    var msg = copyBtn.dataset.msg || 'copy_success';
                    // 若为 i18n key 则翻译，否则直接使用原文本
                    var msgEl = document.getElementById('copy-success-msg');
                    var displayMsg = (window.t && window.t(msg)) ? window.t(msg) : msg;
                    if (msgEl) msgEl.textContent = displayMsg;
                    Utils.showModal('copy-success-modal');
                    setTimeout(function() { Utils.hideModal('copy-success-modal'); }, 3000);
                });
            }
            return;
        }

        // 指令复制
        var cmd = e.target.closest('.cmd-item');
        if (cmd && !cmd.dataset.action) {
            var command = cmd.dataset.cmd || cmd.textContent.trim().split(/\s+/)[0];
            Utils.copyText(command).then(function() { Utils.showToast(window.t ? window.t('toast_cmd_copied') : '指令复制成功'); });
            return;
        }

        // 特殊符号复制
        var charBtn = e.target.closest('.char-btn');
        if (charBtn) {
            Utils.copyText(charBtn.textContent.trim()).then(function() { Utils.showToast('已复制'); });
            return;
        }

        // 实用工具标签切换
        var tab = e.target.closest('.utility-tab');
        if (tab && tab.dataset.tab) {
            document.querySelectorAll('.utility-tab').forEach(function(t) {
                t.classList.remove('border-primary', 'text-primary');
                t.classList.add('border-transparent', 'text-gray-500');
            });
            tab.classList.remove('border-transparent', 'text-gray-500');
            tab.classList.add('border-primary', 'text-primary');
            document.querySelectorAll('.utility-content').forEach(function(c) { c.classList.add('hidden'); });
            var ct = document.getElementById(tab.dataset.tab + '-content');
            if (ct) ct.classList.remove('hidden');
            return;
        }

        // 玩家名点击
        var playerSpan = e.target.closest('[data-player]');
        if (playerSpan && window.showPlayerInfo) {
            window.showPlayerInfo(playerSpan.dataset.player);
        }
    });

})();
