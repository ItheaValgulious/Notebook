
window.onload = () => {
    notebook.Config.canvas_width = window.innerWidth;
    notebook.Config.canvas_height = window.innerHeight;
    notebook.setting_init();
    
    notebook.picbed.init();

    window.api=new notebook.Api(notebook.Config.file.user+'/'+notebook.Config.file.repo,notebook.Config.file.token);
    notebook.init_toolbar();
    notebook.tree.init();
    
    notebook.canvas = new notebook.Canvas();
    notebook.canvas.init();

    document.documentElement.requestFullscreen();
}