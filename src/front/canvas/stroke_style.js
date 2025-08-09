(function () {
    const default_calc_width = (pressure) => {
        return pressure * pressure * 5 + 1;
    };
    function StrokeStyle(color, dash, calc_width) {
        this.color = color;
        this.calc_width = calc_width || default_calc_width;
        this.dash = dash || [];
    }
    StrokeStyle.prototype.apply_style = function (ctx) {
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.setLineDash(this.dash);
    }
    StrokeStyle.prototype.save = function () {
        return {
            color: this.color,
            calc_width: this.calc_width.toString(),
            dash: this.dash
        };
    }
    StrokeStyle.prototype.load = function (data) {
        this.color = data.color;
        this.calc_width = new Function("pressure", data.calc_width);
        this.dash = data.dash;
    }

    class StrokeStyles {
        constructor() {
            this.styles = {};
            // 初始化默认样式
            this.styles['pen1'] = new StrokeStyle('black');
            this.styles['selected'] = new StrokeStyle('rgba(98, 145, 255, 0.79)', null, 
                (pressure) => { return default_calc_width(pressure) + notebook.Config.selected_width * 2; }
            );
            this.styles['select_chain'] = new StrokeStyle('rgba(98, 145, 255, 0.79)', [5], 
                (pressure) => { return notebook.Config.selector_width; }
            );
        }

        save() {
            const data = {};
            for (const name in this.styles) {
                data[name] = this.styles[name].save();
            }
            return data;
        }

        load(data) {
            for (const name in data) {
                const style = new StrokeStyle();
                style.load(data[name]);
                this.styles[name] = style;
            }
        }
    }

    window.notebook.StrokeStyle = StrokeStyle;
    window.notebook.stroke_styles = new StrokeStyles();
})();