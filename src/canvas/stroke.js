(function(){
    function Stroke(styleid=0) {
        this.points = [];
        this.styleid = styleid;
    }
    Stroke.prototype.push = function (point) {
        this.points.push(point);
    }
    Stroke.prototype.draw = function (ctx) {
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
    notebook.Stroke = Stroke;
})();