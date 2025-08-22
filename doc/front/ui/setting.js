(function () {
    var empty_setting = {
        picbed: {
            enable: false,
            token: "",
            user: "",
            repo: ""
        },
        file: {
            token: "",
            user: "",
            repo: ""
        }
    };
    function setting_init() {
        if (!localStorage.getItem('setting')) {
            // 创建一个简单的弹窗让用户输入设置
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';

            const content = document.createElement('div');
            content.style.backgroundColor = 'white';
            content.style.padding = '20px';
            content.style.borderRadius = '5px';
            content.style.width = '400px';

            const textarea = document.createElement('textarea');
            textarea.style.width = '100%';
            textarea.style.height = '200px';
            textarea.placeholder = '请输入设置内容，格式为 JSON:\n' + JSON.stringify(empty_setting, null, 2);

            const saveBtn = document.createElement('button');
            saveBtn.textContent = '保存';
            saveBtn.style.marginTop = '10px';
            saveBtn.style.float = 'right';
            saveBtn.addEventListener('click', function () {
                try {
                    const newSetting = JSON.parse(textarea.value);
                    localStorage.setItem('setting', JSON.stringify(newSetting));
                    modal.remove();
                } catch (e) {
                    alert('输入的 JSON 格式不正确，请检查后重试。');
                }
            });

            content.appendChild(textarea);
            content.appendChild(saveBtn);
            modal.appendChild(content);
            document.body.appendChild(modal);
        }
        var obj = JSON.parse(localStorage.getItem('setting'));
        for (var key in obj) {
            window.notebook.Config[key] = obj[key];
        }
    }

    notebook.setting_init = setting_init;
})();