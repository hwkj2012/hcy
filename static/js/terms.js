/**
 * 服务条款弹窗模块
 */
(function() {
    'use strict';

    var termsMarkdown = [
        '# HCY 无规则生存服务器 — 服务条款',
        '',
        '> 最后更新日期：2026年',
        '> 登录即表示您已阅读、理解并同意本条款的全部内容。',
        '',
        '---',
        '',
        '## 第一章：账号安全与责任',
        '',
        '### 1.1 账号安全提醒',
        '',
        '在HCY服务器中，您的游戏账号是您最宝贵的资产。为了保障您的账号安全，我们强烈建议：',
        '',
        '- **定期更换强密码**，避免使用生日、123456等易被猜解的密码',
        '- **及时保存并记忆密码**，切勿将密码透露给他人',
        '- **谨慎保管账号信息**，因个人疏忽导致的账号丢失由玩家自行承担责任',
        '',
        '### 1.2 服务器安全措施',
        '',
        '服务器已部署多层次安全防护体系：',
        '',
        '- **登录保护**：多次密码错误将触发临时封禁机制，阻断爆破攻击',
        '- **二步验证（2FA）**：高度关注账户安全的玩家，建议在登录池使用 `/2fa` 命令开启动态二步验证',
        '',
        '### 1.3 密码遗忘与账号找回',
        '',
        '> ⚠️ **重要声明**：出于安全考虑，服务器已**停止**为玩家直接重置密码。若您遗忘密码或账号被盗，请按以下流程申请安全重置。',
        '',
        '#### 申请条件',
        '',
        '申请重置密码前，请确保您的账号**在过去30天内未被成功登录**。',
        '',
        '#### 申请流程',
        '',
        '请准备一份**手写保证书**（需包含以下全部内容），并拍摄照片提交审核：',
        '',
        '1. **玩家信息**：填写您的游戏名（如有小号请一并列出）',
        '2. **所有权证明**：提供可验证的账户归属证据，如基地样貌、基地数量、基地传送点名称等信息',
        '3. **丢失原因**：详细描述账号丢失的经过，并说明未来将如何加强安全防护',
        '4. **新密码**：写明您希望重置为的新密码',
        '5. **签署信息**：在保证书末尾签署**真实姓名**及**日期**',
        '',
        '#### 提交方式',
        '',
        '1. 将保证书从**正面**及**两个不同角度**拍摄照片（共三张）',
        '2. 发送至邮箱：**HCY26mc@163.com**',
        '3. 邮件标题格式：**`<玩家名>申请重置密码`**',
        '4. 邮件内容请附上三张保证书照片',
        '',
        '#### 审理周期',
        '',
        '我们将在收到邮件后的 **7个工作日内** 完成审理并为您重置密码。',
        '',
        '> ⚠️ 请注意：若提交内容不符合规范、信息虚假，或未按流程申请，我们**不会受理**您的申请。',
        '',
        '---',
        '',
        '## 第二章：服务器管理制度',
        '',
        '### 2.1 公益性质声明',
        '',
        'HCY 服务器为**纯公益服务器**，不存在任何形式的贿赂及特权行为。',
        '',
        '- 若发现任何协管、公职人员存在不当行为，请立即通过私信举报',
        '- 我们将严肃处理每一起举报，维护公平公正的游戏环境',
        '',
        '### 2.2 责任边界声明',
        '',
        '本服务器为无规则玩法，服务器任何公职人员（包括管理人员、服主）**没有任何义务或责任**来管理人权纠纷。',
        '',
        '- 我们不会受理关于玩家纠纷的任何举报',
        '- 如造成不必要的麻烦，由玩家**自行承担**',
        '',
        '### 2.3 聊天内容与举报管理',
        '',
        '鉴于服务器已上架纯净屏蔽公屏系统，且服务器本质为无规则玩法：',
        '',
        '- 我们**不会受理**任何有关违规聊天内容的举报以及私信',
        '- 若因此类问题频繁干扰服务器公职人员正常休息和工作，将按照轻重严肃处理',
        '- 严重情况下，我们有权对违规玩家**提起法律诉讼**',
        '',
        '### 2.4 公职人员执行权利',
        '',
        '在与服务器公职人员沟通时，请遵守以下原则：',
        '',
        '- 请勿以任何理由或道德绑架方式干扰服务器公职人员执行权利',
        '- 我们尊重人权，也尊重一律平等',
        '- 请不要以任何特权（包括但不限于富豪、未成年人、其他特殊人群）或身份地位进行沟通',
        '- 违反者**后果自负**',
        '',
        '### 2.5 漏洞报告规则',
        '',
        '服务器禁止利用任何漏洞。若发现存在重大漏洞或 BUG 等重大服务器事项：',
        '',
        '- 请及时通过 QQ 等交流软件上报',
        '- 若发现私自利用漏洞，我们有权**封禁您的账户**',
        '',
        '### 2.6 反馈与求助指南',
        '',
        '由于服主个人原因，日常可能无法及时处理服务器相关内容：',
        '',
        '- **紧急事项**（重大漏洞、BUG等）：请通过邮件详细描述',
        '- **普通咨询**：请在**周末或晚间**进行求助',
        '- **注意事项**：请勿频繁骚扰，否则后果由玩家自行承担',
        '- 服主有权对违规玩家行为进行处置',
        '',
        '### 2.7 造谣与诽谤禁止',
        '',
        '任何玩家不得以任何形式（包括但不限于文字、图片、视频等内容），在服务器内或社交媒体平台上，对服务器管理团队及工作人员进行诋毁、造谣或恶意诽谤。',
        '',
        '- **适用范围**：本条款涵盖服务器内聊天、QQ群、微信、B站、贴吧及其他所有公开或私密的社交平台',
        '- **法律后果**：若违反本条并造成严重后果（包括但不限于对他人造成严重心理伤害、名誉损害等），将依照《中华人民共和国刑法》及《中华人民共和国民法典》相关规定依法追究法律责任',
        '- **配合调查**：服务器管理团队将全力配合司法机关，提供相关日志及证据材料',
        '',
        '### 2.8 最终声明',
        '',
        '> 以上条款为最后一次重申。**不配合者请自行退出**，否则出现违规后的后果及法律责任由玩家本人自行承担。',
        '',
        '---',
        '',
        '## 附则',
        '',
        '- 本条款最终解释权归 HCY 服务器管理团队所有',
        '- 更多详细信息请加入官方QQ群：**1107400167** 了解',
        '- 如有疑问，请通过邮件联系：**HCY26mc@163.com**',
        '',
        '---',
        '',
        '*感谢您选择 HCY 无规则生存服务器，祝您游戏愉快！*',
        '',
        '*— HCY*'
    ].join('\n');

    // ========== Markdown 渲染引擎 ==========
    function renderMarkdown(md) {
        var lines = md.split('\n');
        var html = [];
        var inList = false;
        var listType = null;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            // 空行
            if (line.trim() === '') {
                if (inList) {
                    html.push('</' + listType + '>');
                    inList = false;
                    listType = null;
                }
                continue;
            }

            // 标题 (h1-h6)
            var hMatch = line.match(/^(#{1,6})\s+(.*)$/);
            if (hMatch) {
                if (inList) {
                    html.push('</' + listType + '>');
                    inList = false;
                    listType = null;
                }
                var hLevel = hMatch[1].length;
                html.push('<h' + hLevel + '>' + inlineFormat(hMatch[2]) + '</h' + hLevel + '>');
                continue;
            }

            // 水平线
            if (line.match(/^---$/)) {
                if (inList) {
                    html.push('</' + listType + '>');
                    inList = false;
                    listType = null;
                }
                html.push('<hr>');
                continue;
            }

            // 引用
            if (line.startsWith('> ')) {
                if (inList) {
                    html.push('</' + listType + '>');
                    inList = false;
                    listType = null;
                }
                var quoteContent = line.substring(2);
                var isWarning = quoteContent.includes('⚠️');
                var cls = isWarning ? ' class="warning-tip"' : '';
                html.push('<blockquote' + cls + '>' + inlineFormat(quoteContent) + '</blockquote>');
                continue;
            }

            // 无序列表
            var ulMatch = line.match(/^-\s+(.*)$/);
            if (ulMatch) {
                if (!inList || listType !== 'ul') {
                    if (inList) html.push('</' + listType + '>');
                    html.push('<ul>');
                    inList = true;
                    listType = 'ul';
                }
                html.push('<li>' + inlineFormat(ulMatch[1]) + '</li>');
                continue;
            }

            // 有序列表
            var olMatch = line.match(/^\d+\.\s+(.*)$/);
            if (olMatch) {
                if (!inList || listType !== 'ol') {
                    if (inList) html.push('</' + listType + '>');
                    html.push('<ol>');
                    inList = true;
                    listType = 'ol';
                }
                html.push('<li>' + inlineFormat(olMatch[1]) + '</li>');
                continue;
            }

            // 普通段落
            if (inList) {
                html.push('</' + listType + '>');
                inList = false;
                listType = null;
            }
            html.push('<p>' + inlineFormat(line) + '</p>');
        }

        if (inList) html.push('</' + listType + '>');

        return html.join('\n');
    }

    // 行内格式化
    function inlineFormat(text) {
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        text = text.replace(/`(.+?)`/g, '<code>$1</code>');
        text = text.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+)/g, '<a href="mailto:$1" class="text-primary hover:underline">$1</a>');
        return text;
    }

    // ========== 弹窗控制 ==========
    function showTermsModal() {
        var modal = document.getElementById('terms-modal');
        if (!modal) return;
        modal.classList.remove('opacity-0', 'invisible');
        modal.classList.add('opacity-100', 'visible');
        document.body.style.overflow = 'hidden';

        // 渲染内容（只渲染一次）
        var content = document.getElementById('terms-content');
        if (content && content.dataset.rendered !== 'true') {
            content.innerHTML = renderMarkdown(termsMarkdown);
            content.dataset.rendered = 'true';
        }
    }

    function hideTermsModal() {
        var modal = document.getElementById('terms-modal');
        if (!modal) return;
        modal.classList.remove('opacity-100', 'visible');
        modal.classList.add('opacity-0', 'invisible');
        document.body.style.overflow = '';
    }

    // 暴露到全局
    window.showTermsModal = showTermsModal;
    window.hideTermsModal = hideTermsModal;
    window.renderMarkdown = renderMarkdown;
    window.getTermsMarkdown = function() { return termsMarkdown; };

    // ========== 英文服务条款内容 ==========
    var termsMarkdownEn = [
        '# HCY Anarchy Survival Server — Terms of Service',
        '',
        '> Last updated: 2026',
        '> By logging in, you confirm that you have read, understood, and agreed to all terms below.',
        '',
        '---',
        '',
        '## Chapter 1: Account Security & Responsibilities',
        '',
        '### 1.1 Account Security Reminder',
        '',
        'Your game account is your most valuable asset on the HCY server. To keep it safe, we strongly recommend:',
        '',
        '- **Change your password regularly** — avoid weak passwords like "123456" or your birthday',
        '- **Memorize your password** and never share it with anyone',
        '- **Protect your account information** — you are responsible for losses caused by negligence',
        '',
        '### 1.2 Server Security Measures',
        '',
        'The server has deployed multiple layers of security:',
        '',
        '- **Login Protection**: Repeated failed login attempts will trigger a temporary ban to block brute-force attacks',
        '- **Two-Factor Authentication (2FA)**: Security-conscious players can enable 2FA in the login pool using `/2fa`',
        '',
        '### 1.3 Forgotten Passwords & Account Recovery',
        '',
        '> ⚠️ **Important**: For security reasons, the server has **stopped** directly resetting passwords for players. If you forget your password or your account is compromised, please follow the procedure below.',
        '',
        '#### Eligibility',
        '',
        'Your account must **not have been successfully logged into within the past 30 days** to qualify for a reset.',
        '',
        '#### Application Process',
        '',
        'Prepare a **handwritten guarantee letter** (must include all of the following) and submit photos for review:',
        '',
        '1. **Player Info**: Provide your in-game name (list any alt accounts as well)',
        '2. **Proof of Ownership**: Provide verifiable evidence of account ownership, such as base appearance, number of bases, warp point names, etc.',
        '3. **Reason for Loss**: Describe in detail how the account was lost and how you plan to improve security going forward',
        '4. **New Password**: Specify the new password you wish to set',
        '5. **Signature**: Sign the letter with your **real name** and **date**',
        '',
        '#### Submission',
        '',
        '1. Photograph the guarantee letter from **three different angles** (front + two sides)',
        '2. Send to: **HCY26mc@163.com**',
        '3. Email subject format: **`<PlayerName> Password Reset Request`**',
        '4. Attach all three photos',
        '',
        '#### Processing Time',
        '',
        'We will process your request within **7 business days** of receiving the email.',
        '',
        '> ⚠️ Note: If your submission does not meet the requirements, contains false information, or does not follow the procedure, your application **will not be processed**.',
        '',
        '---',
        '',
        '## Chapter 2: Server Management Policies',
        '',
        '### 2.1 Non-Profit Declaration',
        '',
        'The HCY server is a **purely non-profit** server. There are no forms of bribery or privileged treatment.',
        '',
        '- Report any misconduct by staff or moderators via private message immediately',
        '- We will take every report seriously to maintain a fair and just gaming environment',
        '',
        '### 2.2 Liability Boundaries',
        '',
        'This is a no-rules server. No server staff (including management and owners) have **any obligation or responsibility** to intervene in human rights disputes between players.',
        '',
        '- We will **not accept** any reports regarding player disputes',
        '- Any resulting consequences are the **sole responsibility** of the players involved',
        '',
        '### 2.3 Chat Content & Report Management',
        '',
        'Given the server has deployed a clean public-chat filter and operates as a no-rules environment:',
        '',
        '- We **will not accept** any reports or private messages regarding chat content violations',
        '- If such issues repeatedly disrupt staff rest and work, penalties will be applied based on severity',
        '- In serious cases, we reserve the right to **pursue legal action** against offending players',
        '',
        '### 2.4 Staff Enforcement Rights',
        '',
        'When communicating with server staff, please observe the following:',
        '',
        '- Do not interfere with staff exercising their rights under any pretext or moral coercion',
        '- We respect human rights and uphold equality for all',
        '- Do not attempt to negotiate using any privileged status (including but not limited to: wealth, minors, or other special groups)',
        '- Violators bear their **own consequences**',
        '',
        '### 2.5 Vulnerability Reporting',
        '',
        'Exploiting any vulnerability is strictly prohibited. If you discover a major exploit, bug, or other critical server issue:',
        '',
        '- Please report it promptly via QQ or other communication software',
        '- If found exploiting vulnerabilities privately, we reserve the right to **ban your account**',
        '',
        '### 2.6 Feedback & Help Guide',
        '',
        'Due to the owner\'s personal circumstances, server-related matters may not be handled promptly on a daily basis:',
        '',
        '- **Urgent matters** (major exploits, bugs, etc.): Please describe in detail via email',
        '- **General inquiries**: Please seek help on **weekends or evenings**',
        '- **Important**: Do not harass staff repeatedly — consequences are the player\'s own responsibility',
        '- The owner reserves the right to take action against offending players',
        '',
        '### 2.7 Prohibition of Defamation and Rumors',
        '',
        'No player shall, in any form (including but not limited to text, images, videos, etc.), defame, spread rumors about, or maliciously slander the server management team or staff members, whether within the server or on social media platforms.',
        '',
        '- **Scope**: This clause covers in-server chat, QQ groups, WeChat, Bilibili, Tieba, and all other public or private social platforms',
        '- **Legal Consequences**: If a violation of this clause results in serious consequences (including but not limited to severe psychological harm, reputational damage, etc.), legal liability shall be pursued in accordance with the relevant provisions of the Criminal Law of the People\'s Republic of China and the Civil Code of the People\'s Republic of China',
        '- **Cooperation with Investigation**: The server management team will fully cooperate with judicial authorities and provide relevant logs and evidence materials',
        '',
        '### 2.8 Final Statement',
        '',
        '> The above terms are reiterated for the last time. **Those who do not comply should leave voluntarily.** Otherwise, consequences and legal liability arising from violations shall be borne solely by the player.',
        '',
        '---',
        '',
        '## Appendix',
        '',
        '- The final interpretation of these terms belongs to the HCY Server management team',
        '- For more details, join the official QQ group: **1107400167**',
        '- For questions, contact: **HCY26mc@163.com**',
        '',
        '---',
        '',
        '*Thank you for choosing HCY Anarchy Survival Server. Enjoy your stay!*',
        '',
        '*— HCY Network*'
    ].join('\n');

    window.getTermsMarkdownEn = function() { return termsMarkdownEn; };

    // ========== 事件绑定 ==========
    function init() {
        // 注意：服务条款链接现已改为跳转独立页 terms.html（见 index.html），
        // 不再绑定弹窗。如需保留弹窗入口，可在此处为指定元素绑定 showTermsModal。

        // 关闭按钮
        var closeBtn1 = document.getElementById('close-terms-modal');
        if (closeBtn1) closeBtn1.addEventListener('click', hideTermsModal);

        var closeBtn2 = document.getElementById('terms-close-btn');
        if (closeBtn2) closeBtn2.addEventListener('click', hideTermsModal);

        // 同意按钮
        var agreeBtn = document.getElementById('terms-agree-btn');
        if (agreeBtn) {
            agreeBtn.addEventListener('click', function() {
                hideTermsModal();
                var toast = document.getElementById('command-toast');
                if (toast) {
                    toast.textContent = '✅ 已同意服务条款';
                    toast.classList.add('show');
                    clearTimeout(toast._timer);
                    toast._timer = setTimeout(function() {
                        toast.classList.remove('show');
                    }, 1500);
                }
            });
        }

        // 点击背景关闭
        var modal = document.getElementById('terms-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) hideTermsModal();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
