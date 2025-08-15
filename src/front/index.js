
window.onload = () => {
    notebook.Config.canvas_width = window.innerWidth;
    notebook.Config.canvas_height = window.innerHeight;
    // notebook.init_menu();
    notebook.init_toolbar();
    notebook.canvas = new notebook.Canvas();
    notebook.canvas.init();
}