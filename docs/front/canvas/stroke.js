(function () {
    class Stroke extends notebook.CanvasObj {

        constructor(styleid = 0) {
            super();
            this.points = [];
            this.styleid = styleid;
        }

        push(point) {
            this.points.push(point);
            this.rect.add(point.pos.x + this.pos.x, point.pos.y + this.pos.y);
            this.update();
        }

        set_selected(selected) {
            if (super.set_selected(selected))
                this.update();
        }

        _draw(ctx, dirty_rect, styleid) {
            dirty_rect.x1 -= notebook.Config.dirty_bias;
            dirty_rect.x2 += notebook.Config.dirty_bias;
            dirty_rect.y1 -= notebook.Config.dirty_bias;
            dirty_rect.y2 += notebook.Config.dirty_bias;

            styleid = styleid || this.styleid;

            if (this.rect.x2 < dirty_rect.x1 || this.rect.x1 > dirty_rect.x2 ||
                this.rect.y2 < dirty_rect.y1 || this.rect.y1 > dirty_rect.y2) return;

            var tension = notebook.Config.tension;
            var calc_width = notebook.stroke_styles.styles[styleid].calc_width.bind(notebook.stroke_styles.styles[styleid]);


            if (this.points.length == 1) {
                ctx.beginPath();
                notebook.stroke_styles.styles[styleid].apply_style(ctx);
                ctx.arc(this.points[0].pos.x + this.pos.x, this.points[0].pos.y + this.pos.y, calc_width(this.points[0].pressure), 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.lineCap = 'round';
            for (let i = 0; i < this.points.length - 1; i++) {
                const p0 = i > 0 ? this.points[i - 1] : this.points[0];
                const p1 = this.points[i];
                const p2 = this.points[i + 1];
                const p3 = i < this.points.length - 2 ? this.points[i + 2] : p2;

                if (!dirty_rect.in(p1.pos.add(this.pos)) && !dirty_rect.in(p2.pos.add(this.pos))) continue;

                // 计算三次贝塞尔控制点
                const cp1x = p1.pos.x + (p2.pos.x - p0.pos.x) * tension / 3;
                const cp1y = p1.pos.y + (p2.pos.y - p0.pos.y) * tension / 3;
                const cp2x = p2.pos.x - (p3.pos.x - p1.pos.x) * tension / 3;
                const cp2y = p2.pos.y - (p3.pos.y - p1.pos.y) * tension / 3;

                ctx.beginPath();
                ctx.moveTo(p1.pos.x + this.pos.x, p1.pos.y + this.pos.y);

                ctx.lineWidth = calc_width((p1.pressure + p2.pressure) / 2);
                ctx.bezierCurveTo(cp1x + this.pos.x, cp1y + this.pos.y, cp2x + this.pos.x, cp2y + this.pos.y, p2.pos.x + this.pos.x, p2.pos.y + this.pos.y);

                notebook.stroke_styles.styles[styleid].apply_style(ctx);
                ctx.stroke();
            }

            if (notebook.Config.debug) {
                ctx.fillStyle = 'red';
                for (let p of this.points) {
                    ctx.beginPath();
                    ctx.arc(p.x + this.pos.x, p.y + this.pos.y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        draw(ctx, dirty_rect) {
            if (this.selected) {
                this._draw(ctx, dirty_rect, notebook.stroke_styles.get_selected_style(this.styleid));
            }
            this._draw(ctx, dirty_rect);
        }


        simplify() {
            var stroke = [], d = notebook.Config.reserved_end_point_number;
            if (this.points.length <= d * 2) return;

            for (var i = 0; i < d; i++)stroke.push(this.points[i].copy());
            var text = '';
            for (var i = d; i < this.points.length - d - 1; i++) {
                var p = this.points[i], lp = stroke[stroke.length - 1];
                if (notebook.utils.distance(p.pos.x, p.pos.y, lp.pos.x, lp.pos.y) >= notebook.Config.min_point_distance) {
                    stroke.push(p.copy());
                } else {
                    text += ('point skipped' + ' distance:' + ',' + notebook.utils.distance(p.pos.x, p.pos.y, lp.pos.x, lp.pos.y) + '<br>')
                }
            }
            // if(confirm())document.writeln(text);
            for (var i = this.points.length - d; i < this.points.length; i++)stroke.push(this.points[i].copy());
            this.points = stroke;
        }

        calc_rect() {
            var rect = notebook.utils.Rect.empty();
            for (var point of this.points) {
                rect.add(point.pos.x + this.pos.x, point.pos.y + this.pos.y);
            }
            this.rect = rect;
        }

        collide_circle(x, y, r) {
            // Quick bounding box check
            if (x + r < this.rect.x1 || x - r > this.rect.x2 || y + r < this.rect.y1 || y - r > this.rect.y2)
                return false;

            // Adjust coordinates to stroke's position
            x -= this.pos.x;
            y -= this.pos.y;

            // Check each segment
            for (let i = 0; i < this.points.length - 1; i++) {
                const p1 = this.points[i].pos;
                const p2 = this.points[i + 1].pos;
                if (notebook.utils.distance_to_line(x, y, p1.x, p1.y, p2.x, p2.y) < r) return true;
            }
            if (this.points.length == 1 && notebook.utils.distance(x, y, this.points[0].pos.x, this.points[0].pos.y) < r) return true;

            return false;
        }


        collide_path(ctx) {
            for (var p of this.points)
                if (!ctx.isPointInPath(p.pos.x + this.pos.x, p.pos.y + this.pos.y)) return false;
            return true;
        }

        save() {
            var data = {
                points: this.points.map(p => ({ x: parseInt(p.pos.x), y: parseInt(p.pos.y), pressure: parseInt(p.pressure*100)/100 })),
                type: 'stroke',

                styleid: this.styleid,
                pos: { x: parseInt(this.pos.x), y: parseInt(this.pos.y) }
            };
            return data;
        }

        static load(data) {
            var stroke = new Stroke(data.styleid);
            stroke.pos = new notebook.utils.Point(data.pos.x, data.pos.y);
            for (var p of data.points)
                stroke.points.push(new notebook.StrokePoint(new notebook.utils.Point(p.x, p.y), p.pressure));
            stroke.calc_rect();
            return stroke;
        }
        on_remove_from_canvas() {
            this.update();
        }
        update(){
            this.calc_rect();
            this.canvas.add_dirty_rect(this.rect);
        }

    }
    notebook.Stroke = Stroke;
})();