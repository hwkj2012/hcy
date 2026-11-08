/**
 * 登录/注册系统模块
 * 对接服务器 AuthMe 数据库，支持登录、退出、UI状态管理
 */
(function() {
    'use strict';

    // 后端 API 地址
    // 线上：接口与网站同域（Cloudflare Pages Functions），用相对路径即可，
    //       不写死域名——换域名、换环境都不用改代码。
    // 本地：自动指向本机开发服务。
    // 需要临时指向别处时，可在页面里预设 window.HCY_AUTH_API 覆盖。
    var IS_LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var API_BASE = (typeof window !== 'undefined' && window.HCY_AUTH_API)
        || (IS_LOCAL ? 'http://127.0.0.1:3102/api/auth' : '/api/auth');

    // 统一的请求封装：带超时与错误归因
    async function apiPost(path, payload, timeoutMs) {
        var ctrl = new AbortController();
        var timer = setTimeout(function() { ctrl.abort(); }, timeoutMs || 15000);
        try {
            var res = await fetch(API_BASE + path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: ctrl.signal
            });
            var data = null;
            try { data = await res.json(); } catch (e) { data = null; }
            return { ok: res.ok, status: res.status, data: data };
        } finally {
            clearTimeout(timer);
        }
    }

    // ========== 工具函数 ==========

    function showToast(msg, duration) {
        var toast = document.getElementById('command-toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(function() {
            toast.classList.remove('show');
        }, duration || 2000);
    }

    function getToken() {
        return localStorage.getItem('auth_token');
    }

    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('auth_user'));
        } catch(e) {
            return null;
        }
    }

    function saveSession(token, user) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
    }

    function clearSession() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    }

    // 转义后再插入 DOM，避免本地存储被篡改时注入 HTML
    function escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // 相对时间：3 天前 / 刚刚
    function relativeTime(iso) {
        if (!iso) return '';
        var t = new Date(iso).getTime();
        if (!isFinite(t)) return '';
        var diff = Date.now() - t;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
        return Math.floor(diff / 86400000) + ' 天前';
    }

    // ========== 密码派生（在浏览器完成）==========
    // 服务端（Cloudflare Workers 免费版）只有 10ms CPU，跑不动 21 万次 PBKDF2，
    // 所以耗时的部分放在浏览器做；网络上传输的是派生结果，明文密码不出本机。
    // 约定：salt = "hcy:v1:" + 用户名小写，PBKDF2-SHA256 21 万次，输出 64 位十六进制。
    var PBKDF2_ITERATIONS = 210000;

    async function deriveAuthKey(username, password) {
        var enc = new TextEncoder();
        var salt = enc.encode('hcy:v1:' + String(username).toLowerCase());
        var km = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
        var bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
            km, 256
        );
        return Array.prototype.map.call(new Uint8Array(bits), function (b) {
            return ('0' + b.toString(16)).slice(-2);
        }).join('');
    }

    // ========== 登录请求 ==========

    async function loginUser(username, password) {
        var errEl = document.getElementById('login-error');
        var loginBtn = document.getElementById('auth-login-btn');
        var agreeCheck = document.getElementById('terms-agree-check');
        errEl.classList.add('hidden');

        if (!username || !password) {
            errEl.textContent = window.t('auth_err_empty');
            errEl.classList.remove('hidden');
            return false;
        }

        // 必须勾选同意服务条款
        if (!agreeCheck || !agreeCheck.checked) {
            errEl.textContent = window.t('auth_err_terms');
            errEl.classList.remove('hidden');
            // 抖动提示
            var wrap = document.getElementById('terms-agree-wrap');
            if (wrap) {
                wrap.classList.add('terms-shake');
                setTimeout(function() { wrap.classList.remove('terms-shake'); }, 500);
            }
            return false;
        }

        // 按钮加载状态
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + window.t('auth_btn_logging');

        try {
            var authKey = await deriveAuthKey(username, password);
            var r = await apiPost('/login', { username: username, authKey: authKey });
            var data = r.data;

            if (!r.ok || !data || !data.success) {
                var msg = (data && data.error) || window.t('auth_err_connect');
                if (r.status === 429) msg = data && data.error ? data.error : window.t('auth_err_connect');
                errEl.textContent = msg;
                errEl.classList.remove('hidden');
                return false;
            }

            // 保存登录状态
            saveSession(data.token, data.data);
            hideAuthModal();
            updateNavUI();
            showToast(window.t('auth_welcome') + data.data.username + '！');
            return true;

        } catch (err) {
            errEl.textContent = err.name === 'AbortError'
                ? window.t('auth_err_connect')
                : window.t('auth_err_connect');
            errEl.classList.remove('hidden');
            return false;

        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>' + window.t('auth_btn_login');
        }
    }

    // ========== 注册 ==========

    async function registerUser(username, password, password2, agreed) {
        var errEl = document.getElementById('register-error');
        var btn = document.getElementById('auth-register-btn');
        if (!errEl || !btn) return false;

        errEl.classList.add('hidden');

        function fail(msg) {
            errEl.textContent = msg;
            errEl.classList.remove('hidden');
            return false;
        }

        if (!username || !password || !password2) return fail(window.t('auth_err_empty'));
        if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return fail(window.t('auth_err_username_rule'));
        if (password.length < 8) return fail(window.t('auth_err_password_short'));
        if (password !== password2) return fail(window.t('auth_err_password_mismatch'));
        if (!agreed) return fail(window.t('auth_err_terms'));

        btn.disabled = true;
        var original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + window.t('auth_btn_registering');

        try {
            var authKey = await deriveAuthKey(username, password);
            var r = await apiPost('/register', { username: username, authKey: authKey });
            var data = r.data;
            if (!r.ok || !data || !data.success) {
                return fail((data && data.error) || window.t('auth_err_connect'));
            }
            saveSession(data.token, data.data);
            hideAuthModal();
            updateNavUI();
            showToast(window.t('auth_register_success'));
            return true;
        } catch (e) {
            return fail(window.t('auth_err_connect'));
        } finally {
            btn.disabled = false;
            btn.innerHTML = original;
        }
    }

    // ========== 刷新会话（打开页面时校验令牌是否仍有效）==========

    async function refreshProfile() {
        var token = getToken();
        if (!token || !getCurrentUser()) return;
        try {
            var res = await fetch(API_BASE + '/me', {
                headers: { Authorization: 'Bearer ' + token }
            });
            if (res.status === 401 || res.status === 403) {
                clearSession();
                updateNavUI();
                return;
            }
            if (!res.ok) return;
            var data = await res.json();
            if (data && data.success && data.data) {
                saveSession(token, data.data);
                updateNavUI();
            }
        } catch (e) {
            // 网络异常时先用本地缓存，不打断浏览
        }
    }

    // ========== 退出登录 ==========

    function logoutUser() {
        clearSession();
        updateNavUI();
        showToast(window.t('auth_logged_out'));
    }

    // ========== 弹窗控制 ==========

    function showAuthModal() {
        var modal = document.getElementById('auth-modal');
        if (!modal) return;
        modal.classList.remove('opacity-0', 'invisible');
        modal.classList.add('opacity-100', 'visible');
        modal.querySelector('div:first-child').classList.remove('scale-95');
        modal.querySelector('div:first-child').classList.add('scale-100');
        document.body.style.overflow = 'hidden';

        // 重置表单
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-error').classList.add('hidden');
        var agreeCheck = document.getElementById('terms-agree-check');
        if (agreeCheck) agreeCheck.checked = false;
        switchAuthTab('login');
    }

    function hideAuthModal() {
        var modal = document.getElementById('auth-modal');
        if (!modal) return;
        modal.classList.remove('opacity-100', 'visible');
        modal.classList.add('opacity-0', 'invisible');
        modal.querySelector('div:first-child').classList.remove('scale-100');
        modal.querySelector('div:first-child').classList.add('scale-95');
        document.body.style.overflow = '';
    }

    // ========== 标签切换 ==========

    function switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(function(t) {
            t.classList.remove('bg-white', 'shadow-sm', 'text-primary');
            t.classList.add('text-gray-500');
        });
        document.querySelectorAll('.auth-form').forEach(function(f) {
            f.classList.add('hidden');
        });

        if (tab === 'login') {
            document.getElementById('auth-tab-login').classList.add('bg-white', 'shadow-sm', 'text-primary');
            document.getElementById('auth-form-login').classList.remove('hidden');
            document.getElementById('auth-modal-title').textContent = window.t('auth_title_login');
        } else {
            document.getElementById('auth-tab-register').classList.add('bg-white', 'shadow-sm', 'text-primary');
            document.getElementById('auth-form-register').classList.remove('hidden');
            document.getElementById('auth-modal-title').textContent = window.t('auth_title_register');
        }
    }

    // 暴露到全局，兼容 onclick
    window.switchAuthTab = switchAuthTab;

    // ========== 更新导航栏 UI ==========

    function updateNavUI() {
        var user = getCurrentUser();
        var navBtn = document.getElementById('nav-login-btn');
        var mobileBtn = document.getElementById('nav-login-btn-mobile');

        if (!navBtn) return;

        if (user) {
            var initial = escapeHtml(user.username.charAt(0).toUpperCase());

            // 资料行：注册时长 + 最后登录
            var metaBits = [];
            if (typeof user.registeredDays === 'number') {
                metaBits.push('注册 ' + user.registeredDays + ' 天');
            }
            if (user.lastLoginAt) {
                metaBits.push('最后登录 ' + relativeTime(user.lastLoginAt));
            }
            if (typeof user.loginCount === 'number') {
                metaBits.push('登录 ' + user.loginCount + ' 次');
            }
            var metaHtml = metaBits.length
                ? '<div style="padding:6px 14px 8px;font-size:0.75rem;color:#6b7280;line-height:1.6;">' +
                      metaBits.map(function(b) { return '<div>' + escapeHtml(b) + '</div>'; }).join('') +
                  '</div>'
                : '';

            navBtn.innerHTML =
                '<div style="position:relative;display:inline-flex;align-items:center;">' +
                    '<div class="user-avatar-btn">' + initial + '</div>' +
                    '<div class="user-dropdown" id="user-dropdown">' +
                        '<a href="javascript:void(0)" style="font-weight:600;color:#111827;">' +
                            '<i class="fas fa-user-circle"></i> ' + escapeHtml(user.username) +
                        '</a>' +
                        metaHtml +
                        '<div class="dropdown-divider"></div>' +
                        '<a href="javascript:void(0)" id="dropdown-logout" class="logout-link">' +
                            '<i class="fas fa-sign-out-alt"></i> ' + window.t('nav_logout') +
                        '</a>' +
                    '</div>' +
                '</div>';
            navBtn.style.cssText = 'background:transparent;padding:0;border-radius:0;display:inline-flex;';

            // 移动端：显示用户信息
            if (mobileBtn) {
                mobileBtn.innerHTML =
                    '<div class="mobile-user-info">' +
                        '<div class="mobile-user-avatar">' + initial + '</div>' +
                        '<div style="flex:1;">' +
                            '<div style="font-weight:700;">' + escapeHtml(user.username) + '</div>' +
                            '<div style="font-size:0.75rem;opacity:0.8;">' + window.t('auth_logged_in') + '</div>' +
                        '</div>' +
                        '<i class="fas fa-sign-out-alt" id="mobile-logout" style="font-size:1.1rem;cursor:pointer;"></i>' +
                    '</div>';
            }

            // 下拉菜单交互
            setTimeout(function() {
                var avatar = document.querySelector('.user-avatar-btn');
                var dropdown = document.getElementById('user-dropdown');
                if (avatar && dropdown) {
                    avatar.onclick = function(e) {
                        e.stopPropagation();
                        dropdown.classList.toggle('show');
                    };
                    document.addEventListener('click', function() {
                        if (dropdown) dropdown.classList.remove('show');
                    });
                    dropdown.onclick = function(e) {
                        e.stopPropagation();
                    };
                }

                var logoutBtn = document.getElementById('dropdown-logout');
                if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);

                var mobileLogout = document.getElementById('mobile-logout');
                if (mobileLogout) {
                    mobileLogout.addEventListener('click', function(e) {
                        e.stopPropagation();
                        logoutUser();
                    });
                }
            }, 0);

        } else {
            // 未登录状态
            navBtn.innerHTML = '<i class="fas fa-user"></i><span id="nav-login-text">' + window.t('nav_login') + '</span>';
            navBtn.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,#06b6d4,#14b8a6);color:white;padding:6px 16px;border-radius:20px;font-size:0.85rem;font-weight:600;';

            if (mobileBtn) {
                mobileBtn.innerHTML = '<i class="fas fa-user"></i><span id="nav-login-text-mobile">' + window.t('nav_login') + '</span>';
                mobileBtn.style.cssText = 'display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#06b6d4,#14b8a6);color:white;padding:10px 16px;border-radius:12px;font-weight:600;';
            }
        }
    }

    // ========== 事件绑定 ==========

    function init() {
        // 标签切换
        document.querySelectorAll('.auth-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                switchAuthTab(this.dataset.tab);
            });
        });

        // 关闭弹窗
        var closeBtn = document.getElementById('close-auth-modal');
        if (closeBtn) closeBtn.addEventListener('click', hideAuthModal);

        var authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.addEventListener('click', function(e) {
                if (e.target === this) hideAuthModal();
            });
        }

        // 导航栏登录按钮
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('#nav-login-btn');
            var mobBtn = e.target.closest('#nav-login-btn-mobile');
            if ((btn || mobBtn) && !getCurrentUser()) {
                showAuthModal();
            }
        });

        // 登录提交
        var loginBtn = document.getElementById('auth-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', function() {
                loginUser(
                    document.getElementById('login-username').value.trim(),
                    document.getElementById('login-password').value
                );
            });
        }

        // 回车提交
        var pwInput = document.getElementById('login-password');
        if (pwInput) {
            pwInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    var btn = document.getElementById('auth-login-btn');
                    if (btn) btn.click();
                }
            });
        }

        var userInput = document.getElementById('login-username');
        if (userInput) {
            userInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    var btn = document.getElementById('auth-login-btn');
                    if (btn) btn.click();
                }
            });
        }

        // 注册提交
        var regBtn = document.getElementById('auth-register-btn');
        if (regBtn) {
            regBtn.addEventListener('click', function() {
                registerUser(
                    (document.getElementById('reg-username') || {}).value || '',
                    (document.getElementById('reg-password') || {}).value || '',
                    (document.getElementById('reg-password2') || {}).value || '',
                    !!((document.getElementById('reg-terms-check') || {}).checked)
                );
            });
        }

        // 注册表单回车提交
        ['reg-username', 'reg-password', 'reg-password2'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        var b = document.getElementById('auth-register-btn');
                        if (b) b.click();
                    }
                });
            }
        });

        // 忘记密码
        var forgotBtn = document.getElementById('forgot-password');
        if (forgotBtn) {
            forgotBtn.addEventListener('click', function() {
                alert(window.t('auth_forgot_hint'));
            });
        }

        // 初始化 UI
        updateNavUI();
        refreshProfile();

        var user = getCurrentUser();
        if (user) {
            console.log('👋 已登录: ' + user.username);
        }
    }

    // DOM 就绪后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
