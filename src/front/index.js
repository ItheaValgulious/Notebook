window.onload = () => {
    notebook.Config.canvas_width = window.innerWidth;
    notebook.Config.canvas_height = window.innerHeight;
    notebook.init_menu();
    notebook.canvas = new notebook.Canvas();
    notebook.canvas.append_to(document.querySelector('#content_container'));

    md = new notebook.MarkdownArea(new notebook.utils.Point(500, 500), 500, 500);
    notebook.canvas.add_object(md);
}