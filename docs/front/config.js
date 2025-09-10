(function () {
    window.notebook.Config = {
        min_point_distance: 3,
        tension: 0.5,
        reserved_end_point_number: 3,
        canvas_width: 800,
        canvas_height: 600,
        canvas_dp: 3,
        dirty_bias: 30,
        debug: false,
        show_dirty_rect: true,
        selected_width: 2,
        click_max_distance: 20,
        selector_width: 5,
        default_markdown_width: 500,
        default_markdown_height: 500,
        select_color: 'rgba(98, 145, 255, 0.79)',
        empty_file_canvas_template: { objects: [], styles: {}, pos: { x: 0, y: 0 } },
        min_scale: 0.2,
        max_scale: 5,
    };
    window.notebook.Env = {
        current_pen: {
            'pen': 'pencil',
            'touch': 'touch_mover',
            'mouse': 'touch_mover'
        },
        eraser: {
            stroke: true,
            picture: true,
            markdown: true,
            radius: 10,
        },
        current_pointer_type: null,
        current_style: 'pen1',
        current_file: null,
        image_creator:{
            url:''
        }
    };
    window.notebook.Tips={
        'dye':'Dye is to change the style of selected object to the last brush you use!'
    }
})();