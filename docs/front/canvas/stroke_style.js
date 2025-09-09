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
            this.styles['select_chain'] = new StrokeStyle(notebook.Config.select_color, [5],
                [notebook.Config.selector_width, 0, 0]
            );
            this.not_save = ['select_chain'];
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
        _get_style(color,dash,coefficients){
            var name = 'pen' + coefficients.join('.') + '_' + color + '_' + dash.join('.');
            if (!this.styles[name]) this.styles[name] = new StrokeStyle(color, dash, coefficients);
            console.log(name);
            return name;
        }
        get_style(color, width, dash) {
            dash = dash || [];
            return this._get_style(color,dash,[1 * width, 1 * width, 3 * width]);
        }
        get_selected_style(name) {
            var old_style = this.styles[name];
            return this._get_style(notebook.Config.select_color, old_style.dash, old_style.coefficients.map(x => x + 2 * notebook.Config.selected_width));
        }
    }

    window.notebook.StrokeStyle = StrokeStyle;
    window.notebook.stroke_styles = new StrokeStyles();
})();