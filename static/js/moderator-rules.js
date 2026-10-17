/**
 * 协管守则弹窗模块
 * 包含润色后的协管守则内容、渲染引擎、弹窗控制
 */
(function() {
    'use strict';

    // ========== 润色后的协管守则内容 ==========
    var rulesMarkdown = [
        '## 协管守则',
        '',
        '> 最后更新：2026年4月11日',
        '',
        '### 一、总则',
        '',
        '协管员作为服务器的协助管理人员，应当以身作则，维护服务器的公平与秩序。以下守则适用于全体协管员，违反将视情节轻重予以警告、停职或撤销权限。',
        '',
        '---',
        '',
        '### 二、具体守则',
        '',
        '**第一条 · 公正履职**',
        '协管行事应秉持公平公正原则，不得在公务中掺杂任何个人情绪或主观好恶。',
        '',
        '**第二条 · 权限规范**',
        '协管不得利用职务特权从事与公务无关的活动，严禁使用协管权限处理私人事务。',
        '',
        '**第三条 · 信息保密**',
        '协管不得以任何形式泄露玩家的坐标、基地坐标及其他游戏敏感数据。',
        '',
        '**第四条 · 中立立场**',
        '协管不得加入任何阵营或组织，不得与任何玩家建立合作关系，始终保持中立。',
        '',
        '**第五条 · 维护平衡**',
        '协管不得干扰游戏平衡与公平性，更不得危害服务器安全。',
        '',
        '**第六条 · 证据先行**',
        '协管处理事务应基于客观证据，不得凭空臆断；在无充分把握前，不得轻易作出判断。',
        '',
        '**第七条 · 身份管理**',
        '协管不得泄露、炫耀或暗示自身拥有的任何特权，不得公开声明协管身份，严禁泄露管理组内部信息。',
        '',
        '**第八条 · 权限边界**',
        '协管不得在管理职责范围之外干预玩家行为。',
        '',
        '**第九条 · 禁止胁迫**',
        '协管不得威胁或强制无违规行为的玩家做任何事。',
        '',
        '**第十条 · 违规处理**',
        '违反以上任一条款，管理组有权立即撤销其协管权限。',
        '',
        '---',
        '',
        '### 三、附则',
        '',
        '- 本守则最终解释权归 HCY 服务器管理团队所有',
        '- 申请协管请联系管理组进行审核（邮箱：HCY26mc@163.com）'
    ].join('\n');

    // ========== 英文协管守则 ==========
    var rulesMarkdownEn = [
        '## Moderator Code of Conduct',
        '',
        '> Last updated: April 11, 2026',
        '',
        '### I. General Provisions',
        '',
        'Moderators, as assistant management staff, shall lead by example and uphold fairness and order on the server. The following rules apply to all moderators. Violations may result in warnings, suspension, or revocation of privileges depending on severity.',
        '',
        '---',
        '',
        '### II. Specific Rules',
        '',
        '**Article 1 · Impartial Duty**',
        'Moderators shall act with fairness and impartiality, and must not let personal emotions or bias influence official duties.',
        '',
        '**Article 2 · Permission Standards**',
        'Moderators shall not use their privileges for activities unrelated to official duties. Using moderator permissions for private matters is strictly prohibited.',
        '',
        '**Article 3 · Information Confidentiality**',
        'Moderators shall not disclose player coordinates, base locations, or any other sensitive game data in any form.',
        '',
        '**Article 4 · Neutral Stance**',
        'Moderators shall not join any faction or organization, nor establish cooperative relationships with any player. Maintain neutrality at all times.',
        '',
        '**Article 5 · Preserving Balance**',
        'Moderators shall not disrupt game balance or fairness, and must not compromise server security.',
        '',
        '**Article 6 · Evidence First**',
        'Moderators shall base their actions on objective evidence and must not speculate without grounds. Do not make judgments without sufficient certainty.',
        '',
        '**Article 7 · Identity Management**',
        'Moderators shall not disclose, flaunt, or imply any privileges they possess. Do not publicly declare your moderator status. Leaking internal management information is strictly forbidden.',
        '',
        '**Article 8 · Authority Boundaries**',
        'Moderators shall not intervene in player behavior beyond their scope of management responsibilities.',
        '',
        '**Article 9 · No Coercion**',
        'Moderators shall not threaten or force any player who has not violated rules to do anything.',
        '',
        '**Article 10 · Violation Consequences**',
        'Violation of any of the above articles grants the management team the right to immediately revoke moderator privileges.',
        '',
        '---',
        '',
        '### III. Appendix',
        '',
        '- Final interpretation of this code belongs to the HCY server management team',
        '- To apply as a moderator, contact the management team for review (email: HCY26mc@163.com)'
    ].join('\n');

    // ========== 简单 Markdown 渲染 ==========
    function renderMarkdown(md) {
        var lines = md.split('\n');
        var html = [];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            if (line.trim() === '') continue;

            // h2
            var h2Match = line.match(/^## (.+)$/);
            if (h2Match) {
                html.push('<h2>' + inlineFormat(h2Match[1]) + '</h2>');
                continue;
            }

            // h3
            var h3Match = line.match(/^### (.+)$/);
            if (h3Match) {
                html.push('<h3>' + inlineFormat(h3Match[1]) + '</h3>');
                continue;
            }

            // 水平线
            if (line.match(/^---$/)) {
                html.push('<hr>');
                continue;
            }

            // 引用
            if (line.startsWith('> ')) {
                html.push('<blockquote>' + inlineFormat(line.substring(2)) + '</blockquote>');
                continue;
            }

            // 无序列表
            var ulMatch = line.match(/^-\s+(.*)$/);
            if (ulMatch) {
                html.push('<li>' + inlineFormat(ulMatch[1]) + '</li>');
                continue;
            }

            // 粗体行
            var boldMatch = line.match(/^\*\*(.+?)\*\*$/);
            if (boldMatch) {
                html.push('<p style="margin-top:0.8rem;margin-bottom:0.2rem;"><strong>' + inlineFormat(boldMatch[1]) + '</strong></p>');
                continue;
            }

            // 普通段落
            html.push('<p>' + inlineFormat(line) + '</p>');
        }

        return html.join('\n');
    }

    function inlineFormat(text) {
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        text = text.replace(/`(.+?)`/g, '<code>$1</code>');
        return text;
    }

    // ========== 弹窗控制 ==========
    function showModal() {
        var modal = document.getElementById('moderator-rules-modal');
        if (!modal) return;
        modal.classList.remove('opacity-0', 'invisible');
        modal.classList.add('opacity-100', 'visible');
        document.body.style.overflow = 'hidden';

        var content = document.getElementById('moderator-content');
        if (content && content.dataset.rendered !== 'true') {
            content.innerHTML = renderMarkdown(rulesMarkdown);
            content.dataset.rendered = 'true';
        }
    }

    function hideModal() {
        var modal = document.getElementById('moderator-rules-modal');
        if (!modal) return;
        modal.classList.remove('opacity-100', 'visible');
        modal.classList.add('opacity-0', 'invisible');
        document.body.style.overflow = '';
    }

    // ========== 事件绑定 ==========
    function init() {
        var link = document.getElementById('moderator-rules-link');
        if (link) link.addEventListener('click', showModal);

        var closeBtn1 = document.getElementById('close-moderator-modal');
        if (closeBtn1) closeBtn1.addEventListener('click', hideModal);

        var closeBtn2 = document.getElementById('close-moderator-btn');
        if (closeBtn2) closeBtn2.addEventListener('click', hideModal);

        var modal = document.getElementById('moderator-rules-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) hideModal();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 暴露 markdown 供文档页使用
    window.getModeratorRulesMarkdown = function() { return rulesMarkdown; };
    window.getModeratorRulesMarkdownEn = function() { return rulesMarkdownEn; };

})();
