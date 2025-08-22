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
            localStorage.setItem('setting',JSON.stringify(empty_setting));
        }
        var obj = JSON.parse(localStorage.getItem('setting'));
        for (var key in obj) {
            window.notebook.Config[key] = obj[key];
        }
    }
    
    notebook.setting_init = setting_init;
})();