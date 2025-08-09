(function () {
    const default_calc_width = (pressure) => {
        return pressure * pressure * 5 + 1;
    };
    function StrokeStyle(color, calc_width) {
        this.color = color;
        this.calc_width = calc_width || default_calc_width;
    }
    StrokeStyle.prototype.apply_style = function (ctx) {
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
    }
    var stroke_styles = [
        new StrokeStyle('black', null),
    ];
    stroke_styles['selected'] = new StrokeStyle('rgba(98, 145, 255, 0.79)', (pressure) => { return default_calc_width(pressure) + notebook.Config.selected_width*2; });
    stroke_styles['select_chain'] = new StrokeStyle('rgba(98, 145, 255, 0.79)', (pressure) => { return notebook.Config.selector_width;});
    window.notebook.StrokeStyle = StrokeStyle;
    window.notebook.stroke_styles = stroke_styles;
})();