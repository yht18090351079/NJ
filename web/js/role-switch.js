/**
 * 角色切换功能
 * 在所有页面共享使用的角色切换逻辑
 */

// 当前选中的角色
let selectedRole = null;

// 角色切换函数 - 显示角色模态框
function showRoleModal() {
    const roleModal = document.getElementById('roleModal');
    if (roleModal) {
        roleModal.style.display = 'block';
        roleModal.classList.add('active'); // 添加active类以确保可见性

        // 获取当前角色
        const currentRole = document.getElementById('currentRole').textContent;

        // 设置选中的角色选项
        const roleOptions = document.querySelectorAll('.role-option');
        roleOptions.forEach(option => {
            if (option.getAttribute('data-role') === currentRole) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
}

// 关闭角色模态框
function closeRoleModal() {
    const roleModal = document.getElementById('roleModal');
    if (roleModal) {
        roleModal.style.display = 'none';
        roleModal.classList.remove('active'); // 移除active类
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

// 根据角色更新导航链接的可见性 - 不再需要，使用交易大厅统一入口
function updateNavigationVisibility(role) {
    console.log('[Role Modal Debug] 角色已更新为:', role);
    // 更新交易大厅链接文本和图标 - 如果函数存在
    if (typeof updateTradeHallLinkText === 'function') {
        updateTradeHallLinkText(role);
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

        // 更新交易大厅入口
        updateNavigationVisibility(savedRole);
    } else {
        // 设置默认角色为采购商
        localStorage.setItem('userRole', '采购商');
        const currentRoleElement = document.getElementById('currentRole');
        if (currentRoleElement) {
            currentRoleElement.textContent = '采购商';
        }

        // 更新交易大厅入口
        updateNavigationVisibility('采购商');
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
document.addEventListener('DOMContentLoaded', function () {
    // 初始化角色切换功能
    initRoleSwitch();

    // 确保在页面加载后立即更新导航显示
    const currentRole = localStorage.getItem('userRole') || '采购商';
    updateNavigationVisibility(currentRole);
});

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