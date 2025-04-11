/**
 * 农产品供销信息平台 - 发布页面脚本
 * 控制发布页面的交互逻辑和状态管理
 */

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', function () {
    console.log('发布页面脚本加载完成');

    // 初始化发布页面
    initPublishPage();

    // 监听role-switch.js中的角色变化
    const currentRoleElement = document.getElementById('currentRole');
    if (currentRoleElement) {
        // 使用MutationObserver监听角色文本变化
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    console.log('检测到角色变化:', currentRoleElement.textContent);
                    updatePublishCardsByRole(currentRoleElement.textContent);
                }
            });
        });

        // 配置观察选项
        const config = {
            characterData: true,
            childList: true,
            subtree: true
        };

        // 开始观察
        observer.observe(currentRoleElement, config);
        console.log('已设置角色变化监听器');
    }

    // 监听自定义角色变更事件
    document.addEventListener('roleChanged', function (event) {
        console.log('收到roleChanged事件，新角色:', event.detail.role);
        updatePublishCardsByRole(event.detail.role);
    });
});

/**
 * 初始化发布页面
 */
function initPublishPage() {
    console.log('开始初始化发布页面...');

    // 验证DOM元素
    const roleModal = document.getElementById('roleModal');
    const currentRole = document.getElementById('currentRole');

    console.log('角色模态框元素:', roleModal ? '已找到' : '未找到');
    console.log('当前角色元素:', currentRole ? '已找到' : '未找到');

    // 记录onclick属性
    const roleSwitchElem = document.querySelector('.role-switch');
    if (roleSwitchElem) {
        console.log('角色切换元素onclick属性:', roleSwitchElem.getAttribute('onclick'));
    } else {
        console.log('未找到角色切换元素');
    }

    // 加载页脚组件
    loadFooter();

    // 初始化历史记录列表
    initHistoryList();

    // 初始化角色相关功能
    initRoleFeatures();

    // 初始化回到顶部按钮
    initBackToTop();

    // 监听发布卡片点击
    initPublishCardHover();

    console.log('发布页面初始化完成');
}

/**
 * 加载页脚组件
 */
function loadFooter() {
    // 获取页脚容器
    const footerContainer = document.querySelector('[data-component="footer"]');

    if (footerContainer) {
        // 加载页脚内容
        fetch('components/footer.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('无法加载页脚组件');
                }
                return response.text();
            })
            .then(html => {
                footerContainer.innerHTML = html;
                console.log('页脚组件加载成功');
            })
            .catch(error => {
                console.error('加载页脚组件失败:', error);
                footerContainer.innerHTML = '<div class="footer"><div class="container">页脚加载失败</div></div>';
            });
    }
}

/**
 * 初始化历史记录列表
 */
function initHistoryList() {
    // 保存原始历史记录项，以便在后续筛选中使用
    window.originalHistoryItems = [];
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach(item => {
        window.originalHistoryItems.push(item.cloneNode(true));
    });

    console.log('保存了', window.originalHistoryItems.length, '条原始历史记录');

    // 初始化历史记录相关功能
    initHistoryFeatures();
}

/**
 * 初始化历史记录相关功能
 */
function initHistoryFeatures() {
    // 获取当前用户角色
    const currentRole = document.getElementById('currentRole')?.textContent || '';
    console.log('当前角色:', currentRole);

    // 绑定历史记录状态过滤事件
    const statusBtns = document.querySelectorAll('.btn-status');
    if (statusBtns.length > 0) {
        statusBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                // 移除所有状态按钮的active类
                statusBtns.forEach(b => b.classList.remove('active'));
                // 添加当前状态按钮的active类
                this.classList.add('active');

                const status = this.dataset.status;
                console.log('过滤历史记录状态:', status);

                // 更新历史记录列表
                updateHistoryList();
            });
        });
    }

    // 初始化加载历史记录列表
    updateHistoryList();
}

/**
 * 更新历史记录列表
 */
function updateHistoryList() {
    // 获取当前角色
    const currentRole = document.getElementById('currentRole')?.textContent || '';

    // 根据角色确定显示类型
    const roleBasedType = currentRole === '供应商' ? 'supply' : currentRole === '采购商' ? 'demand' : 'all';
    const selectedStatus = document.querySelector('.btn-status.active')?.dataset.status || 'all';

    console.log('更新历史记录列表, 当前角色:', currentRole, '类型:', roleBasedType, '状态:', selectedStatus);

    // 获取历史记录列表容器
    const historyList = document.querySelector('.history-list');

    if (historyList) {
        // 显示加载中状态
        historyList.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>加载中...</p>
            </div>
        `;

        // 模拟API请求延迟
        setTimeout(() => {
            // 使用存储的原始历史记录项
            const allHistoryItems = window.originalHistoryItems || [];

            // 如果没有历史记录项，显示空状态
            if (allHistoryItems.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-state">
                        <img src="https://img.icons8.com/clouds/100/000000/empty-box.png" alt="暂无数据">
                        <h4>暂无发布记录</h4>
                        <p>您尚未发布任何${roleBasedType === 'all' ? '' : roleBasedType === 'supply' ? '供应' : '需求'}信息</p>
                    </div>
                `;

                // 更新分页信息
                updatePagination(0, 0);
                return;
            }

            // 清空加载状态
            historyList.innerHTML = '';

            // 筛选并显示符合条件的历史记录项
            let visibleCount = 0;

            allHistoryItems.forEach(item => {
                const itemType = item.getAttribute('data-type');
                const itemStatus = item.getAttribute('data-status');

                // 应用筛选条件
                const typeMatch = roleBasedType === 'all' || itemType === roleBasedType;
                const statusMatch = selectedStatus === 'all' || itemStatus === selectedStatus;

                // 克隆元素并添加到列表中
                if (typeMatch && statusMatch) {
                    const clonedItem = item.cloneNode(true);
                    historyList.appendChild(clonedItem);
                    visibleCount++;
                }
            });

            // 如果筛选后没有记录，显示筛选无结果状态
            if (visibleCount === 0) {
                historyList.innerHTML = `
                    <div class="empty-state">
                        <img src="https://img.icons8.com/clouds/100/000000/filter.png" alt="筛选无结果">
                        <h4>没有找到匹配的记录</h4>
                        <p>尝试更改筛选条件</p>
                    </div>
                `;
            }

            // 更新分页信息
            const totalPages = Math.ceil(visibleCount / 5); // 假设每页显示5条
            updatePagination(1, Math.max(1, totalPages));

            // 重新绑定操作按钮事件
            initHistoryItemActions();
        }, 800);
    }
}

/**
 * 初始化历史记录项的操作按钮事件
 */
function initHistoryItemActions() {
    // 绑定编辑按钮事件
    document.querySelectorAll('.history-item .btn-action.edit').forEach(btn => {
        if (!btn.disabled && !btn._hasListener) {
            btn._hasListener = true;
            btn.addEventListener('click', function () {
                const historyItem = this.closest('.history-item');
                const itemTitle = historyItem.querySelector('.history-item-title').textContent;
                const itemType = historyItem.getAttribute('data-type');

                console.log('编辑记录:', itemTitle, '类型:', itemType);
                // TODO: 实现编辑功能，根据类型跳转到不同的编辑页面
                if (itemType === 'supply') {
                    window.location.href = 'publish-supply.html?edit=true&id=123'; // 示例ID
                } else if (itemType === 'demand') {
                    window.location.href = 'publish-demand.html?edit=true&id=123'; // 示例ID
                }
            });
        }
    });

    // 绑定上架按钮事件
    document.querySelectorAll('.history-item .btn-action.list').forEach(btn => {
        if (!btn._hasListener) {
            btn._hasListener = true;
            btn.addEventListener('click', function () {
                const historyItem = this.closest('.history-item');
                const itemTitle = historyItem.querySelector('.history-item-title').textContent;
                const listConfirmModal = document.getElementById('listConfirmModal');
                const itemTitleSpan = listConfirmModal.querySelector('.item-title');

                // 更新模态框中的标题
                itemTitleSpan.textContent = itemTitle;

                // 显示模态框
                listConfirmModal.classList.add('show');

                // 处理确认上架
                const handleConfirm = () => {
                    // 隐藏模态框
                    listConfirmModal.classList.remove('show');

                    // 显示上架中状态
                    this.disabled = true;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 上架中...';

                    // 模拟API请求
                    setTimeout(() => {
                        // 更新状态为审核中
                        const statusElement = historyItem.querySelector('.history-item-status');
                        statusElement.className = 'history-item-status pending';
                        statusElement.textContent = '审核中';

                        // 更新数据状态
                        historyItem.setAttribute('data-status', 'pending');

                        // 更新按钮组
                        const actionsDiv = historyItem.querySelector('.history-item-actions');
                        actionsDiv.innerHTML = `
                            <button class="btn-action edit"><i class="fas fa-edit"></i> 编辑</button>
                            <button class="btn-action delete"><i class="fas fa-trash-alt"></i> 删除</button>
                        `;

                        // 提示成功
                        showToast('已提交审核！', 'success');

                        // 重新初始化按钮事件
                        initHistoryItemActions();
                    }, 800);
                };

                // 处理取消上架
                const handleCancel = () => {
                    listConfirmModal.classList.remove('show');
                };

                // 绑定确认和取消按钮事件
                const confirmBtn = listConfirmModal.querySelector('.confirm-btn');
                const cancelBtn = listConfirmModal.querySelector('.cancel-btn');
                const closeBtn = listConfirmModal.querySelector('.close-btn');

                // 移除旧的事件监听器
                confirmBtn.replaceWith(confirmBtn.cloneNode(true));
                cancelBtn.replaceWith(cancelBtn.cloneNode(true));
                closeBtn.replaceWith(closeBtn.cloneNode(true));

                // 添加新的事件监听器
                listConfirmModal.querySelector('.confirm-btn').addEventListener('click', handleConfirm);
                listConfirmModal.querySelector('.cancel-btn').addEventListener('click', handleCancel);
                listConfirmModal.querySelector('.close-btn').addEventListener('click', handleCancel);

                // 点击模态框外部关闭
                listConfirmModal.addEventListener('click', (e) => {
                    if (e.target === listConfirmModal) {
                        handleCancel();
                    }
                });
            });
        }
    });

    // 绑定下架按钮事件
    document.querySelectorAll('.history-item .btn-action.delist').forEach(btn => {
        if (!btn._hasListener) {
            btn._hasListener = true;
            btn.addEventListener('click', function () {
                const historyItem = this.closest('.history-item');
                const itemTitle = historyItem.querySelector('.history-item-title').textContent;
                const delistConfirmModal = document.getElementById('delistConfirmModal');
                const itemTitleSpan = delistConfirmModal.querySelector('.item-title');

                // 更新模态框中的标题
                itemTitleSpan.textContent = itemTitle;

                // 显示模态框
                delistConfirmModal.classList.add('show');

                // 处理确认下架
                const handleConfirm = () => {
                    // 隐藏模态框
                    delistConfirmModal.classList.remove('show');

                    // 显示下架中状态
                    this.disabled = true;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 下架中...';

                    // 模拟API请求
                    setTimeout(() => {
                        // 更新元素状态
                        const statusEl = historyItem.querySelector('.history-item-status');
                        statusEl.className = 'history-item-status delisted';
                        statusEl.textContent = '已下架';

                        // 更新按钮为上架按钮
                        this.className = 'btn-action list';
                        this.innerHTML = '<i class="fas fa-arrow-up"></i> 上架';
                        this.disabled = false;
                        this._hasListener = false; // 重置监听器以便重新绑定

                        // 更新数据属性
                        historyItem.setAttribute('data-status', 'delisted');

                        // 提示成功
                        showToast('下架成功！', 'success');

                        // 重新初始化按钮事件
                        initHistoryItemActions();
                    }, 800);
                };

                // 处理取消下架
                const handleCancel = () => {
                    delistConfirmModal.classList.remove('show');
                };

                // 绑定确认和取消按钮事件
                const confirmBtn = delistConfirmModal.querySelector('.confirm-btn');
                const cancelBtn = delistConfirmModal.querySelector('.cancel-btn');
                const closeBtn = delistConfirmModal.querySelector('.close-btn');

                // 移除旧的事件监听器
                confirmBtn.replaceWith(confirmBtn.cloneNode(true));
                cancelBtn.replaceWith(cancelBtn.cloneNode(true));
                closeBtn.replaceWith(closeBtn.cloneNode(true));

                // 添加新的事件监听器
                delistConfirmModal.querySelector('.confirm-btn').addEventListener('click', handleConfirm);
                delistConfirmModal.querySelector('.cancel-btn').addEventListener('click', handleCancel);
                delistConfirmModal.querySelector('.close-btn').addEventListener('click', handleCancel);

                // 点击模态框外部关闭
                delistConfirmModal.addEventListener('click', (e) => {
                    if (e.target === delistConfirmModal) {
                        handleCancel();
                    }
                });
            });
        }
    });

    // 绑定删除按钮事件
    document.querySelectorAll('.history-item .btn-action.delete').forEach(btn => {
        if (!btn._hasListener) {
            btn._hasListener = true;
            btn.addEventListener('click', function () {
                const historyItem = this.closest('.history-item');
                const itemTitle = historyItem.querySelector('.history-item-title').textContent;
                const deleteConfirmModal = document.getElementById('deleteConfirmModal');
                const itemTitleSpan = deleteConfirmModal.querySelector('.item-title');

                // 更新模态框中的标题
                itemTitleSpan.textContent = itemTitle;

                // 显示模态框
                deleteConfirmModal.classList.add('show');

                // 处理确认删除
                const handleConfirm = () => {
                    // 隐藏模态框
                    deleteConfirmModal.classList.remove('show');

                    // 显示删除动画
                    historyItem.style.opacity = '0.5';

                    // 模拟删除操作
                    setTimeout(() => {
                        historyItem.remove();

                        // 检查是否还有记录
                        const remainingItems = document.querySelectorAll('.history-list .history-item');
                        if (remainingItems.length === 0) {
                            // 如果没有记录了，显示空状态
                            updateHistoryList();
                        }

                        // 提示成功
                        showToast('删除成功！', 'success');
                    }, 500);
                };

                // 处理取消删除
                const handleCancel = () => {
                    deleteConfirmModal.classList.remove('show');
                };

                // 绑定确认和取消按钮事件
                const confirmBtn = deleteConfirmModal.querySelector('.confirm-btn');
                const cancelBtn = deleteConfirmModal.querySelector('.cancel-btn');
                const closeBtn = deleteConfirmModal.querySelector('.close-btn');

                // 移除旧的事件监听器
                confirmBtn.replaceWith(confirmBtn.cloneNode(true));
                cancelBtn.replaceWith(cancelBtn.cloneNode(true));
                closeBtn.replaceWith(closeBtn.cloneNode(true));

                // 添加新的事件监听器
                deleteConfirmModal.querySelector('.confirm-btn').addEventListener('click', handleConfirm);
                deleteConfirmModal.querySelector('.cancel-btn').addEventListener('click', handleCancel);
                deleteConfirmModal.querySelector('.close-btn').addEventListener('click', handleCancel);

                // 点击模态框外部关闭
                deleteConfirmModal.addEventListener('click', (e) => {
                    if (e.target === deleteConfirmModal) {
                        handleCancel();
                    }
                });
            });
        }
    });
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型（success, error, info）
 */
function showToast(message, type = 'info') {
    // 检查是否已有toast容器，没有则创建
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // 创建新的toast元素
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;

    // 添加到容器
    toastContainer.appendChild(toast);

    // 显示toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 自动关闭
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

/**
 * 更新分页控件
 * @param {number} currentPage - 当前页码
 * @param {number} totalPages - 总页数
 */
function updatePagination(currentPage, totalPages) {
    const pagination = document.querySelector('.pagination');
    if (pagination) {
        const prevBtn = pagination.querySelector('.prev');
        const nextBtn = pagination.querySelector('.next');
        const currentPageEl = pagination.querySelector('.current-page');
        const totalPagesEl = pagination.querySelector('.total-pages');

        // 更新页码
        if (currentPageEl) currentPageEl.textContent = currentPage || 1;
        if (totalPagesEl) totalPagesEl.textContent = totalPages || 1;

        // 更新按钮状态
        if (prevBtn) prevBtn.disabled = !currentPage || currentPage <= 1;
        if (nextBtn) nextBtn.disabled = !totalPages || currentPage >= totalPages;

        // 绑定翻页事件
        if (prevBtn && !prevBtn._hasListener) {
            prevBtn._hasListener = true;
            prevBtn.addEventListener('click', function () {
                if (!this.disabled) {
                    const newPage = parseInt(currentPageEl.textContent) - 1;
                    if (newPage >= 1) {
                        updateHistoryList();
                    }
                }
            });
        }

        if (nextBtn && !nextBtn._hasListener) {
            nextBtn._hasListener = true;
            nextBtn.addEventListener('click', function () {
                if (!this.disabled) {
                    const newPage = parseInt(currentPageEl.textContent) + 1;
                    if (newPage <= parseInt(totalPagesEl.textContent)) {
                        updateHistoryList();
                    }
                }
            });
        }
    }
}

/**
 * 初始化角色相关功能
 */
function initRoleFeatures() {
    // 获取当前角色
    const currentRole = document.getElementById('currentRole');

    if (currentRole) {
        // 根据角色更新发布卡片显示
        updatePublishCardsByRole(currentRole.textContent);
        console.log('根据当前角色更新UI:', currentRole.textContent);
    } else {
        console.error('未找到currentRole元素');
    }
}

/**
 * 根据用户角色更新发布卡片显示
 * @param {string} role - 用户角色
 */
function updatePublishCardsByRole(role) {
    const supplyCard = document.getElementById('supply-card');
    const demandCard = document.getElementById('demand-card');
    const description = document.getElementById('publish-description');

    if (!supplyCard || !demandCard) {
        console.error('未找到供应卡片或需求卡片元素');
        return;
    }

    console.log('更新发布卡片显示，当前角色:', role);

    if (role === '供应商') {
        // 供应商只能发布供应信息
        supplyCard.style.display = 'flex';
        demandCard.style.display = 'none';
        if (description) {
            description.textContent = '作为供应商，您可以发布农产品供应信息，展示您的产品';
        }
    } else {
        // 采购商只能发布采购需求
        supplyCard.style.display = 'none';
        demandCard.style.display = 'flex';
        if (description) {
            description.textContent = '作为采购商，您可以发布农产品采购需求，寻找合适的供应商';
        }
    }
}

/**
 * 初始化回到顶部按钮
 */
function initBackToTop() {
    const backToTopBtn = document.querySelector('.back-to-top');

    if (backToTopBtn) {
        // 监听滚动事件
        window.addEventListener('scroll', function () {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        // 点击回到顶部
        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * 初始化发布卡片悬停效果
 */
function initPublishCardHover() {
    const publishCards = document.querySelectorAll('.publish-card');

    if (publishCards.length > 0) {
        publishCards.forEach(card => {
            card.addEventListener('mouseenter', function () {
                // 悬停效果
                this.style.transform = 'translateY(-4px)';
                this.style.boxShadow = 'var(--shadow-md)';
                this.style.borderColor = 'var(--primary-color)';
            });

            card.addEventListener('mouseleave', function () {
                // 恢复正常
                this.style.transform = '';
                this.style.boxShadow = '';
                this.style.borderColor = '';
            });
        });
    }
} 