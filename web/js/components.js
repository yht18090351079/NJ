// 组件加载工具
document.addEventListener('DOMContentLoaded', function () {
    // 加载页脚组件
    loadComponent('footer');
});

/**
 * 加载HTML组件到页面中
 * @param {string} componentName - 组件名称或容器ID
 * @param {string} componentPath - 可选，组件的路径，默认为components/componentName.html
 */
function loadComponent(componentName, componentPath) {
    // 支持两种方式：
    // 1. 通过data-component属性：loadComponent('footer')
    // 2. 通过容器ID和组件路径：loadComponent('footer-container', 'components/footer.html')

    let componentContainer;
    let path;

    if (componentPath) {
        // 如果提供了组件路径，则使用指定的容器ID和路径
        componentContainer = document.getElementById(componentName);
        path = componentPath;
    } else {
        // 兼容之前的方式
        componentContainer = document.querySelector(`[data-component="${componentName}"]`);
        path = `components/${componentName}.html`;
    }

    if (!componentContainer) {
        console.warn(`没有找到${componentName}组件的容器`);
        return;
    }

    fetch(path)
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
            console.error(`尝试加载路径: ${path}`);
        });
} 