(function () {
    function MarkdownArea(pos, width, height) {
        this.width = width;
        this.height = height;
        this.pos = pos;
        this.rect = new notebook.utils.Rect(pos.x, pos.y, pos.x + width, pos.y + height);
        this.init();
        this.canvas = null;
        this.selected = false;
    }
    MarkdownArea.prototype.set_style = function () {
        this.dom.style.left = this.pos.x / notebook.Config.canvas_dp + 'px';
        this.dom.style.top = this.pos.y / notebook.Config.canvas_dp + 'px';
        this.dom.style.width = this.width / notebook.Config.canvas_dp + 'px';
        this.dom.style.height = this.height / notebook.Config.canvas_dp + 'px';
    }
    MarkdownArea.prototype.init = function () {
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
            mode: 'ir'
        };
        this.vditor = new Vditor(this.dom, config);
        document.querySelector('.content_container').appendChild(this.dom);
        this.set_style();

        var waiter = new notebook.utils.Waiter(() => { return this.vditor.vditor != undefined }, () => { this.vditor_inited(); });
    }
    MarkdownArea.prototype.vditor_inited = function () {
        this.vditor.updateToolbarConfig({ hide: true });
        this.vditor.focus();
    }
    MarkdownArea.prototype.save = function () { }
    MarkdownArea.prototype.load = function (obj) { }
    MarkdownArea.prototype.draw = function () { }
    MarkdownArea.prototype.collide_path = function (ctx) {
        return (ctx.isPointInPath(this.rect.x1, this.rect.y1) && ctx.isPointInPath(this.rect.x2, this.rect.y2) && ctx.isPointInPath(this.rect.x1, this.rect.y2) && ctx.isPointInPath(this.rect.x2, this.rect.y1))
    }
    MarkdownArea.prototype.fast_collide_rect = function (rect) {
        return this.rect.collide_rect(rect);
    }
    MarkdownArea.prototype.set_selected = function (selected) {
        this.selected = selected;
        if (selected) this.canvas.selected.push(this);
        else this.canvas.selected.splice(this.canvas.selected.indexOf(this), 1);
        if (selected) this.dom.classList.add('selected');
        else this.dom.classList.remove('selected');
    }
    MarkdownArea.prototype.move = function (dx, dy) {
        this.pos.x += dx;
        this.pos.y += dy;
        this.rect.move(dx, dy);
        this.set_style();
    }
    MarkdownArea.prototype.collide_circle = function(x,y,r){
        
    }
    notebook.MarkdownArea = MarkdownArea;
})();