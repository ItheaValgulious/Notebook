
window.onload = async () => {
    notebook.Config.canvas_width = window.innerWidth;
    notebook.Config.canvas_height = window.innerHeight;
    document.documentElement.requestFullscreen();

    notebook.api = new notebook.Api();
    await notebook.setup_sign();

    notebook.init_toolbar();
    notebook.tree.init();

    notebook.canvas = new notebook.Canvas();
    notebook.canvas.init();

    notebook.finder.init(notebook.canvas);

    document.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    });

    setInterval(() => {
        if (notebook.Env.current_file) {
            notebook.file.save_file();
        }
    }, 60000);
    
}