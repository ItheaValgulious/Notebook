(function () {
    /**
 * 创建右键菜单
 * @param {Array} config - 菜单配置数组，每个元素包含 text, action, type 属性
 * @param {Object} event - 鼠标事件对象，用于获取坐标
 */
    function create_right_menu(config, event) {
        // 移除已存在的菜单
        const existingMenu = document.getElementById('right-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // 创建菜单容器
        const menu = document.createElement('div');
        menu.id = 'right-menu';
        menu.style.position = 'absolute';
        menu.style.backgroundColor = '#fff';
        menu.style.border = '1px solid #ccc';
        menu.style.borderRadius = '4px';
        menu.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.2)';
        menu.style.zIndex = '1000';
        menu.style.minWidth = '150px';
        menu.style.padding = '4px 0';

        // 遍历配置创建菜单项
        config.forEach(item => {
            if (item.type === 'seperate') {
                // 创建分割线
                const separator = document.createElement('div');
                separator.style.height = '1px';
                separator.style.backgroundColor = '#e0e0e0';
                separator.style.margin = '4px 0';
                menu.appendChild(separator);
            } else if (item.type === 'item') {
                // 创建菜单项
                const menuItem = document.createElement('div');
                menuItem.textContent = item.text;
                menuItem.style.padding = '8px 16px';
                menuItem.style.cursor = 'pointer';
                menuItem.style.fontSize = '14px';
                menuItem.style.color = '#333';

                // 鼠标悬停效果
                menuItem.addEventListener('mouseenter', () => {
                    menuItem.style.backgroundColor = '#f0f0f0';
                });

                menuItem.addEventListener('mouseleave', () => {
                    menuItem.style.backgroundColor = 'transparent';
                });

                // 点击事件
                menuItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof item.action === 'function') {
                        item.action();
                    }
                    // 点击后移除菜单
                    menu.remove();
                });

                menu.appendChild(menuItem);
            }
        });

        // 获取鼠标坐标
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // 获取窗口尺寸
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // 获取菜单尺寸（需要先添加到DOM才能获取准确尺寸）
        document.body.appendChild(menu);
        const menuRect = menu.getBoundingClientRect();
        const menuWidth = menuRect.width;
        const menuHeight = menuRect.height;

        // 计算菜单位置，确保在屏幕内
        let left = mouseX;
        let top = mouseY;

        // 如果菜单超出右边界，调整到左侧
        if (left + menuWidth > windowWidth) {
            left = mouseX - menuWidth;
        }

        // 如果菜单超出下边界，调整到上方
        if (top + menuHeight > windowHeight) {
            top = mouseY - menuHeight;
        }

        // 确保菜单不超出左边界和上边界
        left = Math.max(0, left);
        top = Math.max(0, top);

        // 设置菜单位置
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        // 点击其他地方移除菜单
        setTimeout(() => {
            document.addEventListener('click', function removeMenu() {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            });
        }, 100);

        return menu;
    }
    notebook.create_right_menu = create_right_menu;
})()


