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
        this.selected = [];
        this.pos = notebook.utils.Point.zero();
        this.scale = 1;
        this.dirty_rect = this.screen_rect();
    }
    Canvas.prototype.screen_rect = function () {
        return notebook.utils.Rect.full().scale(1 / this.scale).move(this.pos.x / this.scale, this.pos.y / this.scale);
    }
    Canvas.prototype.add_object = function (object) {
        this.objects.push(object);
        object.canvas = this;
        object.on_add_to_canvas();
    }
    Canvas.prototype.get_true_position = function (x, y) {
        return new notebook.utils.Point((x * this.dp + this.pos.x) / this.scale, (y * this.dp + this.pos.y) / this.scale);
    }
    Canvas.prototype.init = function (parentNode) {

        parentNode = parentNode || document.body;

        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('notebook_canvas');
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

        this.canvas.oncontextmenu = function (event) {
            event.preventDefault(); // 禁用默认右键菜单
        };
        var pid = null;
        function pointer_begin(event) {
            pid = event.pointerId;
            var pointerType = event.pointerType;
            if (pointerType == 'mouse' && event.button == 0) {
                pointerType = 'touch';
            } else if (event.button == 2) {
                pointerType = 'pen';
            }

            this.canvas.addEventListener('pointermove', pointer_move);
            this.canvas.addEventListener('pointerup', pointer_end);

            notebook.pens[notebook.Env.current_pen[pointerType]].on_begin(this, event, this.get_true_position(event.offsetX, event.offsetY));
            notebook.Env.current_pointer_type = pointerType;
        }
        function pointer_move(ev) {
            if (ev.pointerId != pid) return;
            var pointerType = ev.pointerType;
            if (pointerType == 'mouse') pointerType = notebook.Env.current_pointer_type;

            if (notebook.Env.current_pointer_type != pointerType) return;

            var events;
            if (ev.getCoalescedEvents)
                events = ev.getCoalescedEvents();
            else events = [ev];
            for (var event of events) {
                notebook.pens[notebook.Env.current_pen[pointerType]].on_move(this, event, this.get_true_position(event.offsetX, event.offsetY));
            }
        }
        function pointer_end(event) {
            if (event.pointerId != pid) return;
            var pointerType = event.pointerType;
            if (pointerType == 'mouse') pointerType = notebook.Env.current_pointer_type;
            if (notebook.Env.current_pointer_type != pointerType) return;

            this.canvas.removeEventListener('pointerup', pointer_end);
            this.canvas.removeEventListener('pointermove', pointer_move);
            notebook.pens[notebook.Env.current_pen[pointerType]].on_end(this, event, this.get_true_position(event.offsetX, event.offsetY));
            notebook.Env.current_pointer_type = null;
        }

        pointer_begin = pointer_begin.bind(this);
        pointer_move = pointer_move.bind(this);
        pointer_end = pointer_end.bind(this);

        this.canvas.addEventListener('pointerdown', pointer_begin);

        var touch_handler = {
            canvas: this
        };
        touch_handler.handleTouchStart = function (event) {
            if (event.touches.length === 2) {
                // 计算两个触摸点之间的初始距离
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                this.initialDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            }
        }.bind(touch_handler)
        touch_handler.handleTouchMove = function (event) {
            if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );

                // 计算缩放比例
                const scaleFactor = currentDistance / this.initialDistance;
                // 调用 set_scale 方法设置缩放
                this.canvas.set_scale(scaleFactor);
                // 更新初始距离
                this.initialDistance = currentDistance;
            }
        }.bind(touch_handler);

        this.canvas.addEventListener('touchstart', touch_handler.handleTouchStart);
        this.canvas.addEventListener('touchmove', touch_handler.handleTouchMove);

        this.canvas.addEventListener('wheel', function (event) {
            event.preventDefault();
            var delta = -Math.sign(event.deltaY);
            this.set_scale((1 + delta * 0.1));
        }.bind(this));

        this.render();
    }
    Canvas.prototype.render = function () {

        requestAnimationFrame(this.render.bind(this));
        if (this.dirty_rect.is_empty()) return;
        this.ctx.save();
        this.ctx.translate(-this.pos.x, -this.pos.y);
        this.ctx.scale(this.scale, this.scale);

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
        data.pos = { x: this.pos.x, y: this.pos.y, scale: this.scale };

        return data;
    }
    Canvas.prototype.load = function (data) {
        this.pos.x = data.pos.x;
        this.pos.y = data.pos.y;
        this.scale = data.pos.scale || 1;
        this.objects = [];
        this.content_container.innerHTML = '';
        notebook.stroke_styles.load(data.styles);
        this.set_style();

        for (var o of data.objects) {
            if (o.type == 'stroke') {
                var stroke = notebook.Stroke.load(o);
                this.add_object(stroke);
            }
            else if (o.type == 'markdown') {
                var markdown = notebook.MarkdownArea.load(o);
                this.add_object(markdown);
            }else if (o.type == 'picture'){
                var picture=notebook.PictureObj.load(o);
                this.add_object(picture);
            }
        }
        this.add_dirty_rect(this.screen_rect());

    }
    Canvas.prototype.move = function (dx, dy) {
        this.pos.x += dx;
        this.pos.y += dy;
        this.add_dirty_rect(this.screen_rect());
        this.set_style();
    }
    Canvas.prototype.set_style = function () {
        // this.content_container.style.left = -this.pos.x / this.dp + 'px';
        // this.content_container.style.top = -this.pos.y / this.dp + 'px';
        this.content_container.style.transform = 'translateX(' + (-this.pos.x / this.dp) + 'px) translateY(' + (-this.pos.y / this.dp) + 'px)' + 'scale(' + this.scale + ')';
    }
    Canvas.prototype.remove_object = function (object) {
        if (object.selected) object.set_selected(false);
        var index = this.objects.indexOf(object);
        if (index != -1) {
            this.objects.splice(index, 1);
            object.on_remove_from_canvas();
            object.canvas = null;
        }
    }
    Canvas.prototype.set_scale = function (scaleFactor) {
        var old_scale = this.scale;
        this.scale *= scaleFactor;
        if (this.scale < notebook.Config.min_scale) this.scale = notebook.Config.min_scale;
        if (this.scale > notebook.Config.max_scale) this.scale = notebook.Config.max_scale;
        var new_scale = this.scale;

        var center=this.get_true_position(this.width/2,this.height/2);

        this.move((center.x * new_scale - center.x * old_scale),
            (center.y * new_scale - center.y * old_scale));


        this.set_style();
        this.add_dirty_rect(this.screen_rect());
    }

    window.notebook.Canvas = Canvas;
})();