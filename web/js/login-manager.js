/**
 * 农产品供销信息平台 - 登录状态管理工具
 * 用于确保跨页面保持一致的登录状态
 */

// 登录状态管理对象
const LoginManager = {
    // 获取当前用户信息
    getCurrentUser() {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
            try {
                return JSON.parse(userInfoStr);
            } catch (e) {
                console.error('解析用户信息失败', e);
                return null;
            }
        }
        return null;
    },

    // 检查用户是否已登录 - 综合多种方法确保一致性
    isLoggedIn() {
        // 首先检查token，这是最可靠的方法
        const hasToken = !!localStorage.getItem('token');

        // 然后检查localStorage中的标志
        const isLoggedInLS = localStorage.getItem('isLoggedIn') === 'true';

        // 最后检查cookie中的标志
        const cookies = this.getCookies();
        const isLoggedInCookie = cookies.isLoggedIn === 'true';

        // 对所有方法的结果进行逻辑与
        const result = hasToken && isLoggedInLS;

        // 如果检测到不一致状态，进行同步
        this.syncLoginState(hasToken, isLoggedInLS, isLoggedInCookie, cookies.token);

        return result;
    },

    // 同步不一致的登录状态
    syncLoginState(hasToken, isLoggedInLS, isLoggedInCookie, cookieToken) {
        // Cookie显示已登录但localStorage没有token
        if (isLoggedInCookie && cookieToken && !hasToken) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('token', cookieToken);
            console.log('已从Cookie同步登录状态到localStorage');
        }

        // localStorage有token但isLoggedIn标志不一致
        if (hasToken && !isLoggedInLS) {
            localStorage.setItem('isLoggedIn', 'true');
            console.log('已修复localStorage中的isLoggedIn标志');
        }

        // localStorage显示已登录但Cookie没有
        if (isLoggedInLS && hasToken && !isLoggedInCookie) {
            this.setCookie('isLoggedIn', 'true', 1); // 1天有效期
            this.setCookie('token', localStorage.getItem('token'), 1);
            console.log('已从localStorage同步登录状态到Cookie');
        }
    },

    // 获取所有cookie并解析为对象
    getCookies() {
        return document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            if (key) acc[key] = value;
            return acc;
        }, {});
    },

    // 设置cookie
    setCookie(name, value, days) {
        const maxAge = days * 24 * 60 * 60;
        document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
    },

    // 用户登录
    login(userData, token, remember = false) {
        // 构建用户信息对象
        const user = {
            name: userData.username || userData.phone || '用户',
            avatar: userData.avatar || '../app/images/default-avatar.png',
            ...userData
        };

        // 生成token（如果未提供）
        if (!token) {
            token = 'user_' + Math.random().toString(36).substring(2);
        }

        // 存储到localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('isGuest', userData.isGuest === true ? 'true' : 'false');
        localStorage.setItem('userName', user.name);
        localStorage.setItem('token', token);
        localStorage.setItem('userInfo', JSON.stringify(user));

        // 设置cookie有效期
        const days = remember ? 30 : 1; // 30天或1天

        // 同步到cookie
        this.setCookie('isLoggedIn', 'true', days);
        this.setCookie('token', token, days);

        // 如果选择了记住我，保存手机号
        if (remember && userData.phone) {
            localStorage.setItem('rememberedPhone', userData.phone);
        }

        // 更新界面显示
        this.updateUI();

        return true;
    },

    // 退出登录
    logout(redirectTo) {
        // 清除localStorage中的登录状态
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isGuest');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userName');

        // 清除cookie
        this.setCookie('isLoggedIn', '', -1); // 立即过期
        this.setCookie('token', '', -1);

        // 如果提供了重定向URL，则跳转
        if (redirectTo) {
            window.location.href = redirectTo;
        }

        return true;
    },

    // 更新界面显示
    updateUI() {
        const isLoggedIn = this.isLoggedIn();
        const user = this.getCurrentUser();

        // 登录按钮和用户头像
        const loginBtn = document.getElementById('loginBtn');
        const userAvatarMini = document.getElementById('userAvatarMini');

        if (loginBtn && userAvatarMini) {
            if (isLoggedIn) {
                // 已登录状态
                loginBtn.style.display = 'none';
                userAvatarMini.style.display = 'block';

                // 设置用户头像
                const userAvatarImg = document.getElementById('userAvatarImg');
                if (userAvatarImg && user) {
                    userAvatarImg.src = user.avatar || '../app/images/default-avatar.png';

                    // 头像加载错误处理
                    userAvatarImg.onerror = function () {
                        this.src = '../app/images/default-avatar.png';
                    };
                }
            } else {
                // 未登录状态
                loginBtn.style.display = 'block';
                userAvatarMini.style.display = 'none';
            }
        }

        // 更新用户名显示
        const userNameElements = document.querySelectorAll('.user-name');
        if (userNameElements.length > 0 && user) {
            userNameElements.forEach(el => {
                el.textContent = user.name;
            });
        }

        // 根据登录状态显示/隐藏元素
        if (isLoggedIn) {
            // 显示已登录状态的元素
            document.querySelectorAll('.logged-in-only').forEach(el => {
                el.style.display = '';
            });

            // 隐藏未登录状态的元素
            document.querySelectorAll('.logged-out-only').forEach(el => {
                el.style.display = 'none';
            });
        } else {
            // 显示未登录状态的元素
            document.querySelectorAll('.logged-out-only').forEach(el => {
                el.style.display = '';
            });

            // 隐藏已登录状态的元素
            document.querySelectorAll('.logged-in-only').forEach(el => {
                el.style.display = 'none';
            });
        }
    },

    // 检查当前页面是否需要登录权限
    checkAuthRequired() {
        // 不同系统中需要登录的页面列表
        const protectedPages = [
            'user.html',
            'publish.html',
            'my-supply.html',
            'my-demand.html',
            'my-favorites.html',
            'compare.html' // 可选，取决于业务需求
        ];

        // 获取当前页面名称
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        // 判断当前页面是否需要登录
        const requiresAuth = protectedPages.includes(currentPage) ||
            document.body.classList.contains('requires-auth');

        // 如果需要登录但用户未登录，重定向到登录页
        if (requiresAuth && !this.isLoggedIn()) {
            const redirectUrl = `login.html?redirect=${encodeURIComponent(currentPage)}`;
            window.location.href = redirectUrl;
            return false;
        }

        return true;
    },

    // 初始化 - 在每个页面加载时调用
    init() {
        // 同步并检查登录状态
        this.isLoggedIn();

        // 更新UI
        this.updateUI();

        // 检查授权要求
        this.checkAuthRequired();

        // 绑定注销按钮事件
        const logoutBtns = document.querySelectorAll('.logout-btn');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('确定要退出登录吗？')) {
                    this.logout('login.html');
                }
            });
        });
    }
};

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', function () {
    LoginManager.init();
});

// 导出LoginManager对象，供其他脚本使用
window.LoginManager = LoginManager; 