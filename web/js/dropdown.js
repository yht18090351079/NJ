/**
 * 下拉菜单功能模块
 * 包含下拉菜单的显示、隐藏和选择功能
 */

// 立即执行函数，确保所有需要的函数在DOM加载前就定义好
(function () {
    // 分类数据
    const categoryData = {
        '水果': {
            '柑橘类': ['耙耙柑', '不知火', '沃柑'],
            '苹果类': ['红富士', '青苹果', '黄元帅'],
            '梨类': ['鸭梨', '雪梨', '库尔勒香梨']
        },
        '蔬菜': {
            '根茎类': ['土豆', '萝卜', '红薯'],
            '叶菜类': ['白菜', '菠菜', '生菜'],
            '茄果类': ['番茄', '茄子', '辣椒']
        },
        '粮油': {
            '谷物': ['小麦', '水稻', '玉米'],
            '豆类': ['黄豆', '绿豆', '红豆'],
            '油料': ['花生', '芝麻', '油菜籽']
        },
        '干货': {
            '食用菌': ['香菇', '木耳', '银耳'],
            '腌制品': ['泡菜', '咸菜', '酸菜'],
            '干果': ['核桃', '杏仁', '腰果']
        }
    };

    // 区域数据
    const regionData = {
        '北京市': {
            '北京市': ['朝阳区', '海淀区', '丰台区', '石景山区', '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区']
        },
        '上海市': {
            '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区']
        },
        '广东省': {
            '广州市': ['越秀区', '海珠区', '荔湾区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '从化区', '增城区'],
            '深圳市': ['福田区', '罗湖区', '南山区', '宝安区', '龙岗区', '盐田区', '龙华区', '坪山区', '光明区'],
            '佛山市': ['禅城区', '南海区', '顺德区', '高明区', '三水区']
        },
        '四川省': {
            '成都市': ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区', '青白江区', '新都区', '温江区', '双流区', '郫都区'],
            '绵阳市': ['涪城区', '游仙区', '安州区'],
            '自贡市': ['自流井区', '贡井区', '大安区']
        },
        '湖北省': {
            '武汉市': ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区', '青山区', '洪山区'],
            '襄阳市': ['襄城区', '樊城区', '襄州区'],
            '宜昌市': ['西陵区', '伍家岗区', '点军区', '猇亭区', '夷陵区']
        }
    };

    /**
     * 下拉菜单显示/隐藏切换
     * @param {HTMLElement} element - 被点击的元素
     * @param {Event} [event] - 事件对象（可选）
     * @returns {boolean} - 返回false阻止默认事件
     */
    function toggleDropdown(element, event) {
        console.log('toggleDropdown called with:', element);

        try {
            // 如果传入了事件对象，阻止冒泡
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            // 检查是否是arrow-icon元素
            const isArrow = element.classList && element.classList.contains('arrow-icon');

            // 获取容器 - 可能是从箭头、输入框或直接容器调用
            let container;

            if (isArrow) {
                // 如果是箭头按钮
                container = element.closest('.search-select-container');
            } else if (element.tagName === 'INPUT') {
                // 如果是输入框
                container = element.closest('.search-select-container');
            } else if (element.classList && element.classList.contains('search-select-container')) {
                // 如果直接是容器
                container = element;
            } else if (typeof element === 'string') {
                // 如果是元素ID
                const el = document.getElementById(element);
                if (el) {
                    return toggleDropdown(el, event);
                } else {
                    console.error('找不到元素:', element);
                    return false;
                }
            } else {
                console.error('无法确定下拉容器:', element);
                return false;
            }

            // 如果找不到容器，直接返回
            if (!container) {
                console.error('找不到下拉容器:', element);
                return false;
            }

            // 获取下拉菜单
            const dropdown = container.querySelector('.search-dropdown');

            if (!dropdown) {
                console.error('找不到下拉菜单元素');
                return false;
            }

            // 关闭所有其他下拉菜单
            document.querySelectorAll('.search-dropdown').forEach(item => {
                if (item !== dropdown) {
                    item.style.display = 'none';
                }
            });

            // 移除所有其他容器的激活状态
            document.querySelectorAll('.search-select-container').forEach(item => {
                if (item !== container) {
                    item.classList.remove('active');
                }
            });

            // 切换当前下拉菜单的显示状态
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
                container.classList.remove('active');
            } else {
                dropdown.style.display = 'block';
                container.classList.add('active');

                // 填充下拉选项
                populateDropdownOptions(container.id);
            }
        } catch (error) {
            console.error('toggleDropdown发生错误:', error);
        }

        // 阻止默认行为和事件冒泡
        return false;
    }

    /**
     * 填充下拉选项
     * @param {string} containerId - 下拉容器ID
     */
    function populateDropdownOptions(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const dropdown = container.querySelector('.search-dropdown');
        if (!dropdown) return;

        // 清空下拉菜单
        dropdown.innerHTML = '';

        // 根据不同的容器ID填充不同的选项
        if (containerId === 'categoryLevel1Container') {
            // 填充一级分类
            Object.keys(categoryData).forEach(category => {
                addDropdownItem(dropdown, category, () => {
                    document.getElementById('categoryLevel1Input').value = category;
                    document.getElementById('categoryLevel2Input').value = '';
                    document.getElementById('categoryLevel3Input').value = '';
                    if (typeof window.formModified !== 'undefined') {
                        window.formModified = true;
                    }
                });
            });
        } else if (containerId === 'categoryLevel2Container') {
            // 填充二级分类
            const level1 = document.getElementById('categoryLevel1Input').value;
            if (level1 && categoryData[level1]) {
                Object.keys(categoryData[level1]).forEach(category => {
                    addDropdownItem(dropdown, category, () => {
                        document.getElementById('categoryLevel2Input').value = category;
                        document.getElementById('categoryLevel3Input').value = '';
                        if (typeof window.formModified !== 'undefined') {
                            window.formModified = true;
                        }
                    });
                });
            } else {
                addDropdownItem(dropdown, '请先选择一级分类', null).style.color = '#999';
            }
        } else if (containerId === 'categoryLevel3Container') {
            // 填充三级分类
            const level1 = document.getElementById('categoryLevel1Input').value;
            const level2 = document.getElementById('categoryLevel2Input').value;
            if (level1 && level2 && categoryData[level1] && categoryData[level1][level2]) {
                categoryData[level1][level2].forEach(category => {
                    addDropdownItem(dropdown, category, () => {
                        document.getElementById('categoryLevel3Input').value = category;
                        if (typeof window.formModified !== 'undefined') {
                            window.formModified = true;
                        }
                    });
                });
            } else {
                addDropdownItem(dropdown, '请先选择二级分类', null).style.color = '#999';
            }
        } else if (containerId === 'provinceContainer') {
            // 填充省份
            Object.keys(regionData).forEach(province => {
                addDropdownItem(dropdown, province, () => {
                    document.getElementById('provinceInput').value = province;
                    document.getElementById('cityInput').value = '';
                    document.getElementById('districtInput').value = '';
                    if (typeof window.formModified !== 'undefined') {
                        window.formModified = true;
                    }
                });
            });
        } else if (containerId === 'cityContainer') {
            // 填充城市
            const province = document.getElementById('provinceInput').value;
            if (province && regionData[province]) {
                Object.keys(regionData[province]).forEach(city => {
                    addDropdownItem(dropdown, city, () => {
                        document.getElementById('cityInput').value = city;
                        document.getElementById('districtInput').value = '';
                        if (typeof window.formModified !== 'undefined') {
                            window.formModified = true;
                        }
                    });
                });
            } else {
                addDropdownItem(dropdown, '请先选择省份', null).style.color = '#999';
            }
        } else if (containerId === 'districtContainer') {
            // 填充区县
            const province = document.getElementById('provinceInput').value;
            const city = document.getElementById('cityInput').value;
            if (province && city && regionData[province] && regionData[province][city]) {
                regionData[province][city].forEach(district => {
                    addDropdownItem(dropdown, district, () => {
                        document.getElementById('districtInput').value = district;
                        if (typeof window.formModified !== 'undefined') {
                            window.formModified = true;
                        }
                    });
                });
            } else {
                addDropdownItem(dropdown, '请先选择城市', null).style.color = '#999';
            }
        }
    }

    /**
     * 添加下拉选项
     * @param {HTMLElement} dropdown - 下拉菜单元素
     * @param {string} text - 选项文本
     * @param {Function} clickHandler - 点击处理函数
     * @returns {HTMLElement} - 返回创建的选项元素
     */
    function addDropdownItem(dropdown, text, clickHandler) {
        const item = document.createElement('div');
        item.className = 'search-dropdown-item';
        item.textContent = text;

        if (clickHandler) {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                clickHandler();

                // 隐藏所有下拉菜单
                document.querySelectorAll('.search-dropdown').forEach(dropdown => {
                    dropdown.style.display = 'none';
                });

                // 移除所有容器的激活状态
                document.querySelectorAll('.search-select-container').forEach(container => {
                    container.classList.remove('active');
                });
            });
        }

        dropdown.appendChild(item);
        return item;
    }

    /**
     * 关闭所有下拉菜单
     */
    function closeAllDropdowns() {
        document.querySelectorAll('.search-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
        });

        document.querySelectorAll('.search-select-container').forEach(container => {
            container.classList.remove('active');
        });
    }

    // 将函数挂载到window全局对象上，使其可以被HTML内联事件调用
    window.toggleDropdown = toggleDropdown;
    window.populateDropdownOptions = populateDropdownOptions;
    window.closeAllDropdowns = closeAllDropdowns;

    // 页面加载完成后初始化点击事件
    document.addEventListener('DOMContentLoaded', function () {
        console.log('下拉菜单模块初始化完成');

        // 点击页面其他区域关闭所有下拉菜单
        document.addEventListener('click', function (event) {
            if (!event.target.closest('.search-select-container') &&
                !event.target.closest('.arrow-icon')) {
                closeAllDropdowns();
            }
        });
    });
})(); 