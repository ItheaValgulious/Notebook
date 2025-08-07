(function(){
    function NotebookCanvas(parent){
        this.canvas=new notebook.Canvas();
        this.dom=document.createElement('canvas');
        (parent||document.body).appendChild(this.dom);
        this.canvas.init(this.dom);
    }
    window.notebook.NotebookCanvas=NotebookCanvas;
})();