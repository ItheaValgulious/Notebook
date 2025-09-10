(function () {
    class Api {
        /**
         * Local FastAPI Notebook Server
         * @param {string} baseUrl - Base URL of the FastAPI server (default: http://127.0.0.1:8000)
         */
        constructor(baseUrl = 'http://124.222.61.175:8000') {
            this.baseUrl = baseUrl;
            this.token = null;
        }

        // Authentication methods
        async signup(username, password) {
            try {
                const response = await fetch(`${this.baseUrl}/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                if (data.status === 'succeed') {
                    this.token = data.token;
                    return { success: true, token: data.token };
                }
                return { success: false };
            } catch (error) {
                console.error('Signup error:', error);
                return { success: false };
            }
        }

        async signin(username, password) {
            try {
                const response = await fetch(`${this.baseUrl}/signin`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                if (data.status === 'succeed') {
                    this.token = data.token;
                    return { success: true, token: data.token };
                }
                return { success: false };
            } catch (error) {
                console.error('Signin error:', error);
                return { success: false };
            }
        }

        async signout() {
            try {
                const response = await fetch(`${this.baseUrl}/signout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token: this.token })
                });
                
                const data = await response.json();
                if (data.status === 'succeed') {
                    this.token = null;
                    return { success: true };
                }
                return { success: false };
            } catch (error) {
                console.error('Signout error:', error);
                return { success: false };
            }
        }

        async check(token) {
            try {
                const response = await fetch(`${this.baseUrl}/check?token=${token}`);
                
                const data = await response.json();
                if (data.status === 'succeed') {
                    this.token = token;
                    return { success: true, username: data.username };
                }
                return { success: false };
            } catch (error) {
                console.error('Check token error:', error);
                return { success: false };
            }
        }

        // File operations
        async read_file(path) {
            try {
                const response = await fetch(`${this.baseUrl}/file/${path}?token=${this.token}`);
                
                if (!response.ok) {
                    return null;
                }
                
                // Check if response is text (file content) or JSON (folder structure)
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    return data.status === 'succeed' ? data.data : null;
                } else {
                    return await response.text();
                }
            } catch (error) {
                console.error('Read file error:', error);
                return null;
            }
        }

        async save_file(path, content) {
            try {
                const response = await fetch(`${this.baseUrl}/file${path}?token=${this.token}`, {
                    method: 'POST',
                    body: content
                });
                
                const data = await response.json();
                return data.status === 'succeed';
            } catch (error) {
                console.error('Save file error:', error);
                return false;
            }
        }

        async read_folder(path) {
            try {
                const response = await fetch(`${this.baseUrl}/file/${path}?token=${this.token}`);
                
                if (!response.ok) {
                    return null;
                }
                
                const data = await response.json();
                return data.status === 'succeed' ? data.data : null;
            } catch (error) {
                console.error('Read folder error:', error);
                return null;
            }
        }

        async new_folder(path) {
            try {
                // Create folder by making a POST request with empty content
                const response = await fetch(`${this.baseUrl}/file/${path}?token=${this.token}`, {
                    method: 'POST',
                    body: ''
                });
                
                const data = await response.json();
                return data.status === 'succeed';
            } catch (error) {
                console.error('Create folder error:', error);
                return false;
            }
        }

        async delete(path) {
            try {
                const response = await fetch(`${this.baseUrl}/file/${path}?token=${this.token}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                return data.status === 'succeed';
            } catch (error) {
                console.error('Delete error:', error);
                return false;
            }
        }

        async rename(oldPath, newname) {
            var newPath=oldPath.substring(0,oldPath.lastIndexOf('/'))+'/'+newname;
            try {
                const response = await fetch(`${this.baseUrl}/rename/file/${oldPath}?newpath=${encodeURIComponent(newPath)}&token=${this.token}`, {
                    method: 'POST'
                });
                
                const data = await response.json();
                return data.status === 'succeed';
            } catch (error) {
                console.error('Rename error:', error);
                return false;
            }
        }

        // Picture operations
        async upload_picture(file) {
            try {
                const formData = new FormData();
                formData.append('img', file);
                
                const response = await fetch(`${this.baseUrl}/picture/?token=${this.token}`, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (data.status === 'succeed') {
                    return { success: true, url: `${this.baseUrl}${data.url}` };
                }
                return { success: false };
            } catch (error) {
                console.error('Upload picture error:', error);
                return { success: false };
            }
        }


        // Helper method to check if authenticated
        isAuthenticated() {
            return this.token !== null;
        }

        // Helper method to set token (useful if you have token from elsewhere)
        setToken(token) {
            this.token = token;
        }

        async download() {
            try {
                const response = await fetch(`${this.baseUrl}/download?token=${this.token}`);
                
                if (!response.ok) {
                    return false;
                }
                
                // Create a blob from the response
                const blob = await response.blob();
                
                // Create a download link and trigger the download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'notebook-download';
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 0);
                
                return true;
            } catch (error) {
                console.error('Download error:', error);
                return false;
            }
        }
    }

    window.notebook = {};
    window.notebook.Api = Api;
})();