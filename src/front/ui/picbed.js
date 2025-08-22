(function () {

    function uint8ArrayToBase64(uint8Array) {
        const chunkSize = 8192; // Process 8192 bytes at a time
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, i + chunkSize);
            binaryString += String.fromCharCode.apply(null, chunk);
        }
        return btoa(binaryString);
    }

    class Picbed {
        constructor() {
            this.token = '';
            this.user = '';
            this.repo = '';
            this.apiBase = 'https://api.github.com';
        }
        init() {
            this.token = notebook.Config.picbed.token;
            this.user = notebook.Config.picbed.user;
            this.repo = notebook.Config.picbed.repo;
        }

        async upload(base64Content, fileName = `image-${Date.now()}.png`) {
            try {

                // 构造上传路径
                const path = `images/${fileName}`;
                const url = `${this.apiBase}/repos/${this.user}/${this.repo}/contents/${path}`;

                // 构造请求体
                const body = {
                    message: `Upload image ${fileName}`,
                    content: base64Content,
                };

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

        async upload_file() {
            //select a file from local system and upload
            return new Promise((resolve, reject) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.click();
                input.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.readAsArrayBuffer(file);
                        reader.onload = async () => {
                            try {



                                const content = new Uint8Array(reader.result);
                                const base64Content = uint8ArrayToBase64(content);
                                resolve(base64Content);
                            } catch (error) {
                                reject(error);
                            }
                        };
                        reader.onerror = () => reject(new Error('Failed to read file'));
                    } else {
                        reject(new Error('No file selected'));
                    }
                });
            });
        }

        async take_photo() {
            //take a photo from camera
            // 调用浏览器的媒体设备 API 来访问摄像头并拍照
            return new Promise(async (resolve, reject) => {
                try {
                    var take_photo_div = document.createElement('div');
                    take_photo_div.classList.add('phototaker');
                    document.body.appendChild(take_photo_div);

                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

                    // 创建一个 video 元素来显示摄像头画面
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.play();

                    // 创建一个按钮用于拍照
                    const captureButton = document.createElement('button');
                    captureButton.textContent = '拍照';
                    take_photo_div.appendChild(captureButton);

                    // 创建一个 canvas 元素用于捕获图像
                    const canvas = document.createElement('canvas');
                    captureButton.addEventListener('click', () => {
                        try {
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            canvas.getContext('2d').drawImage(video, 0, 0);

                            // 将 canvas 中的图像转换为 base64 格式
                            const dataUrl = canvas.toDataURL('image/jpeg');
                            const photoData = dataUrl.split(',')[1];

                            // 停止摄像头流
                            stream.getTracks().forEach(track => track.stop());
                            // 移除 video 和按钮元素
                            document.body.removeChild(take_photo_div);

                            resolve(photoData);
                        } catch (error) {
                            reject(error);
                        }
                    });

                    take_photo_div.appendChild(video);
                } catch (error) {
                    console.error('访问摄像头失败:', error);
                    reject(error);
                }
            });
        }
    }

    notebook.picbed = new Picbed();
})();