(function(){
    function Canvas(){
        this.strokes=[];
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
            if (event.pointerType == 'pen' || notebook.Config.debug) {
                this.canvas.addEventListener('pointermove', pointer_move);
                this.canvas.addEventListener('pointerup',pointer_end);
                notebook.pens[notebook.Env.current_pen].on_begin(this,event);
            }else{
                // 处理触控事件
            }
        }
        function pointer_move(ev){
            if(ev.pointerType != 'pen' && !notebook.Config.debug) return;
            var events;
            if(ev.getCoalescedEvents)
                events=ev.getCoalescedEvents();
            else events=[ev];
            for(var event of events){
                var [x,y]=[(event.pageX-this.canvas_rect.left)*this.dp,(event.pageY-this.canvas_rect.top)*this.dp];
                notebook.pens[notebook.Env.current_pen].on_move(this,event,x,y);
            }
        }
        function pointer_end(event){
            if(event.pointerType != 'pen' && !notebook.Config.debug) return;
            this.canvas.removeEventListener('pointerup',pointer_end);
            this.canvas.removeEventListener('pointermove',pointer_move);
            notebook.pens[notebook.Env.current_pen].on_end(this,event);
        }

        pointer_begin = pointer_begin.bind(this);
        pointer_move = pointer_move.bind(this);
        pointer_end = pointer_end.bind(this);

        this.canvas.addEventListener('pointerdown',pointer_begin);
        this.render();
    }
    Canvas.prototype.render=function(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        for(var stroke of this.strokes){
            stroke.draw(this.ctx);
        }
        requestAnimationFrame(this.render.bind(this));
    }


    window.notebook.Canvas=Canvas;
})();