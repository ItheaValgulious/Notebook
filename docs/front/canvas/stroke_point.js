(function () {
    function StrokePoint(pos, pressure) {
        this.pos = pos
        this.pressure = pressure
    }
    StrokePoint.prototype.copy = function () {
        return new StrokePoint(this.pos.copy(), this.pressure);
    }
    window.notebook.StrokePoint = StrokePoint;
})();