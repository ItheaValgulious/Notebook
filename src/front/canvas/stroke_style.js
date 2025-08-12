(function () {
    const default_calc_width = (pressure) => {
        return pressure * pressure * 5 + 1;
    };
    function StrokeStyle(color, dash, coefficients) {
        this.color = color;
        this.coefficients = coefficients || [1, 0, 5];
        this.dash = dash || [];
    }
    StrokeStyle.prototype.calc_width = function (pressure) {
        return this.coefficients[2] * pressure * pressure + this.coefficients[1] * pressure + this.coefficients[0];
    }

    StrokeStyle.prototype.apply_style = function (ctx) {
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.setLineDash(this.dash);
    }
    StrokeStyle.prototype.save = function () {
        return {
            color: this.color,
            coefficients: this.coefficients,
            dash: this.dash
        };
    }
    StrokeStyle.prototype.load = function (data) {
        this.color = data.color;
        this.coefficients = data.coefficients;
        this.dash = data.dash;
    }

    class StrokeStyles {
        constructor() {
            this.styles = {};
            // 初始化默认样式
            this.styles['pen1'] = new StrokeStyle('black', null, [1, 0, 5]);

            this.styles['selected'] = new StrokeStyle('rgba(98, 145, 255, 0.79)', null,
                [notebook.Config.selected_width * 2 + 1, 0, 5]
            );
            this.styles['select_chain'] = new StrokeStyle('rgba(98, 145, 255, 0.79)', [5],
                [notebook.Config.selector_width, 0, 0]
            );
            this.not_save = ['selected', 'select_chain'];
        }

        save() {
            const data = {};
            for (const name in this.styles) {
                if (this.not_save.includes(name)) continue;
                if (!this.styles[name]) continue;
                data[name] = this.styles[name].save();
            }
            return data;
        }

        load(data) {
            for (var i in this.styles) {
                if (this.not_save.includes(i)) continue;
                this.styles[i] = undefined;
            }
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