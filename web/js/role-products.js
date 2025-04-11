/**
 * 角色相关产品显示功能
 * 处理基于用户角色的产品显示逻辑
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function () {
    // 初始化基于角色的产品显示
    initRoleBasedProducts();

    // 监听角色变更事件
    document.addEventListener('roleChanged', function (event) {
        filterProductsByRole(event.detail.role);
    });

    // 阻止产品操作按钮点击事件传播
    initProductActionButtons();

    // 确保导航条显示正确
    if (typeof updateNavigationVisibility === 'function') {
        const currentRole = localStorage.getItem('userRole') || '采购商';
        updateNavigationVisibility(currentRole);
    }
});

/**
 * 初始化基于角色的产品显示
 */
function initRoleBasedProducts() {
    // 获取当前用户角色
    const currentRole = localStorage.getItem('userRole') || '采购商';

    // 根据角色过滤产品
    filterProductsByRole(currentRole);
}

/**
 * 根据用户角色过滤产品显示
 * @param {string} role - 用户角色 (采购商 或 供应商)
 */
function filterProductsByRole(role) {
    console.log('过滤产品显示，当前角色:', role);

    // 获取所有产品卡片（包括普通产品卡片和需求卡片）
    const productCards = document.querySelectorAll('.product-card, .demand-card');

    // 没有产品卡片则不处理
    if (!productCards.length) {
        console.log('没有找到产品卡片');
        return;
    }

    // 遍历所有产品卡片，根据角色显示或隐藏
    productCards.forEach(card => {
        const slideItem = card.closest('.slide-item');
        if (!slideItem) return;

        // 获取产品适用的角色
        const cardRole = card.getAttribute('data-role');

        // 如果产品角色与当前用户角色匹配，则显示；否则隐藏
        if (cardRole === role || !cardRole) {
            slideItem.style.display = '';
            console.log('显示产品:', card.querySelector('.product-name, .demand-title').textContent);
        } else {
            slideItem.style.display = 'none';
            console.log('隐藏产品:', card.querySelector('.product-name, .demand-title').textContent);
        }
    });

    // 重置轮播索引
    resetProductSlider();
}

/**
 * 重置产品轮播，确保筛选后轮播正常工作
 */
function resetProductSlider() {
    const sliderContainer = document.querySelector('.slider-container');
    const sliderDots = document.querySelectorAll('.slider-dot');

    if (!sliderContainer || !sliderDots.length) return;

    // 重置到第一个可见幻灯片
    const visibleSlides = Array.from(document.querySelectorAll('.slide-item')).filter(
        slide => slide.style.display !== 'none'
    );

    if (visibleSlides.length > 0) {
        // 更新轮播点
        sliderDots.forEach((dot, index) => {
            if (index === 0) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // 更新轮播位置
        sliderContainer.style.transform = 'translateX(0)';
    }
}

/**
 * 阻止产品操作按钮点击事件的传播
 */
function initProductActionButtons() {
    // 为所有产品操作按钮添加阻止事件传播的处理
    document.querySelectorAll('.product-actions button').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // 按钮的具体功能已在其他地方处理
        });
    });
} 