/**
 * 批注组件功能
 * 实现类似Axure的批注功能
 */

class AnnotationManager {
    constructor() {
        this.annotations = [];
        this.currentId = 1;
        this.isEditing = false;
        this.activeAnnotation = null;
        this.currentUnsavedMarker = null; // 跟踪当前未保存的标记
        this.tempId = 'temp'; // 临时批注使用固定的ID
        this.visibleContentId = null; // 当前显示的内容ID
        this.password = ''; // 当前密码
        this.correctPassword = '0318'; // 正确的密码，默认值
        this.lastSaveTime = null;
        this.autoSaveTimer = null;
        this.fileHandle = null;
        this.hasAskedForFileAccess = false;
        this.passwordLoaded = false; // 是否已从文件加载密码
        this.annotationFileName = null; // 批注文件名

        // 绑定方法到实例
        this.toggleEditMode = this.toggleEditMode.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.hideAllAnnotations = this.hideAllAnnotations.bind(this);
        this.validatePassword = this.validatePassword.bind(this);
        this.setPassword = this.setPassword.bind(this);

        // 创建批注层，所有批注标记将添加到这一层
        this.createAnnotationLayer();

        // 添加事件监听
        document.addEventListener('click', this.handleClick);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cancelCurrentAnnotation();
                this.hideAllAnnotations();
            }
        });

        // 监听窗口大小变化和滚动，重新定位所有元素
        window.addEventListener('resize', this.repositionAllElements.bind(this));
        window.addEventListener('scroll', this.repositionAllElements.bind(this), true);

        // 定时检查位置更新
        setInterval(this.repositionAllElements.bind(this), 500);

        // 尝试从localStorage加载密码
        this.loadPasswordFromLocalStorage();
    }

    /**
     * 设置密码
     * @param {string} password - 用户输入的密码
     */
    setPassword(password) {
        this.password = password;
        this.passwordLoaded = true;
    }

    /**
     * 从文件加载密码
     * @param {File} file - 密码文件
     */
    loadPasswordFromFile(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                // 读取文件内容并去除空白字符
                const content = e.target.result.trim();

                if (content) {
                    // 设置密码为文件内容
                    this.correctPassword = content;
                    this.password = content; // 自动填充当前密码
                    this.passwordLoaded = true;

                    // 保存到localStorage以便下次使用
                    localStorage.setItem('annotationPassword', content);

                    this.showSuccessMessage('密码已从文件加载');

                    // 更新按钮状态
                    const passwordBtn = document.getElementById('annotation-password-file');
                    if (passwordBtn) {
                        passwordBtn.classList.add('active');
                        passwordBtn.title = '密码已加载';
                    }
                } else {
                    this.showErrorMessage('密码文件为空');
                }
            } catch (error) {
                console.error('读取密码文件失败', error);
                this.showErrorMessage('读取密码文件失败');
            }
        };

        reader.onerror = () => {
            this.showErrorMessage('无法读取密码文件');
        };

        // 读取文件内容
        reader.readAsText(file);
    }

    /**
     * 从localStorage加载密码
     */
    loadPasswordFromLocalStorage() {
        const savedPassword = localStorage.getItem('annotationPassword');
        if (savedPassword) {
            this.correctPassword = savedPassword;
            this.password = savedPassword;
            this.passwordLoaded = true;

            // 更新按钮状态
            setTimeout(() => {
                const passwordBtn = document.getElementById('annotation-password-file');
                if (passwordBtn) {
                    passwordBtn.classList.add('active');
                    passwordBtn.title = '密码已加载';
                }
            }, 100);
        }
    }

    /**
     * 验证密码
     * @returns {boolean} - 密码是否正确
     */
    validatePassword() {
        // 如果未加载密码，提示选择密码文件
        if (!this.passwordLoaded) {
            this.showErrorMessage('请先选择密码文件');
            return false;
        }

        const isValid = this.password === this.correctPassword;
        if (!isValid) {
            this.showPasswordError();
        }
        return isValid;
    }

    /**
     * 显示密码错误提示
     */
    showPasswordError() {
        const errorToast = document.createElement('div');
        errorToast.className = 'annotation-error-toast';
        errorToast.textContent = '密码错误，无法进行操作！';
        document.body.appendChild(errorToast);

        // 2秒后自动移除提示
        setTimeout(() => {
            errorToast.classList.add('fade-out');
            setTimeout(() => {
                errorToast.remove();
            }, 500);
        }, 2000);
    }

    /**
     * 创建批注层
     */
    createAnnotationLayer() {
        // 检查是否已存在
        let layer = document.getElementById('annotation-layer');

        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'annotation-layer';
            layer.style.position = 'absolute'; // 使用绝对定位而非固定定位
            layer.style.top = '0';
            layer.style.left = '0';
            layer.style.width = '100%';
            layer.style.height = '100%';
            layer.style.pointerEvents = 'none'; // 允许点击穿透
            layer.style.zIndex = '9999'; // 非常高的z-index
            document.body.appendChild(layer);
        }

        this.annotationLayer = layer;
    }

    /**
     * 切换编辑模式
     */
    toggleEditMode() {
        // 检查密码是否正确
        if (!this.validatePassword()) {
            return;
        }

        this.isEditing = !this.isEditing;
        document.body.style.cursor = this.isEditing ? 'crosshair' : '';

        // 通知状态变化
        const event = new CustomEvent('annotation-mode-change', {
            detail: { isEditing: this.isEditing }
        });
        document.dispatchEvent(event);

        // 更新编辑按钮状态
        const toggleBtn = document.getElementById('annotation-toggle');
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', this.isEditing);
        }

        // 如果关闭编辑模式，取消当前未保存的批注
        if (!this.isEditing) {
            this.cancelCurrentAnnotation();
        }
    }

    /**
     * 处理点击事件
     * @param {MouseEvent} e - 鼠标事件对象
     */
    handleClick(e) {
        // 检查是否点击了工具栏按钮，如果是则跳过处理
        if (e.target.closest('.annotation-toolbar')) {
            return;
        }

        // 检查是否点击了批注标记
        if (e.target.closest('.annotation-marker')) {
            return;
        }

        // 检查是否点击了批注内容区域
        if (e.target.closest('.annotation-content')) {
            return;
        }

        // 处理未保存的批注情况
        if (this.currentUnsavedMarker) {
            // 如果有未保存的批注，点击其他地方时应该取消它
            this.cancelCurrentAnnotation();

            // 如果在编辑模式中，继续创建新批注
            if (this.isEditing) {
                const targetElement = e.target;
                this.createAnnotation(e.clientX, e.clientY, targetElement);
                return;
            }
        } else if (this.isEditing) {
            // 如果处于编辑模式且没有未保存的批注，创建新批注
            const targetElement = e.target;
            this.createAnnotation(e.clientX, e.clientY, targetElement);
            return;
        }

        // 点击其他区域时，隐藏所有批注内容
        this.hideAllAnnotations();
    }

    /**
     * 取消当前未保存的批注
     */
    cancelCurrentAnnotation() {
        if (this.currentUnsavedMarker) {
            // 删除未保存的标记
            this.currentUnsavedMarker.remove();
            this.currentUnsavedMarker = null;

            // 隐藏相关的编辑表单
            const tempContent = document.querySelector(`.annotation-content[data-id="${this.tempId}"]`);
            if (tempContent) {
                tempContent.remove();
            }
        }
    }

    /**
     * 创建新批注
     * @param {number} x - 横坐标（客户端坐标）
     * @param {number} y - 纵坐标（客户端坐标）
     * @param {HTMLElement} targetElement - 点击的目标元素
     */
    createAnnotation(x, y, targetElement) {
        // 检查密码是否正确
        if (!this.validatePassword()) {
            return;
        }

        // 取消之前未保存的批注
        this.cancelCurrentAnnotation();

        // 使用临时ID，只有在保存时才分配真正的ID
        const id = this.tempId;

        // 获取目标元素的位置信息（相对于视口）
        const targetRect = targetElement.getBoundingClientRect();

        // 记录目标元素和页面滚动偏移
        const targetInfo = {
            element: targetElement,
            selector: this.getElementSelector(targetElement),
            // 保存目标元素的尺寸
            width: targetRect.width,
            height: targetRect.height,
            // 点击相对位置的百分比
            percentX: ((x - targetRect.left) / targetRect.width) * 100,
            percentY: ((y - targetRect.top) / targetRect.height) * 100
        };

        // 创建标记元素
        const marker = document.createElement('div');
        marker.className = 'annotation-marker';
        marker.textContent = '...'; // 临时显示省略号
        marker.dataset.id = id;
        marker.dataset.temp = 'true'; // 标记为临时
        marker.style.pointerEvents = 'auto'; // 允许点击

        // 跟踪当前未保存的标记
        this.currentUnsavedMarker = marker;

        // 添加到批注层
        this.annotationLayer.appendChild(marker);

        // 定位标记
        this.positionMarker(marker, targetInfo);

        // 创建内容容器
        const content = document.createElement('div');
        content.className = 'annotation-content';
        content.dataset.id = id;
        content.dataset.temp = 'true'; // 标记为临时
        content.style.position = 'absolute'; // 使用绝对定位而非固定定位

        // 创建关闭按钮
        const closeBtn = document.createElement('div');
        closeBtn.className = 'annotation-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.cancelCurrentAnnotation(); // 关闭按钮也取消批注
        });

        // 创建编辑表单
        const form = document.createElement('div');
        form.className = 'annotation-form';

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.placeholder = '输入批注标题';
        titleInput.className = 'annotation-title-input';

        const textArea = document.createElement('textarea');
        textArea.placeholder = '输入批注内容';
        textArea.className = 'annotation-text-input';
        textArea.rows = Math.min(10, Math.max(3, 3)); // 默认3行

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存';
        saveBtn.className = 'annotation-save-btn';
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            // 再次验证密码
            if (!this.validatePassword()) {
                return;
            }

            // 获取批注内容
            const title = titleInput.value.trim() || `批注 ${this.currentId}`;
            const text = textArea.value.trim() || '无内容';

            // 分配真正的ID并递增ID计数器
            const newId = this.currentId++;

            // 更新批注对象
            const annotation = {
                id: newId,
                targetInfo,
                title,
                text,
                direction: this.getOptimalDirection(marker) // 保存当前方向
            };

            // 更新标记和内容的ID
            marker.dataset.id = newId;
            marker.textContent = newId; // 设置显示的序号
            content.dataset.id = newId;

            // 将临时标记转为永久标记
            marker.removeAttribute('data-temp');
            content.removeAttribute('data-temp');
            this.currentUnsavedMarker = null;

            this.annotations.push(annotation);
            this.renderAnnotationContent(content, annotation);
            this.saveAnnotations();

            // 定位内容框
            this.positionContent(content, marker, annotation.direction);

            // 显示内容
            this.hideAllAnnotations();
            content.classList.add('visible');
            this.visibleContentId = newId;
        });

        form.appendChild(titleInput);
        form.appendChild(textArea);
        form.appendChild(saveBtn);

        content.appendChild(closeBtn);
        content.appendChild(form);

        // 添加内容到DOM
        document.body.appendChild(content);

        // 计算并设置内容位置
        const direction = this.getOptimalDirection(marker);
        this.positionContent(content, marker, direction);

        // 显示内容并设置焦点
        this.hideAllAnnotations();
        content.classList.add('visible');
        this.visibleContentId = id;
        titleInput.focus();

        // 添加标记点击事件
        marker.addEventListener('click', (e) => {
            e.stopPropagation();
            // 如果是临时标记，不处理点击事件
            if (marker.dataset.temp) return;

            const id = marker.dataset.id;
            const content = document.querySelector(`.annotation-content[data-id="${id}"]`);

            if (!content) return;

            if (content.classList.contains('visible')) {
                content.classList.remove('visible');
                this.visibleContentId = null;
            } else {
                this.hideAllAnnotations();
                // 更新内容位置
                const annotation = this.annotations.find(a => a.id == id);
                const direction = annotation ? annotation.direction : this.getOptimalDirection(marker);
                this.positionContent(content, marker, direction);
                content.classList.add('visible');
                this.visibleContentId = id;
            }
        });
    }

    /**
     * 定位批注标记
     * @param {HTMLElement} marker - 批注标记元素
     * @param {Object} targetInfo - 目标元素信息
     */
    positionMarker(marker, targetInfo) {
        // 获取目标元素当前位置
        const rect = targetInfo.element.getBoundingClientRect();

        // 计算标记实际位置（页面坐标）
        const markerX = window.scrollX + rect.left + (rect.width * targetInfo.percentX / 100);
        const markerY = window.scrollY + rect.top + (rect.height * targetInfo.percentY / 100);

        // 设置标记位置
        marker.style.position = 'absolute'; // 使用绝对定位
        marker.style.left = `${markerX}px`;
        marker.style.top = `${markerY}px`;

        // 如果有关联的内容框且可见，也更新其位置
        const id = marker.dataset.id;
        if (id && id === this.visibleContentId) {
            const content = document.querySelector(`.annotation-content[data-id="${id}"]`);
            if (content && content.classList.contains('visible')) {
                const annotation = this.annotations.find(a => a.id == id);
                const direction = annotation ? annotation.direction : this.getOptimalDirection(marker);
                this.positionContent(content, marker, direction);
            }
        }
    }

    /**
     * 获取最佳方向
     * @param {HTMLElement} marker - 批注标记元素
     * @returns {string} 方向
     */
    getOptimalDirection(marker) {
        // 获取标记位置
        const markerRect = marker.getBoundingClientRect();
        const markerX = markerRect.left + markerRect.width / 2;
        const markerY = markerRect.top + markerRect.height / 2;

        // 获取视口尺寸
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 内容宽高
        const contentWidth = 300; // 最大宽度
        const contentHeight = 200; // 估计高度

        // 计算四个方向的可用空间
        const rightSpace = viewportWidth - markerX;
        const leftSpace = markerX;
        const topSpace = markerY;
        const bottomSpace = viewportHeight - markerY;

        // 创建方向和空间的映射，从大到小排序
        const spaces = [
            { direction: 'right', space: rightSpace - 30 },
            { direction: 'left', space: leftSpace - contentWidth - 30 },
            { direction: 'bottom', space: bottomSpace - 30 },
            { direction: 'top', space: topSpace - contentHeight - 30 }
        ].sort((a, b) => b.space - a.space);

        // 优先选择空间最大的方向
        const bestOption = spaces[0];

        // 检查最佳方向是否有足够空间
        if (bestOption.space > 50) {
            return bestOption.direction;
        }

        // 如果所有方向空间都不理想，选择相对较好的
        if (rightSpace > leftSpace && rightSpace > topSpace && rightSpace > bottomSpace) {
            return 'right';
        } else if (leftSpace > topSpace && leftSpace > bottomSpace) {
            return 'left';
        } else if (bottomSpace > topSpace) {
            return 'bottom';
        } else {
            return 'top';
        }
    }

    /**
     * 定位内容框
     * @param {HTMLElement} content - 内容框元素
     * @param {HTMLElement} marker - 批注标记元素
     * @param {string} direction - 方向
     */
    positionContent(content, marker, direction) {
        // 获取标记位置（页面坐标）
        const markerRect = marker.getBoundingClientRect();
        const markerX = window.scrollX + markerRect.left + markerRect.width / 2;
        const markerY = window.scrollY + markerRect.top + markerRect.height / 2;

        // 获取视口尺寸和滚动位置
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        // 最小尺寸和最大尺寸
        const minWidth = 280;
        const maxWidth = Math.min(500, viewportWidth - 40);
        const maxHeight = viewportHeight - 80;

        // 先清除可能影响尺寸的样式
        content.style.width = '';
        content.style.height = '';
        content.style.maxWidth = `${maxWidth}px`;
        content.style.maxHeight = `${maxHeight}px`;
        content.style.minWidth = `${minWidth}px`;

        // 为了测量实际尺寸，我们需要临时显示内容但保持不可见
        const originalDisplay = content.style.display;
        const originalVisibility = content.style.visibility;
        content.style.display = 'block';
        content.style.visibility = 'hidden';
        content.style.position = 'absolute';
        content.style.left = '-9999px';
        content.style.top = '-9999px';

        // 测量实际尺寸
        const contentWidth = Math.max(minWidth, Math.min(content.offsetWidth, maxWidth));
        const contentHeight = Math.min(content.scrollHeight, maxHeight);

        // 恢复原始设置
        content.style.display = originalDisplay;
        content.style.visibility = originalVisibility;
        content.style.left = '';
        content.style.top = '';

        // 移除之前的方向类
        content.classList.remove('right', 'left', 'top', 'bottom');

        // 找到最佳方向
        let finalDirection = direction;

        // 检查每个方向的可用空间
        const rightSpace = viewportWidth - (markerRect.right) - 20;
        const leftSpace = markerRect.left - 20;
        const topSpace = markerRect.top - 20;
        const bottomSpace = (viewportHeight - markerRect.bottom) - 20;

        // 如果指定方向的空间不足，找一个更好的方向
        if ((direction === 'right' && rightSpace < contentWidth) ||
            (direction === 'left' && leftSpace < contentWidth) ||
            (direction === 'top' && topSpace < contentHeight) ||
            (direction === 'bottom' && bottomSpace < contentHeight)) {

            // 找到最大的可用空间
            const spaces = [
                { dir: 'right', space: rightSpace, required: contentWidth },
                { dir: 'left', space: leftSpace, required: contentWidth },
                { dir: 'top', space: topSpace, required: contentHeight },
                { dir: 'bottom', space: bottomSpace, required: contentHeight }
            ];

            // 排序找到空间最充足的方向
            spaces.sort((a, b) => (b.space - b.required) - (a.space - a.required));

            if (spaces[0].space >= spaces[0].required) {
                finalDirection = spaces[0].dir;
            }
            // 如果没有理想的方向，使用默认的并让边界检查来处理
        }

        // 根据方向计算初始位置
        let posX, posY;

        switch (finalDirection) {
            case 'right':
                posX = markerX + 15;
                posY = markerY - contentHeight / 2;
                content.classList.add('right');
                break;
            case 'left':
                posX = markerX - contentWidth - 15;
                posY = markerY - contentHeight / 2;
                content.classList.add('left');
                break;
            case 'bottom':
                posX = markerX - contentWidth / 2;
                posY = markerY + 15;
                content.classList.add('bottom');
                break;
            case 'top':
            default:
                posX = markerX - contentWidth / 2;
                posY = markerY - contentHeight - 15;
                content.classList.add('top');
                break;
        }

        // 确保内容框在视口内显示
        // 转换为viewport坐标
        let viewportPosX = posX - scrollX;
        let viewportPosY = posY - scrollY;

        // 水平方向边界检查和调整
        if (viewportPosX < 10) {
            viewportPosX = 10;
        } else if (viewportPosX + contentWidth > viewportWidth - 10) {
            viewportPosX = viewportWidth - contentWidth - 10;
        }

        // 垂直方向边界检查和调整
        if (viewportPosY < 10) {
            viewportPosY = 10;
        } else if (viewportPosY + contentHeight > viewportHeight - 10) {
            viewportPosY = viewportHeight - contentHeight - 10;
        }

        // 转回页面坐标
        posX = viewportPosX + scrollX;
        posY = viewportPosY + scrollY;

        // 设置最终位置和尺寸
        content.style.position = 'absolute';
        content.style.left = `${posX}px`;
        content.style.top = `${posY}px`;
        content.style.width = `${contentWidth}px`;
        content.style.overflowY = 'auto';
    }

    /**
     * 重新定位所有元素
     */
    repositionAllElements() {
        // 重新定位所有标记
        this.annotations.forEach(annotation => {
            const marker = document.querySelector(`.annotation-marker[data-id="${annotation.id}"]:not([data-temp])`);
            if (marker) {
                this.positionMarker(marker, annotation.targetInfo);
            }
        });

        // 重新定位临时标记和内容
        if (this.currentUnsavedMarker) {
            const id = this.currentUnsavedMarker.dataset.id;
            const content = document.querySelector(`.annotation-content[data-id="${id}"][data-temp]`);
            if (content) {
                // 找到相关标记的目标元素信息
                // 从绝对位置计算回相对位置
                const markerX = parseFloat(this.currentUnsavedMarker.style.left) - window.scrollX;
                const markerY = parseFloat(this.currentUnsavedMarker.style.top) - window.scrollY;

                const targetElement = document.elementFromPoint(markerX, markerY);
                if (targetElement) {
                    const targetRect = targetElement.getBoundingClientRect();
                    const targetInfo = {
                        element: targetElement,
                        selector: this.getElementSelector(targetElement),
                        width: targetRect.width,
                        height: targetRect.height,
                        percentX: ((markerX - targetRect.left) / targetRect.width) * 100,
                        percentY: ((markerY - targetRect.top) / targetRect.height) * 100
                    };

                    this.positionMarker(this.currentUnsavedMarker, targetInfo);
                    const direction = this.getOptimalDirection(this.currentUnsavedMarker);
                    this.positionContent(content, this.currentUnsavedMarker, direction);
                }
            }
        }
    }

    /**
     * 生成元素的选择器
     * @param {HTMLElement} element - 要生成选择器的元素
     * @returns {string} 选择器
     */
    getElementSelector(element) {
        // 简单实现，仅使用ID、类名和标签名
        if (element.id) {
            return `#${element.id}`;
        }

        let selector = element.tagName.toLowerCase();
        if (element.className) {
            const classNames = element.className.split(' ').filter(c => c.trim());
            if (classNames.length > 0) {
                selector += `.${classNames[0]}`;
            }
        }

        // 添加一些唯一性标识符（如顺序索引）
        const siblings = Array.from(element.parentNode.children);
        const index = siblings.indexOf(element);
        selector += `:nth-child(${index + 1})`;

        return selector;
    }

    /**
     * 渲染批注内容
     * @param {HTMLElement} contentElement - 内容容器元素
     * @param {Object} annotation - 批注对象
     */
    renderAnnotationContent(contentElement, annotation) {
        // 清空内容
        contentElement.innerHTML = '';

        // 创建关闭按钮
        const closeBtn = document.createElement('div');
        closeBtn.className = 'annotation-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideAnnotation(annotation.id);
        });

        // 创建标题
        const title = document.createElement('div');
        title.className = 'annotation-title';
        title.textContent = annotation.title;

        // 创建内容
        const text = document.createElement('div');
        text.className = 'annotation-text';
        text.textContent = annotation.text;

        // 创建操作区域
        const actions = document.createElement('div');
        actions.className = 'annotation-actions';

        // 添加编辑按钮
        const editBtn = document.createElement('button');
        editBtn.className = 'annotation-edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.validatePassword()) {
                return;
            }
            this.editAnnotation(annotation.id);
        });

        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'annotation-delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 删除';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.validatePassword()) {
                return;
            }
            // 显示删除确认弹窗
            this.showDeleteConfirm(contentElement, annotation.id);
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        // 添加到容器
        contentElement.appendChild(closeBtn);
        contentElement.appendChild(title);
        contentElement.appendChild(text);
        contentElement.appendChild(actions);
    }

    /**
     * 显示删除确认弹窗
     * @param {HTMLElement} contentElement - 内容容器元素
     * @param {number} id - 批注ID
     */
    showDeleteConfirm(contentElement, id) {
        // 创建确认弹窗元素
        const confirmWrapper = document.createElement('div');
        confirmWrapper.className = 'annotation-confirm-wrapper';

        confirmWrapper.innerHTML = `
            <div class="annotation-confirm-box">
                <div class="annotation-confirm-text">确定要删除这条批注吗？</div>
                <div class="annotation-confirm-btns">
                    <button class="annotation-confirm-yes">删除</button>
                    <button class="annotation-confirm-no">取消</button>
                </div>
            </div>
        `;

        // 添加到批注内容区域
        contentElement.appendChild(confirmWrapper);

        // 添加动画类
        setTimeout(() => {
            confirmWrapper.classList.add('active');
        }, 10);

        // 删除按钮事件
        const confirmYesBtn = confirmWrapper.querySelector('.annotation-confirm-yes');
        confirmYesBtn.addEventListener('click', () => {
            // 移除确认弹窗
            confirmWrapper.classList.remove('active');

            // 延迟删除操作，等待动画完成
            setTimeout(() => {
                confirmWrapper.remove();
                this.deleteAnnotation(id);
            }, 200);
        });

        // 取消按钮事件
        const confirmNoBtn = confirmWrapper.querySelector('.annotation-confirm-no');
        confirmNoBtn.addEventListener('click', () => {
            // 移除确认弹窗
            confirmWrapper.classList.remove('active');

            setTimeout(() => {
                confirmWrapper.remove();
            }, 200);
        });

        // 点击弹窗外部也可取消（可选功能）
        confirmWrapper.addEventListener('click', (e) => {
            if (e.target === confirmWrapper) {
                confirmWrapper.classList.remove('active');

                setTimeout(() => {
                    confirmWrapper.remove();
                }, 200);
            }
        });
    }

    /**
     * 进入批注编辑模式
     * @param {number} id - 批注ID
     */
    editAnnotation(id) {
        // 检查密码是否正确
        if (!this.validatePassword()) {
            return;
        }

        // 找到对应的批注
        const annotation = this.annotations.find(anno => anno.id === id);
        if (!annotation) return;

        const contentElement = document.querySelector(`.annotation-content[data-id="${id}"]`);
        if (!contentElement) return;

        // 找到对应的标记
        const marker = document.querySelector(`.annotation-marker[data-id="${id}"]`);
        if (!marker) return;

        // 清空内容元素
        contentElement.innerHTML = '';

        // 创建关闭按钮
        const closeBtn = document.createElement('div');
        closeBtn.className = 'annotation-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideAnnotation(id);
            // 重新渲染内容，取消编辑模式
            this.renderAnnotationContent(contentElement, annotation);
        });

        // 创建编辑表单
        const form = document.createElement('div');
        form.className = 'annotation-form';

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = annotation.title || '';
        titleInput.placeholder = '输入批注标题';
        titleInput.className = 'annotation-title-input';

        const textArea = document.createElement('textarea');
        textArea.value = annotation.text || '';
        textArea.placeholder = '输入批注内容';
        textArea.className = 'annotation-text-input';
        textArea.rows = Math.min(10, Math.max(3, (annotation.text || '').split('\n').length)); // 根据内容行数自动调整

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存';
        saveBtn.className = 'annotation-save-btn';
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            // 再次验证密码
            if (!this.validatePassword()) {
                return;
            }

            // 获取更新的内容
            const title = titleInput.value.trim() || `批注 ${annotation.id}`;
            const text = textArea.value.trim() || '无内容';

            // 更新批注对象
            annotation.title = title;
            annotation.text = text;

            // 重新渲染内容
            this.renderAnnotationContent(contentElement, annotation);

            // 根据新内容调整位置和大小
            const direction = annotation.direction || this.getOptimalDirection(marker);
            this.positionContent(contentElement, marker, direction);

            // 保存更新
            this.saveAnnotations();
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.className = 'annotation-cancel-btn';
        cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // 重新渲染内容，取消编辑模式
            this.renderAnnotationContent(contentElement, annotation);

            // 恢复原始位置
            const direction = annotation.direction || this.getOptimalDirection(marker);
            this.positionContent(contentElement, marker, direction);
        });

        form.appendChild(titleInput);
        form.appendChild(textArea);

        const btnGroup = document.createElement('div');
        btnGroup.className = 'annotation-btn-group';
        btnGroup.appendChild(saveBtn);
        btnGroup.appendChild(cancelBtn);
        form.appendChild(btnGroup);

        contentElement.appendChild(closeBtn);
        contentElement.appendChild(form);

        // 调整文本区域的高度，根据内容自动伸展
        textArea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        // 触发一次input事件，初始化高度
        const inputEvent = new Event('input');
        textArea.dispatchEvent(inputEvent);

        // 调整窗口位置和大小
        const direction = annotation.direction || this.getOptimalDirection(marker);
        this.positionContent(contentElement, marker, direction);

        // 设置输入焦点
        titleInput.focus();
    }

    /**
     * 切换批注内容显示状态
     * @param {number} id - 批注ID
     */
    toggleAnnotationContent(id) {
        const contentElement = document.querySelector(`.annotation-content[data-id="${id}"]`);
        const marker = document.querySelector(`.annotation-marker[data-id="${id}"]`);

        if (!contentElement || !marker) return;

        if (contentElement.classList.contains('visible')) {
            contentElement.classList.remove('visible');
            this.visibleContentId = null;
        } else {
            this.hideAllAnnotations();
            // 获取注释对象
            const annotation = this.annotations.find(a => a.id == id);
            // 更新内容位置
            const direction = annotation ? annotation.direction : this.getOptimalDirection(marker);
            this.positionContent(contentElement, marker, direction);
            contentElement.classList.add('visible');
            this.visibleContentId = id;
        }
    }

    /**
     * 隐藏特定批注内容
     * @param {number} id - 批注ID
     */
    hideAnnotation(id) {
        const contentElement = document.querySelector(`.annotation-content[data-id="${id}"]`);

        if (contentElement) {
            contentElement.classList.remove('visible');
            if (this.visibleContentId === id) {
                this.visibleContentId = null;
            }
        }
    }

    /**
     * 隐藏所有批注内容
     */
    hideAllAnnotations() {
        const contentElements = document.querySelectorAll('.annotation-content');

        contentElements.forEach(element => {
            element.classList.remove('visible');
        });

        this.visibleContentId = null;
    }

    /**
     * 删除批注
     * @param {number} id - 批注ID
     */
    deleteAnnotation(id) {
        // 检查密码是否正确
        if (!this.validatePassword()) {
            return;
        }

        // 找到批注对象
        const index = this.annotations.findIndex(anno => anno.id === id);

        if (index !== -1) {
            // 从数组中移除
            this.annotations.splice(index, 1);

            // 移除DOM元素
            const marker = document.querySelector(`.annotation-marker[data-id="${id}"]`);
            const content = document.querySelector(`.annotation-content[data-id="${id}"]`);

            if (marker) marker.remove();
            if (content) content.remove();

            if (this.visibleContentId === id) {
                this.visibleContentId = null;
            }

            // 重新排序剩余的批注序号
            this.reorderAnnotations();

            // 保存变更
            this.saveAnnotations();
        }
    }

    /**
     * 重新排序批注序号
     */
    reorderAnnotations() {
        // 按原始ID排序，确保顺序保持不变
        this.annotations.sort((a, b) => a.id - b.id);

        // 更新序号，从1开始
        this.annotations.forEach((annotation, index) => {
            const newId = index + 1;
            const oldId = annotation.id;

            // 只有当ID发生变化时才更新
            if (newId !== oldId) {
                // 更新批注对象ID
                annotation.id = newId;

                // 更新DOM中的ID和显示内容
                const marker = document.querySelector(`.annotation-marker[data-id="${oldId}"]`);
                const content = document.querySelector(`.annotation-content[data-id="${oldId}"]`);

                if (marker) {
                    marker.dataset.id = newId;
                    marker.textContent = newId;
                }

                if (content) {
                    content.dataset.id = newId;

                    // 如果标题是默认格式，也更新标题
                    const titleEl = content.querySelector('.annotation-title');
                    if (titleEl && titleEl.textContent.match(/^批注\s+\d+$/)) {
                        titleEl.textContent = `批注 ${newId}`;
                        annotation.title = `批注 ${newId}`;
                    }
                }

                // 如果是当前可见的内容，更新visibleContentId
                if (this.visibleContentId === oldId) {
                    this.visibleContentId = newId;
                }
            }
        });

        // 更新currentId为最大ID+1
        this.currentId = this.annotations.length + 1;
    }

    /**
     * 保存批注到本地存储和文件
     */
    saveAnnotations() {
        try {
            // 深拷贝批注对象，移除DOM元素引用
            const annotationsToSave = this.annotations.map(anno => {
                const copy = { ...anno };
                if (copy.targetInfo) {
                    copy.targetInfo = { ...copy.targetInfo };
                    delete copy.targetInfo.element; // 移除DOM元素引用
                }
                return copy;
            });

            // 将数据转换为JSON字符串
            const jsonData = JSON.stringify(annotationsToSave, null, 2);

            // 记录上次保存时间
            this.lastSaveTime = new Date().getTime();

            // 如果已设置文件句柄，自动保存到文件
            if (this.fileHandle) {
                this.writeToFileHandle(this.fileHandle, jsonData);
                // 显示自动保存指示器
                this.showAutoSaveIndicator();
            }
        } catch (error) {
            console.error('保存批注失败', error);
            this.showErrorMessage('自动保存失败: ' + error.message);
        }
    }

    /**
     * 请求文件系统访问权限 - 只在用户交互时调用
     */
    requestFileAccess() {
        if (this.validatePassword()) {
            this.hasAskedForFileAccess = true;

            // 使用预设的批注文件名
            const suggestedName = this.annotationFileName || `${this.getPageName()}_data.json`;

            this.requestFileSystem(suggestedName).then(fileHandle => {
                if (fileHandle) {
                    this.fileHandle = fileHandle;

                    // 设置成功后立即保存当前批注
                    this.saveAnnotations();
                    this.showSuccessMessage(`已设置批注文件: ${suggestedName}，批注会自动保存`);

                    // 更新按钮状态
                    const autosaveBtn = document.getElementById('annotation-autosave');
                    if (autosaveBtn) {
                        autosaveBtn.classList.remove('attention');
                        autosaveBtn.classList.add('active');
                        autosaveBtn.title = '批注文件已设置(自动保存)';
                    }
                }
            });
        }
    }

    /**
     * 请求文件系统访问权限
     * @param {string} suggestedName - 建议的文件名
     * @returns {Promise<FileSystemFileHandle|null>} 文件句柄
     */
    async requestFileSystem(suggestedName = 'annotations_data.json') {
        try {
            // 检查浏览器是否支持File System Access API
            if ('showSaveFilePicker' in window) {
                // 请求用户选择保存位置
                const options = {
                    suggestedName: suggestedName,
                    types: [{
                        description: '批注JSON文件',
                        accept: { 'application/json': ['.json'] }
                    }]
                };

                // 显示文件选择器
                this.showInfoMessage('请选择批注文件保存位置');
                const fileHandle = await window.showSaveFilePicker(options);
                return fileHandle;
            } else {
                this.showErrorMessage('您的浏览器不支持文件系统访问');
                return null;
            }
        } catch (error) {
            console.error('请求文件系统失败', error);
            // 用户取消选择不显示错误
            if (error.name !== 'AbortError') {
                this.showErrorMessage('无法访问文件系统: ' + error.message);
            }
            return null;
        }
    }

    /**
     * 写入数据到文件句柄
     * @param {FileSystemFileHandle} fileHandle - 文件句柄
     * @param {string} jsonData - 要写入的JSON数据
     */
    async writeToFileHandle(fileHandle, jsonData) {
        try {
            // 获取可写入的文件流
            const writable = await fileHandle.createWritable();

            // 写入数据
            await writable.write(jsonData);

            // 关闭文件流
            await writable.close();

            console.log('自动保存完成:', new Date().toLocaleTimeString());
        } catch (error) {
            console.error('写入文件失败', error);
            this.showErrorMessage('自动保存到文件失败: ' + error.message);
        }
    }

    /**
     * 显示信息提示消息
     * @param {string} message - 消息内容
     */
    showInfoMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'annotation-info-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // 显示时间稍长一些
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 3000);
    }

    /**
     * 显示自动保存指示器
     */
    showAutoSaveIndicator() {
        // 查找现有指示器或创建新的
        let indicator = document.querySelector('.annotation-autosave-indicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'annotation-autosave-indicator';
            document.body.appendChild(indicator);
        }

        // 显示保存状态和文件名
        indicator.textContent = `已保存到: ${this.annotationFileName} ${new Date().toLocaleTimeString()}`;
        indicator.classList.add('visible');

        // 短暂显示后隐藏
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            indicator.classList.remove('visible');
        }, 2000);
    }

    /**
     * 从本地存储加载批注
     */
    loadAnnotations() {
        try {
            const saved = localStorage.getItem('annotations');

            if (saved) {
                this.annotations = JSON.parse(saved);

                // 找到最大ID
                let maxId = 0;
                this.annotations.forEach(anno => {
                    maxId = Math.max(maxId, anno.id);
                    this.renderLoadedAnnotation(anno);
                });

                this.currentId = maxId + 1;
            }
        } catch (error) {
            console.error('加载批注失败', error);
        }
    }

    /**
     * 渲染已加载的批注
     * @param {Object} annotation - 批注对象
     */
    renderLoadedAnnotation(annotation) {
        // 查找目标元素
        const targetElement = document.querySelector(annotation.targetInfo.selector);

        if (!targetElement) {
            console.warn(`无法找到批注 ${annotation.id} 的目标元素: ${annotation.targetInfo.selector}`);
            return;
        }

        // 更新targetInfo中的DOM元素引用
        annotation.targetInfo.element = targetElement;

        // 创建标记元素
        const marker = document.createElement('div');
        marker.className = 'annotation-marker';
        marker.textContent = annotation.id;
        marker.dataset.id = annotation.id;
        marker.style.pointerEvents = 'auto'; // 允许点击
        marker.style.position = 'absolute'; // 使用绝对定位

        // 添加到批注层
        this.annotationLayer.appendChild(marker);

        // 定位标记
        this.positionMarker(marker, annotation.targetInfo);

        // 创建内容容器
        const content = document.createElement('div');
        content.className = 'annotation-content';
        content.dataset.id = annotation.id;
        content.style.position = 'absolute'; // 使用绝对定位

        // 渲染内容
        this.renderAnnotationContent(content, annotation);

        // 添加到DOM
        document.body.appendChild(content);

        // 设置初始位置
        const direction = annotation.direction || this.getOptimalDirection(marker);
        this.positionContent(content, marker, direction);

        // 添加标记点击事件
        marker.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleAnnotationContent(annotation.id);
        });
    }

    /**
     * 导出批注
     */
    exportAnnotations() {
        try {
            // 深拷贝批注对象，移除DOM元素引用
            const annotationsToSave = this.annotations.map(anno => {
                const copy = { ...anno };
                if (copy.targetInfo) {
                    copy.targetInfo = { ...copy.targetInfo };
                    delete copy.targetInfo.element; // 移除DOM元素引用
                }
                return copy;
            });

            // 将数据转换为JSON字符串
            const jsonData = JSON.stringify(annotationsToSave, null, 2);

            // 创建Blob对象
            const blob = new Blob([jsonData], { type: 'application/json' });

            // 生成文件名（使用当前页面的URL，去除特殊字符）
            const pageName = window.location.pathname.split('/').pop().replace(/\.[^/.]+$/, '') || 'page';
            const fileName = `annotations_${pageName}_${new Date().toISOString().slice(0, 10)}.json`;

            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;

            // 触发下载
            document.body.appendChild(link);
            link.click();

            // 清理
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);

            // 显示成功提示
            this.showSuccessMessage('批注已成功导出到文件');
        } catch (error) {
            console.error('导出批注失败', error);
            this.showErrorMessage('导出批注失败：' + error.message);
        }
    }

    /**
     * 导入批注
     * @param {File} file - 导入的批注文件
     */
    importAnnotations(file) {
        try {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    // 解析JSON数据
                    const importedAnnotations = JSON.parse(e.target.result);

                    // 验证导入的数据格式
                    if (!Array.isArray(importedAnnotations)) {
                        throw new Error('无效的批注文件格式');
                    }

                    // 清除当前所有批注
                    this.clearAllAnnotations();

                    // 导入新批注
                    this.annotations = importedAnnotations;

                    // 找到最大ID
                    let maxId = 0;
                    this.annotations.forEach(anno => {
                        maxId = Math.max(maxId, anno.id || 0);
                        // 渲染导入的批注
                        this.renderLoadedAnnotation(anno);
                    });

                    // 更新当前ID
                    this.currentId = maxId + 1;

                    // 保存到localStorage作为备份
                    this.saveAnnotations();

                    // 显示成功提示
                    this.showSuccessMessage(`已成功导入 ${importedAnnotations.length} 条批注`);
                } catch (error) {
                    console.error('解析批注文件失败', error);
                    this.showErrorMessage('解析批注文件失败：' + error.message);
                }
            };

            reader.onerror = () => {
                this.showErrorMessage('读取文件失败');
            };

            // 读取文件内容
            reader.readAsText(file);
        } catch (error) {
            console.error('导入批注失败', error);
            this.showErrorMessage('导入批注失败：' + error.message);
        }
    }

    /**
     * 清除所有批注
     */
    clearAllAnnotations() {
        // 移除所有批注标记和内容
        document.querySelectorAll('.annotation-marker').forEach(marker => marker.remove());
        document.querySelectorAll('.annotation-content').forEach(content => content.remove());

        // 清空批注数组
        this.annotations = [];
        this.currentId = 1;
        this.visibleContentId = null;
    }

    /**
     * 显示成功提示消息
     * @param {string} message - 消息内容
     */
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'annotation-success-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // 2秒后自动移除提示
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 2000);
    }

    /**
     * 显示错误提示消息
     * @param {string} message - 错误消息
     */
    showErrorMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'annotation-error-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // 2秒后自动移除提示
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 2000);
    }

    /**
     * 加载已有批注并初始化文件访问
     */
    initializeFileSystemAndLoad() {
        // 获取当前页面名称
        const pageName = this.getPageName();

        // 构建批注文件名
        const annotationFileName = `${pageName}_data.json`;

        // 保存文件名到实例
        this.annotationFileName = annotationFileName;

        // 显示加载中信息
        this.showInfoMessage(`正在加载批注文件: ${annotationFileName}`);

        // 直接尝试加载指定命名的文件
        this.loadAnnotationsFromNamedFile(annotationFileName);
    }

    /**
     * 获取当前页面名称
     * @returns {string} 页面名称
     */
    getPageName() {
        // 从URL路径中获取页面名称
        const pathname = window.location.pathname;
        const filename = pathname.split('/').pop() || 'index';

        // 移除文件扩展名
        const pageName = filename.replace(/\.[^/.]+$/, '');

        return pageName;
    }

    /**
     * 从指定命名的文件加载批注
     * @param {string} fileName - 文件名
     */
    async loadAnnotationsFromNamedFile(fileName) {
        try {
            // 尝试直接从服务器请求JSON文件
            const response = await fetch(fileName);

            if (response.ok) {
                // 成功获取到文件
                const content = await response.text();

                // 解析JSON
                if (content.trim()) {
                    try {
                        const fileAnnotations = JSON.parse(content);

                        if (Array.isArray(fileAnnotations) && fileAnnotations.length > 0) {
                            // 加载批注数据
                            this.loadAnnotationsFromData(fileAnnotations);
                            this.showSuccessMessage(`已从 ${fileName} 加载 ${fileAnnotations.length} 条批注`);
                        } else {
                            this.showInfoMessage(`批注文件 ${fileName} 已加载，但没有批注数据`);
                        }
                    } catch (e) {
                        console.error('解析批注文件失败', e);
                        this.showErrorMessage(`批注文件 ${fileName} 格式错误`);
                    }
                } else {
                    this.showInfoMessage(`批注文件 ${fileName} 为空`);
                }
            } else if (response.status === 404) {
                // 文件不存在，显示信息
                this.showInfoMessage(`批注文件 ${fileName} 不存在，将创建新文件`);

                // 自动设置保存位置
                setTimeout(() => {
                    const autosaveBtn = document.getElementById('annotation-autosave');
                    if (autosaveBtn) {
                        autosaveBtn.classList.add('attention');
                        autosaveBtn.title = '点击设置批注文件';
                    }
                }, 1000);
            } else {
                // 其他错误
                this.showErrorMessage(`无法加载批注文件 ${fileName}: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('加载批注文件失败', error);
            this.showErrorMessage(`加载批注文件 ${fileName} 失败: ${error.message}`);
        }
    }

    /**
     * 从数据加载批注
     * @param {Array} annotations - 批注数据数组
     */
    loadAnnotationsFromData(annotations) {
        // 清除现有批注
        this.annotations = [];
        document.querySelectorAll('.annotation-marker').forEach(marker => marker.remove());
        document.querySelectorAll('.annotation-content').forEach(content => content.remove());

        // 加载新批注
        this.annotations = annotations;

        // 找到最大ID
        let maxId = 0;
        this.annotations.forEach(anno => {
            maxId = Math.max(maxId, anno.id);
            this.renderLoadedAnnotation(anno);
        });

        // 设置下一个ID
        this.currentId = maxId + 1;
    }
}

/**
 * 初始化批注工具栏
 */
function initAnnotationToolbar() {
    // 创建工具栏容器
    const toolbar = document.createElement('div');
    toolbar.className = 'annotation-toolbar';
    toolbar.innerHTML = `
        <button id="annotation-toggle" title="切换批注模式">
            <i class="fas fa-comment-alt"></i>
        </button>
        <button id="annotation-autosave" title="设置自动保存">
            <i class="fas fa-save"></i>
        </button>
        <button id="annotation-password-file" title="选择密码文件">
            <i class="fas fa-key"></i>
        </button>
        <input type="file" id="password-file-input" style="display:none" accept=".txt">
    `;

    // 添加到页面
    document.body.appendChild(toolbar);

    // 获取按钮并添加事件
    const toggleBtn = document.getElementById('annotation-toggle');
    const autosaveBtn = document.getElementById('annotation-autosave');
    const passwordFileBtn = document.getElementById('annotation-password-file');
    const passwordFileInput = document.getElementById('password-file-input');

    // 创建批注管理器
    const annotationManager = new AnnotationManager();
    // 将管理器添加到window对象以便调试
    window.annotationManager = annotationManager;

    // 加载已有批注
    annotationManager.initializeFileSystemAndLoad();

    // 绑定按钮事件
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        annotationManager.toggleEditMode();
    });

    // 自动保存按钮事件 - 用户交互
    autosaveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        annotationManager.requestFileAccess();
    });

    // 密码文件选择按钮事件
    passwordFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        passwordFileInput.click();
    });

    // 密码文件选择事件
    passwordFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            annotationManager.loadPasswordFromFile(file);
        }
    });

    // 添加模式变化监听
    document.addEventListener('annotation-mode-change', (e) => {
        if (e.detail.isEditing) {
            toolbar.classList.add('editing');
        } else {
            toolbar.classList.remove('editing');
        }
    });
}

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function () {
    initAnnotationToolbar();
});

// 添加批注样式
function addAnnotationStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .annotation-marker {
            position: absolute; /* 使用绝对定位 */
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background-color: #f44336;
            color: white;
            border-radius: 50%;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            z-index: 10000;
            cursor: pointer;
            transform: translate(-50%, -50%);
        }
        
        .annotation-content {
            position: absolute; /* 使用绝对定位 */
            min-width: 280px;
            max-width: 500px;
            width: auto;
            background-color: white;
            border-radius: 4px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            padding: 15px;
            z-index: 10001;
            display: none;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .annotation-content.visible {
            display: block;
        }
        
        .annotation-close {
            position: absolute;
            top: 8px;
            right: 8px;
            cursor: pointer;
            font-size: 20px;
            color: #666;
        }
        
        .annotation-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
            padding-right: 20px; /* 为关闭按钮留出空间 */
        }
        
        .annotation-text {
            font-size: 14px;
            line-height: 1.5;
            color: #555;
            margin-bottom: 15px;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .annotation-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
        
        .annotation-edit-btn, 
        .annotation-delete-btn {
            padding: 5px 10px;
            margin-left: 8px;
            background: none;
            border: 1px solid #ddd;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        
        .annotation-edit-btn:hover {
            background-color: #e3f2fd;
            border-color: #2196f3;
            color: #2196f3;
        }
        
        .annotation-delete-btn:hover {
            background-color: #ffebee;
            border-color: #f44336;
            color: #f44336;
        }
        
        .annotation-form {
            display: flex;
            flex-direction: column;
            width: 100%;
        }
        
        .annotation-title-input, 
        .annotation-text-input {
            margin-bottom: 10px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 3px;
            font-size: 14px;
            width: 100%;
            box-sizing: border-box;
        }
        
        .annotation-text-input {
            min-height: 80px;
            resize: vertical;
        }
        
        .annotation-btn-group {
            display: flex;
            justify-content: flex-end;
        }
        
        .annotation-save-btn, 
        .annotation-cancel-btn {
            padding: 6px 12px;
            margin-left: 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .annotation-save-btn {
            background-color: #4caf50;
            color: white;
            border: none;
        }
        
        .annotation-cancel-btn {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            color: #555;
        }
        
        .annotation-save-btn:hover {
            background-color: #388e3c;
        }
        
        .annotation-cancel-btn:hover {
            background-color: #e0e0e0;
        }
        
        .annotation-error-toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #f44336;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10002;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            animation: toast-in 0.3s ease-out;
        }
        
        .annotation-error-toast.fade-out {
            animation: toast-out 0.5s ease-out forwards;
        }
        
        /* 成功提示样式 */
        .annotation-success-toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #4caf50;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10002;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            animation: toast-in 0.3s ease-out;
        }
        
        .annotation-success-toast.fade-out {
            animation: toast-out 0.5s ease-out forwards;
        }
        
        /* 信息提示样式 */
        .annotation-info-toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #2196f3;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10002;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            animation: toast-in 0.3s ease-out;
        }
        
        .annotation-info-toast.fade-out {
            animation: toast-out 0.5s ease-out forwards;
        }
        
        /* 自动保存指示器 */
        .annotation-autosave-indicator {
            position: fixed;
            bottom: 10px;
            left: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 9998;
        }
        
        .annotation-autosave-indicator.visible {
            opacity: 1;
        }
        
        @keyframes toast-in {
            from { opacity: 0; transform: translate(-50%, 20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
        
        @keyframes toast-out {
            from { opacity: 1; transform: translate(-50%, 0); }
            to { opacity: 0; transform: translate(-50%, 20px); }
        }
        
        .annotation-content.right:before {
            content: '';
            position: absolute;
            left: -8px;
            top: 50%;
            transform: translateY(-50%);
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
            border-right: 8px solid white;
        }
        
        .annotation-content.left:before {
            content: '';
            position: absolute;
            right: -8px;
            top: 50%;
            transform: translateY(-50%);
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
            border-left: 8px solid white;
        }
        
        .annotation-content.top:before {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid white;
        }
        
        .annotation-content.bottom:before {
            content: '';
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 8px solid white;
        }
        
        /* 工具栏样式 */
        .annotation-toolbar {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            padding: 8px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 38px;
            transition: all 0.3s ease;
            opacity: 0.7;
        }
        
        .annotation-toolbar:hover {
            width: 160px;
            opacity: 1;
        }
        
        .annotation-toolbar button {
            width: 30px;
            height: 30px;
            background: none;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 6px;
            transition: all 0.2s;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .annotation-toolbar button:hover,
        .annotation-toolbar button.active {
            background-color: #e3f2fd;
            border-color: #2196f3;
            color: #2196f3;
        }
        
        .annotation-toolbar button:hover::after {
            content: attr(title);
            position: absolute;
            left: 40px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            white-space: nowrap;
            display: none;
        }
        
        .annotation-toolbar:hover button:hover::after {
            display: block;
        }
        
        /* 增加保存按钮的样式 */
        .annotation-toolbar #annotation-autosave {
            background-color: #e3f2fd;
            color: #2196f3;
            border-color: #2196f3;
        }
        
        .annotation-toolbar #annotation-autosave.active {
            background-color: #4caf50;
            color: white;
            border-color: #4caf50;
        }
        
        .annotation-toolbar #annotation-autosave.attention {
            background-color: #ff9800;
            color: white;
            border-color: #ff9800;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        /* 增加密码文件按钮的样式 */
        .annotation-toolbar #annotation-password-file {
            background-color: #fff3e0;
            color: #ff9800;
            border-color: #ff9800;
        }
        
        .annotation-toolbar #annotation-password-file.active {
            background-color: #ff9800;
            color: white;
            border-color: #ff9800;
        }
        
        /* 删除确认弹窗样式 */
        .annotation-confirm-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10002;
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        
        .annotation-confirm-wrapper.active {
            opacity: 1;
        }
        
        .annotation-confirm-box {
            background-color: white;
            border-radius: 4px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
            padding: 15px;
            max-width: 90%;
            width: 250px;
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.2s ease;
        }
        
        .annotation-confirm-wrapper.active .annotation-confirm-box {
            transform: scale(1);
        }
        
        .annotation-confirm-text {
            font-size: 14px;
            margin-bottom: 15px;
            color: #333;
        }
        
        .annotation-confirm-btns {
            display: flex;
            justify-content: center;
            gap: 10px;
        }
        
        .annotation-confirm-yes,
        .annotation-confirm-no {
            padding: 5px 15px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }
        
        .annotation-confirm-yes {
            background-color: #f44336;
            color: white;
            border: none;
        }
        
        .annotation-confirm-no {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            color: #555;
        }
        
        .annotation-confirm-yes:hover {
            background-color: #d32f2f;
        }
        
        .annotation-confirm-no:hover {
            background-color: #e0e0e0;
        }
    `;
    document.head.appendChild(styleEl);
}

// DOM加载后添加样式
document.addEventListener('DOMContentLoaded', function () {
    addAnnotationStyles();
}); 