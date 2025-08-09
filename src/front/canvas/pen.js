(function () {
    function Pen(name, type) {
        this.name = name;
        this.type = [];
        this.on_move = function () { };
        this.on_begin = function () { };
        this.on_end = function () { };
        Pen.pens[name] = this;
    }
    Pen.pens = {};
    var pencil = new Pen('pencil', ['pen','mouse']),
        eraser = new Pen('eraser', ['pen']),
        selector = new Pen('selector', ['pen']);
    var touch_mover = new Pen('touch_mover', ['touch', 'mouse']);

    pencil.on_begin = function (canvas, event, point) {
        this.current_stroke = new notebook.Stroke(notebook.Env.current_style);
        canvas.add_object(this.current_stroke);
    }.bind(pencil);
    pencil.on_move = function (canvas, event, point) {
        this.current_stroke.push(new notebook.StrokePoint(point.x, point.y, event.pressure));
    }.bind(pencil);
    pencil.on_end = function (canvas, event, point) {
        this.current_stroke.simplify();
        this.current_stroke.calc_rect();
        canvas.add_dirty_rect(this.current_stroke.rect);
        this.current_stroke = null;
    }.bind(pencil);

    eraser.on_move = function (canvas, event, point) {
        for (var i = 0; i < canvas.objects.length; i++) {
            var stroke = canvas.objects[i];
            if (stroke.collide_circle(point.x, point.y, notebook.Env.eraser_radius)) {
                canvas.objects.splice(i, 1);
                canvas.add_dirty_rect(stroke.rect);
                i--;
            }
        }
    }.bind(eraser);

    touch_mover.on_begin = function (canvas, event, point) {
        this.lastpos = point.add(canvas.pos.mul(-1));
    }.bind(touch_mover);
    touch_mover.on_move = function (canvas, event, point) {
        point = point.add(canvas.pos.mul(-1));
        var dx = point.x - this.lastpos.x, dy = point.y - this.lastpos.y;
        canvas.pos.x -= dx;
        canvas.pos.y -= dy;
        canvas.add_dirty_rect(notebook.utils.Rect.full().move(canvas.pos.x, canvas.pos.y));
        this.lastpos = point;
    }
    touch_mover.on_end = function (canvas, event, point) {
        this.lastpos = null;
    }

    selector.on_begin = function (canvas, event, point) {
        if (canvas.selected.length) {
            this.mode = 'move';
            this.lastpos = point;
            this.sum = notebook.utils.Point.zero();
        } else {
            this.mode = 'select';
            this.stroke = new notebook.Stroke('select_chain');
            canvas.add_object(this.stroke);
        }
    }
    selector.on_move = function (canvas, event, point) {
        if (this.mode == 'move') {
            var dx = point.x - this.lastpos.x, dy = point.y - this.lastpos.y;
            for (var i = 0; i < canvas.selected.length; i++) {
                var obj = canvas.selected[i];
                canvas.add_dirty_rect(obj.rect);
                obj.move(dx, dy);
                canvas.add_dirty_rect(obj.rect);
            }
            this.sum.x += Math.abs(dx);
            this.sum.y += Math.abs(dy);
            this.lastpos = point;
        } else if (this.mode == 'select') {
            this.stroke.push(new notebook.StrokePoint(point.x, point.y, event.pressure));
        }
    }.bind(selector);
    selector.on_end = function (canvas, event, point) {
        if (this.mode == 'select') {
            canvas.objects.splice(canvas.objects.indexOf(this.stroke), 1);
            canvas.add_dirty_rect(this.stroke.rect);

            //circle to select objects
            this.stroke.simplify();
            this.stroke.calc_rect();

            if (!this.ctx) this.ctx = canvas.canvas.getContext('2d');
            this.ctx.beginPath();
            this.ctx.moveTo(this.stroke.points[0].x, this.stroke.points[0].y);
            for (let p of this.stroke.points) {
                this.ctx.lineTo(p.x, p.y);
            }
            this.ctx.closePath();

            for (var i = 0; i < canvas.objects.length; i++) {
                var obj = canvas.objects[i];
                if (obj.selected || !obj.fast_collide_rect(this.stroke.rect)) continue;
                if (obj.collide_path(this.ctx)) obj.set_selected(true);
            }
        } else if (this.mode == 'move') {
            if (this.sum.x <= notebook.Config.unselect_min_distance && this.sum.y <= notebook.Config.unselect_min_distance) {
                //click to unselect all
                for (var i = 0; i < canvas.objects.length; i++) {
                    var obj = canvas.objects[i];
                    if (obj.selected) obj.set_selected(false);
                }
            }
        }


    }

    window.notebook.pens = Pen.pens;
})();