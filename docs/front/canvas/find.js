(function () {
    class Finder {
        init(canvas) {
            this.canvas = canvas;
        }
        perform_find(text) {
            if (!text || text.trim() === '') {
                this.clear_find_results();
                return;
            }

            this.find_results = [];
            this.current_find_index = 0;

            for (var i = 0; i < this.canvas.objects.length; i++) {
                var obj = this.canvas.objects[i];
                if (obj instanceof notebook.MarkdownArea) {
                    var matches = this.find_text_in_markdown(obj, text);
                    for (var j = 0; j < matches.length; j++) {
                        this.find_results.push({
                            object: obj,
                            match: matches[j],
                            objectIndex: i
                        });
                    }
                }
            }

            this.update_find_results_display();
        }

        find_text_in_markdown(markdownObj, searchText) {
            var matches = [];
            var text = markdownObj.vditor.getValue();
            var searchRegex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            var match;

            while ((match = searchRegex.exec(text)) !== null) {
                matches.push({
                    index: match.index,
                    text: match[0],
                    length: match[0].length
                });
            }

            return matches;
        }

        update_find_results_display() {
            var resultsInfo = document.getElementById('find-results-info');
            if (resultsInfo) {
                var total = this.find_results.length;
                var current = total > 0 ? this.current_find_index + 1 : 0;
                resultsInfo.textContent = `Search Results: ${current}/${total}`;
            }
            this.scroll_to_object();
        }

        clear_find_results() {
            this.find_results = [];
            this.current_find_index = 0;
            this.update_find_results_display();
        }

        find_next() {
            if (this.find_results.length === 0) return;

            this.current_find_index = (this.current_find_index + 1) % this.find_results.length;
            this.update_find_results_display();
        }

        find_prev() {
            if (this.find_results.length === 0) return;

            this.current_find_index = (this.current_find_index - 1 + this.find_results.length) % this.find_results.length;
            this.update_find_results_display();
        }

        scroll_to_object() {
            var obj=this.find_results[this.current_find_index].object;
            if (obj && obj.rect) {
                var rect = obj.rect;
                var centerX = (rect.x1 + rect.x2) / 2;
                var centerY = (rect.y1 + rect.y2) / 2;
                this.canvas.locate(centerX, centerY);
            }
        }
    }
    notebook.finder = new Finder();
})();