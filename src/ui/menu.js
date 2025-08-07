function create_menu(config) {
    // 创建最外层容器
    const headbox = document.createElement('div');
    headbox.className = 'headbox';
    
    const menu = document.createElement('div');
    menu.className = 'menu';
    headbox.appendChild(menu);

    // 递归创建菜单项
    function createMenuItem(item) {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu_item';
        menuItem.textContent = item.text;

        // 如果有子菜单
        if (item.children && item.children.length > 0) {
            menuItem.classList.add('has-children');
            const menuColumn = document.createElement('div');
            menuColumn.className = 'menu_column';

            item.children.forEach(child => {
                menuColumn.appendChild(createMenuItem(child));
            });

            menuItem.appendChild(menuColumn);
        }

        // 如果有动作函数
        if (item.action) {
            menuItem.onclick = (e) => {
                e.stopPropagation();
                item.action();
            };
        }

        return menuItem;
    }

    // 创建顶层菜单项
    config.forEach(item => {
        menu.appendChild(createMenuItem(item));
    });

    return headbox;
}
