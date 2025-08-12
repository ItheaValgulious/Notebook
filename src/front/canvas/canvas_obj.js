(function () {
    function virtual_func_error() {
        throw new Error('virtual function not implemented');
    }
    class CanvasObj {
        constructor() {
            this.rect = notebook.utils.Rect.empty();
            this.pos = notebook.utils.Point.zero();
            this.selected = false;
            this.canvas = null;
        }
        move(dx, dy) {
            this.pos.x += dx;
            this.pos.y += dy;
            this.rect.move(dx, dy);
        }
        collide_circle(x, y, r) {
            virtual_func_error();
        }
        fast_collide_rect(rect) {
            return this.rect.collide_rect(rect);
        }
        collide_path(ctx) {
            virtual_func_error();
        }
        set_selected(selected) {
            virtual_func_error();
        }
        draw(ctx) {
            virtual_func_error();
        }
        save() {
            virtual_func_error();
        }
        load(obj) {
            virtual_func_error();
        }
        on_add_to_canvas() {
            
        }

    }
    notebook.CanvasObj = CanvasObj;

})();