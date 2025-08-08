(function () {
    function StrokeStyle(color, calc_width) {
        this.color = color;
        this.calc_width = calc_width || ((pressure) => {
            return pressure * pressure * 5 + 1;
        });
    }
    stroke_styles = [
        new StrokeStyle('black', null)
    ];
    window.notebook.StrokeStyle = StrokeStyle;
    window.notebook.stroke_styles = stroke_styles;
})();