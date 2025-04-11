/**
 * 供应大厅页面的JavaScript功能
 */

document.addEventListener('DOMContentLoaded', function () {
    // 页面加载完成后初始化
    initCategorySystem();
    initCarousel();
    initPagination();

    // 为所有filter-chip添加基本的点击高亮效果
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function (e) {
            // 防止事件冒泡导致的重复处理
            if (e.target === this || e.currentTarget === this) {
                // 获取当前筛选组
                const filterGroup = this.closest('.filter-chips');
                if (filterGroup) {
                    // 移除同组中其他标签的active类
                    filterGroup.querySelectorAll('.filter-chip').forEach(c => {
                        c.classList.remove('active');
                    });
                    // 给当前标签添加active类
                    this.classList.add('active');
                }
            }
        }, true); // 使用捕获阶段处理事件
    });

    // 初始化所有功能
    initFilterSystem();
    initTagSystem();
    initLoadMore();
    initRoleSwitch();
    initSortingSystem();
    initFilters();
    initQuickView();
    initProductCompare();
    initLocationFilter();
    initTagFilter();

    // 初始化产品卡片按钮
    initProductCardButtons();
});

/**
 * 隐藏所有子分类
 */
function hideAllSubcategories() {
    const secondLevel = document.getElementById('secondLevelCategory');
    const thirdLevel = document.getElementById('thirdLevelCategory');

    if (secondLevel) {
        secondLevel.style.display = 'none';
    }

    if (thirdLevel) {
        thirdLevel.style.display = 'none';
    }
}

/**
 * 初始化分类系统
 */
function initCategorySystem() {
    const mainCategories = document.querySelectorAll('.main-category-item');
    const carousel = document.querySelector('.category-carousel');
    const subCategories = document.querySelectorAll('.sub-category-group');

    // 默认显示全部分类（轮播图）
    if (carousel) {
        carousel.classList.add('active');
        initCarousel();
    }

    // 为每个主分类添加点击事件
    mainCategories.forEach(category => {
        category.addEventListener('click', function () {
            // 移除所有主分类的active状态
            mainCategories.forEach(cat => cat.classList.remove('active'));
            // 为当前点击的分类添加active状态
            this.classList.add('active');

            const categoryType = this.getAttribute('data-category');

            // 隐藏所有子分类和轮播图
            hideAllContent();

            // 如果是"全部分类"，显示轮播图
            if (categoryType === 'all') {
                if (carousel) {
                    carousel.classList.add('active');
                }
            } else {
                // 显示对应的子分类
                const targetSubCategory = document.querySelector(`.sub-category-group[data-parent="${categoryType}"]`);
                if (targetSubCategory) {
                    targetSubCategory.classList.add('active');
                }
            }

            // 更新分类路径
            updateCategoryPath(this.textContent);
        });
    });
}

// 隐藏所有内容（子分类和轮播图）
function hideAllContent() {
    // 隐藏所有子分类
    const subCategories = document.querySelectorAll('.sub-category-group');
    subCategories.forEach(sub => sub.classList.remove('active'));

    // 隐藏轮播图
    const carousel = document.querySelector('.category-carousel');
    if (carousel) {
        carousel.classList.remove('active');
    }
}

/**
 * 初始化轮播图
 */
function initCarousel() {
    const carousel = document.querySelector('.category-carousel');
    if (!carousel) return;

    const slidesContainer = carousel.querySelector('.carousel-slides');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = carousel.querySelectorAll('.indicator');
    const prevBtn = carousel.querySelector('.prev-btn');
    const nextBtn = carousel.querySelector('.next-btn');

    let currentSlide = 0;
    let autoPlayInterval;

    // 初始化指示器
    indicators[currentSlide].classList.add('active');

    // 更新轮播图显示
    function updateCarousel() {
        slidesContainer.style.transform = `translateX(-${currentSlide * 25}%)`;
        // 更新指示器状态
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });
    }

    // 下一张幻灯片
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateCarousel();
        resetAutoPlay();
    }

    // 上一张幻灯片
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateCarousel();
        resetAutoPlay();
    }

    // 绑定按钮事件
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }

    // 绑定指示器事件
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
            resetAutoPlay();
        });
    });

    // 自动播放
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000); // 每5秒切换一次
    }

    // 重置自动播放
    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }

    // 鼠标悬停时暂停自动播放
    carousel.addEventListener('mouseenter', () => {
        clearInterval(autoPlayInterval);
    });

    // 鼠标离开时恢复自动播放
    carousel.addEventListener('mouseleave', () => {
        startAutoPlay();
    });

    // 开始自动播放
    startAutoPlay();
}

/**
 * 重置二级分类的选中状态为 "全部"
 */
function resetSecondLevelActiveState(secondLevelContainer) {
    if (!secondLevelContainer) return;
    const secondaryChips = secondLevelContainer.querySelectorAll('.filter-chip');
    secondaryChips.forEach(chip => chip.classList.remove('active'));
    const allChip = secondLevelContainer.querySelector('.filter-chip[data-filter="subcategory-all"]');
    if (allChip) {
        allChip.classList.add('active');
    }
}

/**
 * 更新分类路径显示
 */
function updateCategoryPath(primary, secondary = null, tertiary = null) {
    const primaryEl = document.getElementById('primaryCategoryPath');
    const secondaryEl = document.getElementById('secondaryCategoryPath');
    const tertiaryEl = document.getElementById('thirdCategoryPath');
    const firstSeparator = document.getElementById('firstSeparator');
    const secondSeparator = document.getElementById('secondSeparator');

    if (!primaryEl) return;

    // 更新一级分类
    primaryEl.textContent = primary;

    // 更新二级分类
    if (secondary && secondaryEl && firstSeparator) {
        secondaryEl.textContent = secondary;
        secondaryEl.style.display = 'inline';
        firstSeparator.style.display = 'inline';
    } else if (secondaryEl && firstSeparator) {
        secondaryEl.style.display = 'none';
        firstSeparator.style.display = 'none';
    }

    // 更新三级分类
    if (tertiary && tertiaryEl && secondSeparator) {
        tertiaryEl.textContent = tertiary;
        tertiaryEl.style.display = 'inline';
        secondSeparator.style.display = 'inline';
    } else if (tertiaryEl && secondSeparator) {
        tertiaryEl.style.display = 'none';
        secondSeparator.style.display = 'none';
    }

    console.log(`更新分类路径: ${primary} ${secondary ? '> ' + secondary : ''} ${tertiary ? '> ' + tertiary : ''}`);
}

/**
 * 隐藏二级分类
 */
function hideSecondaryCategory() {
    const secondLevel = document.getElementById('secondLevelCategory');
    if (secondLevel) {
        secondLevel.style.display = 'none';
        // 重置二级分类的选中状态
        const allChips = secondLevel.querySelectorAll('.filter-chip');
        allChips.forEach(chip => chip.classList.remove('active'));
        const allChip = secondLevel.querySelector('.filter-chip[data-filter="subcategory-all"]');
        if (allChip) {
            allChip.classList.add('active');
        }
    }
}

/**
 * 显示二级分类
 */
function showSecondaryCategories(category) {
    const secondLevel = document.getElementById('secondLevelCategory');
    if (!secondLevel) return;

    // 隐藏所有二级分类组
    const subcategoryGroups = secondLevel.querySelectorAll('.subcategory-group');
    subcategoryGroups.forEach(group => {
        group.style.display = 'none';
    });

    // 显示对应的二级分类组
    const targetGroup = secondLevel.querySelector(`.subcategory-group[data-parent="${category}"]`);
    if (targetGroup) {
        // 显示二级分类容器
        secondLevel.style.display = 'block';
        // 显示对应的分类组
        targetGroup.style.display = 'block';

        // 确保"全部"选项被选中
        const allChips = secondLevel.querySelectorAll('.filter-chip');
        allChips.forEach(chip => chip.classList.remove('active'));
        const allChip = secondLevel.querySelector('.filter-chip[data-filter="subcategory-all"]');
        if (allChip) {
            allChip.classList.add('active');
        }
    }
}

/**
 * 初始化筛选系统
 */
function initFilterSystem() {
    // 筛选项点击事件
    const filterItems = document.querySelectorAll('.filter-item');
    const filterModal = document.querySelector('.filter-modal');
    const filterContent = document.querySelector('.filter-content');
    const filterOptions = document.querySelectorAll('.filter-option');
    const filterReset = document.querySelector('.filter-reset');
    const filterConfirm = document.querySelector('.filter-confirm');

    // 如果找不到必要的DOM元素，直接返回
    if (!filterModal || !filterContent) {
        console.warn('Filter system elements not found');
        return;
    }

    // 当前选中的筛选类型
    let currentFilterType = 'category';

    // 显示筛选模态框
    if (filterItems && filterItems.length > 0) {
        filterItems.forEach(item => {
            item.addEventListener('click', function () {
                const filterType = this.getAttribute('data-filter');
                currentFilterType = filterType;

                // 更新标题和选项
                updateFilterModalContent(filterType);

                filterModal.classList.add('active');

                // 添加点击效果
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 200);
            });
        });
    }

    // 关闭筛选模态框（点击空白处）
    filterModal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });

    // 防止冒泡
    filterContent.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // 筛选选项点击
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('filter-option') || e.target.closest('.filter-option')) {
            const option = e.target.classList.contains('filter-option') ? e.target : e.target.closest('.filter-option');
            const parent = option.parentElement;
            if (!parent) return;

            const allOptions = parent.querySelectorAll('.filter-option');
            allOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            // 添加点击效果
            option.style.transform = 'scale(0.95)';
            setTimeout(() => {
                option.style.transform = 'scale(1)';
            }, 200);
        }
    });

    // 重置筛选
    if (filterReset) {
        filterReset.addEventListener('click', function () {
            const activeFilterOptions = filterContent.querySelectorAll('.filter-option');
            activeFilterOptions.forEach(opt => {
                opt.classList.remove('active');
            });
            if (activeFilterOptions.length > 0) {
                activeFilterOptions[0].classList.add('active');
            }
        });
    }

    // 确认筛选
    if (filterConfirm) {
        filterConfirm.addEventListener('click', function () {
            const selectedOption = filterContent.querySelector('.filter-option.active');
            if (!selectedOption) return;

            // 更新筛选按钮文字
            const filterItem = document.querySelector(`.filter-item[data-filter="${currentFilterType}"]`);
            if (!filterItem) return;

            if (selectedOption.textContent.trim() !== '全部') {
                filterItem.textContent = selectedOption.textContent;
                filterItem.innerHTML = `${selectedOption.textContent} <i class="fas fa-chevron-down"></i>`;

                // 将筛选条件添加到标签列表中
                addFilterTag(selectedOption.textContent, currentFilterType);

                // 高亮显示筛选项
                filterItem.classList.add('active');
            } else {
                // 恢复默认显示
                const defaultText = getDefaultFilterText(currentFilterType);
                filterItem.innerHTML = `${defaultText} <i class="fas fa-chevron-down"></i>`;

                // 从标签列表中移除相关标签
                removeFilterTagByType(currentFilterType);

                // 移除高亮
                filterItem.classList.remove('active');
            }

            // 更新产品列表（模拟）
            filterProducts();

            // 关闭模态框
            filterModal.classList.remove('active');
        });
    }
}

/**
 * 根据筛选类型返回默认显示文本
 */
function getDefaultFilterText(filterType) {
    const filterTexts = {
        'category': '全部分类',
        'area': '所在地区',
        'price': '价格区间',
        'season': '当季时令',
        'certification': '认证类型',
        'more': '更多筛选'
    };
    return filterTexts[filterType] || '筛选';
}

/**
 * 根据筛选类型更新模态框内容
 */
function updateFilterModalContent(filterType) {
    const filterTitle = document.querySelector('.filter-title');
    const filterOptionsContainer = document.querySelector('.filter-options');

    // 清空原有选项
    filterOptionsContainer.innerHTML = '';

    // 根据筛选类型设置标题和选项
    switch (filterType) {
        case 'category':
            filterTitle.textContent = '选择分类';
            const categories = ['全部', '蔬菜', '水果', '粮油', '肉禽蛋', '水产', '干货', '茶叶', '食用菌', '中药材', '调味品', '其他'];
            categories.forEach(category => {
                const option = document.createElement('div');
                option.className = 'filter-option' + (category === '全部' ? ' active' : '');
                option.textContent = category;
                filterOptionsContainer.appendChild(option);
            });
            break;

        case 'area':
            filterTitle.textContent = '选择地区';
            const provinces = ['全部', '四川', '重庆', '云南', '贵州', '陕西', '甘肃', '河南', '山东', '河北', '黑龙江', '其他'];
            provinces.forEach(province => {
                const option = document.createElement('div');
                option.className = 'filter-option' + (province === '全部' ? ' active' : '');
                option.textContent = province;
                filterOptionsContainer.appendChild(option);
            });
            break;

        case 'price':
            filterTitle.textContent = '价格区间';
            const priceRanges = ['全部', '0-5元/斤', '5-10元/斤', '10-20元/斤', '20-50元/斤', '50元以上/斤'];
            priceRanges.forEach(range => {
                const option = document.createElement('div');
                option.className = 'filter-option' + (range === '全部' ? ' active' : '');
                option.textContent = range;
                filterOptionsContainer.appendChild(option);
            });
            break;

        case 'season':
            filterTitle.textContent = '当季时令';
            const seasons = ['全部', '春季', '夏季', '秋季', '冬季', '四季皆宜'];
            seasons.forEach(season => {
                const option = document.createElement('div');
                option.className = 'filter-option' + (season === '全部' ? ' active' : '');
                option.textContent = season;
                filterOptionsContainer.appendChild(option);
            });
            break;

        case 'certification':
            filterTitle.textContent = '认证类型';
            const certifications = ['全部', '有机认证', '绿色食品', '无公害', 'ISO认证', 'HACCP认证'];
            certifications.forEach(cert => {
                const option = document.createElement('div');
                option.className = 'filter-option' + (cert === '全部' ? ' active' : '');
                option.textContent = cert;
                filterOptionsContainer.appendChild(option);
            });
            break;

        case 'more':
            filterTitle.textContent = '更多筛选';
            const moreFilters = ['全部', '最新上架', '包邮', '批发价', '可议价', '预售', '产地直发'];
            moreFilters.forEach(filter => {
                const option = document.createElement('div');
                option.className = 'filter-option' + (filter === '全部' ? ' active' : '');
                option.textContent = filter;
                filterOptionsContainer.appendChild(option);
            });
            break;

        default:
            filterTitle.textContent = '选择筛选条件';
    }
}

/**
 * 初始化标签系统
 */
function initTagSystem() {
    // 移除标签
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('fa-times')) {
            const tag = e.target.closest('.filter-tag');
            if (tag) {
                const filterType = tag.getAttribute('data-type');
                tag.remove();

                // 重置对应的筛选按钮状态
                if (filterType) {
                    const filterItem = document.querySelector(`.filter-item[data-filter="${filterType}"]`);
                    if (filterItem) {
                        filterItem.classList.remove('active');
                        const defaultText = getDefaultFilterText(filterType);
                        filterItem.innerHTML = `${defaultText} <i class="fas fa-chevron-down"></i>`;
                    }
                }

                // 更新产品列表
                filterProducts();
            }
        }
    });
}

/**
 * 添加筛选标签
 */
function addFilterTag(text, type) {
    const tagList = document.querySelector('.tag-list');

    // 检查是否已存在相同类型的标签
    const existingTag = document.querySelector(`.filter-tag[data-type="${type}"]`);
    if (existingTag) {
        existingTag.innerHTML = `${text} <i class="fas fa-times"></i>`;
        return;
    }

    // 创建新标签
    const tag = document.createElement('div');
    tag.className = 'filter-tag';
    tag.setAttribute('data-type', type);
    tag.innerHTML = `${text} <i class="fas fa-times"></i>`;

    tagList.appendChild(tag);

    // 确保标签列表可见
    tagList.style.display = tagList.children.length > 0 ? 'flex' : 'none';
}

/**
 * 根据类型移除筛选标签
 */
function removeFilterTagByType(type) {
    const tag = document.querySelector(`.filter-tag[data-type="${type}"]`);
    if (tag) {
        tag.remove();
    }

    // 检查标签列表是否为空
    const tagList = document.querySelector('.tag-list');
    tagList.style.display = tagList.children.length > 0 ? 'flex' : 'none';
}

/**
 * 筛选产品（模拟）
 */
function filterProducts() {
    const resultCount = document.querySelector('.result-count');
    const productGrid = document.querySelector('.product-grid');
    const emptyState = document.querySelector('.empty-state');
    const loadMore = document.querySelector('.load-more');

    // 获取当前活跃的标签数量
    const activeTags = document.querySelectorAll('.filter-tag').length;

    // 模拟筛选效果
    if (activeTags > 2) {
        // 显示空状态
        productGrid.style.display = 'none';
        loadMore.style.display = 'none';
        emptyState.style.display = 'flex';
        resultCount.textContent = '共0个结果';
    } else {
        // 显示产品
        productGrid.style.display = 'grid';
        loadMore.style.display = 'block';
        emptyState.style.display = 'none';

        // 根据标签数量减少显示的产品数量（模拟筛选）
        const products = productGrid.querySelectorAll('.product-card');
        let visibleCount = products.length;

        products.forEach((product, index) => {
            if (activeTags === 0 || index < products.length - activeTags * 2) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
                visibleCount--;
            }
        });

        resultCount.textContent = `共${visibleCount}个结果`;
    }
}

/**
 * 初始化加载更多功能
 */
function initLoadMore() {
    const loadMore = document.querySelector('.load-more');

    // 如果找不到加载更多按钮，直接返回
    if (!loadMore) {
        console.warn('Load more button not found');
        return;
    }

    let page = 1;

    loadMore.addEventListener('click', function () {
        this.textContent = '加载中...';
        this.style.pointerEvents = 'none';

        // 模拟网络请求延迟
        setTimeout(() => {
            // 模拟加载更多产品
            addMoreProducts(page);

            page++;
            this.textContent = '加载更多';
            this.style.pointerEvents = 'auto';

            // 模拟加载完所有数据
            if (page >= 3) {
                this.textContent = '已加载全部';
                this.style.pointerEvents = 'none';
                this.style.backgroundColor = '#f0f0f0';
                this.style.color = '#999';
            }
        }, 1000);
    });
}

/**
 * 模拟加载更多产品
 */
function addMoreProducts(page) {
    const productGrid = document.querySelector('.product-grid');

    // 模拟产品数据
    const products = [
        {
            id: 7 + page * 6,
            name: '云南红河哈尼梯田大米',
            price: 15.80,
            unit: '斤',
            address: '云南-红河',
            desc: '梯田种植，纯天然无污染，口感香糯，营养丰富。',
            image: 'https://img.freepik.com/free-photo/close-up-rice-bowl_23-2148062221.jpg'
        },
        {
            id: 8 + page * 6,
            name: '湖北恩施富硒茶',
            price: 128.00,
            unit: '500g',
            address: '湖北-恩施',
            desc: '富含硒元素，香气高雅，回甘持久，有降压、抗氧化等功效。',
            image: 'https://img.freepik.com/free-photo/cup-tea_144627-27455.jpg'
        },
        {
            id: 9 + page * 6,
            name: '赣南脐橙',
            price: 5.90,
            unit: '斤',
            address: '江西-赣州',
            desc: '果肉饱满，汁多甜美，富含维生素C，新鲜直发。',
            image: 'https://img.freepik.com/free-photo/orange-white-white_144627-16571.jpg'
        },
        {
            id: 10 + page * 6,
            name: '山西老陈醋',
            price: 23.80,
            unit: '瓶',
            address: '山西-太原',
            desc: '传统酿造，陈年老醋，色泽红褐，醇厚香醪，开胃健脾。',
            image: 'https://img.freepik.com/free-photo/bottle-with-vinegar_144627-30303.jpg'
        }
    ];

    // 创建产品卡片并添加到网格中
    products.forEach(product => {
        const productCard = document.createElement('a');
        productCard.href = `product-detail.html?id=${product.id}`;
        productCard.className = 'product-card';

        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">
                    ¥${product.price.toFixed(2)}<span class="product-unit">/${product.unit}</span>
                </div>
                <div class="product-address">
                    <i class="fas fa-map-marker-alt"></i>${product.address}
                </div>
                <div class="product-desc">${product.desc}</div>
            </div>
        `;

        productGrid.appendChild(productCard);
    });

    // 更新结果数量
    const resultCount = document.querySelector('.result-count');
    const currentCount = parseInt(resultCount.textContent.match(/\d+/)[0]);
    resultCount.textContent = `共${currentCount + products.length}个结果`;
}

/**
 * 初始化角色切换功能
 */
function initRoleSwitch() {
    const roleSwitch = document.querySelector('.role-switch');
    const roleModal = document.querySelector('.role-modal');
    const roleOptions = document.querySelectorAll('.role-option');
    const roleConfirm = document.querySelector('.role-confirm');
    const currentRoleText = document.getElementById('currentRole');

    if (!roleSwitch) return;

    // 从localStorage获取当前角色
    let currentRole = localStorage.getItem('userRole') || 'buyer';

    // 更新UI显示
    function updateRoleUI(role) {
        if (currentRoleText) {
            currentRoleText.textContent = role === 'supplier' ? '供应商' : '采购商';
        }

        // 更新角色选项的激活状态
        roleOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.role === role);
        });
    }

    // 初始化UI
    updateRoleUI(currentRole);

    // 角色切换按钮点击事件
    roleSwitch.addEventListener('click', () => {
        // 添加点击效果
        roleSwitch.style.transform = 'scale(0.95)';
        setTimeout(() => {
            roleSwitch.style.transform = 'scale(1)';
        }, 200);

        // 显示模态框
        roleModal.classList.add('active');

        // 根据当前角色预选对应选项
        roleOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.role === currentRole);
        });
    });

    // 角色选项点击事件
    roleOptions.forEach(option => {
        option.addEventListener('click', () => {
            roleOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });

    // 确认按钮点击事件
    roleConfirm.addEventListener('click', () => {
        const selectedRole = document.querySelector('.role-option.active').dataset.role;
        if (selectedRole !== currentRole) {
            currentRole = selectedRole;
            localStorage.setItem('userRole', currentRole);
            updateRoleUI(currentRole);

            // 如果角色变化，则跳转到对应页面
            if (currentRole === 'supplier') {
                window.location.href = 'demand.html';
            }
        }
        roleModal.classList.remove('active');
    });

    // 点击模态框外部关闭
    roleModal.addEventListener('click', (e) => {
        if (e.target === roleModal) {
            roleModal.classList.remove('active');
            // 重置选项状态
            roleOptions.forEach(option => {
                option.classList.toggle('active', option.dataset.role === currentRole);
            });
        }
    });
}

/**
 * 初始化排序系统
 */
function initSortingSystem() {
    const sortButton = document.querySelector('.result-sort');

    if (!sortButton) return;

    sortButton.addEventListener('click', function () {
        const sortModal = document.createElement('div');
        sortModal.className = 'filter-modal active';

        sortModal.innerHTML = `
            <div class="filter-content">
                <div class="filter-title">排序方式</div>
                <div class="filter-options">
                    <div class="filter-option active">默认排序</div>
                    <div class="filter-option">价格从低到高</div>
                    <div class="filter-option">价格从高到低</div>
                    <div class="filter-option">销量优先</div>
                    <div class="filter-option">好评优先</div>
                    <div class="filter-option">距离最近</div>
                </div>
                <div class="filter-buttons">
                    <div class="filter-confirm" style="width: 100%;">确定</div>
                </div>
            </div>
        `;

        document.body.appendChild(sortModal);

        // 选项点击事件
        const sortOptions = sortModal.querySelectorAll('.filter-option');
        sortOptions.forEach(option => {
            option.addEventListener('click', function () {
                sortOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // 确认按钮点击事件
        const confirmButton = sortModal.querySelector('.filter-confirm');
        confirmButton.addEventListener('click', function () {
            const selectedOption = sortModal.querySelector('.filter-option.active');
            if (selectedOption) {
                sortButton.innerHTML = `${selectedOption.textContent} <i class="fas fa-chevron-down"></i>`;
                // 模拟排序
                sortProducts(selectedOption.textContent);
            }
            sortModal.remove();
        });

        // 点击空白处关闭
        sortModal.addEventListener('click', function (e) {
            if (e.target === sortModal) {
                sortModal.remove();
            }
        });
    });
}

/**
 * 模拟产品排序
 */
function sortProducts(sortType) {
    const productGrid = document.querySelector('.product-grid');
    const products = Array.from(productGrid.querySelectorAll('.product-card'));

    // 根据排序类型对产品进行排序
    switch (sortType) {
        case '价格从低到高':
            products.sort((a, b) => {
                const priceA = parseFloat(a.querySelector('.product-price').textContent.replace('¥', ''));
                const priceB = parseFloat(b.querySelector('.product-price').textContent.replace('¥', ''));
                return priceA - priceB;
            });
            break;

        case '价格从高到低':
            products.sort((a, b) => {
                const priceA = parseFloat(a.querySelector('.product-price').textContent.replace('¥', ''));
                const priceB = parseFloat(b.querySelector('.product-price').textContent.replace('¥', ''));
                return priceB - priceA;
            });
            break;

        default:
            // 随机打乱顺序模拟其他排序方式
            products.sort(() => Math.random() - 0.5);
    }

    // 重新添加到DOM中
    products.forEach(product => {
        productGrid.appendChild(product);
    });

    // 添加排序动画
    products.forEach((product, index) => {
        setTimeout(() => {
            product.style.opacity = '0';
            setTimeout(() => {
                product.style.opacity = '1';
            }, 100);
        }, index * 50);
    });
}

/**
 * 初始化筛选功能
 */
function initFilters() {
    // 筛选标签点击
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', function (e) {
            // 获取当前筛选组
            const filterGroup = this.closest('.filter-chips');

            // 阻止事件冒泡，确保事件不会被父元素处理
            e.stopPropagation();

            // 移除同组中其他标签的active类
            filterGroup.querySelectorAll('.filter-chip').forEach(c => {
                c.classList.remove('active');
            });

            // 给当前标签添加active类
            this.classList.add('active');

            // 如果不是"全部"类型，则添加到已选标签中
            const filterText = this.textContent.trim();
            const filterType = this.getAttribute('data-filter');

            if (!filterType.includes('-all')) {
                addSelectedFilter(filterText, filterType);
            }

            // 触发筛选
            applyFilters();
        });
    });

    // 移除已选标签
    document.addEventListener('click', function (e) {
        if (e.target.closest('.selected-tag i')) {
            const tag = e.target.closest('.selected-tag');
            tag.remove();

            // 重置相应筛选组的选中状态
            resetRelatedFilter(tag.getAttribute('data-filter'));

            // 重新应用筛选
            applyFilters();
        }
    });

    // 清除所有筛选
    const clearFiltersBtn = document.querySelector('.clear-filters-btn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function () {
            // 清除所有已选标签
            document.querySelectorAll('.selected-tag').forEach(tag => {
                tag.remove();
            });

            // 重置所有筛选组为"全部"
            document.querySelectorAll('.filter-chips').forEach(group => {
                const allChip = group.querySelector('[data-filter*="-all"]');
                if (allChip) {
                    group.querySelectorAll('.filter-chip').forEach(c => {
                        c.classList.remove('active');
                    });
                    allChip.classList.add('active');
                }
            });

            // 显示所有产品
            document.querySelectorAll('.product-card').forEach(card => {
                card.style.display = 'block';
            });

            // 更新结果数量
            updateResultCount();
        });
    }
}

/**
 * 添加已选筛选标签
 */
function addSelectedFilter(text, filterType) {
    const selectedTags = document.querySelector('.selected-tags');

    // 检查是否已存在相同类型的标签
    const existingTags = selectedTags.querySelectorAll(`.selected-tag[data-filter^="${filterType.split('-')[0]}"]`);
    existingTags.forEach(tag => tag.remove());

    // 创建新标签
    const tag = document.createElement('span');
    tag.className = 'selected-tag';
    tag.setAttribute('data-filter', filterType);
    tag.innerHTML = `${text} <i class="fas fa-times"></i>`;

    // 添加到已选标签容器
    selectedTags.appendChild(tag);
}

/**
 * 重置相关筛选组的选中状态
 */
function resetRelatedFilter(filterType) {
    if (!filterType) return;

    const filterPrefix = filterType.split('-')[0];
    const filterGroup = document.querySelector(`.filter-chips .filter-chip[data-filter^="${filterPrefix}-"]`).closest('.filter-chips');

    // 移除所有active
    filterGroup.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });

    // 设置"全部"为active
    const allChip = filterGroup.querySelector(`[data-filter="${filterPrefix}-all"]`);
    if (allChip) {
        allChip.classList.add('active');
    }
}

/**
 * 应用筛选
 */
function applyFilters() {
    // 获取选中的分类
    const selectedPrimaryCategory = document.querySelector('.filter-category-section .filter-group:first-child .filter-chip.active');

    // 获取选中的地区
    const selectedProvince = document.querySelector('#provinceFilter .filter-chip.active');
    const selectedCity = document.querySelector('#cityFilter .filter-chip.active');
    const selectedCounty = document.querySelector('#countyFilter .filter-chip.active');

    // 获取选中的认证类型和标签
    const selectedCertification = document.querySelector('.filter-tags-section .filter-group:first-child .filter-chip.active');
    const selectedTag = document.querySelector('.filter-tags-section .filter-group:last-child .filter-chip.active');

    // 获取所有产品卡片
    const productCards = document.querySelectorAll('.product-card');

    // 计数器
    let visibleCount = 0;

    // 遍历所有产品卡片
    productCards.forEach(card => {
        let shouldShow = true;

        // 检查一级分类
        if (selectedPrimaryCategory && !selectedPrimaryCategory.getAttribute('data-filter').includes('-all')) {
            const primaryCategory = selectedPrimaryCategory.getAttribute('data-category');
            const cardCategory = card.getAttribute('data-primary-category');

            if (cardCategory && cardCategory !== primaryCategory) {
                shouldShow = false;
            }
        }

        // 检查省份
        if (shouldShow && selectedProvince && !selectedProvince.getAttribute('data-filter').includes('-all')) {
            const province = selectedProvince.getAttribute('data-province');
            const cardProvince = getProvinceFromAddress(card.querySelector('.product-address').textContent);

            if (cardProvince && cardProvince !== province) {
                shouldShow = false;
            }
        }

        // 检查城市
        if (shouldShow && selectedCity && !selectedCity.getAttribute('data-filter').includes('-all')) {
            const city = selectedCity.getAttribute('data-city');
            const cardCity = getCityFromAddress(card.querySelector('.product-address').textContent);

            if (cardCity && cardCity !== city) {
                shouldShow = false;
            }
        }

        // 检查县区
        if (shouldShow && selectedCounty && !selectedCounty.getAttribute('data-filter').includes('-all')) {
            const county = selectedCounty.getAttribute('data-county');
            const cardCounty = getCountyFromAddress(card.querySelector('.product-address').textContent);

            if (cardCounty && cardCounty !== county) {
                shouldShow = false;
            }
        }

        // 检查认证
        if (shouldShow && selectedCertification && !selectedCertification.getAttribute('data-filter').includes('-all')) {
            const certification = selectedCertification.textContent.trim();
            const cardCertification = card.getAttribute('data-certification');

            if (cardCertification && cardCertification !== certification) {
                shouldShow = false;
            }
        }

        // 检查标签
        if (shouldShow && selectedTag && !selectedTag.getAttribute('data-filter').includes('-all')) {
            const tag = selectedTag.getAttribute('data-filter').replace('tag-', '');
            const cardTag = card.getAttribute('data-tag');

            if (cardTag && !cardTag.includes(tag)) {
                shouldShow = false;
            }
        }

        // 显示或隐藏产品卡片
        card.style.display = shouldShow ? 'block' : 'none';

        // 更新计数
        if (shouldShow) {
            visibleCount++;
        }
    });

    // 更新结果数量和已选筛选条件
    updateResultCount(visibleCount);
    updateSelectedFilters();
}

/**
 * 更新结果数量
 */
function updateResultCount(count) {
    const resultCountElement = document.querySelector('.result-count');

    if (resultCountElement) {
        resultCountElement.textContent = `共${count}个结果`;
    }
}

/**
 * 初始化快速查看功能
 */
function initQuickView() {
    const quickViewButtons = document.querySelectorAll('.quick-view');
    const quickViewModal = document.getElementById('quickViewModal');

    if (!quickViewModal) return;

    // 快速查看按钮点击
    quickViewButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();

            // 获取产品卡片
            const productCard = this.closest('.product-card');

            // 填充快速查看弹窗内容
            populateQuickView(productCard, quickViewModal);

            // 显示弹窗
            quickViewModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // 关闭按钮点击
    const closeButton = quickViewModal.querySelector('.close-modal');
    if (closeButton) {
        closeButton.addEventListener('click', function () {
            quickViewModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // 点击模态框背景关闭
    quickViewModal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

/**
 * 填充快速查看弹窗内容
 */
function populateQuickView(productCard, modal) {
    // 提取产品信息
    const productName = productCard.querySelector('.product-name').textContent;
    const productImage = productCard.querySelector('.product-image img').src;
    const currentPrice = productCard.querySelector('.current-price').textContent;
    const originalPrice = productCard.querySelector('.original-price').textContent;
    const origin = productCard.querySelector('.product-origin').textContent.split(': ')[1];
    const category = productCard.querySelector('.product-category').textContent.split(': ')[1];
    const starsHTML = productCard.querySelector('.stars').innerHTML;
    const ratingCount = productCard.querySelector('.rating-count').textContent;

    // 填充弹窗内容
    modal.querySelector('.product-title').textContent = productName;
    modal.querySelector('.product-quick-image img').src = productImage;
    modal.querySelector('.product-quick-image img').alt = productName;
    modal.querySelector('.current-price').textContent = currentPrice;
    modal.querySelector('.original-price').textContent = originalPrice;
    modal.querySelector('.stars').innerHTML = starsHTML;
    modal.querySelector('.rating-count').textContent = ratingCount;
    modal.querySelector('.origin').textContent = origin;
    modal.querySelector('.category').textContent = category;
}

/**
 * 初始化产品对比功能
 */
function initProductCompare() {
    const compareButtons = document.querySelectorAll('.add-to-compare');
    const compareBar = document.querySelector('.compare-bar');
    const compareItems = document.querySelector('.compare-items');
    const compareBtn = document.querySelector('.compare-btn');
    const clearBtn = document.querySelector('.compare-clear');

    if (!compareBar || !compareItems) return;

    // 添加到对比按钮点击
    compareButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();

            // 获取产品卡片
            const productCard = this.closest('.product-card');
            const productId = productCard.getAttribute('data-id');

            // 检查是否已添加
            if (compareItems.querySelector(`[data-id="${productId}"]`)) {
                showToast('该产品已在对比列表中');
                return;
            }

            // 检查数量限制
            if (compareItems.children.length >= 4) {
                showToast('最多只能对比4个产品');
                return;
            }

            // 添加到对比栏
            addToCompare(productCard);

            // 显示对比栏
            compareBar.classList.add('active');
        });
    });

    // 清空对比列表
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            compareItems.innerHTML = '';
            compareBar.classList.remove('active');
        });
    }

    // 开始对比按钮
    if (compareBtn) {
        compareBtn.addEventListener('click', function () {
            if (compareItems.children.length < 2) {
                showToast('请至少添加2个产品进行对比');
                return;
            }

            // 这里可以跳转到对比页面或显示对比弹窗
            // 实现省略...
            showToast('对比功能即将上线');
        });
    }
}

/**
 * 添加产品到对比栏
 */
function addToCompare(productCard) {
    const compareItems = document.querySelector('.compare-items');

    // 提取产品信息
    const productId = productCard.getAttribute('data-id');
    const productName = productCard.querySelector('.product-name').textContent;
    const productImage = productCard.querySelector('.product-image img').src;
    const currentPrice = productCard.querySelector('.current-price').textContent;

    // 创建对比项
    const compareItem = document.createElement('div');
    compareItem.className = 'compare-item';
    compareItem.setAttribute('data-id', productId);
    compareItem.innerHTML = `
        <div class="compare-item-image">
            <img src="${productImage}" alt="${productName}">
        </div>
        <div class="compare-item-info">
            <div class="compare-item-name">${productName}</div>
            <div class="compare-item-price">${currentPrice}</div>
        </div>
        <button class="compare-item-remove" title="移除"><i class="fas fa-times"></i></button>
    `;

    // 添加到对比栏
    compareItems.appendChild(compareItem);

    // 添加移除按钮点击事件
    const removeButton = compareItem.querySelector('.compare-item-remove');
    removeButton.addEventListener('click', function () {
        compareItem.remove();

        // 如果没有对比项，隐藏对比栏
        if (compareItems.children.length === 0) {
            document.querySelector('.compare-bar').classList.remove('active');
        }
    });

    // 显示提示
    showToast('已添加到对比列表');
}

/**
 * 显示提示消息
 */
function showToast(message) {
    // 查找已有的toast容器，如果没有则创建
    let toastContainer = document.querySelector('.toast-container');

    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // 创建新的toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // 添加到容器
    toastContainer.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 自动关闭
    setTimeout(() => {
        toast.classList.remove('show');

        // 动画结束后移除元素
        setTimeout(() => {
            toast.remove();

            // 如果没有更多toast，移除容器
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, 300);
    }, 3000);
}

/**
 * 初始化地区筛选系统
 */
function initLocationFilter() {
    // 隐藏所有二级和三级分类
    hideAllCityOptions();
    hideAllCountyOptions();

    // 为省份筛选添加点击事件
    const provinceFilter = document.getElementById('provinceFilter');
    if (provinceFilter) {
        const provinceChips = provinceFilter.querySelectorAll('.filter-chip');
        provinceChips.forEach(chip => {
            chip.addEventListener('click', function () {
                // 更新选中状态
                provinceChips.forEach(c => c.classList.remove('active'));
                this.classList.add('active');

                // 获取选中的省份
                const province = this.getAttribute('data-province');

                // 根据选中的省份显示对应的城市
                if (province === 'more' || !province) {
                    hideAllCityOptions();
                    hideAllCountyOptions();
                } else {
                    showCityOptions(province);
                    hideAllCountyOptions();
                }
            });
        });
    }

    // 为城市筛选添加点击事件
    const cityFilter = document.getElementById('cityFilter');
    if (cityFilter) {
        const cityChips = cityFilter.querySelectorAll('.filter-chip');
        cityChips.forEach(chip => {
            chip.addEventListener('click', function () {
                // 只有当点击的是可见的城市选项时才处理
                if (this.offsetParent !== null || this.getAttribute('data-filter') === 'city-all') {
                    // 更新选中状态
                    cityChips.forEach(c => {
                        if (c.offsetParent !== null || c.getAttribute('data-filter') === 'city-all') {
                            c.classList.remove('active');
                        }
                    });
                    this.classList.add('active');

                    // 获取选中的城市
                    const city = this.getAttribute('data-city');

                    // 根据选中的城市显示对应的县区
                    if (!city || this.getAttribute('data-filter') === 'city-all') {
                        hideAllCountyOptions();
                    } else {
                        showCountyOptions(city);
                    }
                }
            });
        });
    }

    // 为县区筛选添加点击事件
    const countyFilter = document.getElementById('countyFilter');
    if (countyFilter) {
        const countyChips = countyFilter.querySelectorAll('.filter-chip');
        countyChips.forEach(chip => {
            chip.addEventListener('click', function () {
                // 只有当点击的是可见的县区选项时才处理
                if (this.offsetParent !== null || this.getAttribute('data-filter') === 'county-all') {
                    // 更新选中状态
                    countyChips.forEach(c => {
                        if (c.offsetParent !== null || c.getAttribute('data-filter') === 'county-all') {
                            c.classList.remove('active');
                        }
                    });
                    this.classList.add('active');

                    // 这里可以添加根据县区筛选产品的逻辑
                    // ...
                }
            });
        });
    }
}

/**
 * 隐藏所有城市选项
 */
function hideAllCityOptions() {
    const cityFilter = document.getElementById('cityFilter');
    if (!cityFilter) return;

    // 显示"全部"选项
    const allCityChip = cityFilter.querySelector('.filter-chip[data-filter="city-all"]');
    if (allCityChip) {
        allCityChip.classList.add('active');
    }

    // 隐藏所有城市组
    const cityGroups = cityFilter.querySelectorAll('.subcategory-group');
    cityGroups.forEach(group => {
        group.style.display = 'none';
    });
}

/**
 * 显示指定省份的城市选项
 */
function showCityOptions(province) {
    const cityFilter = document.getElementById('cityFilter');
    if (!cityFilter) return;

    // 隐藏所有城市组
    hideAllCityOptions();

    // 显示对应省份的城市组
    const targetCityGroup = cityFilter.querySelector(`.subcategory-group[data-parent="${province}"]`);
    if (targetCityGroup) {
        targetCityGroup.style.display = 'block';
    }

    // 重置选中状态为"全部"
    const allCityChip = cityFilter.querySelector('.filter-chip[data-filter="city-all"]');
    if (allCityChip) {
        allCityChip.classList.add('active');
    }
}

/**
 * 隐藏所有县区选项
 */
function hideAllCountyOptions() {
    const countyFilter = document.getElementById('countyFilter');
    if (!countyFilter) return;

    // 显示"全部"选项
    const allCountyChip = countyFilter.querySelector('.filter-chip[data-filter="county-all"]');
    if (allCountyChip) {
        allCountyChip.classList.add('active');
    }

    // 隐藏所有县区组
    const countyGroups = countyFilter.querySelectorAll('.subcategory-group');
    countyGroups.forEach(group => {
        group.style.display = 'none';
    });
}

/**
 * 显示指定城市的县区选项
 */
function showCountyOptions(city) {
    const countyFilter = document.getElementById('countyFilter');
    if (!countyFilter) return;

    // 隐藏所有县区组
    hideAllCountyOptions();

    // 显示对应城市的县区组
    const targetCountyGroup = countyFilter.querySelector(`.subcategory-group[data-parent="${city}"]`);
    if (targetCountyGroup) {
        targetCountyGroup.style.display = 'block';
    }

    // 重置选中状态为"全部"
    const allCountyChip = countyFilter.querySelector('.filter-chip[data-filter="county-all"]');
    if (allCountyChip) {
        allCountyChip.classList.add('active');
    }
}

/**
 * 初始化标签筛选系统
 */
function initTagFilter() {
    // 获取所有标签筛选选项
    const tagChips = document.querySelectorAll('.filter-tags-section .filter-chip');

    tagChips.forEach(chip => {
        chip.addEventListener('click', function (e) {
            // 阻止事件冒泡
            e.stopPropagation();

            // 获取当前筛选组
            const filterGroup = this.closest('.filter-chips');

            // 移除同组中其他标签的active类
            filterGroup.querySelectorAll('.filter-chip').forEach(c => {
                c.classList.remove('active');
            });

            // 给当前标签添加active类
            this.classList.add('active');

            // 应用筛选
            applyFilters();
        });
    });
}

/**
 * 更新应用筛选函数，支持新的筛选结构
 */
function applyFilters() {
    // 获取选中的分类
    const selectedPrimaryCategory = document.querySelector('.filter-category-section .filter-group:first-child .filter-chip.active');
    const selectedSecondaryCategory = document.querySelector('#secondLevelCategory .filter-chip.active');
    const selectedThirdCategory = document.querySelector('#thirdLevelCategory .filter-chip.active');

    // 获取选中的地区
    const selectedProvince = document.querySelector('#provinceFilter .filter-chip.active');
    const selectedCity = document.querySelector('#cityFilter .filter-chip.active');
    const selectedCounty = document.querySelector('#countyFilter .filter-chip.active');

    // 获取选中的认证类型和标签
    const selectedCertification = document.querySelector('.filter-tags-section .filter-group:first-child .filter-chip.active');
    const selectedTag = document.querySelector('.filter-tags-section .filter-group:last-child .filter-chip.active');

    // 获取所有产品卡片
    const productCards = document.querySelectorAll('.product-card');

    // 计数器
    let visibleCount = 0;

    // 遍历所有产品卡片
    productCards.forEach(card => {
        let shouldShow = true;

        // 检查一级分类
        if (selectedPrimaryCategory && !selectedPrimaryCategory.getAttribute('data-filter').includes('-all')) {
            const primaryCategory = selectedPrimaryCategory.getAttribute('data-category');
            const cardCategory = card.getAttribute('data-primary-category');

            if (cardCategory && cardCategory !== primaryCategory) {
                shouldShow = false;
            }
        }

        // 检查二级分类（仅当一级分类匹配且二级不是"全部"时）
        if (shouldShow && selectedSecondaryCategory && !selectedSecondaryCategory.getAttribute('data-filter').includes('-all')) {
            const secondaryCategory = selectedSecondaryCategory.textContent.trim();
            const cardSecondaryCategory = card.getAttribute('data-secondary-category');

            if (cardSecondaryCategory && cardSecondaryCategory !== secondaryCategory) {
                shouldShow = false;
            }
        }

        // 检查三级分类（仅当二级分类匹配且三级不是"全部"时）
        if (shouldShow && selectedThirdCategory && !selectedThirdCategory.getAttribute('data-filter').includes('-all')) {
            const thirdCategory = selectedThirdCategory.textContent.trim();
            const cardThirdCategory = card.getAttribute('data-third-category');

            if (cardThirdCategory && cardThirdCategory !== thirdCategory) {
                shouldShow = false;
            }
        }

        // 检查省份
        if (shouldShow && selectedProvince && !selectedProvince.getAttribute('data-filter').includes('-all')) {
            const province = selectedProvince.getAttribute('data-province');
            const cardProvince = getProvinceFromAddress(card.querySelector('.product-address').textContent);

            if (cardProvince && cardProvince !== province) {
                shouldShow = false;
            }
        }

        // 检查城市
        if (shouldShow && selectedCity && !selectedCity.getAttribute('data-filter').includes('-all')) {
            const city = selectedCity.getAttribute('data-city');
            const cardCity = getCityFromAddress(card.querySelector('.product-address').textContent);

            if (cardCity && cardCity !== city) {
                shouldShow = false;
            }
        }

        // 检查县区
        if (shouldShow && selectedCounty && !selectedCounty.getAttribute('data-filter').includes('-all')) {
            const county = selectedCounty.getAttribute('data-county');
            const cardCounty = getCountyFromAddress(card.querySelector('.product-address').textContent);

            if (cardCounty && cardCounty !== county) {
                shouldShow = false;
            }
        }

        // 检查认证
        if (shouldShow && selectedCertification && !selectedCertification.getAttribute('data-filter').includes('-all')) {
            const certification = selectedCertification.textContent.trim();
            const cardCertification = card.getAttribute('data-certification');

            if (cardCertification && cardCertification !== certification) {
                shouldShow = false;
            }
        }

        // 检查标签
        if (shouldShow && selectedTag && !selectedTag.getAttribute('data-filter').includes('-all')) {
            const tag = selectedTag.getAttribute('data-filter').replace('tag-', '');
            const cardTag = card.getAttribute('data-tag');

            if (cardTag && !cardTag.includes(tag)) {
                shouldShow = false;
            }
        }

        // 显示或隐藏产品卡片
        card.style.display = shouldShow ? 'block' : 'none';

        // 更新计数
        if (shouldShow) {
            visibleCount++;
        }
    });

    // 更新结果数量和已选筛选条件
    updateResultCount(visibleCount);
    updateSelectedFilters();
}

/**
 * 从地址中提取省份
 */
function getProvinceFromAddress(address) {
    if (!address) return null;

    // 假设地址格式为"省份-城市"或"省份省城市市"
    const parts = address.split('-');
    if (parts.length >= 2) {
        return parts[0].trim();
    }

    // 尝试匹配常见省份名称
    const provinces = [
        '北京', '天津', '河北', '山西', '内蒙古',
        '辽宁', '吉林', '黑龙江', '上海', '江苏',
        '浙江', '安徽', '福建', '江西', '山东',
        '河南', '湖北', '湖南', '广东', '广西',
        '海南', '重庆', '四川', '贵州', '云南',
        '西藏', '陕西', '甘肃', '青海', '宁夏',
        '新疆', '香港', '澳门', '台湾'
    ];

    for (const province of provinces) {
        if (address.includes(province)) {
            return province;
        }
    }

    return null;
}

/**
 * 从地址中提取城市
 */
function getCityFromAddress(address) {
    if (!address) return null;

    // 假设地址格式为"省份-城市"
    const parts = address.split('-');
    if (parts.length >= 2) {
        return parts[1].trim();
    }

    return null;
}

/**
 * 从地址中提取县区
 */
function getCountyFromAddress(address) {
    if (!address) return null;

    // 假设地址格式为"省份-城市-县区"
    const parts = address.split('-');
    if (parts.length >= 3) {
        return parts[2].trim();
    }

    return null;
}

/**
 * 更新已选筛选条件
 */
function updateSelectedFilters() {
    // 获取已选筛选条件容器
    const selectedTags = document.querySelector('.selected-tags');

    // 清空现有条件
    selectedTags.innerHTML = '';

    // 收集所有已选择的筛选条件
    const filters = [];

    // 检查一级分类
    const primaryCategory = document.querySelector('.filter-category-section .filter-group:first-child .filter-chip.active');
    if (primaryCategory && !primaryCategory.getAttribute('data-filter').includes('-all')) {
        filters.push({
            text: primaryCategory.textContent.trim(),
            type: 'primary-category'
        });
    }

    // 检查省份
    const province = document.querySelector('#provinceFilter .filter-chip.active');
    if (province && !province.getAttribute('data-filter').includes('-all')) {
        filters.push({
            text: province.textContent.trim(),
            type: 'province'
        });
    }

    // 检查城市
    const city = document.querySelector('#cityFilter .filter-chip.active');
    if (city && !city.getAttribute('data-filter').includes('-all')) {
        filters.push({
            text: city.textContent.trim(),
            type: 'city'
        });
    }

    // 检查县区
    const county = document.querySelector('#countyFilter .filter-chip.active');
    if (county && !county.getAttribute('data-filter').includes('-all')) {
        filters.push({
            text: county.textContent.trim(),
            type: 'county'
        });
    }

    // 检查认证
    const certification = document.querySelector('.filter-tags-section .filter-group:first-child .filter-chip.active');
    if (certification && !certification.getAttribute('data-filter').includes('-all')) {
        filters.push({
            text: certification.textContent.trim(),
            type: 'certification'
        });
    }

    // 检查标签
    const tag = document.querySelector('.filter-tags-section .filter-group:last-child .filter-chip.active');
    if (tag && !tag.getAttribute('data-filter').includes('-all')) {
        filters.push({
            text: tag.textContent.trim(),
            type: 'tag'
        });
    }

    // 添加已选条件到界面
    filters.forEach(filter => {
        const selectedTag = document.createElement('span');
        selectedTag.className = 'selected-tag';
        selectedTag.setAttribute('data-type', filter.type);
        selectedTag.innerHTML = `${filter.text} <i class="fas fa-times"></i>`;

        // 添加删除事件
        selectedTag.querySelector('i').addEventListener('click', function () {
            removeFilter(filter.type);

            // 更新筛选
            applyFilters();
        });

        selectedTags.appendChild(selectedTag);
    });

    // 显示或隐藏已选筛选条件区域
    const selectedFilters = document.querySelector('.selected-filters');
    if (filters.length > 0) {
        selectedFilters.style.display = 'flex';
    } else {
        selectedFilters.style.display = 'none';
    }
}

/**
 * 移除特定类型的筛选条件
 */
function removeFilter(type) {
    let selector;

    switch (type) {
        case 'primary-category':
            selector = '.filter-category-section .filter-group:first-child .filter-chip[data-filter="category-all"]';
            break;

        case 'secondary-category':
            selector = '#secondLevelCategory .filter-chip[data-filter="subcategory-all"]';
            break;

        case 'third-category':
            selector = '#thirdLevelCategory .filter-chip[data-filter="thirdcategory-all"]';
            break;

        case 'province':
            selector = '#provinceFilter .filter-chip[data-filter="province-all"]';
            break;

        case 'city':
            selector = '#cityFilter .filter-chip[data-filter="city-all"]';
            break;

        case 'county':
            selector = '#countyFilter .filter-chip[data-filter="county-all"]';
            break;

        case 'certification':
            selector = '.filter-tags-section .filter-group:first-child .filter-chip[data-filter="cert-all"]';
            break;

        case 'tag':
            selector = '.filter-tags-section .filter-group:last-child .filter-chip[data-filter="tag-all"]';
            break;
    }

    if (selector) {
        const allChip = document.querySelector(selector);
        if (allChip) {
            // 移除同组中其他标签的active类
            const filterGroup = allChip.closest('.filter-chips');
            filterGroup.querySelectorAll('.filter-chip').forEach(c => {
                c.classList.remove('active');
            });

            // 给"全部"标签添加active类
            allChip.classList.add('active');
        }
    }
}

/**
 * 获取三级分类数据
 * 注意：这是静态数据示例，实际应用中应从数据库或API获取
 */
function getThirdLevelCategories(primaryCategory, secondaryCategory) {
    console.log(`获取三级分类数据: 一级=${primaryCategory}, 二级=${secondaryCategory}`);

    // 根据一级和二级分类返回对应的三级分类
    const categoryData = {
        '水果': {
            '热带水果': ['芒果', '榴莲', '香蕉', '菠萝', '木瓜', '椰子', '火龙果', '山竹', '莲雾', '番荔枝'],
            '柑橘类': ['橙子', '柠檬', '柚子', '金橘', '蜜橘', '橘子', '青柠', '红橘', '蜜柚', '柑子'],
            '浆果类': ['草莓', '蓝莓', '葡萄', '树莓', '黑莓', '红提', '黑提', '青提', '樱桃', '猕猴桃'],
            '瓜果类': ['西瓜', '哈密瓜', '甜瓜', '香瓜', '美人瓜', '网纹瓜', '黑美人', '黄皮果', '巨峰葡萄'],
            '核果仁果类': ['苹果', '梨', '桃子', '李子', '杏', '樱桃', '枇杷', '油桃', '蟠桃', '青苹果'],
            '国产特色水果': ['杨梅', '枇杷', '柿子', '石榴', '山楂', '莲雾', '无花果', '板栗', '枣', '杨桃'],
            '时令水果': ['草莓', '西瓜', '桃子', '杨梅', '荔枝', '龙眼', '西梅', '秋葵', '冬枣', '春见']
        },
        '蔬菜': {
            '葱姜蒜类': ['大葱', '小葱', '生姜', '大蒜', '香葱', '洋葱', '韭菜', '蒜苗', '蒜黄', '青蒜'],
            '根茎菜类': ['土豆', '胡萝卜', '洋葱', '萝卜', '山药', '芋头', '莲藕', '生姜', '甜菜', '芜菁'],
            '叶菜类': ['生菜', '菠菜', '白菜', '油麦菜', '芹菜', '茼蒿', '韭菜', '莴笋', '空心菜', '苋菜'],
            '豆菜类': ['豌豆', '青豆', '毛豆', '四季豆', '刀豆', '豇豆', '蚕豆', '芸豆', '扁豆', '荷兰豆'],
            '茄果菜类': ['西红柿', '茄子', '辣椒', '黄瓜', '南瓜', '苦瓜', '冬瓜', '丝瓜', '菜瓜', '西葫芦'],
            '食用菌': ['香菇', '平菇', '金针菇', '木耳', '猴头菇', '杏鲍菇', '鸡腿菇', '茶树菇', '草菇', '松茸'],
            '瓜菜类': ['冬瓜', '南瓜', '丝瓜', '苦瓜', '西葫芦', '黄瓜', '佛手瓜', '蛇瓜', '瓠瓜', '笋瓜'],
            '芽苗类': ['豆芽', '绿豆芽', '黄豆芽', '荞麦芽', '香椿芽', '蒜苗', '韭菜苗', '萝卜苗', '芦笋', '荷兰芽'],
            '野菜特菜': ['马齿苋', '蕨菜', '龙须菜', '荠菜', '苦菊', '鱼腥草', '灰灰菜', '蒲公英', '车前草', '枸杞头'],
            '水生菜类': ['莲藕', '茭白', '芋头', '慈姑', '荸荠', '菱角', '茨实', '水芹', '水葱', '水芥'],
            '甘蓝类': ['卷心菜', '西兰花', '花椰菜', '紫甘蓝', '羽衣甘蓝', '抱子甘蓝', '球茎甘蓝', '芥蓝', '青花菜', '白花菜'],
            '菜用花类': ['菜花', '金针菜', '茼蒿', '芥蓝', '西兰花', '花椰菜', '萝卜花', '芥菜花', '香椿花', '韭菜花']
        },
        '粮油米面': {
            '食用油': ['菜籽油', '花生油', '橄榄油', '调和油', '葵花籽油', '玉米油', '芝麻油', '茶籽油', '亚麻籽油', '椰子油'],
            '调味品': ['酱油', '食醋', '料酒', '蚝油', '豆瓣酱', '番茄酱', '花椒油', '辣椒酱', '沙拉酱', '海鲜酱'],
            '香辛料': ['花椒', '八角', '桂皮', '辣椒粉', '孜然', '胡椒粉', '五香粉', '咖喱粉', '茴香', '丁香'],
            '谷物粉淀粉': ['面粉', '玉米粉', '糯米粉', '淀粉', '红薯粉', '土豆粉', '燕麦粉', '荞麦粉', '全麦面粉', '小麦胚芽粉'],
            '豆制品': ['豆腐', '豆干', '豆皮', '豆浆', '腐竹', '豆腐干', '豆腐丝', '豆腐乳', '内脂豆腐', '豆腐花'],
            '面食米食': ['挂面', '方便面', '米粉', '粉丝', '年糕', '意大利面', '河粉', '刀削面', '拉面', '冷面'],
            '油料作物': ['花生', '芝麻', '菜籽', '葵花籽', '油菜籽', '橄榄', '亚麻籽', '茶籽', '棉籽', '棕榈仁'],
            '豆类作物': ['黄豆', '绿豆', '红豆', '豇豆', '蚕豆', '黑豆', '芸豆', '豌豆', '扁豆', '鹰嘴豆'],
            '谷类作物': ['大米', '小麦', '玉米', '高粱', '小米', '荞麦', '燕麦', '薏米', '糙米', '紫米'],
            '加工副产品': ['麸皮', '谷糠', '油渣', '豆渣', '米糠', '米胚芽', '麦芽', '啤酒糟', '玉米芯', '豆饼']
        },
        '禽畜肉蛋': {
            '畜肉类': ['猪肉', '牛肉', '羊肉', '兔肉', '驴肉', '马肉', '鹿肉', '野猪肉', '肉排', '肉脯'],
            '禽肉类': ['鸡肉', '鸭肉', '鹅肉', '鸽肉', '鹌鹑肉', '火鸡肉', '乌鸡肉', '鸵鸟肉', '鸡胸肉', '鸡翅'],
            '蛋类': ['鸡蛋', '鸭蛋', '鹅蛋', '鹌鹑蛋', '咸蛋', '皮蛋', '松花蛋', '土鸡蛋', '鸵鸟蛋', '鸽子蛋'],
            '乳制品': ['牛奶', '酸奶', '奶粉', '奶酪', '黄油', '乳酸菌', '牦牛奶', '羊奶', '奶油', '炼乳']
        },
        '水产': {
            '海水鱼': ['带鱼', '黄花鱼', '鲳鱼', '鲷鱼', '金枪鱼', '鲅鱼', '鲨鱼', '比目鱼', '海鲈鱼', '石斑鱼'],
            '淡水鱼': ['草鱼', '鲤鱼', '鲫鱼', '鲢鱼', '鳙鱼', '黑鱼', '黄鳝', '泥鳅', '鳗鱼', '鲟鱼'],
            '虾蟹贝类': ['基围虾', '龙虾', '螃蟹', '河蟹', '扇贝', '牡蛎', '蛤蜊', '鲍鱼', '海参', '海蜇'],
            '藻类': ['紫菜', '海带', '裙带菜', '发菜', '石花菜', '江白菜', '蒲菜', '龙须菜']
        },
        '农副加工': {
            '干菜类': ['黑木耳', '香菇', '银耳', '竹笋', '百合', '芋头', '茨菇', '腐竹', '萝卜干', '冬菜'],
            '腌制品': ['咸菜', '泡菜', '榨菜', '酸菜', '梅菜', '萝卜干', '酸豆角', '咸鸭蛋', '咸金枪鱼', '熏肉'],
            '果干类': ['葡萄干', '杏干', '枣干', '莲子', '桂圆肉', '核桃仁', '山楂干', '苹果干', '芒果干', '猕猴桃干'],
            '蜜饯类': ['话梅', '杨梅干', '蜜枣', '果脯', '橄榄', '山楂', '金桔', '柠檬片', '青梅', '果丹皮']
        },
        '中药材': {
            '北药': ['人参', '黄芪', '枸杞', '党参', '西洋参', '白术', '当归', '黄芩', '柴胡', '连翘'],
            '南药': ['陈皮', '茯苓', '白芍', '甘草', '桂枝', '半夏', '厚朴', '三七', '丹参', '远志'],
            '植物类': ['金银花', '红花', '玫瑰花', '薄荷', '荷叶', '芦荟', '决明子', '板蓝根', '大青叶', '菊花'],
            '动物类': ['鹿茸', '蛤蚧', '蝎子', '蜈蚣', '水蛭', '全蝎', '海马', '蟾蜍', '牛黄', '麝香']
        }
    };

    // 如果找到对应的分类数据，返回三级分类列表
    if (categoryData[primaryCategory] && categoryData[primaryCategory][secondaryCategory]) {
        const thirdCategories = categoryData[primaryCategory][secondaryCategory];
        console.log(`成功获取到 ${thirdCategories.length} 个三级分类: ${thirdCategories.join(', ')}`);
        return thirdCategories;
    }

    // 否则返回空数组
    console.warn(`未找到对应的三级分类数据: ${primaryCategory} -> ${secondaryCategory}`);
    return [];
}

/**
 * 更新分类路径
 */
function updateCategoryPath(primary, secondary, tertiary) {
    console.log(`更新分类路径: 一级=${primary || '全部'}, 二级=${secondary || '无'}, 三级=${tertiary || '无'}`);

    // 更新一级分类
    const primaryEl = document.getElementById('primaryCategoryPath');
    if (primaryEl) {
        primaryEl.textContent = primary || '全部';
    }

    // 更新二级分类
    const secondaryEl = document.getElementById('secondaryCategoryPath');
    const firstSeparator = document.getElementById('firstSeparator');

    if (secondaryEl && firstSeparator) {
        if (secondary) {
            secondaryEl.textContent = secondary;
            secondaryEl.style.display = 'inline';
            firstSeparator.style.display = 'inline';
        } else {
            secondaryEl.style.display = 'none';
            firstSeparator.style.display = 'none';
        }
    }

    // 更新三级分类
    const tertiaryEl = document.getElementById('thirdCategoryPath');
    const secondSeparator = document.getElementById('secondSeparator');

    if (tertiaryEl && secondSeparator) {
        if (tertiary) {
            tertiaryEl.textContent = tertiary;
            tertiaryEl.style.display = 'inline';
            secondSeparator.style.display = 'inline';
        } else {
            tertiaryEl.style.display = 'none';
            secondSeparator.style.display = 'none';
        }
    }
}

// 页面加载完成后初始化分类系统
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM加载完成，初始化分类系统');
    initBasicCategorySystem();
});

/**
 * 初始化基础分类系统
 */
function initBasicCategorySystem() {
    // 获取元素
    const firstLevelChips = document.querySelectorAll('.filter-category-section .filter-group:first-child .filter-chip');
    const secondLevelCategory = document.getElementById('secondLevelCategory');

    // 确保二级分类默认隐藏
    if (secondLevelCategory) {
        secondLevelCategory.style.display = 'none';
    } else {
        console.error('找不到二级分类容器');
        return;
    }

    // 为一级分类添加点击事件
    firstLevelChips.forEach(chip => {
        chip.addEventListener('click', function () {
            console.log('点击一级分类:', this.textContent);

            // 更新active状态
            firstLevelChips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // 判断是否是"全部"
            if (this.getAttribute('data-filter') === 'category-all') {
                console.log('点击了全部，隐藏二级分类');
                secondLevelCategory.style.display = 'none';
                updateSimpleCategoryPath(this.textContent);
            } else {
                console.log('点击了具体分类:', this.textContent);
                // 显示二级分类
                secondLevelCategory.style.display = 'block';

                // 获取当前分类
                const category = this.getAttribute('data-category');
                console.log('分类数据:', category);

                // 隐藏所有二级分类组
                const subcategoryGroups = secondLevelCategory.querySelectorAll('.subcategory-group');
                subcategoryGroups.forEach(group => {
                    group.style.display = 'none';
                });

                // 显示对应的二级分类组
                const targetGroup = secondLevelCategory.querySelector(`.subcategory-group[data-parent="${category}"]`);
                if (targetGroup) {
                    targetGroup.style.display = 'block';
                }

                // 重置二级分类选中状态
                const secondaryChips = secondLevelCategory.querySelectorAll('.filter-chip');
                secondaryChips.forEach(c => c.classList.remove('active'));
                const allSecondaryChip = secondLevelCategory.querySelector('.filter-chip[data-filter="subcategory-all"]');
                if (allSecondaryChip) {
                    allSecondaryChip.classList.add('active');
                }

                // 更新分类路径
                updateSimpleCategoryPath(this.textContent);
            }
        });
    });

    // 为二级分类添加点击事件
    const secondaryChips = secondLevelCategory.querySelectorAll('.filter-chip');
    secondaryChips.forEach(chip => {
        chip.addEventListener('click', function () {
            console.log('点击二级分类:', this.textContent);

            // 更新active状态
            secondaryChips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // 获取当前选中的一级分类
            const activePrimary = document.querySelector('.filter-category-section .filter-group:first-child .filter-chip.active');
            const primaryText = activePrimary ? activePrimary.textContent : '全部';
            const secondaryText = this.getAttribute('data-filter') === 'subcategory-all' ? null : this.textContent;

            // 更新分类路径
            updateSimpleCategoryPath(primaryText, secondaryText);
        });
    });
}

/**
 * 简单更新分类路径显示
 */
function updateSimpleCategoryPath(primary, secondary = null) {
    console.log(`更新路径: ${primary} > ${secondary || ''}`);

    // 获取元素
    const primaryEl = document.getElementById('primaryCategoryPath');
    const secondaryEl = document.getElementById('secondaryCategoryPath');
    const separator = document.getElementById('firstSeparator');

    if (!primaryEl || !secondaryEl || !separator) {
        console.error('找不到分类路径元素');
        return;
    }

    // 更新一级分类
    primaryEl.textContent = primary;

    // 更新二级分类
    if (secondary) {
        secondaryEl.textContent = secondary;
        secondaryEl.style.display = 'inline';
        separator.style.display = 'inline';
    } else {
        secondaryEl.style.display = 'none';
        separator.style.display = 'none';
    }
}

// 页面加载完成后直接显示所有分类
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM加载完成，显示所有分类');
    showAllCategories();
});

/**
 * 显示所有分类
 */
function showAllCategories() {
    // 获取元素
    const firstLevelChips = document.querySelectorAll('.filter-category-section .filter-group:first-child .filter-chip');
    const secondLevelCategory = document.getElementById('secondLevelCategory');

    if (!secondLevelCategory) {
        console.error('找不到二级分类容器');
        return;
    }

    // 确保二级分类直接显示
    secondLevelCategory.style.display = 'block';

    // 确保所有二级分类组都显示
    const subcategoryGroups = secondLevelCategory.querySelectorAll('.subcategory-group');
    subcategoryGroups.forEach(group => {
        group.style.display = 'block';
    });

    // 为一级分类添加点击事件，仅处理active状态，不隐藏二级分类
    firstLevelChips.forEach(chip => {
        chip.addEventListener('click', function () {
            // 更新active状态
            firstLevelChips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // 更新分类路径
            updateSimpleCategoryPath(this.textContent);
        });
    });

    // 为二级分类添加点击事件
    const secondaryChips = secondLevelCategory.querySelectorAll('.filter-chip');
    secondaryChips.forEach(chip => {
        chip.addEventListener('click', function () {
            // 更新active状态
            secondaryChips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // 获取当前选中的一级分类
            const activePrimary = document.querySelector('.filter-category-section .filter-group:first-child .filter-chip.active');
            const primaryText = activePrimary ? activePrimary.textContent : '全部';
            const secondaryText = this.getAttribute('data-filter') === 'subcategory-all' ? null : this.textContent;

            // 更新分类路径
            updateSimpleCategoryPath(primaryText, secondaryText);
        });
    });
}

/**
 * 简单更新分类路径显示
 */
function updateSimpleCategoryPath(primary, secondary = null) {
    console.log(`更新路径: ${primary} > ${secondary || ''}`);

    // 获取元素
    const primaryEl = document.getElementById('primaryCategoryPath');
    const secondaryEl = document.getElementById('secondaryCategoryPath');
    const separator = document.getElementById('firstSeparator');

    if (!primaryEl || !secondaryEl || !separator) {
        console.error('找不到分类路径元素');
        return;
    }

    // 更新一级分类
    primaryEl.textContent = primary;

    // 更新二级分类
    if (secondary) {
        secondaryEl.textContent = secondary;
        secondaryEl.style.display = 'inline';
        separator.style.display = 'inline';
    } else {
        secondaryEl.style.display = 'none';
        separator.style.display = 'none';
    }
}

// 页面加载完成后初始化分类系统
document.addEventListener('DOMContentLoaded', function () {
    console.log('初始化京东风格分类系统');
    initJDStyleCategories();
});

/**
 * 初始化京东风格的分类系统
 */
function initJDStyleCategories() {
    // 获取主分类和子分类容器
    const mainCategoryItems = document.querySelectorAll('.main-category-item');
    const subCategoryGroups = document.querySelectorAll('.sub-category-group');
    const subCategories = document.querySelector('.sub-categories');

    if (!mainCategoryItems.length || !subCategoryGroups.length) {
        console.error('找不到分类元素');
        return;
    }

    // 默认显示第一个分类的子分类（全部分类）
    if (subCategories) {
        // 隐藏所有子分类组
        subCategoryGroups.forEach(group => {
            group.style.display = 'none';
        });
    }

    // 为主分类添加点击事件
    mainCategoryItems.forEach(item => {
        item.addEventListener('click', function () {
            // 更新选中状态
            mainCategoryItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // 显示对应的子分类
            const category = this.getAttribute('data-category');

            // 隐藏所有子分类组
            subCategoryGroups.forEach(group => {
                group.style.display = 'none';
            });

            // 显示对应的子分类组
            if (category !== 'all') {
                const targetGroup = document.querySelector(`.sub-category-group[data-parent="${category}"]`);
                if (targetGroup) {
                    targetGroup.style.display = 'block';
                }
            }

            // 更新分类路径
            updateCategoryPath(this.textContent);
        });
    });

    // 为子分类链接添加点击事件
    const subCategoryLinks = document.querySelectorAll('.sub-category-link');
    subCategoryLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // 阻止默认跳转

            // 获取当前分类路径
            const activePrimary = document.querySelector('.main-category-item.active');
            const primaryText = activePrimary ? activePrimary.textContent : '全部分类';
            const secondaryText = this.closest('.sub-category-row').querySelector('.sub-category-title').textContent;
            const tertiaryText = this.textContent;

            // 更新分类路径
            updateCategoryPath(primaryText, secondaryText, tertiaryText);

            // 可以在这里添加筛选产品的逻辑
            console.log(`选中: ${primaryText} > ${secondaryText} > ${tertiaryText}`);

            // 高亮显示当前选中的链接
            subCategoryLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 初始时触发"全部分类"点击，以确保正确的初始状态
    const allCategory = document.querySelector('.main-category-item[data-category="all"]');
    if (allCategory) {
        allCategory.click();
    }
}

/**
 * 初始化轮播图功能
 */
function initCarousel() {
    const carousel = document.querySelector('.category-carousel');
    if (!carousel) return;

    const slidesContainer = carousel.querySelector('.carousel-slides');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = carousel.querySelectorAll('.indicator');
    const prevBtn = carousel.querySelector('.prev-btn');
    const nextBtn = carousel.querySelector('.next-btn');

    let currentSlide = 0;
    let autoPlayInterval;

    // 初始化指示器
    indicators[currentSlide].classList.add('active');

    // 更新轮播图显示
    function updateCarousel() {
        slidesContainer.style.transform = `translateX(-${currentSlide * 25}%)`;
        // 更新指示器状态
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });
    }

    // 下一张幻灯片
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateCarousel();
        resetAutoPlay();
    }

    // 上一张幻灯片
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateCarousel();
        resetAutoPlay();
    }

    // 绑定按钮事件
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }

    // 绑定指示器事件
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
            resetAutoPlay();
        });
    });

    // 自动播放
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000); // 每5秒切换一次
    }

    // 重置自动播放
    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }

    // 鼠标悬停时暂停自动播放
    carousel.addEventListener('mouseenter', () => {
        clearInterval(autoPlayInterval);
    });

    // 鼠标离开时恢复自动播放
    carousel.addEventListener('mouseleave', () => {
        startAutoPlay();
    });

    // 开始自动播放
    startAutoPlay();
}

// 修改 showAllCategories 函数，确保轮播图显示
function showAllCategories() {
    hideAllSubcategoryGroups();
    const allCategoriesCarousel = document.querySelector('.category-carousel[data-parent="all"]');
    if (allCategoriesCarousel) {
        allCategoriesCarousel.style.display = 'block';
    }
    updateCategoryPath('全部分类');
}

// 在文档加载完成后初始化轮播图
document.addEventListener('DOMContentLoaded', function () {
    initCarousel();

    // 确保在选择"全部分类"时显示轮播图
    const allCategoriesLink = document.querySelector('a[data-category="all"]');
    if (allCategoriesLink) {
        allCategoriesLink.addEventListener('click', function (e) {
            e.preventDefault();
            showAllCategories();
        });
    }
});

function initPagination() {
    const pagination = document.querySelector('.pagination');
    const pageJumpInput = document.querySelector('.page-jump-input');
    const pageJumpBtn = document.querySelector('.page-jump-btn');
    let currentPage = 1;
    const totalPages = parseInt(pagination.dataset.totalPages) || 10;

    function updatePaginationState() {
        const prevBtn = pagination.querySelector('.page-prev');
        const nextBtn = pagination.querySelector('.page-next');
        const pageNumbers = pagination.querySelectorAll('.page-number');

        // Update prev/next buttons
        prevBtn.classList.toggle('disabled', currentPage === 1);
        nextBtn.classList.toggle('disabled', currentPage === totalPages);

        // Update active state of page numbers
        pageNumbers.forEach(num => {
            const pageNum = parseInt(num.textContent);
            num.classList.toggle('active', pageNum === currentPage);
        });
    }

    function handleJump() {
        const targetPage = parseInt(pageJumpInput.value);
        if (targetPage && targetPage >= 1 && targetPage <= totalPages) {
            currentPage = targetPage;
            updatePaginationState();
            updatePageContent(currentPage);
            pageJumpInput.value = '';
        } else {
            showToast('请输入有效的页码');
        }
    }

    // Event Listeners
    pagination.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (!target) return;

        e.preventDefault();

        if (target.classList.contains('page-prev') && currentPage > 1) {
            currentPage--;
        } else if (target.classList.contains('page-next') && currentPage < totalPages) {
            currentPage++;
        } else if (target.classList.contains('page-number')) {
            currentPage = parseInt(target.textContent);
        }

        updatePaginationState();
        updatePageContent(currentPage);
    });

    pageJumpInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleJump();
        }
    });

    pageJumpBtn.addEventListener('click', handleJump);

    // Initialize pagination state
    updatePaginationState();
}

// 显示提示信息
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 3秒后移除
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 更新页面内容
function updatePageContent(page) {
    console.log(`加载第 ${page} 页内容`);
    // TODO: 实现具体的内容更新逻辑
}

// 页面加载完成后初始化分页
document.addEventListener('DOMContentLoaded', () => {
    initPagination();
});

// 初始化产品卡片中的按钮点击事件，阻止点击按钮时触发导航
function initProductCardButtons() {
    // 为收藏按钮添加点击事件
    document.querySelectorAll('.add-to-favorite').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            // 收藏逻辑...
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('.product-name').textContent;
            alert(`已将 ${productName} 添加到收藏`);
        });
    });

    // 为对比按钮添加点击事件
    document.querySelectorAll('.add-to-compare').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            // 对比逻辑...
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('.product-name').textContent;
            alert(`已将 ${productName} 添加到对比`);
        });
    });
}

// 在文档加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    // 其它初始化代码...

    // 初始化产品卡片按钮
    initProductCardButtons();
}); 