/**
 * McMMO 等级指南内容加载模块
 * 监听等级指南弹窗打开事件，加载并渲染 mcmmo-commands.md 文件
 */
(function() {
    'use strict';

	    var loaded = false;
	    var modal = document.getElementById('level-guide-modal');
	    if (!modal) return;

	    // 语言切换时重置加载状态，若弹窗已打开则立即重新加载
	    window.addEventListener('langchange', function() {
	        loaded = false;
	        var container = document.getElementById('mcmmo-content');
	        if (container) {
	            container.innerHTML = '<div class="flex items-center justify-center py-10"><i class="fas fa-spinner fa-spin text-primary text-2xl"></i><span class="ml-2 text-gray-600" data-i18n="level_loading">加载内容中...</span></div>';
	        }
	        // 若弹窗当前正在展示，立即加载对应语言内容
	        if (modal.classList.contains('active')) {
	            loaded = true;
	            loadMcmmo();
	        }
	    });

    // 监听弹窗打开
    var observer = new MutationObserver(function() {
        if (modal.classList.contains('active') && !loaded) {
            loaded = true;
            loadMcmmo();
        }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });

    /**
     * 加载并渲染 mcmmo-commands.md 文件
     */
    async function loadMcmmo() {
        var container = document.getElementById('mcmmo-content');
        if (!container) return;

        try {
            var lang = (function(){try{return localStorage.getItem('hcy_lang')||'zh';}catch(e){return'zh';}})();
            var url = lang === 'en' ? 'mcmmo-commands-en.md' : 'mcmmo-commands.md';
            var resp = await fetch(url);
            if (!resp.ok) throw new Error('Load failed');

            var md = await resp.text();

            // 渲染标题
            md = md.replace(/^(#+)\s+(.*)$/gm, function(m, level, text) {
                return '<h' + level.length + '>' + escapeHtml(text) + '</h' + level.length + '>';
            });

            // 渲染引用
            md = md.replace(/^>\s+(.*)$/gm, function(m, text) {
                return '<blockquote>' + escapeHtml(text) + '</blockquote>';
            });

            // 渲染表格行
            md = md.replace(/^\|(.+)\|$/gm, function(m, content) {
                var cells = content.split('|').map(function(c) { return c.trim(); });
                if (!cells.length || cells.every(function(c) { return c === ''; })) return '';
                var isHeader = cells.some(function(c) { return c.includes(':-:'); });
                var tag = isHeader ? 'th' : 'td';
                var cellsHtml = cells
                    .filter(function(c) { return c !== '' && !c.includes(':-:'); })
                    .map(function(c) { return '<' + tag + '>' + escapeHtml(c) + '</' + tag + '>'; })
                    .join('');
                return '<tr>' + cellsHtml + '</tr>';
            });

            // 包裹表格
            md = md.replace(/((?:<tr>[\s\S]*?<\/tr>\s*)+)/g, '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;margin:10px 0;">$1</table>');

            // 渲染无序列表
            md = md.replace(/^[\s]*[-*+]\s+(.*)$/gm, '<li>' + escapeHtml('$1') + '</li>');

            // 渲染行内代码
            md = md.replace(/`([^`]+)`/g, '<code>$1</code>');

            // 渲染加粗
            md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

            // 渲染斜体
            md = md.replace(/\*(.+?)\*/g, '<em>$1</em>');

            // 渲染链接
            md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-500 hover:underline">$1</a>');

            // 渲染段落（未被标签包裹的行）
            var lines = md.split('\n');
            var html = '';
            var inTable = false;
            var inList = false;

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];

                if (line.startsWith('<h') || line.startsWith('<blockquote') || line.startsWith('<table')) {
                    if (inList) { html += '</ul>'; inList = false; }
                    html += line;
                    if (line.startsWith('<table')) inTable = true;
                    if (line.startsWith('</table>')) inTable = false;
                    continue;
                }

                if (line.startsWith('<li>')) {
                    if (!inList) { html += '<ul>'; inList = true; }
                    html += line;
                    continue;
                }

                if (line.startsWith('<tr>')) {
                    html += line;
                    continue;
                }

                if (line.trim() === '') {
                    if (inList) { html += '</ul>'; inList = false; }
                    html += '<br>';
                    continue;
                }

                if (!line.startsWith('<') && line.trim()) {
                    if (inList) { html += '</ul>'; inList = false; }
                    html += '<p>' + line + '</p>';
                }
            }

            if (inList) html += '</ul>';

            container.innerHTML = html;

            // 添加表格样式
            var style = document.createElement('style');
            style.textContent = '#mcmmo-content table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 0.9rem; } #mcmmo-content th, #mcmmo-content td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; } #mcmmo-content th { background-color: #f5f5f5; font-weight: bold; } #mcmmo-content tr:nth-child(even) { background-color: #fafafa; } #mcmmo-content code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }';
            container.appendChild(style);

        } catch (err) {
            console.error('MCMMO加载失败:', err);
            container.innerHTML = '<div class="text-center text-red-500 py-10"><i class="fas fa-exclamation-circle text-2xl mb-2"></i><p>内容加载失败，请稍后重试</p></div>';
        }
    }

    /**
     * HTML 转义函数
     */
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

})();
