(function () {
    class PictureObj extends notebook.CanvasObj {
        constructor(src, pos, width, height) {
            super();
            this.img = new Image();
            this.img.src = src;
            this.pos = pos;
            this.width = width || this.img.width;
            this.height = height || this.img.height;
            this.rect = new notebook.utils.Rect(this.x, this.y, this.x + this.width, this.y + this.height);
            this.loadProgress = 0;

            // Track loading progress
            this.img.onload = () => {
                this.loadProgress = 100;
                if (this.fakeProgressInterval) {
                    clearInterval(this.fakeProgressInterval);
                    this.fakeProgressInterval = null;
                }
                if (this.canvas) {
                    this.canvas.add_dirty_rect(this.rect);
                }
            };

            this.img.onprogress = (event) => {
                if (event.lengthComputable) {
                    this.loadProgress = Math.round((event.loaded / event.total) * 100);
                    if (this.canvas) {
                        this.canvas.add_dirty_rect(this.rect);
                    }
                }
            };

            // Start fake progress if real progress isn't available after a short delay
            setTimeout(() => {
                if (this.loadProgress === 0 && !this.img.complete) {
                    this.startFakeProgress();
                }
            }, 500);

            this.startFakeProgress = () => {
                if (this.fakeProgressInterval) {
                    clearInterval(this.fakeProgressInterval);
                }

                this.fakeProgressInterval = setInterval(() => {
                    if (this.loadProgress < 95) {
                        this.loadProgress += Math.random() * 10; // Random increment
                        this.loadProgress = Math.round(this.loadProgress); // Ensure integer
                        if (this.loadProgress > 95) {
                            this.loadProgress = 95; // Cap at 95% until real load completes
                        }
                        if (this.canvas) {
                            this.canvas.add_dirty_rect(this.rect);
                        }
                    }
                }, 200);
            };
        }
        set_selected(selected) {
            if (super.set_selected(selected))
                this.canvas.add_dirty_rect(this.rect);
        }
        draw(ctx) {
            if (this.selected) {
                ctx.strokeStyle = notebook.Config.select_color;
                ctx.lineWidth = notebook.Config.selected_width * 2;
                ctx.strokeRect(this.pos.x - notebook.Config.selected_width, this.pos.y - notebook.Config.selected_width, this.width+notebook.Config.selected_width, this.height+notebook.Config.selected_width);
            }
            if (!this.img.complete) {
                // draw loading background with progress
                const progressRatio = this.loadProgress / 100;

                // unloaded portion (gray background)
                ctx.fillStyle = "rgba(100, 100, 100, 0.8)";
                ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);

                // loaded portion (blue fill from left)
                const loadedWidth = this.width * progressRatio;
                ctx.fillStyle = "rgba(0, 150, 255, 0.8)";
                ctx.fillRect(this.pos.x, this.pos.y, loadedWidth, this.height);

                // draw loading text (scaled to picture size and centered)
                ctx.fillStyle = "white";
                const fontSize = Math.max(12, Math.min(this.width, this.height) * 0.1); // 10% of smaller dimension, min 12px
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(`Loading ${Math.round(this.loadProgress)}%`, this.pos.x + this.width / 2, this.pos.y + this.height / 2);

                // reset text alignment
                ctx.textAlign = "left";
                ctx.textBaseline = "alphabetic";
            } else {
                ctx.drawImage(this.img, this.pos.x, this.pos.y, this.width, this.height);
            }
        }
        save() {
            return {
                "type": "picture",
                "pos": { x: this.pos.x, y: this.pos.y },
                "width": this.width,
                "height": this.height,
                "src": this.img.src
            };
        }
        static load(obj) {
            let picture = new PictureObj(obj.src,new notebook.utils.Point(obj.pos.x,obj.pos.y), obj.width, obj.height);
            return picture;
        }
        update() {
            this.rect.set(this.pos.x, this.pos.y, this.pos.x + this.width, this.pos.y + this.height);
            this.canvas.add_dirty_rect(this.rect);
        }
        on_remove_from_canvas() {
            this.canvas.add_dirty_rect(this.rect);
        }
    };

    notebook.PictureObj = PictureObj;
})();