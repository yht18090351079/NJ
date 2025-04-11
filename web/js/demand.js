// 需求大厅页面脚本
document.addEventListener('DOMContentLoaded', function () {
    // 初始化筛选功能
    initFilterSystem();

    // 初始化省份城市联动
    initProvinceAndCityFilter();

    // 初始化分页功能
    initPagination();

    // 初始化角色切换功能
    initRoleSwitch();

    // 初始化返回顶部功能
    initBackToTop();

    // 初始化分类系统
    initCategorySystem();

    // 初始化轮播图
    initCarousel();

    // 初始化价格区间筛选功能
    initPriceRangeFilter();

    // 初始化价格筛选功能
    initPriceFilter();

    // 初始化需求列表筛选函数
    updateDemandList();
    updateSelectedFilters();

    // 初始化地区筛选功能
    initLocationFilter();
});

// 初始化筛选系统
function initFilterSystem() {
    const filterChips = document.querySelectorAll('.filter-chip');
    const selectedFilters = document.getElementById('selectedFilters');
    const resultCount = document.getElementById('resultCount');

    // 点击筛选选项
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // 获取当前筛选组
            const filterGroup = chip.closest('.filter-group');
            if (!filterGroup) return;

            // 移除同组其他筛选项的active类
            const groupChips = filterGroup.querySelectorAll('.filter-chip');
            groupChips.forEach(groupChip => groupChip.classList.remove('active'));

            // 添加active类到当前点击项
            chip.classList.add('active');

            // 更新已选筛选条件显示
            updateSelectedFilters();

            // 触发筛选结果更新
            updateFilterResults();
        });
    });

    // 更新已选择筛选条件
    function updateSelectedFilters() {
        const selectedFiltersContainer = document.getElementById('selectedFilters');
        const activeFilters = document.querySelectorAll('.filter-chip.active');
        let selectedFiltersHTML = '';

        activeFilters.forEach(filter => {
            if (!filter.dataset.filter.endsWith('-all')) {
                const filterText = filter.textContent;
                selectedFiltersHTML += `
                    <span class="selected-filter">
                        ${filterText}
                        <i class="fas fa-times" data-filter="${filter.dataset.filter}"></i>
                    </span>
                `;
            }
        });

        selectedFiltersContainer.innerHTML = selectedFiltersHTML;

        // 添加删除已选筛选条件的事件
        const removeButtons = document.querySelectorAll('.selected-filter i');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filterToRemove = button.dataset.filter;
                const originalChip = document.querySelector(`.filter-chip[data-filter="${filterToRemove}"]`);
                if (originalChip) {
                    originalChip.classList.remove('active');
                    // 激活对应的"全部"选项
                    const filterGroup = originalChip.closest('.filter-group');
                    if (filterGroup) {
                        const allChip = filterGroup.querySelector('.filter-chip[data-filter$="-all"]');
                        if (allChip) {
                            allChip.classList.add('active');
                        }
                    }
                }
                button.parentElement.remove();
                updateFilterResults();
            });
        });
    }

    // 应用筛选条件过滤需求列表
    function applyFilters() {
        const demandItems = document.querySelectorAll('.demand-item');
        let visibleCount = 0;

        // 获取当前激活的筛选条件
        const activeCategory = document.querySelector('#categoryFilter .filter-chip.active').dataset.filter;
        const activeProvince = document.querySelector('#provinceFilter .filter-chip.active').dataset.filter;
        const activeCity = document.querySelector('#cityFilter .filter-chip.active').dataset.filter;
        const activePrice = document.querySelector('#priceFilter .filter-chip.active').dataset.filter;

        demandItems.forEach(item => {
            const itemCategory = 'category-' + item.dataset.category;
            const itemArea = 'province-' + item.dataset.area?.split('-')[0];
            const itemCity = 'city-' + item.dataset.area;

            // 检查是否符合筛选条件
            const matchCategory = activeCategory === 'category-all' || activeCategory === itemCategory;
            const matchProvince = activeProvince === 'province-all' || activeProvince === itemArea;
            const matchCity = activeCity === 'city-all' || activeCity === itemCity;

            // 价格范围筛选逻辑
            let matchPrice = true;
            if (activePrice !== 'price-all') {
                const itemPrice = item.dataset.price;

                if (activePrice === 'price-0-5') {
                    // 检查价格是否在0-5元/斤范围内
                    const priceValue = parseFloat(itemPrice);
                    matchPrice = !isNaN(priceValue) && priceValue <= 5;
                } else if (activePrice === 'price-5-10') {
                    // 检查价格是否在5-10元/斤范围内
                    const priceValue = parseFloat(itemPrice);
                    matchPrice = !isNaN(priceValue) && priceValue > 5 && priceValue <= 10;
                } else if (activePrice === 'price-10-20') {
                    // 检查价格是否在10-20元/斤范围内
                    const priceValue = parseFloat(itemPrice);
                    matchPrice = !isNaN(priceValue) && priceValue > 10 && priceValue <= 20;
                } else if (activePrice === 'price-20+') {
                    // 检查价格是否大于20元/斤
                    const priceValue = parseFloat(itemPrice);
                    matchPrice = !isNaN(priceValue) && priceValue > 20;
                }
            }

            // 同时满足所有条件才显示
            if (matchCategory && matchProvince && matchCity && matchPrice) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // 更新结果数量
        resultCount.textContent = visibleCount;

        // 如果没有结果，显示空状态
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
        }
    }

    // 初始化时应用一次筛选
    updateSelectedFilters();
    applyFilters();
}

// 省市区三级联动
function initProvinceAndCityFilter() {
    const provinceFilter = document.getElementById('provinceFilter');
    const cityFilter = document.getElementById('cityFilter');
    const districtFilter = document.getElementById('districtFilter');

    const provinceChips = provinceFilter.querySelectorAll('.filter-chip');
    const cityChips = cityFilter.querySelectorAll('.filter-chip');
    const districtChips = districtFilter.querySelectorAll('.filter-chip');

    // 初始化时隐藏所有城市和区县选项，只显示"全部"
    cityChips.forEach(chip => {
        if (!chip.dataset.filter.includes('city-all')) {
            chip.style.display = 'none';
        }
    });

    districtChips.forEach(chip => {
        if (!chip.dataset.filter.includes('district-all')) {
            chip.style.display = 'none';
        }
    });

    // 省份点击事件
    provinceChips.forEach(chip => {
        chip.addEventListener('click', function () {
            const selectedProvince = this.getAttribute('data-province');
            console.log('选择省份:', selectedProvince);

            // 重置城市和区县选择
            resetCityAndDistrict();

            // 如果点击的是"全部"
            if (this.dataset.filter === 'province-all') {
                hideAllCitiesAndDistricts();
            } else {
                // 显示对应省份的城市，隐藏其他城市
                showCitiesByProvince(selectedProvince);
            }
        });
    });

    // 城市点击事件
    cityChips.forEach(chip => {
        chip.addEventListener('click', function () {
            const selectedCity = this.getAttribute('data-city');
            console.log('选择城市:', selectedCity);

            // 重置区县选择
            resetDistrict();

            // 如果点击的是"全部"
            if (this.dataset.filter === 'city-all') {
                hideAllDistricts();
            } else {
                // 显示对应城市的区县，隐藏其他区县
                showDistrictsByCity(selectedCity);
            }
        });
    });

    // 区县点击事件
    districtChips.forEach(chip => {
        chip.addEventListener('click', function () {
            console.log('选择区县:', this.getAttribute('data-district'));
            updateSelectedFilters();
            updateFilterResults();
        });
    });

    // 重置城市和区县选择
    function resetCityAndDistrict() {
        // 重置城市选择
        const cityAll = cityFilter.querySelector('.filter-chip[data-filter="city-all"]');
        if (cityAll) {
            cityChips.forEach(chip => chip.classList.remove('active'));
            cityAll.classList.add('active');
        }

        // 重置区县选择
        resetDistrict();
    }

    // 重置区县选择
    function resetDistrict() {
        const districtAll = districtFilter.querySelector('.filter-chip[data-filter="district-all"]');
        if (districtAll) {
            districtChips.forEach(chip => chip.classList.remove('active'));
            districtAll.classList.add('active');
        }
    }

    // 隐藏所有城市和区县
    function hideAllCitiesAndDistricts() {
        cityChips.forEach(chip => {
            if (chip.dataset.filter === 'city-all') {
                chip.style.display = '';
                chip.classList.add('active');
            } else {
                chip.style.display = 'none';
                chip.classList.remove('active');
            }
        });

        hideAllDistricts();
    }

    // 隐藏所有区县
    function hideAllDistricts() {
        districtChips.forEach(chip => {
            if (chip.dataset.filter === 'district-all') {
                chip.style.display = '';
                chip.classList.add('active');
            } else {
                chip.style.display = 'none';
                chip.classList.remove('active');
            }
        });
    }

    // 显示指定省份的城市
    function showCitiesByProvince(province) {
        cityChips.forEach(chip => {
            if (chip.dataset.filter === 'city-all') {
                chip.style.display = '';
                chip.classList.add('active');
            } else if (chip.dataset.parent === province) {
                chip.style.display = '';
                chip.classList.remove('active');
            } else {
                chip.style.display = 'none';
                chip.classList.remove('active');
            }
        });

        hideAllDistricts();
    }

    // 显示指定城市的区县
    function showDistrictsByCity(city) {
        districtChips.forEach(chip => {
            if (chip.dataset.filter === 'district-all') {
                chip.style.display = '';
                chip.classList.add('active');
            } else if (chip.dataset.parent === city) {
                chip.style.display = '';
                chip.classList.remove('active');
            } else {
                chip.style.display = 'none';
                chip.classList.remove('active');
            }
        });
    }
}

// 初始化分页功能
function initPagination() {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    const totalPages = parseInt(pagination.dataset.totalPages) || 1;
    const pageNumbers = pagination.querySelectorAll('.page-number');
    const prevBtn = pagination.querySelector('.page-prev');
    const nextBtn = pagination.querySelector('.page-next');
    const jumpInput = pagination.querySelector('.page-jump input');
    const jumpBtn = pagination.querySelector('.btn-jump');

    let currentPage = 1;

    // 更新分页状态
    function updatePaginationState() {
        // 更新页码按钮状态
        pageNumbers.forEach(num => {
            const page = parseInt(num.dataset.page);
            num.classList.toggle('active', page === currentPage);
        });

        // 禁用/启用上一页、下一页按钮
        prevBtn.classList.toggle('disabled', currentPage === 1);
        nextBtn.classList.toggle('disabled', currentPage === totalPages);

        // 更新跳转输入框的值
        if (jumpInput) {
            jumpInput.value = '';
            jumpInput.placeholder = `${currentPage}/${totalPages}`;
        }

        // 加载对应页的内容
        updatePageContent(currentPage);
    }

    // 处理页码点击
    pageNumbers.forEach(num => {
        num.addEventListener('click', function () {
            currentPage = parseInt(this.dataset.page);
            updatePaginationState();
        });
    });

    // 上一页按钮
    if (prevBtn) {
        prevBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                updatePaginationState();
            }
        });
    }

    // 下一页按钮
    if (nextBtn) {
        nextBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                updatePaginationState();
            }
        });
    }

    // 跳转按钮
    if (jumpBtn && jumpInput) {
        jumpBtn.addEventListener('click', function () {
            const pageNum = parseInt(jumpInput.value);
            if (pageNum && pageNum >= 1 && pageNum <= totalPages) {
                currentPage = pageNum;
                updatePaginationState();
            } else {
                // 提示输入有效页码
                showToast('请输入有效页码');
            }
        });

        // 回车键跳转
        jumpInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                const pageNum = parseInt(this.value);
                if (pageNum && pageNum >= 1 && pageNum <= totalPages) {
                    currentPage = pageNum;
                    updatePaginationState();
                } else {
                    // 提示输入有效页码
                    showToast('请输入有效页码');
                }
            }
        });
    }

    // 初始化分页状态
    updatePaginationState();
}

// 更新页面内容
function updatePageContent(page) {
    console.log(`加载第 ${page} 页的内容`);
    // 这里可以添加AJAX请求加载对应页码的内容
    // 或者显示/隐藏当前页的内容
}

// 初始化角色切换功能
function initRoleSwitch() {
    console.log('初始化角色切换功能');

    // 直接通过ID选择元素，避免选择器冲突
    const roleSwitch = document.querySelector('.role-switch');
    const currentRoleText = document.getElementById('currentRole');
    const roleModal = document.getElementById('roleModal');
    const roleOptions = document.querySelectorAll('#roleModal .role-option');
    const roleConfirmBtn = document.getElementById('roleModalConfirmBtn');
    const roleCloseBtn = document.getElementById('roleModalCloseBtn');

    console.log('角色切换按钮:', roleSwitch ? '已找到' : '未找到');
    console.log('当前角色文本:', currentRoleText ? '已找到' : '未找到');
    console.log('角色模态框:', roleModal ? '已找到' : '未找到');
    console.log('关闭按钮:', roleCloseBtn ? '已找到' : '未找到');
    console.log('确认按钮:', roleConfirmBtn ? '已找到' : '未找到');
    console.log('角色选项数量:', roleOptions.length);

    // 从localStorage获取当前角色，默认为采购商
    let currentRole = localStorage.getItem('userRole') || 'buyer';
    console.log('当前角色:', currentRole);

    // 显示模态框函数
    function showModal() {
        console.log('显示角色模态框');
        if (roleModal) {
            // 直接设置样式，避免依赖CSS类
            roleModal.style.display = 'flex';
            roleModal.classList.add('active');

            // 根据当前角色设置选中状态
            roleOptions.forEach(option => {
                const role = option.getAttribute('data-role');
                option.classList.toggle('active', role === currentRole);
                console.log(`角色选项 ${role}:`, role === currentRole ? '已选中' : '未选中');
            });
        }
    }

    // 隐藏模态框函数
    function hideModal() {
        console.log('隐藏角色模态框');
        if (roleModal) {
            roleModal.style.display = 'none';
            roleModal.classList.remove('active');
        }
    }

    // 更新UI显示
    function updateRoleUI(role) {
        console.log('更新角色UI:', role);
        if (currentRoleText) {
            currentRoleText.textContent = role === 'supplier' ? '供应商' : '采购商';
            console.log('角色文本已更新为:', currentRoleText.textContent);
        }

        // 如果角色变化且当前在特定页面，则重定向
        const currentPage = window.location.pathname.split('/').pop().split('.')[0];
        console.log('当前页面:', currentPage);

        if (currentPage === 'supply' && role === 'supplier') {
            console.log('重定向到demand.html');
            window.location.href = 'demand.html';
        } else if (currentPage === 'demand' && role === 'buyer') {
            console.log('重定向到supply.html');
            window.location.href = 'supply.html';
        }
    }

    // 初始化UI
    updateRoleUI(currentRole);

    // 角色切换按钮点击事件 - 使用更直接的方式
    if (roleSwitch) {
        roleSwitch.onclick = function (e) {
            console.log('角色切换按钮被点击');
            e.preventDefault();
            showModal();
        };
    }

    // 角色选项点击事件
    roleOptions.forEach(option => {
        option.onclick = function () {
            const role = this.getAttribute('data-role');
            console.log(`角色选项 ${role} 被点击`);

            // 移除所有选项的active类
            roleOptions.forEach(opt => opt.classList.remove('active'));

            // 为当前选项添加active类
            this.classList.add('active');

            // 更新选中的角色
            currentRole = role;
        };
    });

    // 确认按钮点击事件
    if (roleConfirmBtn) {
        roleConfirmBtn.onclick = function () {
            console.log('确认按钮被点击');

            // 保存选择的角色
            localStorage.setItem('userRole', currentRole);
            console.log(`角色已保存为: ${currentRole}`);

            // 更新UI
            updateRoleUI(currentRole);

            // 隐藏模态框
            hideModal();

            // 显示提示
            showToast(`已切换到${currentRole === 'supplier' ? '供应商' : '采购商'}角色`);
        };
    }

    // 关闭按钮点击事件
    if (roleCloseBtn) {
        roleCloseBtn.onclick = function () {
            console.log('关闭按钮被点击');
            hideModal();
        };
    }

    // 点击模态框背景关闭
    if (roleModal) {
        roleModal.onclick = function (e) {
            if (e.target === this) {
                console.log('点击模态框背景');
                hideModal();
            }
        };
    }

    // 防止事件冒泡
    const modalContent = roleModal ? roleModal.querySelector('.modal-content') : null;
    if (modalContent) {
        modalContent.onclick = function (e) {
            e.stopPropagation();
        };
    }

    console.log('角色切换功能初始化完成');
}

// 初始化返回顶部功能
function initBackToTop() {
    const backToTopBtn = document.querySelector('.back-to-top');

    // 滚动监听
    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    // 点击返回顶部
    backToTopBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 显示提示消息
function showToast(message, type = 'success', duration = 3000) {
    console.log(`显示提示消息: ${message}, 类型: ${type}`);

    let toastContainer = document.querySelector('.toast-container');

    // 如果没有toast容器，创建一个
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
        console.log('创建toast容器');
    }

    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // 添加到容器
    toastContainer.appendChild(toast);
    console.log('添加toast到容器');

    // 显示toast
    setTimeout(() => {
        toast.classList.add('show');
        console.log('显示toast');
    }, 10);

    // 设置定时器移除toast
    setTimeout(() => {
        toast.classList.remove('show');
        console.log('隐藏toast');

        // 动画结束后移除元素
        setTimeout(() => {
            toastContainer.removeChild(toast);
            console.log('移除toast');

            // 如果容器为空，也移除容器
            if (toastContainer.children.length === 0) {
                document.body.removeChild(toastContainer);
                console.log('移除空的toast容器');
            }
        }, 300);
    }, duration);
}

// 初始化分类系统
function initCategorySystem() {
    console.log('开始初始化分类系统');

    const categoryContainer = document.querySelector('.category-container');
    if (!categoryContainer) {
        console.error('未找到分类容器');
        return;
    }

    const mainCategories = categoryContainer.querySelectorAll('.main-category-item');
    console.log(`找到 ${mainCategories.length} 个主分类`);

    const subCategories = document.querySelectorAll('.category-carousel');
    console.log(`找到 ${subCategories.length} 个子分类轮播`);

    // 隐藏所有子分类
    function hideAllSubCategories() {
        console.log('隐藏所有子分类');
        subCategories.forEach(subCategory => {
            subCategory.style.display = 'none';
            subCategory.classList.remove('active');
        });
    }

    // 显示指定分类的子分类
    function showSubCategory(category) {
        console.log(`显示分类: ${category}`);
        const targetSubCategory = document.querySelector(`.category-carousel[data-parent="${category}"]`);
        if (targetSubCategory) {
            targetSubCategory.style.display = 'block';
            targetSubCategory.classList.add('active');

            // 如果是 "all" 分类，初始化轮播图
            if (category === 'all') {
                initCarousel();
            }
        } else {
            console.warn(`未找到分类 ${category} 的子分类`);
        }
    }

    // 更新主分类的激活状态
    function updateMainCategoryState(clickedCategory) {
        mainCategories.forEach(category => {
            if (category === clickedCategory) {
                category.classList.add('active');
            } else {
                category.classList.remove('active');
            }
        });
    }

    // 为每个主分类添加点击事件
    mainCategories.forEach(category => {
        category.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('主分类被点击:', this.dataset.category);

            // 更新激活状态
            updateMainCategoryState(this);

            // 隐藏所有子分类
            hideAllSubCategories();

            // 显示对应的子分类
            showSubCategory(this.dataset.category);
        });
    });

    // 初始化默认显示全部分类
    const defaultCategory = document.querySelector('.main-category-item[data-category="all"]');
    if (defaultCategory) {
        console.log('初始化默认分类: all');
        defaultCategory.classList.add('active');
        showSubCategory('all');
    } else {
        console.error('未找到默认分类按钮');
    }
}

// 确保在 DOM 完全加载后初始化
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM 加载完成，开始初始化');
    initCategorySystem();
});

// 更新筛选结果
function updateFilterResults() {
    const demandItems = document.querySelectorAll('.demand-item');
    const activeFilters = {
        category: getActiveFilter('category'),
        province: getActiveFilter('province'),
        city: getActiveFilter('city'),
        price: getActiveFilter('price')
    };

    console.log('Active filters:', activeFilters); // 添加调试日志

    let visibleCount = 0;

    demandItems.forEach(item => {
        const shouldShow = checkItemMatchesFilters(item, activeFilters);
        item.style.display = shouldShow ? 'block' : 'none';
        if (shouldShow) visibleCount++;
    });

    // 更新结果计数
    const resultCount = document.getElementById('resultCount');
    if (resultCount) {
        resultCount.textContent = visibleCount;
    }

    // 显示/隐藏空状态提示
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
    }

    console.log('Visible items count:', visibleCount); // 添加调试日志
}

// 获取当前激活的筛选条件
function getActiveFilter(type) {
    const activeChip = document.querySelector(`.filter-chip.active[data-filter^="${type}-"]`);
    return activeChip ? activeChip.dataset.filter : `${type}-all`;
}

// 更新筛选结果检查函数
function checkItemMatchesFilters(item, activeFilters) {
    // 如果所有筛选条件都是"全部"，则显示所有商品
    const isAllFilters = Object.values(activeFilters).every(filter => filter.endsWith('-all'));
    if (isAllFilters) {
        return true;
    }

    const itemCategory = item.dataset.category;
    const itemArea = item.dataset.area;
    const itemPrice = item.dataset.price;
    const itemTags = item.dataset.tags ? item.dataset.tags.split(',') : [];

    // 检查分类
    if (activeFilters.category !== 'category-all' &&
        !itemCategory.includes(activeFilters.category.replace('category-', ''))) {
        return false;
    }

    // 检查地区（省份和城市）
    if (activeFilters.province !== 'province-all') {
        const province = activeFilters.province.replace('province-', '');
        if (!itemArea.includes(province)) {
            return false;
        }

        if (activeFilters.city !== 'city-all') {
            const city = activeFilters.city.split('-').pop();
            if (!itemArea.includes(city)) {
                return false;
            }
        }
    }

    // 检查标签
    if (activeFilters.tag !== 'tag-all') {
        const requiredTag = activeFilters.tag.replace('tag-', '');
        if (!itemTags.includes(requiredTag)) {
            return false;
        }
    }

    // 检查价格
    if (activeFilters.price !== 'price-all') {
        const priceRange = activeFilters.price.replace('price-', '').split('-');
        const itemPriceValue = parseFloat(itemPrice);

        if (priceRange.length === 2) {
            const [min, max] = priceRange;
            if (itemPriceValue < parseFloat(min) || itemPriceValue > parseFloat(max)) {
                return false;
            }
        } else if (priceRange[0] === '20+' && itemPriceValue <= 20) {
            return false;
        }
    }

    return true;
}

// 初始化轮播图
function initCarousel() {
    const carousels = document.querySelectorAll('.category-carousel[data-parent="all"]');
    console.log('找到轮播图元素:', carousels.length);

    carousels.forEach(carousel => {
        const slides = carousel.querySelectorAll('.carousel-slide');
        const indicators = carousel.querySelectorAll('.indicator');
        const prevBtn = carousel.querySelector('.prev-btn');
        const nextBtn = carousel.querySelector('.next-btn');
        let currentSlide = 0;
        let autoplayInterval;

        if (slides.length === 0) {
            console.warn('轮播图没有幻灯片');
            return;
        }

        // 设置指示器初始状态
        if (indicators.length > 0) {
            indicators[0].classList.add('active');
        }

        // 显示指定幻灯片
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.style.transform = `translateX(${100 * (i - index)}%)`;
            });

            // 更新指示器状态
            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === index);
            });
        }

        // 下一张幻灯片
        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }

        // 上一张幻灯片
        function prevSlide() {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        }

        // 设置自动播放
        function startAutoplay() {
            stopAutoplay(); // 先清除之前的定时器
            autoplayInterval = setInterval(nextSlide, 5000);
        }

        // 停止自动播放
        function stopAutoplay() {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
                autoplayInterval = null;
            }
        }

        // 初始化显示第一张幻灯片
        showSlide(0);

        // 添加按钮事件监听
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                prevSlide();
                stopAutoplay();
                startAutoplay();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                nextSlide();
                stopAutoplay();
                startAutoplay();
            });
        }

        // 添加指示器点击事件
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                currentSlide = index;
                showSlide(currentSlide);
                stopAutoplay();
                startAutoplay();
            });
        });

        // 鼠标悬停时暂停自动播放
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);

        // 开始自动播放
        startAutoplay();
    });
}

// 重置所有筛选条件
function resetAllFilters() {
    // 重置所有筛选条件为"全部"
    document.querySelectorAll('.filter-chip[data-filter$="-all"]').forEach(chip => {
        const filterGroup = chip.closest('.filter-group');
        if (filterGroup) {
            filterGroup.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        }
    });

    // 更新筛选结果
    updateFilterResults();
    updateSelectedFilters();
}

// 为重置筛选按钮添加事件监听
document.querySelector('.btn-reset-filter')?.addEventListener('click', resetAllFilters);

// 初始化价格区间筛选功能
function initPriceRangeFilter() {
    const minPriceInput = document.querySelector('.price-input[name="min-price"]');
    const maxPriceInput = document.querySelector('.price-input[name="max-price"]');
    const priceUnitSelect = document.querySelector('.price-unit select');
    const applyPriceBtn = document.querySelector('.btn-apply-price');

    if (!minPriceInput || !maxPriceInput || !priceUnitSelect || !applyPriceBtn) {
        console.error('Price range filter elements not found');
        return;
    }

    // 限制只能输入数字和小数点
    function validateNumberInput(event) {
        const value = event.target.value;
        const newValue = value.replace(/[^\d.]/g, '');

        // 确保只有一个小数点
        const dotCount = (newValue.match(/\./g) || []).length;
        if (dotCount > 1) {
            event.target.value = newValue.slice(0, newValue.lastIndexOf('.'));
            return;
        }

        // 限制小数点后两位
        if (newValue.includes('.')) {
            const [integer, decimal] = newValue.split('.');
            if (decimal && decimal.length > 2) {
                event.target.value = `${integer}.${decimal.slice(0, 2)}`;
                return;
            }
        }

        event.target.value = newValue;
    }

    // 验证并格式化价格输入
    function validatePriceRange() {
        const minPrice = parseFloat(minPriceInput.value) || 0;
        const maxPrice = parseFloat(maxPriceInput.value) || 0;

        if (minPrice > maxPrice && maxPrice !== 0) {
            // 如果最小价格大于最大价格，交换它们的值
            minPriceInput.value = maxPrice.toFixed(2);
            maxPriceInput.value = minPrice.toFixed(2);
            return false;
        }

        // 格式化为两位小数
        if (minPrice) minPriceInput.value = minPrice.toFixed(2);
        if (maxPrice) maxPriceInput.value = maxPrice.toFixed(2);

        return true;
    }

    // 应用价格筛选
    function applyPriceFilter() {
        if (!validatePriceRange()) {
            return;
        }

        const minPrice = parseFloat(minPriceInput.value) || 0;
        const maxPrice = parseFloat(maxPriceInput.value) || 0;
        const unit = priceUnitSelect.value;

        // 移除之前的价格筛选标签
        const existingPriceTags = document.querySelectorAll('.selected-filter[data-type="price"]');
        existingPriceTags.forEach(tag => tag.remove());

        // 如果有价格范围，添加筛选标签
        if (minPrice || maxPrice) {
            const priceText = `${minPrice ? minPrice.toFixed(2) : '0'} - ${maxPrice ? maxPrice.toFixed(2) : '∞'} ${unit}`;
            addFilterTag('price', priceText);

            // 这里可以添加实际的筛选逻辑
            console.log('Applying price filter:', { minPrice, maxPrice, unit });
        }
    }

    // 绑定事件监听器
    minPriceInput.addEventListener('input', validateNumberInput);
    maxPriceInput.addEventListener('input', validateNumberInput);
    minPriceInput.addEventListener('blur', validatePriceRange);
    maxPriceInput.addEventListener('blur', validatePriceRange);
    applyPriceBtn.addEventListener('click', applyPriceFilter);

    // 当单位改变时，保持价格值不变但更新显示
    priceUnitSelect.addEventListener('change', () => {
        if (minPriceInput.value || maxPriceInput.value) {
            applyPriceFilter();
        }
    });
}

// 初始化价格筛选功能
function initPriceFilter() {
    const priceFilter = document.getElementById('priceFilter');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const priceUnitSelect = document.getElementById('priceUnit');
    const applyPriceBtn = priceFilter.querySelector('.btn-apply-price');

    // 预设价格区间点击处理
    priceFilter.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            // 移除其他价格区间的选中状态
            priceFilter.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // 清空自定义价格输入
            minPriceInput.value = '';
            maxPriceInput.value = '';

            // 更新筛选结果
            updateDemandList();
            updateSelectedFilters();
        });
    });

    // 自定义价格区间确定按钮点击处理
    applyPriceBtn.addEventListener('click', function () {
        const minPrice = parseFloat(minPriceInput.value);
        const maxPrice = parseFloat(maxPriceInput.value);
        const unit = priceUnitSelect.value;

        if (isNaN(minPrice) && isNaN(maxPrice)) {
            alert('请输入有效的价格区间');
            return;
        }

        // 移除预设价格区间的选中状态
        priceFilter.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));

        // 更新筛选结果
        updateDemandList();
        updateSelectedFilters();
    });
}

// 获取当前选中的价格筛选条件
function getSelectedPriceFilter() {
    const priceFilter = document.getElementById('priceFilter');
    const activeChip = priceFilter.querySelector('.filter-chip.active');
    const minPrice = parseFloat(document.getElementById('minPrice').value);
    const maxPrice = parseFloat(document.getElementById('maxPrice').value);
    const unit = document.getElementById('priceUnit').value;

    if (activeChip) {
        return activeChip.dataset.filter;
    } else if (!isNaN(minPrice) || !isNaN(maxPrice)) {
        return {
            min: minPrice,
            max: maxPrice,
            unit: unit
        };
    }
    return null;
}

// 更新需求列表筛选函数
function updateDemandList() {
    const demandItems = document.querySelectorAll('.demand-item');
    const selectedCategory = getSelectedCategory();
    const selectedArea = getSelectedArea();
    const selectedTags = getSelectedTags();
    const selectedPrice = getSelectedPriceFilter();

    demandItems.forEach(item => {
        let shouldShow = true;

        // 检查分类筛选
        if (selectedCategory && selectedCategory !== 'all') {
            shouldShow = shouldShow && item.dataset.category === selectedCategory;
        }

        // 检查地区筛选
        if (selectedArea && selectedArea !== 'all') {
            shouldShow = shouldShow && item.dataset.area === selectedArea;
        }

        // 检查标签筛选
        if (selectedTags && selectedTags.length > 0) {
            const itemTags = item.dataset.tags.split(',');
            shouldShow = shouldShow && selectedTags.some(tag => itemTags.includes(tag));
        }

        // 检查价格筛选
        if (selectedPrice) {
            const itemPrice = item.dataset.price;
            if (typeof selectedPrice === 'string') {
                // 预设价格区间
                switch (selectedPrice) {
                    case 'price-all':
                        break;
                    case 'price-0-5':
                        shouldShow = shouldShow && checkPriceRange(itemPrice, 0, 5);
                        break;
                    case 'price-5-10':
                        shouldShow = shouldShow && checkPriceRange(itemPrice, 5, 10);
                        break;
                    case 'price-10-20':
                        shouldShow = shouldShow && checkPriceRange(itemPrice, 10, 20);
                        break;
                    case 'price-20+':
                        shouldShow = shouldShow && checkPriceRange(itemPrice, 20, Infinity);
                        break;
                }
            } else {
                // 自定义价格区间
                shouldShow = shouldShow && checkCustomPriceRange(itemPrice, selectedPrice.min, selectedPrice.max, selectedPrice.unit);
            }
        }

        item.style.display = shouldShow ? 'block' : 'none';
    });

    // 更新结果数量
    updateResultCount();
}

// 检查价格是否在预设区间内
function checkPriceRange(priceStr, min, max) {
    if (priceStr === 'market') return true; // 对于"市场价"特殊处理

    const prices = priceStr.split('-').map(p => parseFloat(p));
    if (prices.length === 1) {
        return prices[0] >= min && prices[0] <= max;
    } else {
        return prices[0] >= min && prices[1] <= max;
    }
}

// 检查价格是否在自定义区间内（考虑单位转换）
function checkCustomPriceRange(priceStr, min, max, unit) {
    if (priceStr === 'market') return true;

    const prices = priceStr.split('-').map(p => parseFloat(p));
    const convertedPrices = prices.map(p => convertPrice(p, 'jin', unit));

    if (isNaN(min)) {
        return Math.max(...convertedPrices) <= max;
    } else if (isNaN(max)) {
        return Math.min(...convertedPrices) >= min;
    } else {
        return Math.min(...convertedPrices) >= min && Math.max(...convertedPrices) <= max;
    }
}

// 价格单位转换
function convertPrice(price, fromUnit, toUnit) {
    const rates = {
        jin: 1,
        kg: 2,
        ton: 2000
    };
    return price * rates[fromUnit] / rates[toUnit];
}

// 更新已选择的筛选条件显示
function updateSelectedFilters() {
    const selectedFilters = document.getElementById('selectedFilters');
    selectedFilters.innerHTML = '';

    // 添加选中的价格筛选条件
    const priceFilter = getSelectedPriceFilter();
    if (priceFilter) {
        let priceText = '';
        if (typeof priceFilter === 'string') {
            const chip = document.querySelector(`[data-filter="${priceFilter}"]`);
            priceText = chip.textContent;
        } else {
            const unit = document.getElementById('priceUnit').value;
            if (!isNaN(priceFilter.min) && !isNaN(priceFilter.max)) {
                priceText = `${priceFilter.min}-${priceFilter.max}元/${unit}`;
            } else if (!isNaN(priceFilter.min)) {
                priceText = `≥${priceFilter.min}元/${unit}`;
            } else if (!isNaN(priceFilter.max)) {
                priceText = `≤${priceFilter.max}元/${unit}`;
            }
        }

        if (priceText && priceFilter !== 'price-all') {
            const filterChip = document.createElement('span');
            filterChip.className = 'selected-filter';
            filterChip.innerHTML = `价格：${priceText} <i class="fas fa-times"></i>`;
            filterChip.addEventListener('click', () => {
                document.querySelector('[data-filter="price-all"]').click();
            });
            selectedFilters.appendChild(filterChip);
        }
    }

    // ... existing selected filters code ...
}

// 初始化地区筛选功能
function initLocationFilter() {
    const provinceFilter = document.getElementById('provinceFilter');
    const cityFilter = document.getElementById('cityFilter');
    const countyFilter = document.getElementById('countyFilter');

    // 隐藏所有城市和区县选项
    hideAllCityOptions();
    hideAllCountyOptions();

    // 省份点击事件
    provinceFilter.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            const province = this.dataset.province;

            // 更新选中状态
            provinceFilter.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // 重置城市和区县选择
            resetCitySelection();
            resetCountySelection();

            if (this.dataset.filter === 'province-all') {
                // 选择"全部"时隐藏所有城市和区县
                hideAllCityOptions();
                hideAllCountyOptions();
            } else {
                // 显示对应省份的城市
                showCitiesByProvince(province);
                hideAllCountyOptions();
            }

            // 更新筛选结果
            updateDemandList();
            updateSelectedFilters();
        });
    });

    // 城市点击事件
    cityFilter.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            const city = this.dataset.city;

            // 更新选中状态
            cityFilter.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // 重置区县选择
            resetCountySelection();

            if (this.dataset.filter === 'city-all') {
                // 选择"全部"时隐藏所有区县
                hideAllCountyOptions();
            } else {
                // 显示对应城市的区县
                showCountiesByCity(city);
            }

            // 更新筛选结果
            updateDemandList();
            updateSelectedFilters();
        });
    });

    // 区县点击事件
    countyFilter.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            // 更新选中状态
            countyFilter.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // 更新筛选结果
            updateDemandList();
            updateSelectedFilters();
        });
    });
}

// 隐藏所有城市选项
function hideAllCityOptions() {
    const cityFilter = document.getElementById('cityFilter');
    cityFilter.querySelectorAll('.filter-chip:not([data-filter="city-all"])').forEach(chip => {
        chip.style.display = 'none';
    });
}

// 隐藏所有区县选项
function hideAllCountyOptions() {
    const countyFilter = document.getElementById('countyFilter');
    countyFilter.querySelectorAll('.filter-chip:not([data-filter="county-all"])').forEach(chip => {
        chip.style.display = 'none';
    });
}

// 显示指定省份的城市
function showCitiesByProvince(province) {
    const cityFilter = document.getElementById('cityFilter');

    // 先隐藏所有城市
    hideAllCityOptions();

    // 显示对应省份的城市
    cityFilter.querySelectorAll(`.filter-chip[data-parent="${province}"]`).forEach(chip => {
        chip.style.display = 'inline-flex';
    });
}

// 显示指定城市的区县
function showCountiesByCity(city) {
    const countyFilter = document.getElementById('countyFilter');

    // 先隐藏所有区县
    hideAllCountyOptions();

    // 显示对应城市的区县
    countyFilter.querySelectorAll(`.filter-chip[data-parent="${city}"]`).forEach(chip => {
        chip.style.display = 'inline-flex';
    });
}

// 重置城市选择
function resetCitySelection() {
    const cityFilter = document.getElementById('cityFilter');
    cityFilter.querySelector('.filter-chip[data-filter="city-all"]').classList.add('active');
    cityFilter.querySelectorAll('.filter-chip:not([data-filter="city-all"])').forEach(chip => {
        chip.classList.remove('active');
    });
}

// 重置区县选择
function resetCountySelection() {
    const countyFilter = document.getElementById('countyFilter');
    countyFilter.querySelector('.filter-chip[data-filter="county-all"]').classList.add('active');
    countyFilter.querySelectorAll('.filter-chip:not([data-filter="county-all"])').forEach(chip => {
        chip.classList.remove('active');
    });
}

// 获取当前选中的地区
function getSelectedArea() {
    const province = document.querySelector('#provinceFilter .filter-chip.active');
    const city = document.querySelector('#cityFilter .filter-chip.active');
    const county = document.querySelector('#countyFilter .filter-chip.active');

    if (province.dataset.filter === 'province-all') {
        return null;
    }

    if (city.dataset.filter === 'city-all') {
        return province.dataset.province;
    }

    if (county.dataset.filter === 'county-all') {
        return city.dataset.city;
    }

    return county.dataset.county;
}

// 更新已选择的筛选条件显示
function updateSelectedFilters() {
    const selectedFilters = document.getElementById('selectedFilters');
    selectedFilters.innerHTML = '';

    // 添加选中的地区筛选条件
    const province = document.querySelector('#provinceFilter .filter-chip.active');
    const city = document.querySelector('#cityFilter .filter-chip.active');
    const county = document.querySelector('#countyFilter .filter-chip.active');

    if (province.dataset.filter !== 'province-all') {
        let areaText = province.dataset.province;

        if (city.dataset.filter !== 'city-all') {
            areaText += ' - ' + city.dataset.city;

            if (county.dataset.filter !== 'county-all') {
                areaText += ' - ' + county.dataset.county;
            }
        }

        const filterChip = document.createElement('span');
        filterChip.className = 'selected-filter';
        filterChip.innerHTML = `地区：${areaText} <i class="fas fa-times"></i>`;
        filterChip.addEventListener('click', () => {
            document.querySelector('#provinceFilter [data-filter="province-all"]').click();
        });
        selectedFilters.appendChild(filterChip);
    }

    // ... 其他筛选条件的显示代码 ...
}

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    initLocationFilter();
    // ... 其他初始化代码 ...
}); 