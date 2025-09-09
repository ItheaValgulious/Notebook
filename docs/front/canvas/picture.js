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
        }
        set_selected(selected) {
            if (super.set_selected(selected))
                this.canvas.add_dirty_rect(this.rect);
        }
        draw(ctx) {
            if (this.selected) {
                ctx.strokeStyle = notebook.Config.select_color;
                ctx.lineWidth = notebook.Config.selected_width * 2;
                ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
            }
            ctx.drawImage(this.img, this.pos.x, this.pos.y, this.width, this.height);
        }
        save() {
            return {
                "type": "picture",
                "pos": { x: this.x, y: this.y },
                "width": this.width,
                "height": this.height,
                "src": this.img.src
            };
        }
        static load(obj) {
            let picture = new PictureObj(obj.src, obj.width, obj.height);
            picture.pos.x = obj.pos.x;
            picture.pos.y = obj.pos.y;
            return picture;
        }
        update(){
            this.rect.set(this.pos.x, this.pos.y, this.pos.x + this.width, this.pos.y + this.height);
            this.canvas.add_dirty_rect(this.rect);
        }
        on_remove_from_canvas() {
            this.canvas.add_dirty_rect(this.rect);
        }
    };

    notebook.PictureObj = PictureObj;
})();