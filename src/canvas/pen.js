(function(){
    function Pen(name){
        this.name=name;
        this.on_move=function(){};
        this.on_begin=function(){};
        this.on_end=function(){};
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
        canvas.add_dirty_rect(this.current_stroke.rect);
    }.bind(pencil);
    pencil.on_end=function(canvas,event){
        this.current_stroke.simplify();
        this.current_stroke.calc_rect();
        canvas.add_dirty_rect(this.current_stroke.rect);
        this.current_stroke=null;
    }.bind(pencil);

    eraser.on_move=function(canvas,event,x,y){
        for(var i=0;i<canvas.strokes.length;i++){
            var stroke=canvas.strokes[i];
            if(stroke.collide_circle(x,y,notebook.Env.eraser_radius)){
                canvas.strokes.splice(i,1);
                canvas.add_dirty_rect(stroke.rect);
                i--;
            }
        }
    }.bind(eraser);

    window.notebook.pens=[
        pencil,
        eraser,
        selector
    ];
})();