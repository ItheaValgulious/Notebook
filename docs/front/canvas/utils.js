
(function () {
    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    }
    function distance_to_line(x, y, x1, y1, x2, y2) {
        // Closest point on segment to circle center
        const dx = x2 - x1;
        const dy = y2 - y1;
        const l2 = dx * dx + dy * dy;
        let t = 0;
        if (l2 !== 0) {
            t = ((x - x1) * dx + (y - y1) * dy) / l2;
            t = Math.max(0, Math.min(1, t));
        }
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        return notebook.utils.distance(x, y, closestX, closestY);
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
    Point.prototype.copy = function () {
        return new Point(this.x, this.y);
    }


    function Rect(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    Rect.prototype.in = function (p) {
        return p.x >= this.x1 && p.x <= this.x2 && p.y >= this.y1 && p.y <= this.y2;
    }
    Rect.prototype.add = function (x, y) {
        if(this.is_empty()){
            this.x1=this.x2=x,this.y1=this.y2=y;
        }
        this.x1 = Math.min(this.x1, x);
        this.y1 = Math.min(this.y1, y);
        this.x2 = Math.max(this.x2, x);
        this.y2 = Math.max(this.y2, y);
    }
    Rect.prototype.is_empty = function () {
        return this.x1 > this.x2 || this.y1 > this.y2;
    }
    Rect.empty = function () {
        return new Rect(notebook.Config.canvas_width * notebook.Config.canvas_dp, notebook.Config.canvas_height * notebook.Config.canvas_dp, 0, 0);
    }
    Rect.full = function () {
        return new Rect(0, 0, notebook.Config.canvas_width * notebook.Config.canvas_dp, notebook.Config.canvas_height * notebook.Config.canvas_dp);
    }
    Rect.prototype.move = function (dx, dy) {
        this.x1 += dx;
        this.y1 += dy;
        this.x2 += dx;
        this.y2 += dy;
        return this;
    }
    Rect.prototype.collide_rect = function (rect) {
        return !(this.x2 < rect.x1 || this.x1 > rect.x2 ||
            this.y2 < rect.y1 || this.y1 > rect.y2);
    }
    Rect.prototype.set = function (x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    Rect.prototype.scale = function (k) {
        this.w = (this.x2 - this.x1) * k;
        this.h = (this.y2 - this.y1) * k;
        this.x2 = this.x1 + this.w;
        this.y2 = this.y1 + this.h;
        return this;
    }



    function Waiter(checker, action, interval = 100) {
        this.checker = checker;
        this.action = action;
        this.interval = interval;
        this.timer = null;
        this.start();
    }
    Waiter.prototype.start = function () {
        this.timer = setInterval(() => {
            if (this.checker()) {
                clearInterval(this.timer);
                this.action();
            }
        }, this.interval);
    }

    window.notebook.utils = {
        distance: distance,
        distance_to_line: distance_to_line,
        Rect: Rect,
        Point: Point,
        Waiter: Waiter
    };
})();