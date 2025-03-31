/**
 * 农产品供销信息平台 JavaScript功能
 * 实现首页所有交互功能
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function () {
    // 初始化轮播图
    initBanner();

    // 初始化选项卡
    initTabs();

    // 模拟加载更多产品
    initLoadMore();

    // 底部导航点击效果
    initNavigation();

    // 初始化懒加载
    initLazyLoading();
});

/**
 * 初始化轮播图功能
 */
function initBanner() {
    const bannerSlides = document.querySelectorAll('.banner-slide');
    const indicators = document.querySelectorAll('.banner-indicator');
    let currentSlideIndex = 0;
    const slideInterval = 3000; // 轮播间隔时间，单位毫秒

    // 设置初始激活状态
    updateActiveSlide(0);

    // 自动轮播
    let slideTimer = setInterval(nextSlide, slideInterval);

    // 指示器点击事件
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            clearInterval(slideTimer);
            updateActiveSlide(index);
            slideTimer = setInterval(nextSlide, slideInterval);
        });
    });

    // 触摸事件处理
    const bannerWrapper = document.querySelector('.banner-wrapper');
    let startX, endX;

    bannerWrapper.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        clearInterval(slideTimer);
    }, { passive: true });

    bannerWrapper.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;

        // 判断滑动方向
        if (endX < startX - 50) { // 左滑
            nextSlide();
        } else if (endX > startX + 50) { // 右滑
            prevSlide();
        }

        slideTimer = setInterval(nextSlide, slideInterval);
    }, { passive: true });

    /**
     * 更新当前激活的幻灯片
     * @param {number} index - 幻灯片索引
     */
    function updateActiveSlide(index) {
        // 移除所有激活状态
        bannerSlides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));

        // 设置当前激活状态
        bannerSlides[index].classList.add('active');
        indicators[index].classList.add('active');

        currentSlideIndex = index;
    }

    /**
     * 下一张幻灯片
     */
    function nextSlide() {
        let nextIndex = currentSlideIndex + 1;
        if (nextIndex >= bannerSlides.length) {
            nextIndex = 0;
        }
        updateActiveSlide(nextIndex);
    }

    /**
     * 上一张幻灯片
     */
    function prevSlide() {
        let prevIndex = currentSlideIndex - 1;
        if (prevIndex < 0) {
            prevIndex = bannerSlides.length - 1;
        }
        updateActiveSlide(prevIndex);
    }
}

/**
 * 初始化选项卡功能
 */
function initTabs() {
    const tabItems = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');

    tabItems.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // 移除所有激活状态
            tabItems.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // 设置当前激活状态
            tab.classList.add('active');
            tabContents[index].classList.add('active');

            // 添加动画效果
            tabContents[index].classList.add('fade-in');

            // 动画结束后移除动画类
            setTimeout(() => {
                tabContents[index].classList.remove('fade-in');
            }, 500);
        });
    });
}

/**
 * 初始化加载更多功能
 */
function initLoadMore() {
    const productGrid = document.querySelector('.product-grid');
    const loadMoreElem = document.querySelector('.load-more');
    let isLoading = false;

    // 检测滚动到底部触发加载
    window.addEventListener('scroll', function () {
        if (isLoading) return;

        // 判断是否滚动到底部附近
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollY + windowHeight >= documentHeight - 100) {
            loadMoreProducts();
        }
    });

    // 加载更多按钮点击事件
    if (loadMoreElem) {
        loadMoreElem.addEventListener('click', loadMoreProducts);
    }

    /**
     * 加载更多产品
     */
    function loadMoreProducts() {
        if (isLoading) return;

        isLoading = true;

        // 显示加载中
        if (loadMoreElem) {
            loadMoreElem.textContent = '正在加载更多...';
        }

        // 模拟网络请求延迟
        setTimeout(() => {
            // 模拟产品数据
            const products = [
                {
                    name: '红富士苹果',
                    price: '5.99',
                    unit: '斤',
                    address: '山东-烟台',
                    desc: '新鲜采摘的红富士苹果，口感脆甜，果肉细腻。',
                    image: 'https://via.placeholder.com/300x300?text=苹果'
                },
                {
                    name: '有机大米',
                    price: '18.80',
                    unit: '斤',
                    address: '黑龙江-五常',
                    desc: '纯天然有机种植，无农药残留，香糯可口。',
                    image: 'https://via.placeholder.com/300x300?text=大米'
                }
            ];

            // 添加新产品到网格
            products.forEach(product => {
                const productCard = createProductCard(product);
                productGrid.appendChild(productCard);
            });

            // 恢复加载状态
            isLoading = false;
            if (loadMoreElem) {
                loadMoreElem.textContent = '加载更多';
            }
        }, 1000);
    }

    /**
     * 创建产品卡片元素
     * @param {Object} product - 产品数据
     * @returns {HTMLElement} - 产品卡片DOM元素
     */
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';

        card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-price">
          ¥${product.price}<span class="product-unit">/${product.unit}</span>
        </div>
        <div class="product-address">
          <i class="fas fa-map-marker-alt"></i>${product.address}
        </div>
        <div class="product-desc">${product.desc}</div>
      </div>
    `;

        // 添加点击事件
        card.addEventListener('click', () => {
            // 跳转到详情页的逻辑，这里仅做演示
            alert(`查看${product.name}的详情`);
        });

        return card;
    }
}

/**
 * 初始化底部导航功能
 */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(navItem => {
        navItem.addEventListener('click', function () {
            // 如果已经是活跃项，不执行任何操作
            if (this.classList.contains('active')) {
                return;
            }

            // 获取目标页面名称
            const pageName = this.getAttribute('data-page');

            // 根据页面名称跳转
            if (pageName === 'home') {
                window.location.href = 'index.html';
            } else if (pageName === 'supply') {
                window.location.href = 'supply.html';
            } else if (pageName === 'demand') {
                window.location.href = 'demand.html';
            } else if (pageName === 'user') {
                window.location.href = 'user.html';
            }
        });
    });

    // 发布按钮特殊处理
    const publishBtn = document.querySelector('.nav-publish');
    if (publishBtn) {
        publishBtn.addEventListener('click', function () {
            window.location.href = 'publish.html';
        });
    }
}

/**
 * 下拉刷新功能（仅作演示）
 */
let startY = 0;
let pullDistance = 0;
const PULL_THRESHOLD = 100; // 触发刷新的阈值

document.addEventListener('touchstart', (e) => {
    // 仅当在页面顶部时才启用下拉刷新
    if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
    }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    // 仅当在页面顶部时才计算下拉距离
    if (window.scrollY === 0 && startY > 0) {
        pullDistance = e.touches[0].clientY - startY;

        // 视觉反馈，这里仅做简单处理，实际应用需要添加过渡动画
        if (pullDistance > 0) {
            const pageContent = document.querySelector('.page-content');
            pageContent.style.transform = `translateY(${Math.min(pullDistance / 2, 80)}px)`;
        }
    }
}, { passive: true });

document.addEventListener('touchend', () => {
    if (pullDistance > PULL_THRESHOLD) {
        // 触发刷新
        refreshPage();
    }

    // 重置
    const pageContent = document.querySelector('.page-content');
    pageContent.style.transform = '';
    startY = 0;
    pullDistance = 0;
}, { passive: true });

/**
 * 刷新页面内容
 */
function refreshPage() {
    // 显示刷新指示器
    // 这里仅做演示，实际应用需要添加刷新动画
    alert('正在刷新页面...');

    // 模拟刷新延迟
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

/**
 * 初始化图片懒加载功能
 */
function initLazyLoading() {
    // 如果浏览器支持 IntersectionObserver
    if ('IntersectionObserver' in window) {
        const imgObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-load');
                    imgObserver.unobserve(img);
                }
            });
        });

        // 获取所有需要懒加载的图片
        const lazyImages = document.querySelectorAll('img.lazy-load');
        lazyImages.forEach(img => {
            imgObserver.observe(img);
        });
    } else {
        // 降级处理，对于不支持 IntersectionObserver 的浏览器
        const lazyImages = document.querySelectorAll('img.lazy-load');
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy-load');
        });
    }
} 