# 角色切换功能集成说明

本文档说明如何在所有页面中集成角色切换功能。

## 功能说明

角色切换系统提供了以下功能：

1. 用户可以在采购商和供应商两个角色之间切换
2. 角色切换需要点击"确认切换"按钮后才会生效
3. 角色信息在本地存储中保存，在所有页面间共享
4. **导航菜单根据用户角色自动调整：**
   - 采购商可以看到供应大厅，但看不到需求大厅
   - 供应商可以看到需求大厅，但看不到供应大厅
5. 如果用户访问了与其角色不符的页面，将自动跳转到合适的页面：
   - 供应商访问供应大厅会自动跳转到需求大厅
   - 采购商访问需求大厅会自动跳转到供应大厅

## 步骤一：添加角色切换HTML结构

在每个页面的 `utility-components` 区域内添加以下HTML代码：

```html
<!-- 角色切换模态框 -->
<div class="role-modal" id="roleModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>切换角色</h3>
            <button type="button" class="close-btn" id="roleModalCloseBtn" onclick="closeRoleModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
            <div class="role-options">
                <div class="role-option" data-role="采购商" onclick="selectRoleOption(this)">
                    <i class="fas fa-shopping-cart"></i>
                    <div class="role-option-info">
                        <h4>采购商</h4>
                        <p>发布农产品采购需求</p>
                    </div>
                </div>
                <div class="role-option" data-role="供应商" onclick="selectRoleOption(this)">
                    <i class="fas fa-store"></i>
                    <div class="role-option-info">
                        <h4>供应商</h4>
                        <p>发布农产品供应信息</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-confirm" id="roleModalConfirmBtn" onclick="confirmRoleChange()">确认切换</button>
        </div>
    </div>
</div>
```

## 步骤二：添加角色切换按钮

在页面的导航栏中添加角色切换按钮：

```html
<div class="header-icons">
    <div class="role-switch" onclick="showRoleModal(); return false;">
        <i class="fas fa-exchange-alt"></i>
        <span id="currentRole" onclick="showRoleModal(); event.stopPropagation(); return false;">采购商</span>
    </div>
    <!-- 其他头部图标 -->
</div>
```

## 步骤三：引入JavaScript文件

在页面底部，在其他JS文件之后添加角色切换的JavaScript文件：

```html
<script src="js/role-switch.js"></script>
```

## 步骤四：确保CSS样式正确

确保在样式表中包含了角色模态框的样式。如果没有，需要添加以下CSS样式：

```css
/* 角色切换模态框样式 */
.role-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    justify-content: center;
    align-items: center;
}

.role-modal .modal-content {
    background-color: white;
    border-radius: 8px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.role-modal .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
}

.role-modal .modal-header h3 {
    margin: 0;
    font-size: 18px;
    color: var(--text-primary);
}

.role-modal .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #999;
}

.role-modal .modal-body {
    padding: 20px;
}

.role-modal .role-options {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.role-modal .role-option {
    display: flex;
    align-items: center;
    padding: 15px;
    border: 2px solid #eee;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.role-modal .role-option:hover {
    border-color: var(--primary-color-light);
    background-color: var(--bg-hover);
}

.role-modal .role-option.active {
    border-color: var(--primary-color);
    background-color: var(--primary-color-light-bg);
}

.role-modal .role-option i {
    font-size: 24px;
    margin-right: 15px;
    color: var(--primary-color);
}

.role-modal .role-option-info h4 {
    margin: 0 0 5px 0;
    font-size: 16px;
    color: var(--text-primary);
}

.role-modal .role-option-info p {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary);
}

.role-modal .modal-footer {
    padding: 15px 20px;
    border-top: 1px solid #eee;
    text-align: right;
}

.role-modal .btn-confirm {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 20px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.role-modal .btn-confirm:hover {
    background-color: var(--primary-color-dark);
}
```

## 完成

完成上述步骤后，角色切换功能将在所有页面上正常工作。当用户点击角色切换按钮时，将显示角色选择模态框，并且只有在用户点击"确认切换"按钮后才会应用更改。

系统会根据角色自动调整导航菜单和页面访问，确保：
- 供应商看不见供应大厅选项，只能访问需求大厅
- 采购商看不见需求大厅选项，只能访问供应大厅

这样，每种角色都只能看到与自己相关的内容。 