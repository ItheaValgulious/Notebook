(function () {

    // UITreePanel class
    class UITreePanel {
        constructor() {
            this.dom = null;
        }

        init(dom) {
            this.dom = dom;
            this.dom.innerHTML = ''; // Clear existing content
        }

        set_tree(obj) {
            if (!this.dom) return;
            this.dom.innerHTML = ''; // Clear current tree
            this.renderNode(obj, this.dom, 0);
        }

        renderNode(obj, parentDom, depth) {
            const nodeDiv = document.createElement('div');
            nodeDiv.classList.add('tree-node');
            if (obj.children && obj.children.length > 0) {
                nodeDiv.classList.add('expanded'); // Default to expanded
            } else {
                nodeDiv.classList.add('leaf');
            }

            nodeDiv.dataset.depth = depth;
            nodeDiv.style.paddingLeft = `${depth * 20}px`;
            nodeDiv.style.display = 'flex'; // Ensure visible by default

            // Create toggle button for nodes with children
            const toggle = document.createElement('span');
            toggle.classList.add('tree-toggle');
            nodeDiv.appendChild(toggle);

            // Create icon
            const icon = document.createElement('i');
            icon.classList.add('tree-icon');
            if (obj.icon) {
                icon.className = `fas fa-${obj.icon} tree-icon`;
            }
            nodeDiv.appendChild(icon);

            // Create label
            const label = document.createElement('span');
            label.innerText = obj.label || 'Node';
            label.setAttribute('title', obj.label)
            label.classList.add('tree-label');
            nodeDiv.appendChild(label);


            // Event listeners
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = nodeDiv.classList.toggle('expanded');
                let current = nodeDiv.nextElementSibling;
                const myDepth = parseInt(nodeDiv.dataset.depth);
                while (current) {
                    const currentDepth = parseInt(current.dataset.depth);
                    if (currentDepth <= myDepth) break;
                    current.style.display = isExpanded ? 'flex' : 'none';
                    current = current.nextElementSibling;
                }
            });

            nodeDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                if (obj.on_left_click) {
                    obj.on_left_click(obj, nodeDiv, e);
                }
            });

            nodeDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (obj.on_right_click) {
                    obj.on_right_click(obj, nodeDiv, e);
                }
            });

            nodeDiv.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (obj.on_double_click) {
                    obj.on_double_click(obj, nodeDiv, e);
                }
            });

            parentDom.appendChild(nodeDiv);

            // Render children as siblings
            if (obj.children && obj.children.length > 0) {
                obj.children.forEach(child => {
                    this.renderNode(child, parentDom, depth + 1);
                });
            }

            return nodeDiv;
        }
    }

    class Tree {
        constructor() {
            this.path = '';
            this.tree = null;
            this.treePanel = new UITreePanel();
        }
        init() {
            this.treePanel.init(document.getElementById('tree-content'));
            this.set_path('/')
        }
        async set_path(path) {
            this.path = path;
            this.tree = await window.api.read_folder(path);
            this.treePanel.set_tree(this.construct_render_tree_obj(this.tree));
        }
        rename(obj, dom) {
            var path = obj.data.path;
            var label = dom.querySelector('.tree-label');
            label.contentEditable = true;
            label.focus();

            //set selection
            var range = document.createRange();
            range.setStart(label.firstChild, 0);
            range.setEnd(label.firstChild, obj.label.indexOf('.'));
            var selection = document.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);


            var _rename = (e) => {
                this.clear_select();
                window.api.rename(path, label.innerText);
                this.set_path(this.path);
            }
            var func = (e) => {
                if (e.key != 'Enter' && e.key != 'Escape') return;

                if (e.key == 'Enter') {
                    _rename();
                } else if (e.key == 'Escape') {
                    label.innerText = obj.label;
                }
                label.contentEditable = false;
                label.removeEventListener('blur', _rename);
                label.removeEventListener('keydown', func);
            }
            label.addEventListener('blur', _rename);
            label.addEventListener('keydown', func);
        }
        clear_select() {
            notebook.Env.current_file = null;
            this.treePanel.dom.querySelectorAll('.useless_selected').forEach(item => {
                item.classList.remove('useless_selected');
            });
            this.treePanel.dom.querySelectorAll('.selected').forEach(item => {
                item.classList.remove('selected');
            });
        }
        create_render_obj(obj) {
            var name = obj.path.split('/').pop();
            return {
                label: name,
                icon: obj.type === 'folder' ? 'folder' : (name.split('.').pop() == 'fire' ? 'fire' : 'file'),

                children: obj.children ? obj.children.map(child => this.construct_render_tree_obj(child)) : [],
                data: {
                    type: obj.type,
                    path: obj.path
                },
                on_left_click: async (obj, nodeDiv, e) => {
                    if (obj.data.type == 'folder') return;
                    if (obj.data.path == notebook.Env.current_file) return;
                    if (notebook.canvas.objects.length) notebook.file.save_file();
                    this.clear_select();
                    if (obj.label.split('.').pop() != 'fire') {
                        nodeDiv.classList.add('useless_selected');
                        return;
                    }
                    nodeDiv.classList.add('selected');
                    await notebook.file.open(obj.data.path);
                    notebook.toolbar.manager.select_brush(0);
                },
                on_right_click: (obj, nodeDiv, e) => {
                    if (obj.data.type == 'folder') {
                        notebook.create_right_menu([
                            {
                                text: 'New File', action: async () => {

                                    let date = new Date();
                                    let year = date.getFullYear();
                                    let month = (date.getMonth() + 1).toString().padStart(2, '0');
                                    let day = date.getDate().toString().padStart(2, '0');
                                    let hours = date.getHours().toString().padStart(2, '0');
                                    let minutes = date.getMinutes().toString().padStart(2, '0');
                                    let seconds = date.getSeconds().toString().padStart(2, '0');

                                    var filename = `note_${year}_${month}_${day}_${hours}_${minutes}_${seconds}.fire`;

                                    await window.api.save_file(obj.data.path + '/' + filename, JSON.stringify({
                                        canvas: notebook.Config.empty_file_canvas_template,
                                        toolbar: notebook.toolbar.manager.save()
                                    }));
                                    this.set_path(this.path);

                                }, type: 'item'
                            },
                            {
                                text: 'New Folder', action: async () => {
                                    var folder_name = 'New_Folder'
                                    await window.api.new_folder(obj.data.path + '/' + folder_name);
                                    this.set_path(this.path);
                                }, type: 'item'
                            },
                            { type: 'seperate' },
                            {
                                text: 'Rename', action: async () => {
                                    this.rename(obj, nodeDiv);
                                }, type: 'item'
                            },
                            { type: 'seperate' },
                            {
                                text: 'Delete', action: async () => {
                                    await window.api.delete(obj.data.path);
                                    // 刷新树显示
                                    this.set_path(this.path);
                                }, type: 'item'
                            },
                            { type: 'seperate' },
                            {
                                text: "Open Folder",
                                action: async () => {
                                    this.path = obj.data.path;
                                    this.tree.set_path(this.path);
                                }

                            }
                        ], e);
                    } else {
                        //file
                        notebook.create_right_menu([
                            {
                                text: 'Rename', action: async () => {
                                    this.rename(obj, nodeDiv);
                                }, type: 'item'
                            },
                            {
                                text: 'Delete', action: async () => {
                                    await window.api.delete(obj.data.path);
                                    this.set_path(this.path);
                                }, type: 'item'
                            },
                        ], e);
                    }
                },
                on_double_click: (obj, nodeDiv, e) => {
                    this.rename(obj, nodeDiv);
                }
            };
        }
        construct_render_tree_obj(obj) {
            return this.create_render_obj(obj);
        }

    };
    notebook.tree = new Tree();
})();
