/**
 * 农产品供销信息平台 Web应用端 JavaScript
 * 包含主要交互逻辑和功能实现
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function () {
    // 初始化导航栏
    initNavigation();

    // 初始化轮播图
    initBannerCarousel();

    // 初始化数据图表 - 确保加载优先级
    setTimeout(() => {
        initDataCharts();
    }, 100);

    // 初始化产品对比功能
    initProductCompare();

    // 初始化快捷导航
    initQuickNav();

    // 响应式调整
    handleResponsive();

    // 初始化搜索功能
    initSearch();

    // 初始化供需热力图切换
    initHeatmapToggle();

    // 初始化产品轮播
    initProductSlider();

    // 初始化产品分类筛选
    initProductCategoryFilter();

    // 初始化产品快速查看
    initProductQuickView();

    // 初始化收藏功能
    initFavorites();

    // 初始化产品视图切换功能
    initViewToggle();

    // 初始化分类选择
    initCategorySelection();

    // 初始化产品操作按钮
    initProductActionButtons();

    // 确保导航条根据角色正确显示
    if (typeof updateNavigationVisibility === 'function') {
        const currentRole = localStorage.getItem('userRole') || '采购商';
        updateNavigationVisibility(currentRole);
    }
});

/**
 * 初始化导航栏
 * 配置水平导航菜单和侧边栏的交互行为
 */
function initNavigation() {
    // 水平导航菜单高亮当前页面
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.horizontal-nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href) ||
            (currentPath.endsWith('/') && href === 'index.html')) {
            link.classList.add('active');
        }

        // 添加悬停效果
        link.addEventListener('mouseenter', function () {
            this.querySelector('i').classList.add('fa-beat');
        });

        link.addEventListener('mouseleave', function () {
            this.querySelector('i').classList.remove('fa-beat');
        });
    });

    // 移动端菜单按钮点击事件
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMobileMenu);
    }

    // 隐藏侧边栏，现在使用水平导航
    const sidebar = document.querySelector('.web-sidebar');
    if (sidebar) {
        sidebar.style.display = 'none';
    }
}

/**
 * 切换移动端菜单
 */
function toggleMobileMenu() {
    // 检查是否已经存在移动导航
    let mobileNav = document.querySelector('.mobile-nav');

    if (mobileNav) {
        // 如果已经存在，则切换其可见性
        if (mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            setTimeout(() => {
                mobileNav.remove();
            }, 300); // 等待动画完成
        } else {
            mobileNav.classList.add('active');
        }
        return;
    }

    // 创建移动导航
    mobileNav = document.createElement('div');
    mobileNav.className = 'mobile-nav';

    // 复制水平导航的链接到移动导航
    const navContent = document.querySelector('.horizontal-nav-menu').cloneNode(true);
    mobileNav.appendChild(navContent);

    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-nav-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.addEventListener('click', () => {
        mobileNav.classList.remove('active');
        setTimeout(() => {
            mobileNav.remove();
        }, 300); // 等待动画完成
    });
    mobileNav.prepend(closeBtn);

    // 添加到body
    document.body.appendChild(mobileNav);

    // 动画效果
    setTimeout(() => {
        mobileNav.classList.add('active');
    }, 10);

    // 移动端菜单中的链接点击后关闭菜单
    const mobileLinks = mobileNav.querySelectorAll('.horizontal-nav-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            setTimeout(() => {
                mobileNav.remove();
            }, 300);
        });
    });
}

/**
 * 处理响应式调整
 */
function handleResponsive() {
    // 监听窗口大小变化
    window.addEventListener('resize', function () {
        // 如果屏幕宽度大于992px且存在移动导航，则移除
        if (window.innerWidth > 992) {
            const mobileNav = document.querySelector('.mobile-nav');
            if (mobileNav) {
                mobileNav.remove();
            }
        }
    });
}

/**
 * 侧边栏功能初始化
 */
function initSidebar() {
    // 侧边栏展开/收起切换
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const webLayout = document.querySelector('.web-layout');

    if (sidebarToggle && webLayout) {
        sidebarToggle.addEventListener('click', function () {
            webLayout.classList.toggle('sidebar-collapsed');
            // 保存用户偏好
            localStorage.setItem('sidebarCollapsed', webLayout.classList.contains('sidebar-collapsed'));
        });

        // 恢复用户偏好
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            webLayout.classList.add('sidebar-collapsed');
        }
    }

    // 移动端侧边栏菜单按钮
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.web-sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', function () {
            sidebar.classList.toggle('open');
            if (backdrop) {
                backdrop.classList.toggle('active');
            }
        });

        // 点击背景关闭侧边栏
        if (backdrop) {
            backdrop.addEventListener('click', function () {
                sidebar.classList.remove('open');
                backdrop.classList.remove('active');
            });
        }
    }
}

/**
 * Banner轮播功能初始化
 */
function initBanner() {
    const bannerSlides = document.querySelectorAll('.banner-slide');
    const indicators = document.querySelectorAll('.banner-indicator');
    const prevBtn = document.querySelector('.banner-prev');
    const nextBtn = document.querySelector('.banner-next');

    if (bannerSlides.length === 0) return;

    let currentSlide = 0;
    let slideInterval = null;

    // 切换到指定幻灯片
    function goToSlide(index) {
        bannerSlides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));

        bannerSlides[index].classList.add('active');
        if (indicators[index]) {
            indicators[index].classList.add('active');
        }

        currentSlide = index;
    }

    // 下一张幻灯片
    function nextSlide() {
        let next = currentSlide + 1;
        if (next >= bannerSlides.length) {
            next = 0;
        }
        goToSlide(next);
    }

    // 上一张幻灯片
    function prevSlide() {
        let prev = currentSlide - 1;
        if (prev < 0) {
            prev = bannerSlides.length - 1;
        }
        goToSlide(prev);
    }

    // 开始自动播放
    function startAutoplay() {
        stopAutoplay();
        slideInterval = setInterval(nextSlide, 5000);
    }

    // 停止自动播放
    function stopAutoplay() {
        if (slideInterval) {
            clearInterval(slideInterval);
        }
    }

    // 绑定指示器点击事件
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToSlide(index);
            startAutoplay();
        });
    });

    // 绑定上一张/下一张按钮点击事件
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            startAutoplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            startAutoplay();
        });
    }

    // 鼠标悬停暂停自动播放
    const bannerWrapper = document.querySelector('.banner-wrapper');
    if (bannerWrapper) {
        bannerWrapper.addEventListener('mouseenter', stopAutoplay);
        bannerWrapper.addEventListener('mouseleave', startAutoplay);
    }

    // 初始化自动播放
    startAutoplay();
}

/**
 * 初始化数据图表
 * 配置并渲染各种数据可视化图表
 */
function initDataCharts() {
    console.log('开始初始化其他数据图表（价格趋势图表由内联脚本处理）');

    // 确保页面已完全加载
    if (document.readyState !== 'complete') {
        window.addEventListener('load', initDataCharts);
        return;
    }

    // 价格趋势图表由内联脚本处理，这里不再初始化
    // initPriceTrendChart();

    // 按照优先级顺序加载其他图表，并添加错误处理
    try {
        // 延迟加载其他图表，避免资源竞争
        setTimeout(() => {
            try {
                // 热力图交互
                initHeatmap();

                // 季节性产品预测交互
                initSeasonalPrediction();

                // 价格指数卡片交互
                initPriceIndex();

                // 数据看板控件交互
                initDashboardControls();

                console.log('所有辅助数据图表初始化完成');
            } catch (error) {
                console.error('初始化次要图表时出错:', error);
            }
        }, 500);
    } catch (error) {
        console.error('初始化图表时出错:', error);
    }
}

/**
 * 初始化热力图交互
 */
function initHeatmap() {
    // 切换供应/需求视图
    const viewToggleButtons = document.querySelectorAll('.btn-toggle');
    if (viewToggleButtons.length === 0) return;

    viewToggleButtons.forEach(button => {
        button.addEventListener('click', function () {
            // 取消所有按钮的激活状态
            viewToggleButtons.forEach(btn => btn.classList.remove('active'));

            // 激活当前按钮
            this.classList.add('active');

            // 获取视图类型
            const viewType = this.getAttribute('data-view');
            updateHeatmapView(viewType);
        });
    });

    // 初始化热力图标记点交互
    const mapMarkers = document.querySelectorAll('.map-marker');
    mapMarkers.forEach(marker => {
        marker.addEventListener('mouseenter', function () {
            this.querySelector('.marker-tooltip').style.opacity = '1';
        });

        marker.addEventListener('mouseleave', function () {
            this.querySelector('.marker-tooltip').style.opacity = '0';
        });
    });
}

/**
 * 更新热力图视图
 * @param {string} viewType - 视图类型 ('supply' 或 'demand')
 */
function updateHeatmapView(viewType) {
    const heatmapOverlay = document.querySelector('.heatmap-overlay');
    const markers = document.querySelectorAll('.map-marker');

    if (viewType === 'supply') {
        // 更改热力图渐变色
        heatmapOverlay.style.background = 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.2))';

        // 显示供应标记，隐藏需求标记
        markers.forEach(marker => {
            const dot = marker.querySelector('.marker-dot');
            if (dot.classList.contains('supply-high')) {
                marker.style.display = 'block';
            } else {
                marker.style.display = 'none';
            }
        });
    } else if (viewType === 'demand') {
        // 更改热力图渐变色
        heatmapOverlay.style.background = 'linear-gradient(to left, rgba(255,255,255,0.8), rgba(255,255,255,0.2))';

        // 显示需求标记，隐藏供应标记
        markers.forEach(marker => {
            const dot = marker.querySelector('.marker-dot');
            if (dot.classList.contains('demand-high')) {
                marker.style.display = 'block';
            } else {
                marker.style.display = 'none';
            }
        });
    }
}

/**
 * 初始化季节性产品预测交互
 */
function initSeasonalPrediction() {
    const seasonQuarters = document.querySelectorAll('.season-quarter');
    if (seasonQuarters.length === 0) return;

    // 季度切换功能
    seasonQuarters.forEach(quarter => {
        quarter.addEventListener('click', function () {
            // 取消所有季度的激活状态
            seasonQuarters.forEach(q => q.classList.remove('active'));

            // 激活当前季度
            this.classList.add('active');

            // 获取季度标识
            const quarterValue = this.getAttribute('data-quarter');
            updateSeasonalProducts(quarterValue);
        });
    });
}

/**
 * 更新季节性产品列表
 * @param {string} quarter - 季度标识 ('Q1', 'Q2', 'Q3', 'Q4')
 */
function updateSeasonalProducts(quarter) {
    // 根据季度更新产品数据
    // 这里是模拟数据，实际应用中应从后端获取
    const seasonalProductsData = {
        'Q1': [
            { name: '草莓', area: '浙江', period: '1月-4月', trend: 'up', value: '28%', icon: 'fa-apple-alt' },
            { name: '菠菜', area: '山东', period: '1月-3月', trend: 'up', value: '15%', icon: 'fa-leaf' },
            { name: '萝卜', area: '河北', period: '12月-3月', trend: 'down', value: '8%', icon: 'fa-carrot' },
            { name: '春笋', area: '安徽', period: '3月-5月', trend: 'up', value: '32%', icon: 'fa-seedling' }
        ],
        'Q2': [
            { name: '樱桃', area: '烟台', period: '4月下旬-6月', trend: 'up', value: '32%', icon: 'fa-apple-alt' },
            { name: '西瓜', area: '海南', period: '5月-7月', trend: 'up', value: '28%', icon: 'fa-carrot' },
            { name: '草莓', area: '浙江', period: '2月-5月下旬', trend: 'down', value: '15%', icon: 'fa-lemon' },
            { name: '春笋', area: '安徽', period: '3月-5月', trend: 'down', value: '8%', icon: 'fa-seedling' }
        ],
        'Q3': [
            { name: '葡萄', area: '新疆', period: '7月-9月', trend: 'up', value: '22%', icon: 'fa-seedling' },
            { name: '荔枝', area: '广东', period: '6月-8月', trend: 'up', value: '18%', icon: 'fa-apple-alt' },
            { name: '茄子', area: '山东', period: '6月-9月', trend: 'up', value: '15%', icon: 'fa-carrot' },
            { name: '黄瓜', area: '河北', period: '7月-9月', trend: 'down', value: '7%', icon: 'fa-leaf' }
        ],
        'Q4': [
            { name: '柿子', area: '陕西', period: '10月-11月', trend: 'up', value: '20%', icon: 'fa-apple-alt' },
            { name: '白菜', area: '河北', period: '10月-12月', trend: 'up', value: '25%', icon: 'fa-leaf' },
            { name: '洋葱', area: '甘肃', period: '9月-11月', trend: 'down', value: '5%', icon: 'fa-seedling' },
            { name: '苹果', area: '山东', period: '9月-11月', trend: 'up', value: '18%', icon: 'fa-apple-alt' }
        ]
    };

    // 获取产品容器
    const productsContainer = document.querySelector('.season-products');
    if (!productsContainer) return;

    // 获取当前季度数据
    const products = seasonalProductsData[quarter];
    if (!products) return;

    // 清空容器
    productsContainer.innerHTML = '';

    // 添加产品项
    products.forEach((product, index) => {
        const trendIconClass = product.trend === 'up' ? 'fa-long-arrow-alt-up' : 'fa-long-arrow-alt-down';
        const trendClass = product.trend === 'up' ? 'up' : 'down';

        const productItemHTML = `
            <div class="season-product-item">
                <div class="product-rank">${index + 1}</div>
                <div class="product-icon"><i class="fas ${product.icon}"></i></div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-meta">
                        <span class="production-area">${product.area}</span>
                        <span class="product-period">${product.period}</span>
                    </div>
                </div>
                <div class="product-trend ${trendClass}">
                    <i class="fas ${trendIconClass}"></i>
                    <span>${product.value}</span>
                </div>
            </div>
        `;

        productsContainer.innerHTML += productItemHTML;
    });
}

/**
 * 初始化价格指数卡片交互
 */
function initPriceIndex() {
    const priceIndexCards = document.querySelectorAll('.price-index-card');
    if (priceIndexCards.length === 0) return;

    // 添加悬停效果
    priceIndexCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        });
    });
}

/**
 * 初始化数据看板控件交互
 */
function initDashboardControls() {
    // 时间筛选器交互
    const dashboardFilter = document.querySelector('.dashboard-filter');
    if (dashboardFilter) {
        dashboardFilter.addEventListener('change', function () {
            // 此处可添加时间筛选逻辑
            console.log('Dashboard time filter changed to:', this.value);
            // 触发数据重新加载
            refreshDashboardData(this.value);
        });
    }

    // 刷新按钮交互
    const refreshBtn = document.querySelector('.dashboard-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            // 添加旋转动画
            this.querySelector('i').classList.add('fa-spin');

            // 模拟刷新延迟
            setTimeout(() => {
                this.querySelector('i').classList.remove('fa-spin');

                // 获取当前选择的时间范围
                const timeRange = document.querySelector('.dashboard-filter').value;
                // 刷新数据
                refreshDashboardData(timeRange);

                // 显示刷新成功提示
                showToast('数据已更新');
            }, 1000);
        });
    }

    // 更多按钮交互
    const moreBtn = document.querySelector('.dashboard-more-btn');
    if (moreBtn) {
        moreBtn.addEventListener('click', function () {
            // 此处可添加更多选项菜单
            console.log('More options clicked');
        });
    }

    // 图表展开按钮交互
    const expandBtns = document.querySelectorAll('.card-action-btn');
    expandBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const cardBody = this.closest('.card-header').nextElementSibling;
            const card = this.closest('.dashboard-card');

            // 切换展开状态
            if (card.classList.contains('expanded')) {
                card.classList.remove('expanded');
                cardBody.style.maxHeight = null;
                this.querySelector('i').classList.replace('fa-compress-alt', 'fa-expand-alt');
            } else {
                card.classList.add('expanded');
                cardBody.style.maxHeight = '500px';
                this.querySelector('i').classList.replace('fa-expand-alt', 'fa-compress-alt');
            }
        });
    });
}

/**
 * 刷新看板数据
 * @param {string} timeRange - 时间范围
 */
function refreshDashboardData(timeRange) {
    // 这里应该是从后端API获取数据的逻辑
    // 这里提供更详细的模拟数据
    console.log('Refreshing dashboard data for timeRange:', timeRange);

    // 不同时间范围的模拟数据
    const trendData = {
        '7days': {
            '苹果': [8.6, 8.7, 8.7, 8.8, 8.9, 8.9, 8.8],
            '西红柿': [5.5, 5.5, 5.4, 5.5, 5.6, 5.6, 5.6],
            '土豆': [2.5, 2.5, 2.4, 2.4, 2.5, 2.5, 2.5],
            '大米': [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5]
        },
        '30days': {
            '苹果': [8.5, 8.5, 8.6, 8.6, 8.7, 8.7, 8.7, 8.8, 8.8, 8.8, 8.7, 8.7, 8.6, 8.6, 8.7, 8.7, 8.7, 8.8, 8.8, 8.9, 8.9, 8.9, 8.8, 8.8, 8.8, 8.8, 8.7, 8.7, 8.8, 8.8],
            '西红柿': [5.6, 5.6, 5.5, 5.5, 5.4, 5.4, 5.4, 5.3, 5.3, 5.3, 5.2, 5.2, 5.3, 5.3, 5.4, 5.4, 5.4, 5.5, 5.5, 5.6, 5.6, 5.6, 5.5, 5.5, 5.5, 5.5, 5.6, 5.6, 5.6, 5.6],
            '土豆': [2.6, 2.6, 2.6, 2.5, 2.5, 2.5, 2.5, 2.5, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5],
            '大米': [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5]
        },
        '90days': {
            '苹果': [7.8, 7.9, 8.0, 8.1, 8.2, 8.3, 8.3, 8.4, 8.4, 8.5, 8.5, 8.5, 8.6, 8.6, 8.7, 8.7, 8.7, 8.8, 8.8, 8.8, 8.7, 8.7, 8.6, 8.6, 8.7, 8.7, 8.7, 8.8, 8.8, 8.9],
            '西红柿': [4.5, 4.6, 4.7, 4.8, 4.9, 5.0, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.6, 5.5, 5.4, 5.4, 5.4, 5.3, 5.3, 5.3, 5.2, 5.2, 5.3, 5.3, 5.4, 5.4, 5.4, 5.5, 5.5, 5.6],
            '土豆': [2.8, 2.8, 2.7, 2.7, 2.7, 2.6, 2.6, 2.6, 2.6, 2.6, 2.5, 2.5, 2.5, 2.5, 2.5, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5],
            '大米': [3.6, 3.6, 3.6, 3.6, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5]
        },
        'year': {
            '苹果': [8.5, 8.9, 9.2, 8.8, 8.5, 8.2, 7.8, 7.5, 7.2, 7.8, 8.5, 8.8],
            '西红柿': [5.8, 6.2, 5.5, 4.8, 4.2, 3.8, 3.5, 3.6, 4.0, 4.5, 5.2, 5.6],
            '土豆': [2.5, 2.6, 2.8, 3.0, 3.2, 3.5, 3.2, 3.0, 2.8, 2.6, 2.4, 2.5],
            '大米': [3.5, 3.6, 3.6, 3.7, 3.8, 3.9, 3.9, 3.8, 3.8, 3.7, 3.6, 3.5]
        }
    };

    // 为选定的时间范围准备标签
    const timeLabels = {
        '7days': ['昨天', '前2天', '前3天', '前4天', '前5天', '前6天', '前7天'].reverse(),
        '30days': Array.from({ length: 30 }, (_, i) => `${30 - i}天前`).reverse(),
        '90days': Array.from({ length: 90 }, (_, i) => `${Math.floor(i / 30) + 1}月${i % 30 + 1}日`).slice(0, 30),
        'year': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    };

    // 获取价格趋势图表实例
    const priceTrendChart = Chart.getChart('price-trend-chart');
    if (priceTrendChart) {
        // 更新标签
        priceTrendChart.data.labels = timeLabels[timeRange];

        // 更新所有数据集
        priceTrendChart.data.datasets.forEach((dataset, index) => {
            const productName = dataset.label;
            if (trendData[timeRange] && trendData[timeRange][productName]) {
                dataset.data = trendData[timeRange][productName];
            }
        });

        priceTrendChart.update();

        // 更新图表洞察
        const insightEl = document.querySelector('.chart-insight');
        if (insightEl) {
            let insightHTML = '';
            switch (timeRange) {
                case '7days':
                    insightHTML = '<i class="fas fa-arrow-up trend-up"></i><span>近7天苹果价格稳中有升，较上周同期上涨2.3%</span>';
                    break;
                case '30days':
                    insightHTML = '<i class="fas fa-arrow-up trend-up"></i><span>近30天苹果价格呈波动上升趋势，较上月上涨3.5%</span>';
                    break;
                case '90days':
                    insightHTML = '<i class="fas fa-arrow-up trend-up"></i><span>近90天苹果价格整体呈上升趋势，增幅达14.1%</span>';
                    break;
                case 'year':
                    insightHTML = '<i class="fas fa-retweet trend-cycle"></i><span>全年苹果价格呈现明显季节性变化，春季最高，秋季最低</span>';
                    break;
            }
            insightEl.innerHTML = insightHTML;
        }
    }

    // 同时更新农产品价格指数数据
    updatePriceIndexData(timeRange);
}

/**
 * 更新农产品价格指数数据
 * @param {string} timeRange - 时间范围
 */
function updatePriceIndexData(timeRange) {
    // 模拟不同时间范围的价格指数数据
    const indexData = {
        '7days': {
            '蔬菜指数': { value: 127.8, change: 1.3 },
            '水果指数': { value: 109.5, change: 1.3 },
            '粮油指数': { value: 98.2, change: -0.5 },
            '肉禽蛋指数': { value: 116.2, change: 0.9 },
            '水产指数': { value: 103.8, change: 0.2 }
        },
        '30days': {
            '蔬菜指数': { value: 126.5, change: 2.3 },
            '水果指数': { value: 108.2, change: 0.8 },
            '粮油指数': { value: 98.7, change: -0.5 },
            '肉禽蛋指数': { value: 115.3, change: 1.2 },
            '水产指数': { value: 103.6, change: -0.3 }
        },
        '90days': {
            '蔬菜指数': { value: 123.7, change: 5.1 },
            '水果指数': { value: 105.6, change: 3.4 },
            '粮油指数': { value: 99.3, change: 0.1 },
            '肉禽蛋指数': { value: 112.8, change: 2.7 },
            '水产指数': { value: 102.5, change: 1.0 }
        },
        'year': {
            '蔬菜指数': { value: 118.2, change: 8.6 },
            '水果指数': { value: 102.1, change: 6.9 },
            '粮油指数': { value: 99.2, change: 0.3 },
            '肉禽蛋指数': { value: 109.5, change: 5.4 },
            '水产指数': { value: 101.5, change: 2.0 }
        }
    };

    // 更新时间戳
    const dateEl = document.querySelector('.price-index-date');
    if (dateEl) {
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        dateEl.textContent = `更新时间: ${formattedDate}`;
    }

    // 更新指数卡片数据
    const indexCards = document.querySelectorAll('.price-index-card');
    indexCards.forEach(card => {
        const indexName = card.querySelector('.index-name').textContent;
        const indexValueEl = card.querySelector('.index-value');
        const indexTrendEl = card.querySelector('.index-trend');

        if (indexData[timeRange] && indexData[timeRange][indexName]) {
            const data = indexData[timeRange][indexName];
            indexValueEl.textContent = data.value.toFixed(1);

            // 更新涨跌趋势
            const trendSpan = indexTrendEl.querySelector('span');
            trendSpan.textContent = Math.abs(data.change).toFixed(1) + '%';

            if (data.change > 0) {
                indexTrendEl.className = 'index-trend up';
                indexTrendEl.querySelector('i').className = 'fas fa-caret-up';
            } else if (data.change < 0) {
                indexTrendEl.className = 'index-trend down';
                indexTrendEl.querySelector('i').className = 'fas fa-caret-down';
            } else {
                indexTrendEl.className = 'index-trend stable';
                indexTrendEl.querySelector('i').className = 'fas fa-minus';
            }
        }
    });
}

/**
 * 显示提示信息
 * @param {string} message - 提示信息内容
 */
function showToast(message) {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // 添加到body
    document.body.appendChild(toast);

    // 触发显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 设置自动消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

/**
 * 初始化产品对比功能
 * 处理产品添加到对比栏及对比操作
 */
function initProductCompare() {
    const compareButtons = document.querySelectorAll('.add-to-compare');
    const compareBar = document.querySelector('.compare-bar');
    const compareItems = document.querySelector('.compare-items');
    const compareClearBtn = document.querySelector('.compare-clear-btn');
    const compareStartBtn = document.querySelector('.compare-start-btn');
    const maxCompareItems = 4;

    if (!compareButtons.length || !compareBar || !compareItems) return;

    let compareList = [];

    // 更新对比栏显示
    function updateCompareBar() {
        // 清空当前对比项
        compareItems.innerHTML = '';

        if (compareList.length === 0) {
            // 显示空提示
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'compare-placeholder';
            emptyMsg.textContent = '选择商品进行对比...';
            compareItems.appendChild(emptyMsg);
            compareStartBtn.disabled = true;
        } else {
            // 添加对比产品项
            compareList.forEach(product => {
                const item = document.createElement('div');
                item.className = 'compare-item';
                item.innerHTML = `
                    <div class="compare-item-img">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="compare-item-name">${product.name}</div>
                    <button class="compare-item-remove" data-id="${product.id}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                compareItems.appendChild(item);
            });

            // 启用/禁用对比按钮
            compareStartBtn.disabled = compareList.length < 2;
        }

        // 显示/隐藏对比栏
        if (compareList.length > 0) {
            compareBar.classList.add('active');
        } else {
            compareBar.classList.remove('active');
        }
    }

    // 添加产品到对比列表
    function addToCompare(productCard) {
        const productId = productCard.getAttribute('data-id') || Math.random().toString(36).substr(2, 9);

        // 检查是否已经添加过
        if (compareList.some(p => p.id === productId)) {
            showToast('该商品已在对比列表中', 'info');
            return;
        }

        // 检查是否超过最大数量
        if (compareList.length >= maxCompareItems) {
            showToast(`最多只能对比${maxCompareItems}个商品`, 'error');
            return;
        }

        // 添加产品
        const product = {
            id: productId,
            name: productCard.querySelector('.product-name').textContent,
            image: productCard.querySelector('.product-image img').src,
            price: productCard.querySelector('.current-price').textContent,
            origin: productCard.querySelector('.product-origin').textContent
        };

        compareList.push(product);
        updateCompareBar();
        showToast('已添加到对比列表');
    }

    // 从对比列表中移除产品
    function removeFromCompare(productId) {
        compareList = compareList.filter(p => p.id !== productId);
        updateCompareBar();
    }

    // 清空对比列表
    function clearCompareList() {
        compareList = [];
        updateCompareBar();
    }

    // 开始对比
    function startCompare() {
        // 这里可以实现跳转到对比页面的逻辑
        // 或者打开对比弹窗
        showToast('对比功能即将上线', 'info');
    }

    // 添加事件监听
    compareButtons.forEach(button => {
        button.addEventListener('click', function () {
            const productCard = this.closest('.product-card');
            addToCompare(productCard);
        });
    });

    // 监听对比项移除
    compareItems.addEventListener('click', function (e) {
        const removeBtn = e.target.closest('.compare-item-remove');
        if (removeBtn) {
            const productId = removeBtn.getAttribute('data-id');
            removeFromCompare(productId);
        }
    });

    // 清空对比列表
    if (compareClearBtn) {
        compareClearBtn.addEventListener('click', clearCompareList);
    }

    // 开始对比
    if (compareStartBtn) {
        compareStartBtn.addEventListener('click', startCompare);
    }

    // 初始化对比栏状态
    updateCompareBar();
}

/**
 * 快捷导航初始化
 */
function initQuickNav() {
    const backToTopBtn = document.querySelector('.back-to-top');

    if (backToTopBtn) {
        // 回到顶部按钮
        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // 页面滚动时显示/隐藏回到顶部按钮
        window.addEventListener('scroll', function () {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
    }

    // 其他快捷导航功能...
}

/**
 * 搜索功能初始化
 */
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchForm = document.querySelector('.search-form');

    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (searchInput && searchInput.value.trim()) {
                // 搜索请求
                window.location.href = `search.html?q=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });
    }

    // 高级搜索面板切换
    const advancedSearchToggle = document.querySelector('.advanced-search-toggle');
    const advancedSearchPanel = document.querySelector('.advanced-search-panel');

    if (advancedSearchToggle && advancedSearchPanel) {
        advancedSearchToggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            advancedSearchPanel.classList.toggle('active');

            // 添加切换图标效果
            const icon = this.querySelector('i');
            if (advancedSearchPanel.classList.contains('active')) {
                icon.classList.remove('fa-sliders-h');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-sliders-h');
            }
        });

        // 点击面板内部不关闭
        advancedSearchPanel.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        // 点击外部关闭面板
        document.addEventListener('click', function (e) {
            if (!advancedSearchPanel.contains(e.target) && !advancedSearchToggle.contains(e.target)) {
                advancedSearchPanel.classList.remove('active');

                // 重置图标
                const icon = advancedSearchToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-sliders-h');
            }
        });

        // 处理高级搜索表单提交
        const searchActions = advancedSearchPanel.querySelector('.search-actions');
        if (searchActions) {
            const searchBtn = searchActions.querySelector('.btn-search');
            const resetBtn = searchActions.querySelector('.btn-reset');

            if (searchBtn) {
                searchBtn.addEventListener('click', function (e) {
                    e.preventDefault();

                    // 收集所有搜索条件
                    const params = new URLSearchParams();

                    // 添加类别
                    const categorySelect = advancedSearchPanel.querySelector('select[value]');
                    if (categorySelect && categorySelect.value) {
                        params.append('category', categorySelect.value);
                    }

                    // 添加价格范围
                    const priceInputs = advancedSearchPanel.querySelectorAll('.price-range input');
                    if (priceInputs[0] && priceInputs[0].value) {
                        params.append('min_price', priceInputs[0].value);
                    }
                    if (priceInputs[1] && priceInputs[1].value) {
                        params.append('max_price', priceInputs[1].value);
                    }

                    // 添加产地
                    const regionSelect = advancedSearchPanel.querySelectorAll('select')[1];
                    if (regionSelect && regionSelect.value) {
                        params.append('region', regionSelect.value);
                    }

                    // 添加关键词（如果有）
                    if (searchInput && searchInput.value.trim()) {
                        params.append('q', searchInput.value.trim());
                    }

                    // 跳转到搜索结果页
                    window.location.href = `search.html?${params.toString()}`;
                });
            }

            if (resetBtn) {
                resetBtn.addEventListener('click', function (e) {
                    // 重置所有选择和输入
                    const selects = advancedSearchPanel.querySelectorAll('select');
                    const inputs = advancedSearchPanel.querySelectorAll('input');

                    selects.forEach(select => {
                        select.selectedIndex = 0;
                    });

                    inputs.forEach(input => {
                        input.value = '';
                    });
                });
            }
        }
    }
}

/**
 * 动态数据加载
 * @param {string} url - API接口地址
 * @param {object} params - 请求参数
 * @returns {Promise} - 请求Promise对象
 */
function fetchData(url, params = {}) {
    // 构建请求URL
    const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

    const fullUrl = queryString ? `${url}?${queryString}` : url;

    // 发送请求
    return fetch(fullUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Data fetch error:', error);
            throw error;
        });
}

/**
 * 表单验证辅助函数
 * @param {HTMLFormElement} form - 表单元素
 * @returns {boolean} - 验证是否通过
 */
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        // 重置错误状态
        input.classList.remove('error');
        const errorMsg = input.parentNode.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }

        // 必填项验证
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            markFieldError(input, '此项为必填项');
        }

        // 电子邮件格式验证
        if (input.type === 'email' && input.value.trim()) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(input.value)) {
                isValid = false;
                markFieldError(input, '请输入有效的电子邮件地址');
            }
        }

        // 手机号格式验证
        if (input.dataset.type === 'phone' && input.value.trim()) {
            const phonePattern = /^1[3-9]\d{9}$/;
            if (!phonePattern.test(input.value)) {
                isValid = false;
                markFieldError(input, '请输入有效的手机号码');
            }
        }

        // 其他验证规则...
    });

    return isValid;
}

/**
 * 标记表单字段错误
 * @param {HTMLElement} field - 表单字段元素
 * @param {string} message - 错误消息
 */
function markFieldError(field, message) {
    field.classList.add('error');

    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;

    field.parentNode.appendChild(errorElement);
}

/**
 * 防抖函数
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} - 防抖后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 初始化供需热力图切换
 */
function initHeatmapToggle() {
    const supplyButton = document.querySelector('.btn-toggle[data-view="supply"]');
    const demandButton = document.querySelector('.btn-toggle[data-view="demand"]');
    const heatmapOverlay = document.querySelector('.heatmap-overlay');

    if (supplyButton && demandButton && heatmapOverlay) {
        // 设置初始状态为供应模式
        heatmapOverlay.classList.add('supply-mode');
        heatmapOverlay.classList.remove('demand-mode');

        // 监听供应按钮点击
        supplyButton.addEventListener('click', function () {
            supplyButton.classList.add('active');
            demandButton.classList.remove('active');
            heatmapOverlay.classList.add('supply-mode');
            heatmapOverlay.classList.remove('demand-mode');

            // 调整渐变条颜色
            const gradientBar = document.querySelector('.gradient-bar');
            if (gradientBar) {
                gradientBar.style.background = 'linear-gradient(to right, #bfeeb7, #76c173, #2E8B57)';
            }
        });

        // 监听需求按钮点击
        demandButton.addEventListener('click', function () {
            demandButton.classList.add('active');
            supplyButton.classList.remove('active');
            heatmapOverlay.classList.add('demand-mode');
            heatmapOverlay.classList.remove('supply-mode');

            // 调整渐变条颜色
            const gradientBar = document.querySelector('.gradient-bar');
            if (gradientBar) {
                gradientBar.style.background = 'linear-gradient(to right, #ffcdd2, #ef9a9a, #e4393c)';
            }
        });
    }
}

/**
 * 初始化产品轮播
 */
function initProductSlider() {
    const sliderContainer = document.querySelector('.slider-container');
    const slides = document.querySelectorAll('.slide-item');
    const prevBtn = document.querySelector('.slider-arrow.prev');
    const nextBtn = document.querySelector('.slider-arrow.next');
    const dots = document.querySelectorAll('.slider-dot');

    if (!sliderContainer || !slides.length) return;

    let currentIndex = 0;
    const slideWidth = 100; // 百分比宽度

    // 更新小圆点指示器
    const updateDots = () => {
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    };

    // 过滤掉隐藏的幻灯片
    const getVisibleSlides = () => {
        return Array.from(slides).filter(slide => slide.style.display !== 'none');
    };

    // 切换到指定幻灯片
    function goToSlide(slideIndex) {
        const visibleSlides = getVisibleSlides();
        if (!visibleSlides.length) return;

        // 确保索引在有效范围内
        if (slideIndex < 0) {
            slideIndex = 0;
        } else if (slideIndex >= visibleSlides.length) {
            slideIndex = visibleSlides.length - 1;
        }

        // 找到可见幻灯片中的索引对应的实际幻灯片索引
        const actualIndex = Array.from(slides).indexOf(visibleSlides[slideIndex]);
        currentIndex = actualIndex;

        // 更新轮播位置
        sliderContainer.style.transform = `translateX(-${currentIndex * slideWidth}%)`;
        updateDots();
    }

    // 绑定点击事件
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });

    // 上一张/下一张按钮
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            let newIndex = currentIndex - 1;
            if (newIndex < 0) {
                newIndex = getVisibleSlides().length - 1;
            }
            goToSlide(newIndex);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            let newIndex = currentIndex + 1;
            if (newIndex >= getVisibleSlides().length) {
                newIndex = 0;
            }
            goToSlide(newIndex);
        });
    }

    // 自动播放
    let autoplayInterval;
    const startAutoplay = () => {
        autoplayInterval = setInterval(() => {
            let newIndex = currentIndex + 1;
            if (newIndex >= getVisibleSlides().length) {
                newIndex = 0;
            }
            goToSlide(newIndex);
        }, 5000);
    };

    const stopAutoplay = () => {
        clearInterval(autoplayInterval);
    };

    // 启动自动播放
    startAutoplay();

    // 鼠标悬停时暂停自动播放
    sliderContainer.addEventListener('mouseenter', stopAutoplay);
    sliderContainer.addEventListener('mouseleave', startAutoplay);

    // 初始化轮播
    goToSlide(0);

    // 窗口调整大小时重新计算
    window.addEventListener('resize', () => {
        goToSlide(currentIndex);
    });
}

/**
 * 初始化产品分类筛选功能
 * 根据所选分类显示/隐藏产品
 */
function initProductCategoryFilter() {
    console.log('正在初始化产品分类筛选...');

    // 获取所有分类标签按钮
    const categoryTabs = document.querySelectorAll('.tab-btn');
    console.log(`找到 ${categoryTabs.length} 个分类标签`);

    // 获取所有产品卡片
    const productCards = document.querySelectorAll('.product-card');
    console.log(`找到 ${productCards.length} 个产品卡片`);

    if (!categoryTabs.length) {
        console.warn('未找到分类标签按钮，无法初始化分类筛选功能');
        return;
    }

    if (!productCards.length) {
        console.warn('未找到产品卡片，无法初始化分类筛选功能');
        return;
    }

    // 为每个分类标签添加点击事件
    categoryTabs.forEach(tab => {
        console.log(`为分类标签 "${tab.textContent.trim()}" 添加点击事件监听器`);

        tab.addEventListener('click', function (e) {
            console.log(`点击了分类标签: ${this.textContent.trim()}`);

            // 更新标签激活状态
            categoryTabs.forEach(t => {
                t.classList.remove('active');
                console.log(`移除标签 "${t.textContent.trim()}" 的活跃状态`);
            });

            this.classList.add('active');
            console.log(`为标签 "${this.textContent.trim()}" 添加活跃状态`);

            // 获取选中的分类
            const selectedCategory = this.getAttribute('data-category');
            console.log(`已选择分类: ${selectedCategory}`);

            // 筛选产品
            let visibleCount = 0;
            productCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                console.log(`检查产品卡片分类: ${cardCategory}`);

                const slideItem = card.closest('.slide-item');

                if (selectedCategory === 'all' || cardCategory === selectedCategory) {
                    // 显示符合条件的产品
                    if (slideItem) {
                        slideItem.style.display = 'block';
                        console.log(`显示产品: ${card.querySelector('.product-name')?.textContent}`);
                    }
                    visibleCount++;
                } else {
                    // 隐藏不符合条件的产品
                    if (slideItem) {
                        slideItem.style.display = 'none';
                        console.log(`隐藏产品: ${card.querySelector('.product-name')?.textContent}`);
                    }
                }
            });

            console.log(`筛选完成，显示了 ${visibleCount} 个产品`);

            // 重置轮播（如果有）
            if (typeof window.goToSlide === 'function') {
                window.goToSlide(0);
                console.log('重置产品轮播到第一个幻灯片');
            }
        });
    });

    // 默认选中第一个标签
    if (categoryTabs.length > 0) {
        console.log('默认选中第一个标签');
        categoryTabs[0].click();
    }

    console.log('产品分类筛选初始化完成');
}

/**
 * 初始化产品快速查看功能
 * 处理快速查看弹窗的显示与数据填充
 */
function initProductQuickView() {
    const quickViewButtons = document.querySelectorAll('.quick-view');
    const quickViewModal = document.getElementById('quickViewModal');

    if (!quickViewButtons.length || !quickViewModal) return;

    const closeModal = quickViewModal.querySelector('.close-modal');

    quickViewButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();

            // 获取产品数据
            const productCard = this.closest('.product-card');
            const productImage = productCard.querySelector('.product-image img').src;
            const productName = productCard.querySelector('.product-name').textContent;
            const currentPrice = productCard.querySelector('.current-price').textContent;
            const originalPrice = productCard.querySelector('.original-price').textContent;
            const ratingStars = productCard.querySelector('.stars').innerHTML;
            const ratingCount = productCard.querySelector('.rating-count').textContent;
            const origin = productCard.querySelector('.product-origin').textContent.split(':')[1].trim();
            const category = productCard.querySelector('.product-category').textContent.split(':')[1].trim();

            // 填充弹窗数据
            quickViewModal.querySelector('.product-quick-image img').src = productImage;
            quickViewModal.querySelector('.product-title').textContent = productName;
            quickViewModal.querySelector('.product-price .current-price').textContent = currentPrice;
            quickViewModal.querySelector('.product-price .original-price').textContent = originalPrice;
            quickViewModal.querySelector('.product-rating .stars').innerHTML = ratingStars;
            quickViewModal.querySelector('.product-rating .rating-count').textContent = ratingCount;
            quickViewModal.querySelector('.meta-item .origin').textContent = origin;
            quickViewModal.querySelector('.meta-item .category').textContent = category;

            // 显示弹窗
            quickViewModal.style.display = 'flex';
        });
    });

    // 关闭弹窗
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            quickViewModal.style.display = 'none';
        });
    }

    // 点击弹窗外部关闭
    quickViewModal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });

    // 处理数量选择器
    const quantityDecrease = quickViewModal.querySelector('.quantity-decrease');
    const quantityIncrease = quickViewModal.querySelector('.quantity-increase');
    const quantityInput = quickViewModal.querySelector('.quantity-selector input');

    if (quantityDecrease && quantityIncrease && quantityInput) {
        quantityDecrease.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });

        quantityIncrease.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue < 99) {
                quantityInput.value = currentValue + 1;
            }
        });

        quantityInput.addEventListener('change', function () {
            let value = parseInt(this.value);
            if (isNaN(value) || value < 1) {
                this.value = 1;
            } else if (value > 99) {
                this.value = 99;
            }
        });
    }
}

/**
 * 初始化收藏夹功能
 * 处理产品收藏状态切换
 */
function initFavorites() {
    const favoriteButtons = document.querySelectorAll('.add-to-favorite');

    favoriteButtons.forEach(button => {
        button.addEventListener('click', function () {
            const icon = this.querySelector('i');

            if (icon.classList.contains('far')) {
                // 添加到收藏
                icon.classList.remove('far');
                icon.classList.add('fas');
                showToast('已添加到收藏夹');
            } else {
                // 从收藏中移除
                icon.classList.remove('fas');
                icon.classList.add('far');
                showToast('已从收藏夹移除');
            }
        });
    });
}

/**
 * 初始化产品视图切换功能 - 移除列表视图，只保留网格视图
 */
function initViewToggle() {
    console.log('初始化视图设置');

    const productSlider = document.querySelector('.product-slider');

    if (productSlider) {
        // 确保使用网格视图
        productSlider.classList.remove('list-view');
        productSlider.classList.add('grid-view');
        console.log('已设置为网格视图');
    }
}

// Category data structure
const categoryData = {
    '水果': {
        '柑橘类': {
            '柑橘': ['耙耙柑', '沃柑', '茂谷柑'],
            '橙子': ['脐橙', '血橙', '夏橙'],
            '柚子': ['蜜柚', '文旦', '红心柚']
        },
        '瓜果类': {
            '西瓜': ['8424', '京欣', '麒麟'],
            '哈密瓜': ['网纹', '羊角蜜', '白兰瓜']
        }
    },
    '蔬菜': {
        '叶菜类': {
            '生菜': ['油麦菜', '圆生菜', '罗马生菜'],
            '白菜': ['大白菜', '娃娃菜', '小白菜']
        }
    }
    // ... 更多分类数据
};

// Initialize category selection
function initCategorySelection() {
    const level1Input = document.getElementById('categoryLevel1Input');
    const level2Input = document.getElementById('categoryLevel2Input');
    const level3Input = document.getElementById('categoryLevel3Input');
    const level4Input = document.getElementById('categoryLevel4Input');

    const level1Dropdown = document.getElementById('categoryLevel1Dropdown');
    const level2Dropdown = document.getElementById('categoryLevel2Dropdown');
    const level3Dropdown = document.getElementById('categoryLevel3Dropdown');
    const level4Dropdown = document.getElementById('categoryLevel4Dropdown');

    if (!level1Input || !level2Input || !level3Input || !level4Input) return;

    // 为每个下拉图标添加点击事件
    document.querySelectorAll('.dropdown-icon').forEach((icon, index) => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const container = icon.closest('.search-select-container');
            const input = container.querySelector('.form-input');
            const dropdown = container.querySelector('.search-dropdown');

            // 如果输入框被禁用，不显示下拉列表
            if (input.disabled) return;

            // 切换下拉图标的旋转状态
            container.classList.toggle('active');

            // 根据不同级别显示对应的选项
            if (input === level1Input) {
                showAllOptions(level1Dropdown, Object.keys(categoryData));
            } else if (input === level2Input && level1Input.value) {
                showAllOptions(level2Dropdown, Object.keys(categoryData[level1Input.value] || {}));
            } else if (input === level3Input && level1Input.value && level2Input.value) {
                showAllOptions(level3Dropdown, Object.keys(categoryData[level1Input.value]?.[level2Input.value] || {}));
            } else if (input === level4Input && level1Input.value && level2Input.value && level3Input.value) {
                showAllOptions(level4Dropdown, categoryData[level1Input.value]?.[level2Input.value]?.[level3Input.value] || []);
            }
        });
    });

    // 点击输入框时显示下拉列表
    [level1Input, level2Input, level3Input, level4Input].forEach(input => {
        input.addEventListener('click', (e) => {
            e.stopPropagation();
            if (input.disabled) return;

            const container = input.closest('.search-select-container');
            const dropdown = container.querySelector('.search-dropdown');

            // 显示对应的选项
            if (input === level1Input) {
                showAllOptions(level1Dropdown, Object.keys(categoryData));
            } else if (input === level2Input && level1Input.value) {
                showAllOptions(level2Dropdown, Object.keys(categoryData[level1Input.value] || {}));
            } else if (input === level3Input && level1Input.value && level2Input.value) {
                showAllOptions(level3Dropdown, Object.keys(categoryData[level1Input.value]?.[level2Input.value] || {}));
            } else if (input === level4Input && level1Input.value && level2Input.value && level3Input.value) {
                showAllOptions(level4Dropdown, categoryData[level1Input.value]?.[level2Input.value]?.[level3Input.value] || []);
            }
        });
    });

    // 输入框输入事件
    level1Input.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        const matches = Object.keys(categoryData).filter(cat =>
            cat.toLowerCase().includes(searchTerm.toLowerCase())
        );
        showDropdown(level1Dropdown, matches, handleLevel1Selection);
    });

    level2Input.addEventListener('input', (e) => {
        const level1Value = level1Input.value;
        if (!categoryData[level1Value]) return;

        const searchTerm = e.target.value.trim();
        const matches = Object.keys(categoryData[level1Value]).filter(cat =>
            cat.toLowerCase().includes(searchTerm.toLowerCase())
        );
        showDropdown(level2Dropdown, matches, handleLevel2Selection);
    });

    level3Input.addEventListener('input', (e) => {
        const level1Value = level1Input.value;
        const level2Value = level2Input.value;
        if (!categoryData[level1Value]?.[level2Value]) return;

        const searchTerm = e.target.value.trim();
        const matches = Object.keys(categoryData[level1Value][level2Value]).filter(cat =>
            cat.toLowerCase().includes(searchTerm.toLowerCase())
        );
        showDropdown(level3Dropdown, matches, handleLevel3Selection);
    });

    level4Input.addEventListener('input', (e) => {
        const level1Value = level1Input.value;
        const level2Value = level2Input.value;
        const level3Value = level3Input.value;
        if (!categoryData[level1Value]?.[level2Value]?.[level3Value]) return;

        const searchTerm = e.target.value.trim();
        const suggestions = categoryData[level1Value][level2Value][level3Value];
        const matches = suggestions.filter(cat =>
            cat.toLowerCase().includes(searchTerm.toLowerCase())
        );
        showDropdown(level4Dropdown, matches, handleLevel4Selection);
    });

    // 处理选项选择
    function handleLevel1Selection(selected) {
        level1Input.value = selected;
        level2Input.value = '';
        level3Input.value = '';
        level4Input.value = '';

        level2Input.disabled = false;
        level3Input.disabled = true;
        level4Input.disabled = true;

        hideAllDropdowns();
    }

    function handleLevel2Selection(selected) {
        level2Input.value = selected;
        level3Input.value = '';
        level4Input.value = '';

        level3Input.disabled = false;
        level4Input.disabled = true;

        hideAllDropdowns();
    }

    function handleLevel3Selection(selected) {
        level3Input.value = selected;
        level4Input.value = '';
        level4Input.disabled = false;
        hideAllDropdowns();
    }

    function handleLevel4Selection(selected) {
        level4Input.value = selected;
        hideAllDropdowns();
    }

    // 点击页面其他地方时关闭所有下拉列表
    document.addEventListener('click', () => {
        hideAllDropdowns();
    });

    // 隐藏所有下拉列表并重置图标状态
    function hideAllDropdowns() {
        [level1Dropdown, level2Dropdown, level3Dropdown, level4Dropdown].forEach(dropdown => {
            if (dropdown) {
                dropdown.style.display = 'none';
                const container = dropdown.closest('.search-select-container');
                if (container) {
                    container.classList.remove('active');
                }
            }
        });
    }

    // 显示下拉列表选项
    function showAllOptions(dropdown, items) {
        if (!dropdown || !items.length) return;

        const container = dropdown.closest('.search-select-container');
        container.classList.add('active');

        dropdown.innerHTML = items.map(item => `
            <div class="search-dropdown-item">${item}</div>
        `).join('');

        dropdown.style.display = 'block';

        // 为每个选项添加点击事件
        dropdown.querySelectorAll('.search-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const selected = item.textContent;
                const input = dropdown.closest('.search-select-container').querySelector('.form-input');

                if (input === level1Input) handleLevel1Selection(selected);
                else if (input === level2Input) handleLevel2Selection(selected);
                else if (input === level3Input) handleLevel3Selection(selected);
                else if (input === level4Input) handleLevel4Selection(selected);
            });
        });
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

            // 不需要在这里添加特定的操作，各自的功能已经在其他函数中处理
        });
    });