(function(){
    function Pen(name){
        this.name=name;
        this.on_move=function(){};
        this.on_begin=null;
        this.on_end=null;
    }
    var pencil=new Pen('pencil'),
        eraser=new Pen('eraser'),
        selector=new Pen('selector');

    pencil.on_begin=function(canvas,event){
        this.current_stroke=new notebook.Stroke()
        canvas.strokes.push(this.current_stroke);
    }.bind(pencil);
    pencil.on_move=function(canvas,event,x,y){
        this.current_stroke.push(new notebook.StrokePoint(x,y,event.pressure));
    }.bind(pencil);
    pencil.on_end=function(canvas,event){
        this.current_stroke.simplify();
    }.bind(pencil);

    window.notebook.pens=[
        pencil,
        eraser,
        selector
    ];
})();