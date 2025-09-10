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
                value: value
            };
            this.vditor = new Vditor(this.dom, config);
            this.update();

            //vditor will be able to use after some time(why?)
            var waiter = new notebook.utils.Waiter(() => { return this.vditor.vditor != undefined }, () => { this.vditor_inited(); });
        }

        update() {
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

            // Add type event listener to check for scrollbars and adjust height
            this.addTypeEventListener();
        }

        addTypeEventListener() {
            // Add input event listener to detect content changes
            this.vditor.vditor.ir.element.addEventListener('input', () => {
                this.checkScrollbarAndAdjustHeight();
            });

            // Also add keyup event for comprehensive typing detection
            this.vditor.vditor.ir.element.addEventListener('keyup', () => {
                this.checkScrollbarAndAdjustHeight();
            });
        }

        checkScrollbarAndAdjustHeight() {
            const editorElement = this.vditor.vditor.ir.element;
            const scrollHeight = editorElement.scrollHeight;
            const clientHeight = editorElement.clientHeight;

            // Check if there's a scrollbar (scrollHeight > clientHeight)
            if (scrollHeight > clientHeight) {
                // Calculate the difference and add some extra space
                const heightDifference = scrollHeight - clientHeight;
                const extraSpace = 50; // Add 50px extra space

                var delta = heightDifference + extraSpace;

                // Increase the height
                this.height += delta;
                this.canvas.move(0,delta)

                // Update the DOM element dimensions
                this.update();

                // Also update the vditor editor height
                this.vditor.vditor.ir.element.style.height = (this.height / notebook.Config.canvas_dp) + 'px';
            }
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


        set_selected(selected) {
            super.set_selected(selected);
            if (selected) this.dom.classList.add('selected');
            else this.dom.classList.remove('selected');
        }

        move(dx, dy) {
            super.move(dx, dy);
            this.update();
        }
        start_edit() {
            this.dom.style.pointerEvents='auto';
            // this.canvas.content_container.style.zIndex = 1;
        }
        end_edit() {
            this.dom.style.pointerEvents='none';
            // this.canvas.content_container.style.zIndex = -1;
        }

        on_remove_from_canvas() {
            this.canvas.content_container.removeChild(this.dom);
        }
    }
    notebook.MarkdownArea = MarkdownArea;
})();