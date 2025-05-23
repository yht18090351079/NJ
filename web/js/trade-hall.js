/**
 * 交易大厅导航处理
 * 根据用户角色决定跳转到供应大厅还是需求大厅
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function () {
    // 初始化交易大厅链接
    initTradeHallLink();

    // 监听角色变更事件，更新交易大厅链接文本
    document.addEventListener('roleChanged', function (event) {
        updateTradeHallLinkText(event.detail.role);
    });
});

/**
 * 初始化交易大厅链接点击事件
 */
function initTradeHallLink() {
    // 获取导航链接元素
    const tradeHallLink = document.getElementById('trade-hall-link');
    const sidebarTradeHallLink = document.getElementById('sidebar-trade-hall-link');

    // 获取当前用户角色
    const currentRole = localStorage.getItem('userRole') || '采购商';

    // 更新链接文本
    updateTradeHallLinkText(currentRole);

    // 为主导航添加点击处理
    if (tradeHallLink) {
        tradeHallLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateToTradeHall(currentRole);
        });
    }

    // 为侧边栏导航添加点击处理
    if (sidebarTradeHallLink) {
        sidebarTradeHallLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateToTradeHall(currentRole);
        });
    }
}

/**
 * 根据角色更新交易大厅链接文本
 * @param {string} role - 用户角色
 */
function updateTradeHallLinkText(role) {
    const tradeHallLink = document.getElementById('trade-hall-link');
    const sidebarTradeHallLink = document.getElementById('sidebar-trade-hall-link');

    const hallName = role === '供应商' ? '需求大厅' : '供应大厅';
    const icon = role === '供应商' ? 'fa-shopping-cart' : 'fa-store';

    // 更新主导航文本和图标
    if (tradeHallLink) {
        const iconElement = tradeHallLink.querySelector('i');
        const textElement = tradeHallLink.querySelector('span');

        if (iconElement) {
            // 删除所有fa开头的类
            iconElement.className = iconElement.className.split(' ').filter(cls => !cls.startsWith('fa-')).join(' ');
            // 添加新图标类
            iconElement.classList.add('fas', icon);
        }

        if (textElement) {
            textElement.textContent = hallName;
        }
    }

    // 更新侧边栏导航文本和图标
    if (sidebarTradeHallLink) {
        const iconElement = sidebarTradeHallLink.querySelector('i');
        const textElement = sidebarTradeHallLink.querySelector('span');

        if (iconElement) {
            // 删除所有fa开头的类
            iconElement.className = iconElement.className.split(' ').filter(cls => !cls.startsWith('fa-')).join(' ');
            // 添加新图标类
            iconElement.classList.add('fas', icon);
        }

        if (textElement) {
            textElement.textContent = hallName;
        }
    }
}

/**
 * 根据用户角色导航到对应的交易大厅页面
 * @param {string} role - 用户角色
 */
function navigateToTradeHall(role) {
    // 供应商 -> 需求大厅，采购商 -> 供应大厅
    const targetPage = role === '供应商' ? 'demand.html' : 'supply.html';
    window.location.href = targetPage;
}

 