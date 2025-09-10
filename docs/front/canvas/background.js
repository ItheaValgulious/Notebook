(function () {

    class EmptyBackground {
        static draw(rect, ctx) {
            ctx.fillStyle = notebook.Env.background.empty.color;
            ctx.fillRect(rect.x1, rect.y1, rect.x2 - rect.x1, rect.y2 - rect.y1);
        }
    }
    class LineBackground extends EmptyBackground {
        static draw(rect, ctx) {
            super.draw(rect, ctx);
            ctx.strokeStyle = notebook.Env.background.line.color;
            ctx.lineWidth = notebook.Env.background.line.line_width;
            var interval = notebook.Env.background.line.interval;
            for (var y = parseInt(rect.y1 / interval) * interval; y <= rect.y2; y += interval) {
                ctx.beginPath();
                ctx.moveTo(rect.x1, y);
                ctx.lineTo(rect.x2, y);
                ctx.stroke();
            }
        }
    }
    class GridBackground extends EmptyBackground {
        static draw(rect, ctx) {
            super.draw(rect, ctx);
            ctx.strokeStyle = notebook.Env.background.grid.color;
            ctx.lineWidth = notebook.Env.background.grid.line_width;
            var interval = notebook.Env.background.grid.interval;
            for (var y = parseInt(rect.y1 / interval) * interval; y <= rect.y2; y += interval) {
                ctx.beginPath();
                ctx.moveTo(rect.x1, y);
                ctx.lineTo(rect.x2, y);
                ctx.stroke();
            }
            for (var x = parseInt(rect.x1 / interval) * interval; x <= rect.x2; x += interval) {
                ctx.beginPath();
                ctx.moveTo(x, rect.y1);
                ctx.lineTo(x, rect.y2);
                ctx.stroke();
            }
        }
    }
    class DotBackground extends EmptyBackground {
        static draw(rect, ctx) {
            super.draw(rect, ctx);
            ctx.fillStyle = notebook.Env.background.dotted.color;
            var interval = notebook.Env.background.dotted.interval;
            for (var y = parseInt(rect.y1 / interval) * interval; y <= rect.y2; y += interval) {
                for (var x = parseInt(rect.x1 / interval) * interval; x <= rect.x2; x += interval) {
                    ctx.beginPath();
                    ctx.arc(x, y, notebook.Env.background.dotted.radius, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
    }

    class BackgroundManager {
        constructor() {
            this.backgrounds = {};
        }
        register(name, background) {
            this.backgrounds[name] = background;
        }
        get() {
            return this.backgrounds[notebook.Env.background.type];
        }
        set(name) {
            notebook.Env.background.type = name;
        }
    }

    notebook.background_manager = new BackgroundManager();
    notebook.background_manager.register('empty', EmptyBackground);
    notebook.background_manager.register('line', LineBackground);
    notebook.background_manager.register('grid', GridBackground);
    notebook.background_manager.register('dot', DotBackground);
})()