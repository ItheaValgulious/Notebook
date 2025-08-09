(function () {
    function create_menu(config) {

        const menu = document.createElement('div');
        menu.className = 'menu';

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

        return menu;
    }
    function init_menu() {
        document.querySelector('.menu_container').appendChild(create_menu([
            {
                'text': 'File',
                'children': [
                    {
                        'text': 'New',
                        'action': () => { console.log('New File') }
                    },
                    {
                        'text': 'Open',
                        'action': async () => {
                            try {
                                const filePath = await window.api.showOpenDialog();
                                if (filePath) {
                                    const content = await window.api.read_file(filePath);
                                    // 假设 notebook.canvas.load 是加载内容的方法
                                    notebook.canvas.load(content);
                                    console.log('文件已打开:', filePath);
                                }
                            } catch (error) {
                                console.error('打开文件时出错:', error);
                            }
                        }
                    },
                    {
                        'text': 'Save',
                        'action': async () => {
                            try {
                                const content = notebook.canvas.save();
                                const filePath = await window.api.showSaveDialog();
                                if (filePath) {
                                    await window.api.save_file(filePath, content);
                                    console.log('文件已保存:', filePath);
                                }
                            } catch (error) {
                                console.error('保存文件时出错:', error);
                            }
                        }
                    }
                ]
            },
            {
                'text': 'Edit',
                'children': [
                    {
                        'text': 'Undo',
                        'action': () => { console.log('Undo Action') }
                    },
                    {
                        'text': 'Redo',
                        'action': () => { console.log('Redo Action') }
                    }
                ]
            },
            {
                'text': 'Edit',
                'children': [
                    {
                        'text': 'Insert',
                        children: [
                            {
                                'text': 'Image',
                                'action': () => { console.log('Insert Image') }
                            },
                            {
                                'text': 'Markdown',
                                'action': () => { console.log('Insert Markdown') }
                            }
                        ]
                    },
                    {
                        'text': 'Undo',
                        'action': () => { console.log('Undo Action') }
                    },
                    {
                        'text': 'Redo',
                        'action': () => { console.log('Redo Action') }
                    }
                ]
            },
        ]));
    }
    window.notebook.init_menu = init_menu;
})();