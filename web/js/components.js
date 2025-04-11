// 组件加载工具
document.addEventListener('DOMContentLoaded', function () {
    // 加载页脚组件
    loadComponent('footer');
});

/**
 * 加载HTML组件到页面中
 * @param {string} componentName - 组件名称，对应components目录下的HTML文件名
 */
function loadComponent(componentName) {
    const componentContainer = document.querySelector(`[data-component="${componentName}"]`);
    if (!componentContainer) {
        console.warn(`没有找到${componentName}组件的容器`);
        return;
    }

    fetch(`components/${componentName}.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            componentContainer.innerHTML = html;
        })
        .catch(error => {
            console.error(`加载${componentName}组件失败:`, error);
        });
} 