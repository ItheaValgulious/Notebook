(function () {
    function Canvas() {
        this.objects = [];
        this.width = notebook.Config.canvas_width;
        this.height = notebook.Config.canvas_height;
        this.dp = notebook.Config.canvas_dp;
        this.canvas_rect = null;
        this.canvas = null;
        this.content_container = null;
        this.ctx = null;
        this.dirty_rect = notebook.utils.Rect.full();
        this.selected = [];
        this.pos = notebook.utils.Point.zero();
    }
    Canvas.prototype.add_object = function (object) {
        this.objects.push(object);
        object.canvas = this;
        object.on_add_to_canvas();
    }
    Canvas.prototype.get_true_position = function (event) {
        return new notebook.utils.Point((event.offsetX * this.dp + this.pos.x), (event.offsetY * this.dp + this.pos.y));
    }
    Canvas.prototype.init = function (parentNode) {
        parentNode = parentNode || document.body;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.width * this.dp;
        this.canvas.height = this.height * this.dp;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.canvas_rect = this.canvas.getBoundingClientRect();
        parentNode.appendChild(this.canvas);

        this.content_container = document.createElement('div');
        this.content_container.classList.add('content_container');
        parentNode.appendChild(this.content_container);

        this.set_style();

        function pointer_begin(event) {
            var pointerType = event.pointerType;
            if (notebook.Config.debug && pointerType == 'mouse') pointerType = 'pen';
            this.canvas.addEventListener('pointermove', pointer_move);
            this.canvas.addEventListener('pointerup', pointer_end);

            notebook.pens[notebook.Env.current_pen[pointerType]].on_begin(this, event, this.get_true_position(event));
            notebook.Env.current_pointer_type = pointerType;
        }
        function pointer_move(ev) {
            var pointerType = ev.pointerType;
            if (notebook.Config.debug && pointerType == 'mouse') pointerType = 'pen';
            if (notebook.Env.current_pointer_type != pointerType) return;

            var events;
            if (ev.getCoalescedEvents)
                events = ev.getCoalescedEvents();
            else events = [ev];
            for (var event of events) {
                notebook.pens[notebook.Env.current_pen[pointerType]].on_move(this, event, this.get_true_position(event));
            }
        }
        function pointer_end(event) {
            var pointerType = event.pointerType;

            if (notebook.Config.debug && pointerType == 'mouse') pointerType = 'pen';
            if (notebook.Env.current_pointer_type != pointerType) return;

            this.canvas.removeEventListener('pointerup', pointer_end);
            this.canvas.removeEventListener('pointermove', pointer_move);
            notebook.pens[notebook.Env.current_pen[pointerType]].on_end(this, event, this.get_true_position(event));
            notebook.Env.current_pointer_type = null;
        }

        pointer_begin = pointer_begin.bind(this);
        pointer_move = pointer_move.bind(this);
        pointer_end = pointer_end.bind(this);

        this.canvas.addEventListener('pointerdown', pointer_begin);
        this.render();
    }
    Canvas.prototype.render = function () {
        requestAnimationFrame(this.render.bind(this));
        if (this.dirty_rect.is_empty()) return;
        this.ctx.save();
        this.ctx.translate(-this.pos.x, -this.pos.y);

        if (notebook.Config.debug && notebook.Config.show_dirty_rect) {
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(this.dirty_rect.x1, this.dirty_rect.y1,
                this.dirty_rect.x2 - this.dirty_rect.x1,
                this.dirty_rect.y2 - this.dirty_rect.y1);
        }

        this.ctx.clearRect(this.dirty_rect.x1, this.dirty_rect.y1,
            this.dirty_rect.x2 - this.dirty_rect.x1,
            this.dirty_rect.y2 - this.dirty_rect.y1);
        for (var stroke of this.objects) {
            stroke.draw(this.ctx, this.dirty_rect);
        }
        this.dirty_rect = notebook.utils.Rect.empty();

        this.ctx.restore();
    }
    Canvas.prototype.add_dirty_rect = function (rect) {
        this.dirty_rect.add(rect.x1 - notebook.Config.dirty_bias, rect.y1 - notebook.Config.dirty_bias);
        this.dirty_rect.add(rect.x2 + notebook.Config.dirty_bias, rect.y2 + notebook.Config.dirty_bias);
    }
    Canvas.prototype.save = function () {
        var data = {};
        data.objects = this.objects.map(function (o) { return o.save(); });
        data.styles = notebook.stroke_styles.save();
        data.pos = { x: this.pos.x, y: this.pos.y };
        return JSON.stringify(data);
    }
    Canvas.prototype.load = function (text) {
        var data = JSON.parse(text);
        this.pos.x = data.pos.x;
        this.pos.y = data.pos.y;
        this.objects = [];
        for (var o of data.objects) {
            if (o.type == 'stroke') {
                var stroke = notebook.Stroke.load(o);
                this.add_object(stroke);
            }
            else if (o.type == 'markdown') {
                var markdown = notebook.MarkdownArea.load(o);
                this.add_object(markdown);
            }
        }
        notebook.stroke_styles.load(data.styles);
        this.set_style();
        this.add_dirty_rect(notebook.utils.Rect.full().move(this.pos.x, this.pos.y));
    }
    Canvas.prototype.move = function (dx, dy) {
        this.pos.x += dx;
        this.pos.y += dy;
        this.add_dirty_rect(notebook.utils.Rect.full().move(this.pos.x, this.pos.y));
        this.set_style();
    }
    Canvas.prototype.set_style = function () {
        this.content_container.style.left = -this.pos.x / this.dp + 'px';
        this.content_container.style.top = -this.pos.y / this.dp + 'px';
    }
    Canvas.prototype.remove_object = function (object) {
        if(object.selected)object.set_selected(false);
        var index = this.objects.indexOf(object);
        if (index != -1) {
            this.objects.splice(index, 1);
            object.on_remove_from_canvas();
            object.canvas = null;
        }
    }


    window.notebook.Canvas = Canvas;
})();