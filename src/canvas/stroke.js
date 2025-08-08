(function(){
    function Stroke(styleid=0) {
        this.points = [];
        this.styleid = styleid;
        this.rect = notebook.utils.Rect.empty();
    }
    Stroke.prototype.push = function (point) {
        this.points.push(point);
        this.rect.add(point.x, point.y);
    }
    Stroke.prototype.draw = function (ctx,dirty_rect) {
        if(this.rect.x2 < dirty_rect.x1 || this.rect.x1 > dirty_rect.x2 ||
            this.rect.y2 < dirty_rect.y1 || this.rect.y1 > dirty_rect.y2) return;
        
        var tension = notebook.Config.tension;
        var calc_width=notebook.stroke_styles[this.styleid].calc_width;

        if (this.points.length == 1) {
            ctx.beginPath();
            ctx.arc(this.points[0].x, this.points[0].y, calc_width(this.points.pressure * 2), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.lineCap = 'round';
        for (let i = 0; i < this.points.length - 1; i++) {
            const p0 = i > 0 ? this.points[i - 1] : this.points[0];
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            const p3 = i < this.points.length - 2 ? this.points[i + 2] : p2;

            if(!dirty_rect.in(p1.x, p1.y) && !dirty_rect.in(p2.x, p2.y)) continue;

            // 计算三次贝塞尔控制点
            const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
            const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
            const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
            const cp2y = p2.y - (p3.y - p1.y) * tension / 3;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineWidth = calc_width((p1.pressure + p2.pressure) / 2)
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            ctx.stroke();
        }

        if(notebook.Config.debug){
            ctx.fillStyle='red';
            for(let p of this.points){
                ctx.beginPath();
                ctx.arc(p.x,p.y,1,0,Math.PI*2);
                ctx.fill();
            }
        }
    }
    Stroke.prototype.simplify = function () {
        var stroke = [], d = notebook.Config.reserved_end_point_number;
        if (this.points.length <= d * 2) return;

        for (var i = 0; i < d; i++)stroke.push(this.points[i].copy());
        var text='';
        for (var i = d; i < this.points.length - d - 1; i++) {
            var p = this.points[i], lp = stroke[stroke.length - 1];
            if (notebook.utils.distance(p.x, p.y, lp.x, lp.y) >= notebook.Config.min_point_distance) {
                stroke.push(p.copy());
            }else{
                text+=('point skipped'+' distance:'+','+ notebook.utils.distance(p.x, p.y, lp.x, lp.y)+'<br>')
            }
        }
        // if(confirm())document.writeln(text);
        for (var i = this.points.length - d; i < this.points.length; i++)stroke.push(this.points[i].copy());
        this.points = stroke;
    }
    Stroke.prototype.calc_rect=function(){
        var rect=notebook.utils.Rect.empty();
        for(var point of this.points){
            rect.add(point.x,point.y);
        }
        this.rect=rect;
    }
    Stroke.prototype.collide_circle = function(x, y, r) {
        // Quick bounding box check
        if(x+r < this.rect.x1 || x-r > this.rect.x2 || y+r < this.rect.y1 || y-r > this.rect.y2)
            return false;
        // Check each segment
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            // Closest point on segment to circle center
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const l2 = dx * dx + dy * dy;
            let t = 0;
            if (l2 !== 0) {
                t = ((x - p1.x) * dx + (y - p1.y) * dy) / l2;
                t = Math.max(0, Math.min(1, t));
            }
            const closestX = p1.x + t * dx;
            const closestY = p1.y + t * dy;
            if (notebook.utils.distance(x, y, closestX, closestY) < r) {
                return true;
            }
        }
        return false;
    }
    notebook.Stroke = Stroke;
})();