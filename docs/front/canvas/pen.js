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
    var pencil = new Pen('pencil', ['pen']),
        eraser = new Pen('eraser', ['pen']),
        selector = new Pen('selector', ['pen']);
    var touch_mover = new Pen('touch_mover', ['touch']);
    var markdown_creator = new Pen('markdown_creator', ['pen']);
    var image_creator = new Pen('image_creator', ['pen']);

    pencil.on_begin = function (canvas, event, point) {
        this.current_stroke = new notebook.Stroke(notebook.Env.current_style);
        canvas.add_object(this.current_stroke);
    }.bind(pencil);
    pencil.on_move = function (canvas, event, point) {
        this.current_stroke.push(new notebook.StrokePoint(point, event.pressure));
    }.bind(pencil);
    pencil.on_end = function (canvas, event, point) {
        this.current_stroke.simplify();
        this.current_stroke.calc_rect();
        canvas.add_dirty_rect(this.current_stroke.rect);
        this.current_stroke = null;
    }.bind(pencil);

    eraser.on_move = function (canvas, event, point) {
        var delete_all_selected = false;
        for (var i = 0; i < canvas.objects.length; i++) {
            var obj = canvas.objects[i];
            if (obj.collide_circle(point.x, point.y, notebook.Env.eraser_radius)) {
                if (!obj.selected) {
                    canvas.remove_object(obj);
                    i--;
                } else {
                    delete_all_selected = true;
                    break;
                }
            }
        }
        if (delete_all_selected) {
            var list=[];
            for (var se of canvas.selected) 
                list.push(se);
            for(var obj of list){
                obj.set_selected(false);
                canvas.remove_object(obj);
            }
        }
    }.bind(eraser);

    touch_mover.on_begin = function (canvas, event, point) {
        var factor = canvas.dp;
        this.lastpos = new notebook.utils.Point(event.offsetX * factor, event.offsetY * factor);
    }.bind(touch_mover);
    touch_mover.on_move = function (canvas, event, point) {
        var factor = canvas.dp;
        point = new notebook.utils.Point(event.offsetX * factor, event.offsetY * factor);
        var dx = point.x - this.lastpos.x, dy = point.y - this.lastpos.y;
        canvas.move(-dx, -dy);
        this.lastpos = point;
    }
    touch_mover.on_end = function (canvas, event, point) {
        this.lastpos = null;
    }

    selector.on_begin = function (canvas, event, point) {
        this.sum = notebook.utils.Point.zero();
        this.lastpos = point;

        if (canvas.selected.length) {
            this.mode = 'move';
        } else {
            this.mode = 'select';
            this.stroke = new notebook.Stroke('select_chain');
            canvas.add_object(this.stroke);
        }
    }
    selector.on_move = function (canvas, event, point) {
        var dx = point.x - this.lastpos.x, dy = point.y - this.lastpos.y;
        this.sum.x += Math.abs(dx);
        this.sum.y += Math.abs(dy);
        if (this.mode == 'move') {
            for (var i = 0; i < canvas.selected.length; i++) {
                var obj = canvas.selected[i];
                canvas.add_dirty_rect(obj.rect);
                obj.move(dx, dy);
                canvas.add_dirty_rect(obj.rect);
            }
        } else if (this.mode == 'select') {
            this.stroke.push(new notebook.StrokePoint(point, event.pressure));
        }
        this.lastpos = point;
    }.bind(selector);
    selector.on_end = function (canvas, event, point) {
        if (this.mode == 'select') {
            canvas.remove_object(this.stroke);

            if (this.sum.x <= notebook.Config.click_max_distance && this.sum.y <= notebook.Config.click_max_distance) {
                //click to select objects
                for (var i = 0; i < canvas.objects.length; i++) {
                    var obj = canvas.objects[i];
                    if (obj.collide_circle(this.lastpos.x, this.lastpos.y, 1)) {
                        obj.set_selected(true);
                    }
                }
            } else {
                //circle to select objects
                this.stroke.simplify();
                this.stroke.calc_rect();

                if (!this.ctx) this.ctx = canvas.canvas.getContext('2d');
                this.ctx.beginPath();
                this.ctx.moveTo(this.stroke.points[0].pos.x, this.stroke.points[0].pos.y);
                for (let p of this.stroke.points) {
                    this.ctx.lineTo(p.pos.x, p.pos.y);

                }
                this.ctx.closePath();

                for (var i = 0; i < canvas.objects.length; i++) {
                    var obj = canvas.objects[i];
                    if (obj.selected || !obj.fast_collide_rect(this.stroke.rect)) continue;
                    if (obj.collide_path(this.ctx)) obj.set_selected(true);
                }
            }
        } else if (this.mode == 'move') {
            if (this.sum.x <= notebook.Config.click_max_distance && this.sum.y <= notebook.Config.click_max_distance) {
                //click to unselect all
                for (var i = 0; i < canvas.objects.length; i++) {
                    var obj = canvas.objects[i];
                    if (obj.selected) obj.set_selected(false);
                }
            }
        }
    }

    markdown_creator.on_begin = function (canvas, event, point) {
        this.mode = 'create';
        this.beginpos = point;
        this.lastpos = point;
        this.sum = notebook.utils.Point.zero();
        for (var obj of canvas.objects) {
            if (obj instanceof notebook.MarkdownArea && obj.rect.in(point)) {
                this.mode = 'edit';
                this.markdown = obj;
            }
        }
        if (this.mode == 'create') {
            this.markdown = new notebook.MarkdownArea(point, notebook.Config.default_markdown_width, notebook.Config.default_markdown_height);
            canvas.add_object(this.markdown);
        }

    }.bind(markdown_creator);
    markdown_creator.on_move = function (canvas, event, point) {
        if (this.mode == 'create') {
            this.markdown.width = point.x - this.beginpos.x;
            this.markdown.height = point.y - this.beginpos.y;
            this.markdown.set_style()
        } else if (this.mode == 'edit') {
            var dx = point.x - this.lastpos.x, dy = point.y - this.lastpos.y;
            this.markdown.width += dx;
            this.markdown.height += dy;
            this.markdown.set_style();
        }
        this.sum.x += Math.abs(point.x - this.lastpos.x);
        this.sum.y += Math.abs(point.y - this.lastpos.y);
        this.lastpos = point;
    }.bind(markdown_creator);
    markdown_creator.on_end = function (canvas, event, point) {
        if (this.mode == 'create') {
            if (this.sum.x <= notebook.Config.click_max_distance && this.sum.y <= notebook.Config.click_max_distance) {
                this.markdown.width = notebook.Config.default_markdown_width;
                this.markdown.height = notebook.Config.default_markdown_height;
                this.markdown.set_style();
            }
            this.markdown.focus();
        } else if (this.mode == 'edit') {
            if (this.sum.x <= notebook.Config.click_max_distance && this.sum.y <= notebook.Config.click_max_distance) {
                this.markdown.width -= point.x - this.beginpos.x;
                this.markdown.height -= point.y - this.beginpos.y;
                this.markdown.set_style();
                this.markdown.focus()
            } else {
            }
        }
        this.markdown = null;
    }.bind(markdown_creator);

    image_creator.on_end = function (canvas, event, point) {
        var value = `![image](${notebook.Env.image_creator.url})`;
        var md = new notebook.MarkdownArea(point, notebook.Config.default_markdown_width, notebook.Config.default_markdown_height, value);
        canvas.add_object(md);
        notebook.Env.image_creator.url = '';
    }.bind(image_creator)



    window.notebook.pens = Pen.pens;
})();