(function(){
    function Canvas(){
        this.strokes=[]
        this.current_stroke=new notebook.Stroke();
        this.width=notebook.Config.canvas_width;
        this.height=notebook.Config.canvas_height;
        this.dp=notebook.Config.canvas_dp;
        this.canvas_rect=null;
        this.canvas=null;
        this.ctx=null;
    }

    Canvas.prototype.init=function(dom_canvas){
        this.canvas=dom_canvas;
        this.ctx=this.canvas.getContext('2d');
        this.canvas.width=this.width*this.dp;
        this.canvas.height=this.height*this.dp;
        this.canvas.style.width=this.width+'px';
        this.canvas.style.height=this.height+'px';
        this.canvas_rect=this.canvas.getBoundingClientRect();

        
        function pointer_begin(event){
            if (event.pointerType != 'pen'&&!notebook.Config.debug) return;
            this.canvas.addEventListener('pointermove',pointer_move.bind(this));
        }
        function pointer_move(ev){
            var events;
            if(ev.getCoalescedEvents)
                events=ev.getCoalescedEvents();
            else events=[ev];
            for(var event of events){
                var [x,y]=[(event.pageX-this.canvas_rect.left)*this.dp,(event.pageY-this.canvas_rect.top)*this.dp];
                this.current_stroke.push(new notebook.StrokePoint(x,y,event.pressure));
            }
        }
        function pointer_end(event){
            this.canvas.removeEventListener('pointermove',pointer_move);
            this.current_stroke.simplify();
            this.strokes.push(this.current_stroke);
            this.current_stroke=new notebook.Stroke();
        }

        this.canvas.addEventListener('pointerdown',pointer_begin.bind(this));
        this.canvas.addEventListener('pointerup',pointer_end.bind(this));
        this.render();
    }
    Canvas.prototype.render=function(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        for(var stroke of this.strokes){
            stroke.draw(this.ctx);
        }
        this.current_stroke.draw(this.ctx);
        requestAnimationFrame(this.render.bind(this));
    }


    window.notebook.Canvas=Canvas;
})();