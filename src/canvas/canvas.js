(function () {
    function Canvas() {
        this.strokes = [];
        this.width = notebook.Config.canvas_width;
        this.height = notebook.Config.canvas_height;
        this.dp = notebook.Config.canvas_dp;
        this.canvas_rect = null;
        this.canvas = null;
        this.ctx = null;
        this.dirty_rect = notebook.utils.Rect.full();
    }

    Canvas.prototype.init = function (dom_canvas) {
        this.canvas = dom_canvas;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.width * this.dp;
        this.canvas.height = this.height * this.dp;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.canvas_rect = this.canvas.getBoundingClientRect();


        function pointer_begin(event) {
            if (event.pointerType == 'pen' || notebook.Config.debug) {
                this.canvas.addEventListener('pointermove', pointer_move);
                this.canvas.addEventListener('pointerup', pointer_end);
                notebook.pens[notebook.Env.current_pen].on_begin(this, event);
            } else {
                // 处理触控事件
            }
        }
        function pointer_move(ev) {
            if (ev.pointerType != 'pen' && !notebook.Config.debug) return;
            var events;
            if (ev.getCoalescedEvents)
                events = ev.getCoalescedEvents();
            else events = [ev];
            for (var event of events) {
                var [x, y] = [(event.pageX - this.canvas_rect.left) * this.dp, (event.pageY - this.canvas_rect.top) * this.dp];
                notebook.pens[notebook.Env.current_pen].on_move(this, event, x, y);
            }
        }
        function pointer_end(event) {
            if (event.pointerType != 'pen' && !notebook.Config.debug) return;
            this.canvas.removeEventListener('pointerup', pointer_end);
            this.canvas.removeEventListener('pointermove', pointer_move);
            notebook.pens[notebook.Env.current_pen].on_end(this, event);
        }

        pointer_begin = pointer_begin.bind(this);
        pointer_move = pointer_move.bind(this);
        pointer_end = pointer_end.bind(this);

        this.canvas.addEventListener('pointerdown', pointer_begin);
        this.render();
    }
    Canvas.prototype.render = function () {
        requestAnimationFrame(this.render.bind(this));
        if(this.dirty_rect.is_empty())return;
        
        if (notebook.Config.debug&&notebook.Config.show_dirty_rect) {
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(this.dirty_rect.x1, this.dirty_rect.y1,
                this.dirty_rect.x2 - this.dirty_rect.x1,
                this.dirty_rect.y2 - this.dirty_rect.y1);
        }

        this.ctx.clearRect(this.dirty_rect.x1, this.dirty_rect.y1,
            this.dirty_rect.x2 - this.dirty_rect.x1,
            this.dirty_rect.y2 - this.dirty_rect.y1);
        for (var stroke of this.strokes) {
            stroke.draw(this.ctx, this.dirty_rect);
        }
        this.dirty_rect = notebook.utils.Rect.empty();
    }
    Canvas.prototype.add_dirty_rect = function (rect) {
        this.dirty_rect.add(rect.x1-notebook.Config.dirty_bias, rect.y1-notebook.Config.dirty_bias);
        this.dirty_rect.add(rect.x2+notebook.Config.dirty_bias, rect.y2+notebook.Config.dirty_bias);
    }


    window.notebook.Canvas = Canvas;
})();