/**
 * 服务器文档独立页脚本
 * 职责：渲染各分区内容、目录滚动高亮、深链跳转、同意流程、移动端目录、返回首页跳过加载动画
 * 依赖：terms.js（提供 window.renderMarkdown / window.getTermsMarkdown）
 */
(function () {
    'use strict';

    // ========== 公告内容（Markdown） ==========
    function getAnnouncementMarkdown() {
        return [
            '## ' + (window.t('docs_announce_h2') || '2026 年公告'),
            '',
            window.t('announce_p1') || '我们仅用 McMMO 技能等级之和 作为等级评判标准。',
            '',
            window.t('announce_p2') || '服务器纯公益，**无任何充值氪金项目**。',
            '',
            window.t('announce_p5') || '服务器内禁止刷屏和宣传其他服务器，违者禁言 **7** 天。',
            '',
            '> ' + (window.t('announce_footer') || '祝您游玩愉快 —— HCY')
        ].join('\n');
    }

    // ========== 更新内容（Markdown） ==========
    function getUpdatesMarkdown() {
        return [
            '## ' + (window.t('docs_updates_h2') || '更新日志'),
            '',
            '- **' + (window.t('docs_updates_item1_date') || '2026年10月') + '** — ' + (window.t('docs_updates_item1') || '更新小黑塔'),
            '',
            '---',
            '',
            '## ' + (window.t('docs_updates_future_h2') || '未来企划'),
            '',
            '- **' + (window.t('docs_updates_future1_date') || '预计未来几月') + '** — ' + (window.t('docs_updates_future1') || '更新小游戏')
        ].join('\n');
    }

    // ========== 帮助指令数据 ==========
    var helpData = [
        {
            titleKey: 'docs_help_basic',
            cmds: [
                { cmd: '/sethome <家名称>',   cmdEn: '/sethome <home>',        descKey: 'cmd_sethome',           desc: '保存当前位置' },
                { cmd: '/home <家名称>',      cmdEn: '/home <home>',           descKey: 'cmd_home',              desc: '回家' },
                { cmd: '/showitem',          descKey: 'cmd_showitem',          desc: '展示手持物品' },
                { cmd: '/back',              descKey: 'cmd_back',              desc: '回到上次死亡点' },
                { cmd: '/msg <玩家> <内容>',  cmdEn: '/msg <player> <msg>',    descKey: 'cmd_msg',              desc: '私聊' },
                { cmd: '/seed',              descKey: 'cmd_seed',              desc: '查看地图种子' },
                { cmd: '/tpa <玩家>',         cmdEn: '/tpa <player>',          descKey: 'cmd_tpa',              desc: '传送到其他玩家' },
                { cmd: '/tpahere <玩家>',     cmdEn: '/tpahere <player>',      descKey: 'cmd_tpahere',           desc: '把其他玩家传送到你这里' },
                { cmd: '/hat',               descKey: 'cmd_hat',               desc: '将手中物品戴在头上' },
                { cmd: '/skin <正版名/UUID>', cmdEn: '/skin <name/UUID>',      descKey: 'cmd_skin',             desc: '换皮肤' },
            ]
        },
        {
            titleKey: 'docs_help_special',
            cmds: [
                { cmd: '/rtp',        descKey: 'cmd_rtp',        desc: '随机传送' },
                { cmd: '/back',       descKey: 'cmd_back2',      desc: '回到上一次死亡点' },
                { cmd: '/party',      descKey: 'cmd_party',      desc: '临时工会系统' },
                { cmd: '/zmusic',     descKey: 'cmd_zmusic',     desc: '服内播放音乐' },
            ]
        },
        {
            titleKey: 'docs_help_bot',
            cmds: [
                { cmd: 'i', descKey: 'cmd_bot_i', desc: '在线状态查看' }
            ]
        }
    ];

    function init() {
        // 返回首页时设置跳过加载动画标记
        var backBtn = document.getElementById('docs-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                try { sessionStorage.setItem('skip_preloader', '1'); } catch (e) {}
            });
        }

        // 同意栏检测
        var agreeBar = document.getElementById('docs-agree-bar');
        var showAgree = false;
        try {
            showAgree = sessionStorage.getItem('show_agree_bar') === '1';
            sessionStorage.removeItem('show_agree_bar');
        } catch (e) {}
        if (agreeBar && !showAgree) {
            agreeBar.style.display = 'none';
        }

        renderAnnouncement();
        renderUpdates();
        renderHelp();
        renderModerator();
        renderTerms();
        enableScrollSpy();
        if (showAgree) enableAgreeFlow();
        enableBackToTop();
        enableMobileToc();
        enableHashDropdown();
        handleDeepLink();

        // 语言切换时重新渲染动态内容
        window.addEventListener('langchange', function () {
            renderAnnouncement();
            renderUpdates();
            renderHelp();
            renderModerator();
            renderTerms();
        });
    }

    // ========== 渲染公告 ==========
    function renderAnnouncement() {
        var el = document.getElementById('announcement-content');
        if (!el || !window.renderMarkdown) return;
        el.innerHTML = window.renderMarkdown(getAnnouncementMarkdown());
    }

    // ========== 渲染更新内容 ==========
    function renderUpdates() {
        var el = document.getElementById('updates-content');
        if (!el || !window.renderMarkdown) return;
        el.innerHTML = window.renderMarkdown(getUpdatesMarkdown());
    }

    // ========== 渲染帮助 ==========
    function renderHelp() {
        var el = document.getElementById('help-content');
        if (!el) return;

        var isEn = false;
        try { isEn = (localStorage.getItem('hcy_lang') || 'zh') === 'en'; } catch (e) {}

        var html = '';
        helpData.forEach(function (block) {
            html += '<div class="docs-help-block"><h3>' + escapeHtml(window.t(block.titleKey)) + '</h3><div class="docs-cmd-grid">';
            block.cmds.forEach(function (c) {
                var descText = (c.descKey && window.t(c.descKey)) || c.desc;
                var cmdText = isEn ? (c.cmdEn || c.cmd) : c.cmd;
                html +=
                    '<div class="docs-cmd" data-copy="' + escapeAttr(cmdText) + '" title="点击复制">' +
                    '<code>' + escapeHtml(cmdText) + '</code>' +
                    '<span class="docs-cmd-desc">' + escapeHtml(descText) + '</span>' +
                    '</div>';
            });
            html += '</div></div>';
        });

        html += '<div class="docs-help-block"><h3>' + escapeHtml(window.t('docs_help_mcmmo')) + '</h3>' +
            '<p style="color:#6b7280;">' + escapeHtml(window.t('docs_help_mcmmo_desc')) + '</p></div>';

        el.innerHTML = html;

        // 点击复制
        el.querySelectorAll('.docs-cmd').forEach(function (item) {
            item.addEventListener('click', function () {
                var text = this.getAttribute('data-copy');
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(function () { showToast(window.t('docs_copied') + text); });
                } else {
                    showToast(window.t('docs_copied') + text);
                }
            });
        });
    }

    // ========== 渲染协管守则 ==========
    function renderModerator() {
        var el = document.getElementById('moderator-content');
        if (!el || !window.renderMarkdown) return;
        var md = '';
        try {
            var lang = localStorage.getItem('hcy_lang') || 'zh';
            if (lang === 'en' && window.getModeratorRulesMarkdownEn) {
                md = window.getModeratorRulesMarkdownEn();
            } else if (window.getModeratorRulesMarkdown) {
                md = window.getModeratorRulesMarkdown();
            }
        } catch (e) {
            md = window.getModeratorRulesMarkdown ? window.getModeratorRulesMarkdown() : '';
        }
        if (md) {
            el.innerHTML = window.renderMarkdown(md);
        } else {
            el.innerHTML = '<div class="docs-empty"><i class="fas fa-inbox"></i><h3>暂未加载</h3><p>请稍后刷新重试</p></div>';
        }
    }

    // ========== 渲染服务条款 ==========
    function renderTerms() {
        var el = document.getElementById('terms-content');
        if (!el || !window.renderMarkdown) return;
        var md;
        try {
            var lang = localStorage.getItem('hcy_lang') || 'zh';
            if (lang === 'en' && window.getTermsMarkdownEn) {
                md = window.getTermsMarkdownEn();
            } else if (window.getTermsMarkdown) {
                md = window.getTermsMarkdown();
            } else {
                return;
            }
        } catch (e) {
            md = window.getTermsMarkdown ? window.getTermsMarkdown() : '';
        }
        el.innerHTML = window.renderMarkdown(md);
    }

    // ========== 滚动高亮（scroll-spy） ==========
    function enableScrollSpy() {
        var links = document.querySelectorAll('.docs-toc a[data-target]');
        var sections = ['announcement', 'updates', 'help', 'moderator', 'terms'];
        if (!links.length) return;

        function update() {
            var scrollY = window.scrollY + 130;
            var current = sections[0];
            for (var i = 0; i < sections.length; i++) {
                var el = document.getElementById(sections[i]);
                if (el && el.getBoundingClientRect().top + window.scrollY <= scrollY) {
                    current = sections[i];
                }
            }
            links.forEach(function (a) {
                a.classList.toggle('active', a.dataset.target === current);
            });
        }

        var ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () { update(); ticking = false; });
                ticking = true;
            }
        }, { passive: true });

        update();
    }

    // ========== 同意流程 ==========
    function enableAgreeFlow() {
        var check = document.getElementById('terms-agree-check-page');
        var btn = document.getElementById('terms-agree-confirm');
        if (!check || !btn) return;

        function refreshBtn() { btn.disabled = !check.checked; }

        check.addEventListener('change', function () {
            refreshBtn();
            if (check.checked) {
                try {
                    localStorage.setItem('terms_agreed', '1');
                    localStorage.setItem('terms_agreed_time', new Date().toISOString());
                } catch (e) {}
            }
        });

        btn.addEventListener('click', function () {
            if (btn.disabled) return;
            var original = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-check"></i><span>' + window.t('docs_agree_done') + '</span>';

            try { sessionStorage.setItem('skip_preloader', '1'); } catch (e) {}

            // 若由 window.open 打开可自动关闭
            if (window.opener && !window.opener.closed) {
                try { window.opener.postMessage({ type: 'terms-agreed' }, '*'); } catch (e) {}
                setTimeout(function () { window.close(); }, 400);
            } else {
                showToast(window.t('docs_agree_toast'));
                setTimeout(function () { window.location.href = 'index.html'; }, 2000);
            }
        });

        try {
            if (localStorage.getItem('terms_agreed') === '1') {
                check.checked = true;
                refreshBtn();
            }
        } catch (e) {}
    }

    // ========== 返回顶部 ==========
    function enableBackToTop() {
        var btn = document.getElementById('docs-to-top');
        if (!btn) return;
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    btn.classList.toggle('show', window.scrollY > 400); ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }

    // ========== 移动端目录 ==========
    function enableMobileToc() {
        var toggle = document.getElementById('docs-toc-toggle');
        var sidebar = document.getElementById('docs-sidebar');
        if (!toggle || !sidebar) return;

        var overlay = document.createElement('div');
        overlay.className = 'docs-overlay';
        document.body.appendChild(overlay);

        function open() { sidebar.classList.add('open'); overlay.classList.add('show'); }
        function close() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }

        toggle.addEventListener('click', open);
        overlay.addEventListener('click', close);

        // 点击目录项后关闭
        sidebar.querySelectorAll('a[data-target]').forEach(function (a) {
            a.addEventListener('click', function () { close(); });
        });
    }

    // ========== 哈希工具下载下拉 ==========
    function enableHashDropdown() {
        var toggle = document.getElementById('hash-dl-toggle');
        var menu = document.getElementById('hash-dl-menu');
        if (!toggle || !menu) return;

        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            var isOpen = menu.classList.contains('show');
            if (isOpen) {
                menu.classList.remove('show');
                toggle.setAttribute('aria-expanded', 'false');
            } else {
                menu.classList.add('show');
                toggle.setAttribute('aria-expanded', 'true');
            }
        });

        // 点击外部关闭
        document.addEventListener('click', function (e) {
            if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.remove('show');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ========== 深链跳转 ==========
    // 支持 #announcement / #updates / #help / #terms
    function handleDeepLink() {
        var hash = window.location.hash.replace('#', '').replace('/', '');
        var valid = { announcement: true, updates: true, help: true, moderator: true, terms: true };
        if (hash && valid[hash]) {
            var el = document.getElementById(hash);
            if (el) {
                // 等渲染完成后再滚动
                setTimeout(function () {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 150);
            }
        } else {
            // 默认滚动到顶部
            window.scrollTo(0, 0);
        }
    }

    // ========== 工具函数 ==========
    function showToast(msg) {
        var t = document.createElement('div');
        t.className = 'docs-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.classList.add('show'); });
        setTimeout(function () {
            t.classList.remove('show');
            setTimeout(function () { t.remove(); }, 300);
        }, 1800);
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function escapeAttr(s) { return escapeHtml(s); }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
