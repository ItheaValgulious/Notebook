(function () {
    class Picbed {
        constructor() {
            this.token = '';
            this.user = '';
            this.repo = '';
            this.apiBase = 'https://api.github.com';
        }
        init(){
            this.token = notebook.Config.picbed.token;
            this.user = notebook.Config.picbed.user;
            this.repo = notebook.Config.picbed.repo;
        }

        async upload(img, fileName = `image-${Date.now()}.png`) {
            try {
                // 确保图片数据是ArrayBuffer或Uint8Array
                if (!(img instanceof ArrayBuffer) && !(img instanceof Uint8Array)) {
                    throw new Error('Image must be in ArrayBuffer or Uint8Array format.');
                }

                // 将buffer转换为Base64
                const base64Content = btoa(
                    String.fromCharCode(...new Uint8Array(img))
                );

                // 构造上传路径
                const path = `images/${fileName}`;
                const url = `${this.apiBase}/repos/${this.user}/${this.repo}/contents/${path}`;

                // 构造请求体
                const body = {
                    message: `Upload image ${fileName}`,
                    content: base64Content,
                };

                console.log(url);

                // 发送请求到GitHub API
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        Authorization: `token ${this.token}`,
                        Accept: 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Upload failed: ${error.message}`);
                }

                const result = await response.json();
                return {
                    url: result.content.download_url,
                    path: result.content.path,
                    sha: result.content.sha,
                };
            } catch (error) {
                console.error('Upload error:', error);
                throw error;
            }
        }
    }

    notebook.picbed = new Picbed();
})();