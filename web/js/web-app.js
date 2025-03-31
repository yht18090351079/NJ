/**
 * 农产品供销信息平台Web应用端JavaScript
 * 实现Web端特有功能
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function () {
    // 初始化侧边栏
    initSidebar();

    // 初始化对比功能
    initCompare();

    // 初始化自适应导航
    initResponsiveNav();

    // 检查URL参数自动激活对应导航项
    activateNavFromUrl();

    // 检查登录状态
    checkLoginStatus();

    // 设置导航栏活动状态
    setActiveNavItem();

    // 移动端侧边栏
    setupSidebar();

    // 设置响应式布局
    setupResponsiveLayout();

    // 图片懒加载
    setupLazyLoading();

    // 过滤器通用功能
    setupFilters();
});

/**
 * 初始化侧边栏
 */
function initSidebar() {
    // 菜单开关点击事件
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    const sidebarClose = document.querySelector('.sidebar-close');

    if (menuToggle && sidebar && overlay) {
        // 打开侧边栏
        menuToggle.addEventListener('click', function () {
            sidebar.classList.add('open');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        });

        // 关闭侧边栏
        function closeSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }

        if (sidebarClose) {
            sidebarClose.addEventListener('click', closeSidebar);
        }

        overlay.addEventListener('click', closeSidebar);

        // 侧边栏菜单项点击
        const menuItems = document.querySelectorAll('.sidebar-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function () {
                // 移除所有active类
                menuItems.forEach(i => i.classList.remove('active'));
                // 添加当前active类
                this.classList.add('active');

                // 如果是移动端，点击后关闭侧边栏
                if (window.innerWidth < 768) {
                    closeSidebar();
                }
            });
        });
    }
}

/**
 * 初始化对比功能
 */
function initCompare() {
    // 对比栏相关元素
    const compareBar = document.querySelector('.compare-bar');
    const compareItems = document.querySelector('.compare-items');
    const compareClear = document.querySelector('.compare-clear');
    const compareButton = document.querySelector('.compare-button');

    if (!compareBar || !compareItems) return;

    // 获取本地存储的对比项
    let compareList = getCompareList();

    // 渲染对比项
    renderCompareItems();

    // 清空对比按钮
    if (compareClear) {
        compareClear.addEventListener('click', function () {
            compareList = [];
            saveCompareList();
            renderCompareItems();
        });
    }

    // 开始对比按钮
    if (compareButton) {
        compareButton.addEventListener('click', function () {
            if (compareList.length < 2) {
                alert('请至少添加2个商品进行对比');
                return;
            }

            // 跳转到对比页面
            window.location.href = 'compare.html?ids=' + compareList.map(item => item.id).join(',');
        });
    }

    // 给产品卡片添加对比按钮
    addCompareButtonToProducts();

    /**
     * 渲染对比栏中的对比项
     */
    function renderCompareItems() {
        // 清空当前内容
        compareItems.innerHTML = '';

        // 如果没有对比项，隐藏对比栏
        if (compareList.length === 0) {
            compareBar.classList.remove('show');
            return;
        }

        // 有对比项，显示对比栏
        compareBar.classList.add('show');

        // 渲染每个对比项
        compareList.forEach(item => {
            const compareItem = document.createElement('div');
            compareItem.className = 'compare-item';
            compareItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="compare-item-img">
                <div class="compare-item-remove" data-id="${item.id}">×</div>
            `;
            compareItems.appendChild(compareItem);
        });

        // 绑定移除按钮事件
        const removeButtons = document.querySelectorAll('.compare-item-remove');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                removeCompareItem(id);
            });
        });
    }

    /**
     * 添加对比按钮到产品卡片
     */
    function addCompareButtonToProducts() {
        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach(card => {
            // 检查是否已经有对比按钮
            if (card.querySelector('.compare-toggle')) return;

            // 获取产品信息
            const id = card.getAttribute('data-id') || Math.random().toString(36).substr(2, 9);
            const name = card.querySelector('.product-name').textContent;
            const image = card.querySelector('.product-image').src;

            // 添加产品ID
            card.setAttribute('data-id', id);

            // 创建对比按钮
            const compareToggle = document.createElement('div');
            compareToggle.className = 'compare-toggle';
            compareToggle.innerHTML = '<i class="fas fa-balance-scale"></i>';

            // 如果该产品已在对比列表，设置激活状态
            if (isInCompareList(id)) {
                compareToggle.classList.add('active');
            }

            // 添加点击事件
            compareToggle.addEventListener('click', function (e) {
                e.stopPropagation(); // 阻止冒泡，防止触发卡片点击

                if (isInCompareList(id)) {
                    // 如果已在列表，则移除
                    removeCompareItem(id);
                    this.classList.remove('active');
                } else {
                    // 如果不在列表，且列表未满，则添加
                    if (compareList.length >= 4) {
                        alert('最多只能对比4个商品');
                        return;
                    }

                    addCompareItem({
                        id,
                        name,
                        image
                    });

                    this.classList.add('active');
                }
            });

            // 将按钮添加到卡片上
            card.appendChild(compareToggle);
        });
    }

    /**
     * 添加对比项
     * @param {Object} item - 对比项
     */
    function addCompareItem(item) {
        // 检查是否已存在
        if (isInCompareList(item.id)) return;

        // 添加到列表
        compareList.push(item);
        saveCompareList();
        renderCompareItems();
    }

    /**
     * 移除对比项
     * @param {string} id - 对比项ID
     */
    function removeCompareItem(id) {
        compareList = compareList.filter(item => item.id !== id);
        saveCompareList();
        renderCompareItems();

        // 更新产品卡片上的对比按钮状态
        const compareToggle = document.querySelector(`.product-card[data-id="${id}"] .compare-toggle`);
        if (compareToggle) {
            compareToggle.classList.remove('active');
        }
    }

    /**
     * 检查产品是否在对比列表中
     * @param {string} id - 产品ID
     * @return {boolean}
     */
    function isInCompareList(id) {
        return compareList.some(item => item.id === id);
    }

    /**
     * 从本地存储获取对比列表
     * @return {Array}
     */
    function getCompareList() {
        const list = localStorage.getItem('compareList');
        return list ? JSON.parse(list) : [];
    }

    /**
     * 保存对比列表到本地存储
     */
    function saveCompareList() {
        localStorage.setItem('compareList', JSON.stringify(compareList));
    }
}

/**
 * 初始化响应式导航
 */
function initResponsiveNav() {
    // 导航链接点击事件
    const navLinks = document.querySelectorAll('.web-nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            // 移除所有active类
            navLinks.forEach(l => l.classList.remove('active'));
            // 添加当前active类
            this.classList.add('active');
        });
    });

    // 监听窗口大小变化
    window.addEventListener('resize', function () {
        updateNavigation();
    });

    // 初始化时执行一次
    updateNavigation();

    /**
     * 根据窗口大小更新导航样式
     */
    function updateNavigation() {
        // 获取最新的窗口宽度
        const windowWidth = window.innerWidth;

        // 根据窗口宽度调整导航显示
        if (windowWidth >= 768) {
            // 平板和桌面显示顶部导航
            document.querySelector('.web-nav-links').style.display = 'flex';
            document.querySelector('.bottom-navbar').style.display = 'none';
        } else {
            // 移动端显示底部导航
            document.querySelector('.web-nav-links').style.display = 'none';
            document.querySelector('.bottom-navbar').style.display = 'flex';
        }
    }
}

/**
 * 从URL参数激活导航项
 */
function activateNavFromUrl() {
    // 获取当前URL路径
    const path = window.location.pathname;
    const pageName = path.split('/').pop().replace('.html', '');

    // 激活顶部导航对应项
    const webNavLinks = document.querySelectorAll('.web-nav-link');
    webNavLinks.forEach(link => {
        const linkPage = link.getAttribute('data-page');
        if (linkPage === pageName || (pageName === '' && linkPage === 'index')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // 激活侧边栏对应项
    const sidebarMenuItems = document.querySelectorAll('.sidebar-menu-item');
    sidebarMenuItems.forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === pageName || (pageName === '' && itemPage === 'index')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 激活底部导航对应项
    const bottomNavItems = document.querySelectorAll('.nav-item');
    bottomNavItems.forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === pageName || (pageName === '' && itemPage === 'index')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * 检查登录状态并更新UI
 */
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isGuest = localStorage.getItem('isGuest') === 'true';
    const userName = localStorage.getItem('userName') || '用户';

    const loginBtn = document.getElementById('loginBtn');
    const userAvatarMini = document.getElementById('userAvatarMini');

    if (loginBtn && userAvatarMini) {
        if (isLoggedIn) {
            loginBtn.style.display = 'none';
            userAvatarMini.style.display = 'block';

            // 设置用户头像
            const userAvatarImg = document.getElementById('userAvatarImg');
            if (userAvatarImg) {
                // 如果有保存的头像链接，则使用保存的头像
                const savedAvatar = localStorage.getItem('userAvatar');
                if (savedAvatar) {
                    userAvatarImg.src = savedAvatar;
                }

                // 为头像添加错误处理
                userAvatarImg.onerror = function () {
                    this.src = '../app/images/default-avatar.png';
                };
            }

            // 更新用户菜单项的文本（如果存在）
            const userMenuName = document.querySelector('.user-name');
            if (userMenuName) {
                userMenuName.textContent = userName;
            }
        } else {
            loginBtn.style.display = 'block';
            userAvatarMini.style.display = 'none';
        }
    }

    // 检查是否需要强制登录的页面
    const requiresAuth = document.body.classList.contains('requires-auth');
    if (requiresAuth && !isLoggedIn) {
        // 记录当前URL以便登录后重定向回来
        const currentUrl = window.location.href;
        window.location.href = `login.html?redirect=${encodeURIComponent(currentUrl)}`;
    }
}

/**
 * 设置导航栏活动状态
 */
function setActiveNavItem() {
    // 获取当前页面的URL路径
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop().split('.')[0] || 'index';

    // 设置Web导航栏
    const webNavLinks = document.querySelectorAll('.web-nav-link');
    webNavLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });

    // 设置侧边栏
    const sidebarMenuItems = document.querySelectorAll('.sidebar-menu-item');
    sidebarMenuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        }
    });

    // 设置底部导航栏
    const bottomNavItems = document.querySelectorAll('.nav-item');
    bottomNavItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        }
    });
}

/**
 * 设置移动端侧边栏
 */
function setupSidebar() {
    const menuToggleBtn = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 199;
        display: none;
    `;
    document.body.appendChild(overlay);

    if (menuToggleBtn && sidebar) {
        menuToggleBtn.addEventListener('click', function () {
            sidebar.classList.toggle('open');
            document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
            overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
        });

        overlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            document.body.style.overflow = '';
            overlay.style.display = 'none';
        });
    }
}

/**
 * 设置响应式布局
 */
function setupResponsiveLayout() {
    const resizeHandler = () => {
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        const isDesktop = window.innerWidth >= 1024;

        // 更新 body 类以用于 CSS 媒体查询
        document.body.classList.toggle('is-mobile', isMobile);
        document.body.classList.toggle('is-tablet', isTablet);
        document.body.classList.toggle('is-desktop', isDesktop);

        // 在这里添加任何其他依赖窗口大小的布局调整
    };

    // 初始运行一次
    resizeHandler();

    // 监听窗口大小变化
    window.addEventListener('resize', resizeHandler);
}

/**
 * 设置图片懒加载
 */
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');

        const imageObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.removeAttribute('loading');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(function (image) {
            imageObserver.observe(image);
        });
    }
}

/**
 * 设置过滤器通用功能
 */
function setupFilters() {
    const filterOptions = document.querySelectorAll('.filter-option');
    if (filterOptions.length > 0) {
        filterOptions.forEach(option => {
            option.addEventListener('click', function () {
                // 获取所属分组中的所有选项
                const parent = this.closest('.filter-options');
                if (parent) {
                    const siblings = parent.querySelectorAll('.filter-option');
                    siblings.forEach(sib => sib.classList.remove('active'));
                }
                this.classList.add('active');
            });
        });
    }

    const sortOptions = document.querySelectorAll('.sort-option');
    if (sortOptions.length > 0) {
        sortOptions.forEach(option => {
            option.addEventListener('click', function () {
                sortOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
}

/**
 * 格式化价格显示
 * @param {number} price - 价格金额
 * @param {boolean} showSymbol - 是否显示货币符号
 * @returns {string} 格式化后的价格字符串
 */
function formatPrice(price, showSymbol = true) {
    if (typeof price !== 'number') {
        price = parseFloat(price) || 0;
    }

    return `${showSymbol ? '¥' : ''}${price.toFixed(2)}`;
}

/**
 * 解析URL参数
 * @returns {Object} 参数对象
 */
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');

    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        if (pair.length === 2) {
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
    }

    return params;
}

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error, info, warning)
 * @param {number} duration - 显示时长(毫秒)
 */
function showMessage(message, type = 'info', duration = 3000) {
    const messageContainer = document.querySelector('.message-container') || createMessageContainer();

    const messageElement = document.createElement('div');
    messageElement.className = `message-item message-${type}`;
    messageElement.innerHTML = `
        <div class="message-icon">
            <i class="fas fa-${getIconForMessageType(type)}"></i>
        </div>
        <div class="message-content">${message}</div>
    `;

    messageContainer.appendChild(messageElement);

    // 添加后立即显示的动画
    setTimeout(() => {
        messageElement.classList.add('message-show');
    }, 10);

    // 到时间后删除
    setTimeout(() => {
        messageElement.classList.remove('message-show');
        messageElement.classList.add('message-hide');

        // 等待淡出动画完成后删除元素
        setTimeout(() => {
            messageElement.remove();
        }, 300);
    }, duration);
}

/**
 * 创建消息容器
 * @returns {HTMLElement} 消息容器元素
 */
function createMessageContainer() {
    const container = document.createElement('div');
    container.className = 'message-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    document.body.appendChild(container);

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .message-item {
            display: flex;
            align-items: center;
            padding: 10px 16px;
            border-radius: 4px;
            background-color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transform: translateX(100%);
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
            max-width: 400px;
        }
        .message-show {
            transform: translateX(0);
            opacity: 1;
        }
        .message-hide {
            transform: translateX(100%);
            opacity: 0;
        }
        .message-icon {
            margin-right: 12px;
        }
        .message-success .message-icon { color: #52c41a; }
        .message-error .message-icon { color: #f5222d; }
        .message-info .message-icon { color: #1890ff; }
        .message-warning .message-icon { color: #faad14; }
    `;
    document.head.appendChild(style);

    return container;
}

/**
 * 获取消息类型对应的图标
 * @param {string} type - 消息类型
 * @returns {string} 图标名称
 */
function getIconForMessageType(type) {
    const icons = {
        success: 'check-circle',
        error: 'times-circle',
        info: 'info-circle',
        warning: 'exclamation-circle'
    };

    return icons[type] || icons.info;
}

/**
 * 配置表单验证
 * @param {HTMLFormElement} form - 要验证的表单
 * @param {Object} rules - 验证规则
 * @param {Function} submitCallback - 提交回调
 */
function setupFormValidation(form, rules, submitCallback) {
    if (!form) return;

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        let isValid = true;
        const formData = {};

        // 清除之前的错误
        const errorMessages = form.querySelectorAll('.form-error-message');
        errorMessages.forEach(el => el.remove());

        // 验证每个字段
        for (const fieldName in rules) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) continue;

            const fieldRules = rules[fieldName];
            const value = field.value.trim();
            formData[fieldName] = value;

            let fieldIsValid = true;
            let errorMessage = '';

            // 检查各种规则
            if (fieldRules.required && value === '') {
                fieldIsValid = false;
                errorMessage = fieldRules.requiredMessage || '此字段为必填项';
            } else if (fieldRules.pattern && !new RegExp(fieldRules.pattern).test(value)) {
                fieldIsValid = false;
                errorMessage = fieldRules.patternMessage || '格式不正确';
            } else if (fieldRules.minLength && value.length < fieldRules.minLength) {
                fieldIsValid = false;
                errorMessage = fieldRules.minLengthMessage || `长度不能少于${fieldRules.minLength}个字符`;
            } else if (fieldRules.custom && typeof fieldRules.custom === 'function') {
                const customResult = fieldRules.custom(value, formData);
                if (customResult !== true) {
                    fieldIsValid = false;
                    errorMessage = customResult;
                }
            }

            // 更新表单验证状态
            isValid = isValid && fieldIsValid;

            // 显示错误消息
            if (!fieldIsValid) {
                const errorElement = document.createElement('div');
                errorElement.className = 'form-error-message';
                errorElement.textContent = errorMessage;
                errorElement.style.cssText = `
                    color: #f5222d;
                    font-size: 12px;
                    margin-top: 4px;
                `;

                const formGroup = field.closest('.form-group') || field.parentNode;
                formGroup.appendChild(errorElement);

                field.classList.add('form-input-error');
            } else {
                field.classList.remove('form-input-error');
            }
        }

        // 如果表单验证通过，调用回调
        if (isValid && typeof submitCallback === 'function') {
            submitCallback(formData);
        }
    });

    // 输入时清除错误
    for (const fieldName in rules) {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (!field) continue;

        field.addEventListener('input', function () {
            const formGroup = field.closest('.form-group') || field.parentNode;
            const errorMessage = formGroup.querySelector('.form-error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
            field.classList.remove('form-input-error');
        });
    }
}

/**
 * 退出登录
 */
function logout() {
    // 清除登录状态
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isGuest');
    localStorage.removeItem('userName');

    // 显示消息
    showMessage('已成功退出登录', 'success');

    // 延迟后重定向到首页
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

/**
 * 显示确认对话框
 * @param {string} message - 确认消息
 * @param {Function} confirmCallback - 确认回调
 * @param {Function} cancelCallback - 取消回调
 */
function showConfirm(message, confirmCallback, cancelCallback) {
    // 创建对话框元素
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirm-dialog';
    confirmDialog.innerHTML = `
        <div class="confirm-content">
            <div class="confirm-message">${message}</div>
            <div class="confirm-actions">
                <button class="btn btn-secondary confirm-cancel">取消</button>
                <button class="btn btn-primary confirm-ok">确认</button>
            </div>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .confirm-dialog {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        .confirm-content {
            background-color: white;
            border-radius: 8px;
            padding: 24px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .confirm-message {
            margin-bottom: 24px;
            text-align: center;
        }
        .confirm-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
    `;
    document.head.appendChild(style);

    // 添加到页面
    document.body.appendChild(confirmDialog);
    document.body.style.overflow = 'hidden';

    // 绑定按钮事件
    const cancelBtn = confirmDialog.querySelector('.confirm-cancel');
    const okBtn = confirmDialog.querySelector('.confirm-ok');

    cancelBtn.addEventListener('click', function () {
        closeDialog();
        if (typeof cancelCallback === 'function') {
            cancelCallback();
        }
    });

    okBtn.addEventListener('click', function () {
        closeDialog();
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
    });

    // 关闭对话框
    function closeDialog() {
        document.body.style.overflow = '';
        confirmDialog.remove();
    }
}

/**
 * 商品收藏功能
 * @param {string} productId - 商品ID
 * @param {Element} favButton - 收藏按钮元素
 */
function toggleFavorite(productId, favButton) {
    // 检查用户是否登录
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isGuest = localStorage.getItem('isGuest') === 'true';

    if (!isLoggedIn) {
        showMessage('请先登录再进行收藏操作', 'warning');
        return;
    }

    if (isGuest) {
        showMessage('游客模式不支持收藏功能', 'info');
        return;
    }

    // 获取当前收藏列表
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorited = favorites.includes(productId);

    if (isFavorited) {
        // 取消收藏
        favorites = favorites.filter(id => id !== productId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        showMessage('已取消收藏', 'info');

        if (favButton) {
            favButton.classList.remove('favorited');
            favButton.innerHTML = '<i class="far fa-heart"></i> 收藏';
        }
    } else {
        // 添加收藏
        favorites.push(productId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        showMessage('收藏成功', 'success');

        if (favButton) {
            favButton.classList.add('favorited');
            favButton.innerHTML = '<i class="fas fa-heart"></i> 已收藏';
        }
    }
} 