
(function () {
    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    }

    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.zero = function () {
        return new Point(0, 0);
    }
    Point.prototype.add = function (p) {
        return new Point(this.x + p.x, this.y + p.y);
    }
    Point.prototype.mul = function (k) {
        return new Point(this.x * k, this.y * k);
    }

    function Rect(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    Rect.prototype.in = function (x, y) {
        return x >= this.x1 && x <= this.x2 && y >= this.y1 && y <= this.y2;
    }
    Rect.prototype.add = function (x, y) {
        this.x1 = Math.min(this.x1, x);
        this.y1 = Math.min(this.y1, y);
        this.x2 = Math.max(this.x2, x); 
        this.y2 = Math.max(this.y2, y);
    }
    Rect.prototype.is_empty = function () {
        return this.x1 > this.x2 || this.y1 > this.y2;
    }
    Rect.empty=function(){
        return new Rect(notebook.Config.canvas_width*notebook.Config.canvas_dp, notebook.Config.canvas_height*notebook.Config.canvas_dp, 0, 0);
    }
    Rect.full=function(){
        return new Rect(0, 0, notebook.Config.canvas_width*notebook.Config.canvas_dp, notebook.Config.canvas_height*notebook.Config.canvas_dp);
    }
    Rect.prototype.move = function (dx, dy) {
        this.x1 += dx;
        this.y1 += dy;
        this.x2 += dx;
        this.y2 += dy;
        return this;
    }
    
    window.notebook.utils = {
        distance: distance,
        Rect: Rect,
        Point: Point
    };
})();