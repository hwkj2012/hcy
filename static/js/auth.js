/**
 * 登录/注册系统模块
 * 对接服务器 AuthMe 数据库，支持登录、退出、UI状态管理
 */
(function() {
    'use strict';

    // 后端 API 地址（修改为你的服务器地址）
    var API_BASE = 'http://workstation.monikasuki.work:3001/api/auth';

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
            var res = await fetch(API_BASE + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password })
            });

            var data = await res.json();

            if (!res.ok || !data.success) {
                errEl.textContent = data.error || window.t('auth_err_connect');
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
            errEl.textContent = window.t('auth_err_connect');
            errEl.classList.remove('hidden');
            return false;

        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>' + window.t('auth_btn_login');
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
            var initial = user.username.charAt(0).toUpperCase();

            // 桌面端：显示头像 + 下拉菜单
            navBtn.innerHTML =
                '<div style="position:relative;display:inline-flex;align-items:center;">' +
                    '<div class="user-avatar-btn">' + initial + '</div>' +
                    '<div class="user-dropdown" id="user-dropdown">' +
                        '<a href="javascript:void(0)" style="font-weight:600;color:#111827;">' +
                            '<i class="fas fa-user-circle"></i> ' + user.username +
                        '</a>' +
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
                            '<div style="font-weight:700;">' + user.username + '</div>' +
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

        // 忘记密码
        var forgotBtn = document.getElementById('forgot-password');
        if (forgotBtn) {
            forgotBtn.addEventListener('click', function() {
                alert('忘记密码？请在游戏内联系管理员重置。');
            });
        }

        // 初始化 UI
        updateNavUI();

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
