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
        this.markersVisible = true; // 新增：标记批注是否可见的状态标志

        // 绑定方法到实例
        this.toggleEditMode = this.toggleEditMode.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleCaptureClick = this.handleCaptureClick.bind(this); // 绑定新的捕获处理器
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

        // 添加或移除捕获监听器
        if (this.isEditing) {
            document.addEventListener('click', this.handleCaptureClick, true);
        } else {
            document.removeEventListener('click', this.handleCaptureClick, true);
        }

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
     * 处理捕获阶段的点击事件（仅在编辑模式下激活）
     * @param {MouseEvent} e - 鼠标事件对象
     */
    handleCaptureClick(e) {
        if (!this.isEditing) {
            // 安全检查：如果不知何故在非编辑模式下触发，则移除监听器并返回
            document.removeEventListener('click', this.handleCaptureClick, true);
            return;
        }

        // 允许点击批注相关的UI元素
        if (e.target.closest('.annotation-toolbar') ||
            e.target.closest('.annotation-marker') ||
            e.target.closest('.annotation-content')) {
            // 对于这些元素，让事件正常传播，由 handleClick 或其内部逻辑处理
            return;
        }

        // --- 点击了页面其他元素 --- 
        // 阻止默认行为和事件冒泡
        e.preventDefault();
        e.stopPropagation();

        // 创建新的批注
        const targetElement = e.target;
        // 确保 createAnnotation 在这里被调用
        this.createAnnotation(e.clientX, e.clientY, targetElement);
    }

    /**
     * 处理点击事件（冒泡阶段）
     * @param {MouseEvent} e - 鼠标事件对象
     */
    handleClick(e) {
        // 如果点击了工具栏，直接返回 (工具栏按钮有自己的监听器)
        if (e.target.closest('.annotation-toolbar')) {
            return;
        }

        // 处理点击批注标记
        const marker = e.target.closest('.annotation-marker');
        if (marker) {
            // 如果是编辑模式下的临时标记，不处理 (由创建流程处理)
            if (this.isEditing && marker.dataset.temp) {
                return;
            }
            // 获取ID并切换内容显示
            const id = parseInt(marker.dataset.id, 10);
            if (!isNaN(id)) {
                // 阻止可能的默认行为（例如，如果标记在链接内）并停止冒泡
                e.preventDefault();
                e.stopPropagation();
                this.toggleAnnotationContent(id);
            }
            return; // 处理完标记点击后返回
        }

        // 如果点击在批注内容内部
        if (e.target.closest('.annotation-content')) {
            // 允许内容区域内部的默认交互（如选择文本），但阻止事件冒泡到document
            // 防止触发下方的 hideAllAnnotations
            e.stopPropagation();
            // 注意：内容框内的按钮（保存、取消、删除确认等）需要它们自己的stopPropagation来防止关闭内容框
            return;
        }

        // --- 点击了页面空白区域 (或其他未被捕获监听器阻止的元素) ---

        // 如果是编辑模式，理论上不应到达这里，因为捕获监听器会处理非UI点击
        // 但作为安全措施，如果到达这里，不做任何操作
        if (this.isEditing) {
            // console.warn('handleClick: Click outside UI in edit mode - should be handled by capture listener.');
            return;
        }

        // 非编辑模式下，点击空白区域不再自动关闭批注
        // this.hideAllAnnotations(); // <--- 移除这一行，不再自动关闭

        // 同时取消可能存在的未保存批注（理论上非编辑模式不应有，但为了健壮性）
        this.cancelCurrentAnnotation();
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

            // 使用预设的批注文件名 - 使用 json/ 目录 + 动态页面名称
            const pageName = this.getPageName(); // 获取页面名称
            const suggestedFileName = `${pageName}_data.json`; // Filename suggestion for save dialog

            this.annotationFileName = `json/${suggestedFileName}`; // Keep intended path for loading

            // Pass only the filename to requestFileSystem
            this.requestFileSystem(suggestedFileName).then(fileHandle => {
                if (fileHandle) {
                    this.fileHandle = fileHandle;
                    // Optional: Update internal name based on actual chosen name?
                    // this.annotationFileName = fileHandle.name; // Problem: loses path info
                    // Better to keep this.annotationFileName as the intended load path.
                    this.saveAnnotations(); // Save immediately
                    // Use fileHandle.name for success message
                    this.showSuccessMessage(`批注将自动保存到: ${fileHandle.name}`);

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
    async requestFileSystem(suggestedName = 'annotations_data.json') { // Parameter is now filename only
        try {
            // 检查浏览器是否支持File System Access API
            if ('showSaveFilePicker' in window) {
                // 请求用户选择保存位置
                const options = {
                    suggestedName: suggestedName, // Pass only the filename
                    types: [{
                        description: '批注JSON文件',
                        accept: { 'application/json': ['.json'] }
                    }]
                };

                // 显示文件选择器，并提示用户选择目录
                this.showInfoMessage('请选择批注文件保存位置 (建议在 json 目录下)');
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

        // 显示保存状态和实际文件名 (如果句柄存在)
        const displayName = this.fileHandle ? this.fileHandle.name : this.annotationFileName;
        indicator.textContent = `已保存到: ${displayName} ${new Date().toLocaleTimeString()}`;
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
            const fileName = `${this.getPageName()}_data.json`; // 使用 getPageName() 保证与加载/保存逻辑一致

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
        const pageName = this.getPageName(); // 恢复获取页面名称

        // 构建批注文件名 - 使用 json/ 目录 + 动态页面名称
        const annotationFileName = `json/${pageName}_data.json`;

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

    /**
     * 切换所有批注标记的可见性
     * @returns {boolean} - 切换后的可见性状态
     */
    toggleMarkersVisibility() {
        // 反转当前可见性状态
        this.markersVisible = !this.markersVisible;

        // 获取所有批注标记
        const markers = document.querySelectorAll('.annotation-marker');

        // 更新所有标记的可见性
        markers.forEach(marker => {
            if (this.markersVisible) {
                marker.style.display = ''; // 恢复默认显示
                marker.style.opacity = '1';
                marker.style.visibility = 'visible';
            } else {
                marker.style.display = 'none'; // 隐藏标记
                // 可以用这个替代，实现淡出效果: 
                // marker.style.opacity = '0';
                // marker.style.visibility = 'hidden';
            }
        });

        // 如果标记被隐藏，同时隐藏所有打开的批注内容
        if (!this.markersVisible) {
            this.hideAllAnnotations();
        }

        // 返回切换后的状态
        return this.markersVisible;
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
        <button id="annotation-visibility" title="显示/隐藏批注标记">
            <i class="fas fa-eye"></i>
        </button>
        <input type="file" id="password-file-input" style="display:none" accept=".txt">
    `;

    // 添加到页面
    document.body.appendChild(toolbar);

    // 获取按钮并添加事件
    const toggleBtn = document.getElementById('annotation-toggle');
    const autosaveBtn = document.getElementById('annotation-autosave');
    const passwordFileBtn = document.getElementById('annotation-password-file');
    const visibilityBtn = document.getElementById('annotation-visibility'); // 新增
    const passwordFileInput = document.getElementById('password-file-input');

    // 创建批注管理器
    const annotationManager = new AnnotationManager();
    // 将管理器添加到window对象以便调试
    window.annotationManager = annotationManager;

    // 加载已有批注
    annotationManager.initializeFileSystemAndLoad();

    // 绑定按钮事件 - 批注模式切换
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        annotationManager.toggleEditMode();
        // 同时切换菜单展开状态
        toggleMenu();
    });

    // 自动保存按钮事件 - 点击时也收起菜单
    autosaveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        annotationManager.requestFileAccess();
        // 收起菜单
        toolbar.classList.remove('expanded');
    });

    // 密码文件选择按钮事件 - 点击时也收起菜单
    passwordFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        passwordFileInput.click();
        // 收起菜单
        toolbar.classList.remove('expanded');
    });

    // 新增：显示/隐藏批注按钮事件
    visibilityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // 切换批注标记可见性
        const isVisible = annotationManager.toggleMarkersVisibility();
        // 更新按钮图标
        visibilityBtn.innerHTML = isVisible ?
            '<i class="fas fa-eye"></i>' :
            '<i class="fas fa-eye-slash"></i>';
        // 收起菜单
        toolbar.classList.remove('expanded');
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

    // 切换菜单展开状态的函数
    function toggleMenu() {
        toolbar.classList.toggle('expanded');
    }

    // 点击页面其他区域时收起菜单
    document.addEventListener('click', (e) => {
        // 如果点击的不是工具栏内的元素
        if (!e.target.closest('.annotation-toolbar')) {
            // 收起菜单
            toolbar.classList.remove('expanded');
        }
    });
}

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function () {
    initAnnotationToolbar();
});

// 添加批注样式
function addAnnotationStyles() {
    // 检查样式是否已添加，避免重复添加
    if (document.getElementById('annotation-component-styles')) {
        return;
    }
    const styleEl = document.createElement('style');
    styleEl.id = 'annotation-component-styles'; // 添加ID以便检查
    styleEl.textContent = `
/* 
 * 批注组件样式
 * 实现类似Axure的批注功能
 */

/* 批注标记样式 */
.annotation-marker {
    position: fixed; /* 使用fixed定位以保持在视口中 */
    width: 18px; /* 更小的尺寸 (原来是 20px) */
    height: 18px; /* 更小的尺寸 (原来是 20px) */
    /* 使用CSS变量，如果定义了 */
    background-color: var(--accent-color, #FF6347); /* 默认使用番茄红 */
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px; /* 更小的字体 (原来是 12px) */
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    transition: transform 0.2s ease;
    /* 初始使用translate确保居中 */
    transform: translate(-50%, -50%);
    pointer-events: auto; /* 允许点击 */
}

.annotation-marker:hover {
    /* 保持translate效果并放大 */
    transform: translate(-50%, -50%) scale(1.1);
}

/* 批注层样式 */
/* 注意：JS中创建的annotationLayer使用了absolute定位，如果需要fixed，需要统一 */
#annotation-layer {
    /* 与JS中的设置保持一致，或在此处覆盖 */
    position: absolute; /* 或 fixed */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%; /* 或根据需要调整 */
    pointer-events: none; /* 允许点击穿透 */
    z-index: 9999;
}

/* 批注内容容器 */
.annotation-content {
    position: absolute; /* 使用absolute定位，由JS计算位置 */
    background-color: white;
    border-radius: var(--radius-md, 8px); /* 使用变量或默认值 */
    padding: var(--spacing-md, 12px);
    box-shadow: var(--shadow-md, 0 4px 8px rgba(0, 0, 0, 0.1));
    min-width: 280px; /* 增加最小宽度 */
    max-width: 350px; /* 调整最大宽度 */
    z-index: 10001;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    pointer-events: auto; /* 允许交互 */
    word-wrap: break-word;
    overflow-wrap: break-word;
}

.annotation-content.visible {
    opacity: 1;
    visibility: visible;
}

/* 箭头样式 */
.annotation-content::before {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    background-color: white;
    transform: rotate(45deg);
    box-shadow: inherit; /* 继承阴影 */
    z-index: -1; /* 放在内容后面 */
}

/* 上方显示箭头 */
.annotation-content.top::before {
    bottom: -6px;
    left: calc(50% - 6px);
    box-shadow: 2px 2px 2px rgba(0,0,0,0.05); /* 细微阴影 */
}

/* 下方显示箭头 */
.annotation-content.bottom::before {
    top: -6px;
    left: calc(50% - 6px);
    box-shadow: -2px -2px 2px rgba(0,0,0,0.05);
}

/* 左侧显示箭头 */
.annotation-content.left::before {
    top: calc(50% - 6px);
    right: -6px;
    box-shadow: 2px -2px 2px rgba(0,0,0,0.05);
}

/* 右侧显示箭头 */
.annotation-content.right::before {
    top: calc(50% - 6px);
    left: -6px;
    box-shadow: -2px 2px 2px rgba(0,0,0,0.05);
}

/* 批注标题 */
.annotation-title {
    font-size: var(--font-size-md, 16px);
    font-weight: bold;
    margin-bottom: var(--spacing-sm, 8px);
    color: var(--text-primary, #333);
    padding-right: 25px; /* 为关闭按钮留空间 */
}

/* 批注内容 */
.annotation-text {
    font-size: var(--font-size-base, 14px);
    color: var(--text-secondary, #666);
    line-height: 1.5;
    margin-bottom: 15px; /* 与actions间距 */
    max-height: 300px; /* 限制最大高度 */
    overflow-y: auto; /* 超出时滚动 */
}

/* 关闭按钮 */
.annotation-close {
    position: absolute;
    top: 8px; /* 调整位置 */
    right: 8px;
    width: 24px; /* 增大点击区域 */
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-tertiary, #999);
    font-size: 20px; /* 增大图标 */
    border-radius: 50%;
    transition: background-color 0.2s, color 0.2s;
}

.annotation-close:hover {
    color: var(--text-primary, #333);
    background-color: #f0f0f0;
}

/* 操作按钮区域 */
.annotation-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm, 8px); /* 按钮间距 */
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border-color, #eee);
}

/* 编辑和删除按钮通用样式 */
.annotation-edit-btn,
.annotation-delete-btn {
    padding: 6px 12px;
    background: none;
    border: 1px solid #ddd;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s ease;
    display: inline-flex; /* 使用flex布局图标和文字 */
    align-items: center;
    gap: 4px; /* 图标和文字间距 */
}

.annotation-edit-btn i,
.annotation-delete-btn i {
    font-size: 1em; /* 图标大小与文字一致 */
}

.annotation-edit-btn:hover {
    background-color: #e3f2fd; /* 淡蓝色背景 */
    border-color: #2196f3; /* 蓝色边框 */
    color: #2196f3; /* 蓝色文字 */
}

.annotation-delete-btn:hover {
    background-color: #ffebee; /* 淡红色背景 */
    border-color: #f44336; /* 红色边框 */
    color: #f44336; /* 红色文字 */
}

/* 批注工具栏 */
.annotation-toolbar {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: transparent; /* 改为透明背景 */
    border-radius: var(--radius-md, 8px);
    /* 移除阴影，只给按钮添加阴影 */
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm, 8px);
    z-index: 9999;
    transition: all 0.3s ease;
    align-items: center; /* 确保按钮居中 */
}

/* 工具栏按钮通用样式 */
.annotation-toolbar button {
    width: 40px;
    height: 40px;
    border-radius: 50%; /* 圆形按钮 */
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--white, #fff);
    color: var(--text-primary, #333);
    border: 1px solid var(--border-color, #eee); /* 添加边框 */
    box-shadow: var(--shadow-md, 0 4px 8px rgba(0,0,0,0.1));
    /* 过渡所有属性，用于平滑动画 */
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* 弹性过渡效果 */
    font-size: 16px; /* 图标大小 */
    cursor: pointer;
    position: absolute; /* 绝对定位，便于定位炸开位置 */
    bottom: 0; /* 初始位置都在主按钮位置 */
    right: 0;
}

/* 只有主按钮显示在顶层 */
#annotation-toggle {
    z-index: 2;
}

/* 次级按钮默认隐藏在主按钮后面 */
.annotation-toolbar button:not(#annotation-toggle) {
    opacity: 0;
    visibility: hidden;
    transform: scale(0.8); /* 稍微缩小 */
    z-index: 1;
}

/* 菜单展开状态 - 显示次级按钮 */
.annotation-toolbar.expanded #annotation-autosave {
    opacity: 1;
    visibility: visible;
    transform: translateX(-60px) scale(1); /* 向左移动 */
}

.annotation-toolbar.expanded #annotation-password-file {
    opacity: 1;
    visibility: visible;
    transform: translateX(-120px) scale(1); /* 更靠左 */
}

/* 新增按钮的展开位置 */
.annotation-toolbar.expanded #annotation-visibility {
    opacity: 1;
    visibility: visible;
    transform: translateX(-180px) scale(1); /* 最靠左 */
}

/* 自动保存按钮特殊样式 */
#annotation-autosave {
    /* 默认样式已在通用按钮中 */
}

#annotation-autosave.active {
    background-color: #4caf50; /* 绿色表示已激活 */
    color: white;
    border-color: #4caf50;
}

#annotation-autosave.attention {
    background-color: #ff9800; /* 橙色表示需要注意 */
    color: white;
    border-color: #ff9800;
    animation: pulse 1.5s infinite;
}

/* 密码文件按钮特殊样式 */
#annotation-password-file {
    /* 默认样式已在通用按钮中 */
}

#annotation-password-file.active {
    background-color: #ffc107; /* 黄色表示已加载 */
    color: #333;
    border-color: #ffc107;
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(255, 152, 0, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0); }
}

/* 编辑表单样式 */
.annotation-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm, 8px);
    margin-top: var(--spacing-md, 12px);
}

.annotation-title-input,
.annotation-text-input {
    padding: var(--spacing-sm, 8px);
    border: 1px solid var(--border-color, #ddd);
    border-radius: var(--radius-sm, 4px);
    font-size: var(--font-size-base, 14px);
    width: 100%; /* 占满容器宽度 */
    box-sizing: border-box; /* 防止padding撑开宽度 */
}

.annotation-text-input {
    min-height: 80px; /* 最小高度 */
    resize: vertical; /* 允许垂直调整大小 */
}

.annotation-title-input:focus,
.annotation-text-input:focus {
    outline: none;
    border-color: var(--accent-color, #FF6347); /* 焦点时边框变色 */
    box-shadow: 0 0 0 2px rgba(255, 99, 71, 0.2); /* 焦点光晕 */
}

/* 表单按钮组 */
.annotation-btn-group {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm, 8px);
    margin-top: 5px; /* 与上方元素间距 */
}

/* 保存和取消按钮通用样式 */
.annotation-save-btn,
.annotation-cancel-btn {
    padding: 8px 16px; /* 增大内边距 */
    border: none;
    border-radius: var(--radius-sm, 4px);
    font-size: var(--font-size-base, 14px);
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.annotation-save-btn {
    background-color: var(--primary-color, #2E8B57); /* 使用主色调 */
    color: white;
}

.annotation-save-btn:hover {
    background-color: #256d43; /* 主色调加深 */
}

.annotation-cancel-btn {
    background-color: #f5f5f5;
    color: #555;
    border: 1px solid #ddd;
}

.annotation-cancel-btn:hover {
    background-color: #e0e0e0;
}

/* 提示信息样式 (Toast) */
.annotation-toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    border-radius: 4px;
    color: white;
    z-index: 10002;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.annotation-toast.visible {
    opacity: 1;
    transform: translate(-50%, 0);
}

.annotation-success-toast {
    background-color: #4caf50; /* 绿色 */
}

.annotation-error-toast {
    background-color: #f44336; /* 红色 */
}

.annotation-info-toast {
    background-color: #2196f3; /* 蓝色 */
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
    pointer-events: none; /* 不阻挡下方点击 */
}

.annotation-autosave-indicator.visible {
    opacity: 1;
}

/* 删除确认弹窗样式 */
.annotation-confirm-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.1); /* 半透明遮罩 */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10002; /* 比内容高一级 */
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none; /* 默认不响应 */
}

.annotation-confirm-wrapper.active {
    opacity: 1;
    pointer-events: auto; /* 激活时响应 */
}

.annotation-confirm-box {
    background-color: white;
    border-radius: var(--radius-md, 8px);
    box-shadow: var(--shadow-md, 0 4px 8px rgba(0, 0, 0, 0.1));
    padding: 20px; /* 增加内边距 */
    max-width: 90%;
    width: 280px; /* 固定宽度 */
    text-align: center;
    transform: scale(0.9);
    transition: transform 0.2s ease;
}

.annotation-confirm-wrapper.active .annotation-confirm-box {
    transform: scale(1);
}

.annotation-confirm-text {
    font-size: 14px;
    margin-bottom: 20px; /* 增加间距 */
    color: var(--text-primary, #333);
}

.annotation-confirm-btns {
    display: flex;
    justify-content: center;
    gap: 10px;
}

.annotation-confirm-yes,
.annotation-confirm-no {
    padding: 8px 18px;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
    border: none; /* 移除边框 */
}

.annotation-confirm-yes {
    background-color: #f44336; /* 红色 */
    color: white;
}

.annotation-confirm-no {
    background-color: #f5f5f5;
    color: #555;
    border: 1px solid #ddd; /* 保留取消按钮边框 */
}

.annotation-confirm-yes:hover {
    background-color: #d32f2f;
}

.annotation-confirm-no:hover {
    background-color: #e0e0e0;
}

/* 其他按钮样式保持不变 */

/* 按钮悬浮效果 */
.annotation-toolbar button:hover {
    transform: scale(1.05) translate(0, 0); /* 保持在原位置的同时稍微放大 */
    background-color: #f5f5f5; /* 悬停背景色 */
    border-color: #ddd;
}

/* 展开状态下，次级按钮的悬浮效果需要保留位移 */
.annotation-toolbar.expanded #annotation-autosave:hover {
    transform: translateX(-60px) scale(1.05);
}

.annotation-toolbar.expanded #annotation-password-file:hover {
    transform: translateX(-120px) scale(1.05);
}

/* 新增按钮的悬浮效果 */
.annotation-toolbar.expanded #annotation-visibility:hover {
    transform: translateX(-180px) scale(1.05);
}

/* 激活/编辑状态下的切换按钮 */
#annotation-toggle.active,
.annotation-toolbar.editing #annotation-toggle {
    background-color: var(--accent-color, #FF6347);
    color: white;
    border-color: var(--accent-color, #FF6347);
}

    `;
    document.head.appendChild(styleEl);
}

// DOM加载后添加样式
document.addEventListener('DOMContentLoaded', function () {
    addAnnotationStyles();
}); 