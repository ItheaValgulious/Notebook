(function () {
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
            return !(x < this.rect.x1 || x > this.rect.x2 || y < this.rect.y1 || y > this.rect.y2) ||
                notebook.utils.distance_to_line(x, y, this.rect.x1, this.rect.y1, this.rect.x1, this.rect.y2) <= r ||
                notebook.utils.distance_to_line(x, y, this.rect.x1, this.rect.y1, this.rect.x2, this.rect.y1) <= r ||
                notebook.utils.distance_to_line(x, y, this.rect.x2, this.rect.y1, this.rect.x2, this.rect.y2) <= r ||
                notebook.utils.distance_to_line(x, y, this.rect.x2, this.rect.y2, this.rect.x1, this.rect.y2) <= r;
        }
        fast_collide_rect(rect) {
            return this.rect.collide_rect(rect);
        }
        collide_path(ctx) {
            return (ctx.isPointInPath(this.rect.x1, this.rect.y1) && ctx.isPointInPath(this.rect.x2, this.rect.y2) && ctx.isPointInPath(this.rect.x1, this.rect.y2) && ctx.isPointInPath(this.rect.x2, this.rect.y1))
        }
        set_selected(selected) {
            if (this.selected === selected) return false;
            this.selected = selected;
            if (selected) this.canvas.selected.push(this);
            else {
                const index = this.canvas.selected.indexOf(this);
                if (index > -1) this.canvas.selected.splice(index, 1);
            }
            return true;
        }
        draw(ctx) {
            notebook.utils.virtual_func_error();
        }
        save() {
            notebook.utils.virtual_func_error();
        }
        static load(obj) {
            notebook.utils.virtual_func_error();
        }
        update(){}
        on_add_to_canvas() { }
        on_remove_from_canvas() { }
    }
    notebook.CanvasObj = CanvasObj;

})();