(function () {
    notebook.info = (text) => {
        // 创建信息提示div
        const infoDiv = document.createElement('div');
        infoDiv.className = 'info-message';
        infoDiv.textContent = text;
        
        // 设置样式
        infoDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 9999;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: opacity 0.3s ease;
        `;
        
        // 添加到页面
        document.body.appendChild(infoDiv);
        
        // 3秒后自动消失
        setTimeout(() => {
            infoDiv.style.opacity = '0';
            setTimeout(() => {
                if (infoDiv.parentNode) {
                    infoDiv.parentNode.removeChild(infoDiv);
                }
            }, 300);
        }, 3000);
    }
})();