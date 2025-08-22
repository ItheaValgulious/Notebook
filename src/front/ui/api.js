(function () {
    class Api {
        /**
         * GitHub API文件存储系统
         * @param {string} repo - 仓库名称，格式为 'username/repository'
         * @param {string} token - GitHub个人访问令牌
         */
        constructor(repo, token) {
            this.repo = repo;
            this.token = token;
            this.baseUrl = 'https://api.github.com';
            this.headers = {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            };
            this.fileStructurePath = 'file.json';
            this.fileStructure = null;
            this.init();
        }

        // Generate unique ID for files
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        // Directly read a file from GitHub without using file structure
        async _read_file(path) {
            try {
                const response = await fetch(`${this.baseUrl}/repos/${this.repo}/contents/${path}`, {
                    headers: this.headers
                });

                if (!response.ok) {
                    if (response.status === 404) return null; // File not found
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                if (data.type === 'file') {
                    return {
                        content: atob(data.content),
                        sha: data.sha
                    };
                }
                return null;
            } catch (error) {
                console.error('Error in _read_file:', error);
                return null;
            }
        }

        // Directly save a file to GitHub without using file structure
        async _save_file(path, content, message = `Update ${path}`, sha = undefined) {
            try {
                const response = await fetch(`${this.baseUrl}/repos/${this.repo}/contents/${path}`, {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify({
                        message,
                        content: btoa(content),
                        sha
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return {
                    sha: data.content.sha
                };
            } catch (error) {
                console.error('Error in _save_file:', error);
                return null;
            }
        }

        // Initialize by loading or creating file.json
        async init() {
            const fileJsonData = await this._read_file(this.fileStructurePath);
            if (fileJsonData) {
                this.fileStructure = JSON.parse(fileJsonData.content);
            } else {
                this.fileStructure = {
                    path: '/',
                    type: 'folder',
                    children: []
                };
                // Create file.json if it doesn't exist
                await this._save_file(this.fileStructurePath, JSON.stringify(this.fileStructure, null, 2), `Create ${this.fileStructurePath}`);
            }
            return true;
        }

        // Save file.json
        async saveFileStructure() {
            try {
                const content = JSON.stringify(this.fileStructure, null, 2);
                const existingFile = await this._read_file(this.fileStructurePath);
                return await this._save_file(
                    this.fileStructurePath,
                    content,
                    `Update ${this.fileStructurePath}`,
                    existingFile ? existingFile.sha : undefined
                );
            } catch (error) {
                console.error('Error saving file structure:', error);
                return null;
            }
        }

        // Find node in file structure
        findNode(path, structure = this.fileStructure) {
            if (structure.path === path) return structure;
            if (structure.type === 'folder') {
                for (const child of structure.children) {
                    const result = this.findNode(path, child);
                    if (result) return result;
                }
            }
            return null;
        }

        async read_file(path) {
            try {
                if (!this.fileStructure) await this.init();

                const node = this.findNode(path);
                if (!node || node.type !== 'file') return null;

                const fileData = await this._read_file(`storage_${node.id}`);
                return fileData ? fileData.content : null;
            } catch (error) {
                console.error('Error reading file:', error);
                return null;
            }
        }

        async save_file(path, content) {
            try {
                if (!this.fileStructure) await this.init();

                let node = this.findNode(path);
                const isNewFile = !node;

                if (isNewFile) {
                    const id = this.generateId();
                    node = {
                        path,
                        type: 'file',
                        id
                    };
                    const parentPath = path.substring(0, path.lastIndexOf('/'));
                    const parent = parentPath ? this.findNode(parentPath) : this.fileStructure;
                    if (!parent || parent.type !== 'folder') {
                        throw new Error('Parent folder not found');
                    }
                    parent.children.push(node);
                }

                // Save actual file content
                const existingFile = await this._read_file(`storage_${node.id}`);
                const fileResponse = await this._save_file(
                    `storage_${node.id}`,
                    content,
                    `Update storage_${node.id}`,
                    existingFile ? existingFile.sha : undefined
                );

                if (!fileResponse) {
                    throw new Error('Failed to save file content');
                }

                // Update file structure
                const structureResponse = await this.saveFileStructure();

                return structureResponse !== null;
            } catch (error) {
                console.error('Error saving file:', error);
                return null;
            }
        }

        async read_folder(path) {
            try {
                if (!this.fileStructure) await this.init();

                const node = this.findNode(path);
                if (!node || node.type !== 'folder') return null;

                return node;
            } catch (error) {
                console.error('Error reading folder:', error);
                return null;
            }
        }

        async new_folder(path) {
            try {
                if (!this.fileStructure) await this.init();

                if (this.findNode(path)) {
                    throw new Error('Folder already exists');
                }

                const folder = {
                    path,
                    type: 'folder',
                    children: []
                };

                const parentPath = path.substring(0, path.lastIndexOf('/'));
                const parent = parentPath ? this.findNode(parentPath) : this.fileStructure;
                if (!parent || parent.type !== 'folder') {
                    throw new Error('Parent folder not found');
                }

                parent.children.push(folder);
                return await this.saveFileStructure();
            } catch (error) {
                console.error('Error creating folder:', error);
                return null;
            }
        }

        async delete(path) {
            try {
                if (!this.fileStructure) await this.init();

                const node = this.findNode(path);
                if (!node) return false;

                const parentPath = path.substring(0, path.lastIndexOf('/'));
                const parent = parentPath ? this.findNode(parentPath) : this.fileStructure;
                if (!parent || parent.type !== 'folder') return false;

                // If it's a file, delete the storage file
                if (node.type === 'file') {
                    const fileData = await this._read_file(`storage_${node.id}`);
                    if (fileData) {
                        const response = await fetch(`${this.baseUrl}/repos/${this.repo}/contents/storage_${node.id}`, {
                            method: 'DELETE',
                            headers: this.headers,
                            body: JSON.stringify({
                                message: `Delete storage_${node.id}`,
                                sha: fileData.sha
                            })
                        });
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                    }
                } else if (node.type == 'folder') {
                    // Delete folder recursively
                    const deleteRecursively = async (folder) => {
                        for (const child of folder.children) {
                            if (child.type === 'folder') {
                                await deleteRecursively(child);
                            } else {
                                const fileData = await this._read_file(`storage_${child.id}`);
                                if (fileData) {
                                    const response = await fetch(`${this.baseUrl}/repos/${this.repo}/contents/storage_${child.id}`, {
                                        method: 'DELETE',
                                        headers: this.headers,
                                        body: JSON.stringify({
                                            message: `Delete storage_${child.id}`,
                                            sha: fileData.sha
                                        })
                                    });
                                    if (!response.ok) {
                                        throw new Error(`HTTP error! status: ${response.status}`);
                                    }
                                }
                            }
                        }
                    };
                    await deleteRecursively(node);
                }

                // Remove from parent children
                parent.children = parent.children.filter(child => child.path !== path);
                return await this.saveFileStructure();
            } catch (error) {
                console.error('Error deleting:', error);
                return false;
            }
        }

        async rename(path, newname) {
            try {
                if (!this.fileStructure) await this.init();

                const node = this.findNode(path);
                if (!node) return false;

                const parentPath = path.substring(0, path.lastIndexOf('/'));
                const newPath = parentPath ? `${parentPath}/${newname}` : newname;

                if (this.findNode(newPath)) {
                    throw new Error('Target path already exists');
                }

                // Update path in file structure
                node.path = newPath;

                // For folders, recursively update children paths
                if (node.type === 'folder') {
                    const updateChildPaths = (children, oldParentPath, newParentPath) => {
                        for (const child of children) {
                            child.path = child.path.replace(oldParentPath, newParentPath);
                            if (child.type === 'folder') {
                                updateChildPaths(child.children, oldParentPath, newParentPath);
                            }
                        }
                    };
                    updateChildPaths(node.children, path, newPath);
                }

                return await this.saveFileStructure();
            } catch (error) {
                console.error('Error renaming:', error);
                return false;
            }
        }
    }
    window.notebook = {};
    window.notebook.Api = Api;
})();