(function(){
    function StrokePoint(x, y, pressure) {
    this.x = x;
    this.y = y;
    this.pressure = pressure
    }
    StrokePoint.prototype.copy = function () {
        return new StrokePoint(this.x, this.y, this.pressure);
    }
    window.notebook.StrokePoint=StrokePoint;
})();