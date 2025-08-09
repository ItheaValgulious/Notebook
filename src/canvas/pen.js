(function () {
    function Pen(name) {
        this.name = name;
        this.on_move = function () { };
        this.on_begin = function () { };
        this.on_end = function () { };
    }
    var pencil = new Pen('pencil'),
        eraser = new Pen('eraser'),
        selector = new Pen('selector');

    pencil.on_begin = function (canvas, event, x, y) {
        this.current_stroke = new notebook.Stroke()
        canvas.add_object(this.current_stroke);
    }.bind(pencil);
    pencil.on_move = function (canvas, event, x, y) {
        this.current_stroke.push(new notebook.StrokePoint(x, y, event.pressure));
    }.bind(pencil);
    pencil.on_end = function (canvas, event, x, y) {
        this.current_stroke.simplify();
        this.current_stroke.calc_rect();
        canvas.add_dirty_rect(this.current_stroke.rect);
        this.current_stroke = null;
    }.bind(pencil);

    eraser.on_move = function (canvas, event, x, y) {
        for (var i = 0; i < canvas.objects.length; i++) {
            var stroke = canvas.objects[i];
            if (stroke.collide_circle(x, y, notebook.Env.eraser_radius)) {
                canvas.objects.splice(i, 1);
                canvas.add_dirty_rect(stroke.rect);
                i--;
            }
        }
    }.bind(eraser);

    selector.on_begin = function (canvas, event, x, y) {
        if (canvas.selected.length) {
            this.mode = 'move';
            this.lastpos = { x: x, y: y };
            this.sum = { x: 0, y: 0 };
        } else {
            this.mode = 'select';
            this.stroke = new notebook.Stroke();
            canvas.add_object(this.stroke);
            this.stroke.styleid = 'select_chain';
        }
    }
    selector.on_move = function (canvas, event, x, y) {
        if (this.mode == 'move') {
            var dx = x - this.lastpos.x, dy = y - this.lastpos.y;
            for (var i = 0; i < canvas.selected.length; i++) {
                var obj = canvas.selected[i];
                canvas.add_dirty_rect(obj.rect);
                obj.move(dx, dy);
                canvas.add_dirty_rect(obj.rect);
            }
            this.sum.x += Math.abs(dx);
            this.sum.y += Math.abs(dy);
            this.lastpos = { x: x, y: y };
        } else if (this.mode == 'select') {
            this.stroke.push(new notebook.StrokePoint(x, y, event.pressure));
        }
    }.bind(selector);
    selector.on_end = function (canvas, event, x, y) {
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

    window.notebook.pens = [
        pencil,
        eraser,
        selector
    ];
})();