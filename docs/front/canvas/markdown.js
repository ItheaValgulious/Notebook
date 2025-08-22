(function () {
    class MarkdownArea extends notebook.CanvasObj {
        constructor(pos, width, height, value) {
            value = value || '';
            super();
            this.width = width;
            this.height = height;
            this.pos = pos;
            this.rect = new notebook.utils.Rect(pos.x, pos.y, pos.x + width, pos.y + height);

            this.dom = document.createElement('div');
            this.dom.classList.add('markdown_area');
            var config = {
                width: this.width / notebook.Config.canvas_dp,
                height: this.height / notebook.Config.canvas_dp,
                toolbarConfig: {
                    hide: true
                },
                cache: {
                    enable: false,
                },
                preview: {
                    math: {
                        inlineDigit: true
                    }
                },
                mode: 'ir',
                focus: this.start_edit.bind(this),
                blur: this.end_edit.bind(this),
                value:value
            };
            this.vditor = new Vditor(this.dom, config);
            this.set_style();

            //vditor will be able to use after some time(why?)
            var waiter = new notebook.utils.Waiter(() => { return this.vditor.vditor != undefined }, () => { this.vditor_inited(); });
        }

        set_style() {
            this.rect.set(this.pos.x, this.pos.y, this.pos.x + this.width, this.pos.y + this.height);

            this.dom.style.left = this.pos.x / notebook.Config.canvas_dp + 'px';
            this.dom.style.top = this.pos.y / notebook.Config.canvas_dp + 'px';
            this.dom.style.width = this.width / notebook.Config.canvas_dp + 'px';
            this.dom.style.height = this.height / notebook.Config.canvas_dp + 'px';
        }

        on_add_to_canvas() {
            this.canvas.content_container.appendChild(this.dom);
        }


        vditor_inited() {
            // this.vditor.updateToolbarConfig({ hide: true });
            // this.vditor.focus();
        }

        focus() {
            if (this.vditor.vditor)
                this.vditor.focus();
            else
                var waiter = new notebook.utils.Waiter(() => { return this.vditor.vditor != undefined }, () => { this.vditor.focus(); });
        }

        save() {
            return {
                content: this.vditor.getValue(),
                pos: this.pos,
                width: this.width,
                height: this.height,
                type: 'markdown'

            }
        }

        static load(obj) {
            var markdown = new MarkdownArea(obj.pos, obj.width, obj.height, obj.content);

            return markdown;
        }


        draw(ctx) { }

        collide_path(ctx) {
            return (ctx.isPointInPath(this.rect.x1, this.rect.y1) && ctx.isPointInPath(this.rect.x2, this.rect.y2) && ctx.isPointInPath(this.rect.x1, this.rect.y2) && ctx.isPointInPath(this.rect.x2, this.rect.y1))
        }

        set_selected(selected) {
            this.selected = selected;
            if (selected) this.canvas.selected.push(this);
            else {
                const index = this.canvas.selected.indexOf(this);
                if (index > -1) this.canvas.selected.splice(index, 1);
            }
            if (selected) this.dom.classList.add('selected');
            else this.dom.classList.remove('selected');

        }

        move(dx, dy) {
            super.move(dx, dy);
            this.set_style();
        }

        collide_circle(x, y, r) {
            return !(x < this.rect.x1 || x > this.rect.x2 || y < this.rect.y1 || y > this.rect.y2) ||
                notebook.utils.distance_to_line(x, y, this.rect.x1, this.rect.y1, this.rect.x1, this.rect.y2) <= r ||
                notebook.utils.distance_to_line(x, y, this.rect.x1, this.rect.y1, this.rect.x2, this.rect.y1) <= r ||
                notebook.utils.distance_to_line(x, y, this.rect.x2, this.rect.y1, this.rect.x2, this.rect.y2) <= r ||
                notebook.utils.distance_to_line(x, y, this.rect.x2, this.rect.y2, this.rect.x1, this.rect.y2) <= r;
        }
        start_edit() {
            this.canvas.content_container.style.zIndex = 1;
        }
        end_edit() {
            this.canvas.content_container.style.zIndex = -1;
        }

        on_remove_from_canvas() {
            this.canvas.content_container.removeChild(this.dom);
        }
    }
    notebook.MarkdownArea = MarkdownArea;
})();