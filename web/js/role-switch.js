/**
 * 角色切换功能
 * 在所有页面共享使用的角色切换逻辑
 */

// 当前选中的角色
let selectedRole = null;

// 角色切换函数 - 显示角色模态框
function showRoleModal(event) {
    console.log('[Role Modal Debug] 显示角色模态框被调用');
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('[Role Modal Debug] 阻止事件默认行为和传播');
    }

    const roleModal = document.getElementById('roleModal');
    if (!roleModal) {
        console.error('[Role Modal Debug] 无法找到ID为roleModal的元素!');
        return;
    }

    // 获取当前角色
    const currentRoleElement = document.getElementById('currentRole');
    if (!currentRoleElement) {
        console.error('[Role Modal Debug] 无法找到currentRole元素');
        return;
    }

    const currentRole = currentRoleElement.textContent.trim();
    selectedRole = currentRole; // 初始化为当前角色
    console.log('[Role Modal Debug] 当前角色:', currentRole);

    console.log('[Role Modal Debug] 正在设置模态框样式...');
    // 强制显示模态框
    roleModal.style.display = 'flex';
    roleModal.style.visibility = 'visible';
    roleModal.style.opacity = '1';
    roleModal.classList.add('active');

    // 更新模态框中的选中状态
    const roleOptions = roleModal.querySelectorAll('.role-option');
    let foundMatch = false;

    roleOptions.forEach(option => {
        const roleName = option.getAttribute('data-role');
        option.classList.remove('active');
        if (roleName === currentRole) {
            option.classList.add('active');
            foundMatch = true;
            console.log('[Role Modal Debug] 设置选中角色:', roleName);
        }
    });

    // 如果没有找到匹配项，默认选中第一个选项
    if (!foundMatch && roleOptions.length > 0) {
        roleOptions[0].classList.add('active');
        console.log('[Role Modal Debug] 未找到匹配角色，默认选中第一个选项:', roleOptions[0].getAttribute('data-role'));
    }

    console.log('[Role Modal Debug] 模态框显示完成');
}

// 关闭角色模态框
function closeRoleModal() {
    console.log('[Role Modal Debug] 关闭角色模态框');
    const roleModal = document.getElementById('roleModal');
    if (roleModal) {
        roleModal.style.display = 'none';
        roleModal.classList.remove('active');
        console.log('[Role Modal Debug] 角色模态框已关闭');
    } else {
        console.error('[Role Modal Debug] 无法找到角色模态框');
    }
}

// 选择角色选项（只是视觉上的选择，不应用更改）
function selectRoleOption(option) {
    const roleOptions = document.querySelectorAll('.role-option');
    roleOptions.forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');
}

// 确认角色更改
function confirmRoleChange() {
    const selectedOption = document.querySelector('.role-option.active');
    if (!selectedOption) {
        console.warn('未选择任何角色选项');
        return;
    }

    const newRole = selectedOption.getAttribute('data-role');
    const currentRole = document.getElementById('currentRole');
    if (currentRole) {
        currentRole.textContent = newRole;
        console.log('角色已切换为:', newRole);
    }

    // 关闭模态框
    closeRoleModal();

    // 更新角色相关UI
    updateRoleUI(newRole);

    // 如果在发布页面，更新历史记录
    if (typeof updateHistoryList === 'function') {
        // 更新历史记录列表
        updateHistoryList();
    }
}

// 根据角色更新导航链接的可见性
function updateNavigationVisibility(role) {
    console.log('[Role Modal Debug] 更新导航链接可见性，当前角色:', role);

    // 获取所有导航链接
    const supplyNavLinks = document.querySelectorAll('.horizontal-nav-link[href*="supply.html"], .mobile-nav-link[href*="supply.html"]');
    const demandNavLinks = document.querySelectorAll('.horizontal-nav-link[href*="demand.html"], .mobile-nav-link[href*="demand.html"]');

    // 根据角色显示/隐藏导航链接
    if (role === '供应商') {
        // 供应商可以看到需求大厅，但看不到供应大厅
        supplyNavLinks.forEach(link => {
            const listItem = link.closest('.horizontal-nav-item') || link.closest('.mobile-nav-item');
            if (listItem) {
                listItem.style.display = 'none';
            }
        });

        demandNavLinks.forEach(link => {
            const listItem = link.closest('.horizontal-nav-item') || link.closest('.mobile-nav-item');
            if (listItem) {
                listItem.style.display = '';
            }
        });
    } else if (role === '采购商') {
        // 采购商可以看到供应大厅，但看不到需求大厅
        supplyNavLinks.forEach(link => {
            const listItem = link.closest('.horizontal-nav-item') || link.closest('.mobile-nav-item');
            if (listItem) {
                listItem.style.display = '';
            }
        });

        demandNavLinks.forEach(link => {
            const listItem = link.closest('.horizontal-nav-item') || link.closest('.mobile-nav-item');
            if (listItem) {
                listItem.style.display = 'none';
            }
        });
    } else {
        // 默认情况下都显示
        supplyNavLinks.forEach(link => {
            const listItem = link.closest('.horizontal-nav-item') || link.closest('.mobile-nav-item');
            if (listItem) {
                listItem.style.display = '';
            }
        });

        demandNavLinks.forEach(link => {
            const listItem = link.closest('.horizontal-nav-item') || link.closest('.mobile-nav-item');
            if (listItem) {
                listItem.style.display = '';
            }
        });
    }
}

// 初始化角色切换功能
function initRoleSwitch() {
    console.log('[Role Modal Debug] 初始化角色切换功能');

    // 绑定角色切换按钮事件
    const roleSwitchButtons = document.querySelectorAll('.role-switch');
    roleSwitchButtons.forEach(button => {
        button.addEventListener('click', showRoleModal);
    });

    // 绑定模态框关闭按钮事件
    const closeButton = document.getElementById('roleModalCloseBtn');
    if (closeButton) {
        closeButton.addEventListener('click', closeRoleModal);
    }

    // 绑定角色选项点击事件
    const roleOptions = document.querySelectorAll('.role-option');
    roleOptions.forEach(option => {
        option.addEventListener('click', function () {
            selectRoleOption(this);
        });
    });

    // 绑定确认按钮点击事件
    const confirmButton = document.getElementById('roleModalConfirmBtn');
    if (confirmButton) {
        confirmButton.addEventListener('click', confirmRoleChange);
    }

    // 从localStorage获取保存的角色
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
        const currentRoleElement = document.getElementById('currentRole');
        if (currentRoleElement) {
            currentRoleElement.textContent = savedRole;
        }

        // 根据保存的角色更新导航链接显示
        updateNavigationVisibility(savedRole);
    }

    // 点击模态框外部关闭
    document.addEventListener('click', function (event) {
        const roleModal = document.getElementById('roleModal');
        if (!roleModal) return;

        if (roleModal.style.display === 'flex' || roleModal.classList.contains('active')) {
            // 检查点击是否在模态框内容区域之外
            const modalContent = roleModal.querySelector('.modal-content');
            if (modalContent && !modalContent.contains(event.target) &&
                !event.target.classList.contains('role-switch') &&
                !event.target.closest('.role-switch')) {
                console.log('[Role Modal Debug] 点击了模态框外部，关闭模态框');
                closeRoleModal();
            }
        }
    });

    console.log('[Role Modal Debug] 角色切换功能初始化完成');
}

// 在页面加载完成后初始化角色切换功能
document.addEventListener('DOMContentLoaded', initRoleSwitch);

/**
 * 更新角色相关UI
 * @param {string} role - 用户角色
 */
function updateRoleUI(role) {
    console.log('更新角色UI:', role);

    // 获取之前保存的角色
    const previousRole = localStorage.getItem('userRole');

    // 如果角色相同，不执行任何操作
    if (previousRole === role) {
        console.log('角色未变更，无需更新UI');
        return;
    }

    // 更新发布卡片显示
    if (typeof updatePublishCardsByRole === 'function') {
        updatePublishCardsByRole(role);
    }

    // 更新导航链接可见性
    updateNavigationVisibility(role);

    // 保存到本地存储
    localStorage.setItem('userRole', role);

    // 触发角色更改事件，让其他组件可以响应
    const roleChangeEvent = new CustomEvent('roleChanged', {
        detail: { role: role }
    });
    document.dispatchEvent(roleChangeEvent);

    // 根据角色和当前页面决定是否需要跳转
    const currentPage = window.location.pathname.split('/').pop().split('.')[0];

    // 设置一个延迟，确保UI先更新完成
    setTimeout(() => {
        if (role === '供应商') {
            if (currentPage === 'supply') {
                // 供应商不应该看到供应大厅，跳转到需求大厅
                console.log('角色为供应商，跳转到需求大厅');
                window.location.href = 'demand.html';
            }
        } else if (role === '采购商') {
            if (currentPage === 'demand') {
                // 采购商不应该看到需求大厅，跳转到供应大厅
                console.log('角色为采购商，跳转到供应大厅');
                window.location.href = 'supply.html';
            }
        }
    }, 100);
} 