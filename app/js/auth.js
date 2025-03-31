/**
 * 农产品供销信息平台 - 用户认证工具
 * 用于管理用户登录状态、权限控制和认证相关功能
 */

// 登录状态管理对象
const Auth = {
    // 需要登录才能访问的页面列表
    protectedPages: [
        'user.html',        // 个人中心
        'publish.html',     // 发布信息
        'my-supply.html',   // 我的供应
        'my-demand.html',   // 我的需求
        'my-favorites.html', // 我的收藏
        'my-history.html',  // 浏览历史
        'messages.html',    // 消息中心
        'settings.html'     // 设置页面
    ],

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

    // 检查用户是否已登录
    isLoggedIn() {
        return !!localStorage.getItem('token');
    },

    // 获取当前页面名称
    getCurrentPage() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop();
        return pageName || 'index.html'; // 默认为首页
    },

    // 判断当前页面是否需要登录
    isProtectedPage(pageName) {
        return this.protectedPages.includes(pageName);
    },

    // 用户登录
    login(userData, token, remember = false) {
        localStorage.setItem('userInfo', JSON.stringify(userData));
        localStorage.setItem('token', token);

        if (remember && userData.phone) {
            localStorage.setItem('rememberedPhone', userData.phone);
        }
    },

    // 用户退出
    logout(redirectTo = 'login.html') {
        // 清除所有登录相关数据
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        sessionStorage.clear();

        // 保留记住的手机号
        const rememberedPhone = localStorage.getItem('rememberedPhone');

        // 跳转到登录页面
        window.location.href = redirectTo;
    },

    // 登录状态检查
    checkLoginStatus() {
        const currentPage = this.getCurrentPage();

        // 如果当前页面需要登录
        if (this.isProtectedPage(currentPage)) {
            // 检查是否已登录
            if (!this.isLoggedIn()) {
                // 未登录，重定向到登录页面并传递当前页面作为重定向目标
                const redirectUrl = `login.html?redirect=${encodeURIComponent(currentPage)}`;
                window.location.href = redirectUrl;
                return false;
            }
        }

        // 如果是登录页面且用户已登录，可以重定向到首页
        if (currentPage === 'login.html' && this.isLoggedIn()) {
            // 检查是否有重定向参数
            const urlParams = new URLSearchParams(window.location.search);
            const redirectPage = urlParams.get('redirect');

            if (redirectPage) {
                window.location.href = redirectPage;
            } else {
                window.location.href = 'index.html';
            }
            return false;
        }

        return true;
    },

    // 从URL获取重定向地址
    getRedirectUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('redirect') || 'index.html';
    },

    // 页面初始化时更新UI显示
    updateAuthUI() {
        if (this.isLoggedIn()) {
            // 用户已登录，更新界面显示
            const user = this.getCurrentUser();

            // 查找并更新用户信息显示区域
            const userNameElements = document.querySelectorAll('.user-name');
            const userAvatarElements = document.querySelectorAll('.user-avatar');

            if (user) {
                // 更新用户名
                userNameElements.forEach(el => {
                    if (el) el.textContent = user.name;
                });

                // 更新头像
                userAvatarElements.forEach(el => {
                    if (el) el.src = user.avatar || 'https://via.placeholder.com/64x64';
                });
            }

            // 显示已登录状态的元素
            document.querySelectorAll('.logged-in-only').forEach(el => {
                el.style.display = '';
            });

            // 隐藏未登录状态的元素
            document.querySelectorAll('.logged-out-only').forEach(el => {
                el.style.display = 'none';
            });
        } else {
            // 用户未登录
            // 隐藏已登录状态的元素
            document.querySelectorAll('.logged-in-only').forEach(el => {
                el.style.display = 'none';
            });

            // 显示未登录状态的元素
            document.querySelectorAll('.logged-out-only').forEach(el => {
                el.style.display = '';
            });
        }
    }
};

// 页面加载完成后检查登录状态
document.addEventListener('DOMContentLoaded', function () {
    Auth.checkLoginStatus();
    Auth.updateAuthUI();
});

// 导出Auth对象，供其他脚本使用
window.Auth = Auth;

// 退出登录点击事件
const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
        if (confirm('确定要退出登录吗？')) {
            // 显示加载状态
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 退出中...';
            this.disabled = true;

            // 使用Auth对象处理退出登录
            setTimeout(() => {
                Auth.logout('login.html');
            }, 800);
        }
    });
}
