/**
 * 打字机循环动画模块
 * 让 "HCY 无规则生存服务器" 文字循环打字出现再消失
 */
(function() {
    'use strict';

    var titleEl = document.getElementById('typing-title');
    if (!titleEl) return;

    // 要打字显示的完整文字
    var fullText = (window.t && window.t('page_title')) ? window.t('page_title') : 'HCY 无规则生存服务器';

    // 打字速度配置（毫秒）
    var SPEED = {
        type: 100,       // 每个字打出的间隔
        delete: 50,      // 每个字删除的间隔
        pauseAfterType: 2000,  // 打完后停留时间
        pauseAfterDelete: 800  // 删完后停留时间
    };

    var index = 0;          // 当前显示的字符数
    var isDeleting = false; // 是否正在删除
    var timer = null;

    /**
     * 执行一次打字或删除步骤
     */
    function step() {
        // 如果元素被隐藏或不在视口中，跳过
        if (!titleEl || titleEl.offsetParent === null) {
            timer = setTimeout(step, 100);
            return;
        }

        if (!isDeleting) {
            // === 打字阶段 ===
            index++;
            titleEl.textContent = fullText.substring(0, index);

            if (index >= fullText.length) {
                // 打字完成，暂停后开始删除
                isDeleting = true;
                clearTimeout(timer);
                timer = setTimeout(step, SPEED.pauseAfterType);
                return;
            }
            timer = setTimeout(step, SPEED.type);

        } else {
            // === 删除阶段 ===
            index--;
            titleEl.textContent = fullText.substring(0, index);

            if (index <= 0) {
                // 删除完成，暂停后重新打字
                isDeleting = false;
                clearTimeout(timer);
                timer = setTimeout(step, SPEED.pauseAfterDelete);
                return;
            }
            timer = setTimeout(step, SPEED.delete);
        }
    }

    // 语言切换时更新打字文本
    window.addEventListener('langchange', function () {
        var newText = (window.t && window.t('page_title')) ? window.t('page_title') : 'HCY 无规则生存服务器';
        if (newText !== fullText) {
            fullText = newText;
            index = 0;
            isDeleting = false;
            clearTimeout(timer);
            titleEl.textContent = '';
            timer = setTimeout(step, 300);
        }
    });

    // 初始等待 500ms 后开始
    timer = setTimeout(step, 500);

    // 页面可见性变化时保持同步（用户切换标签页回来后继续）
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && titleEl) {
            // 如果元素内容不完整，强制同步状态
            var currentLen = titleEl.textContent.length;
            if (currentLen > 0 && currentLen < fullText.length) {
                // 正在打字或删除中，保持现有状态
            }
        }
    });

})();
