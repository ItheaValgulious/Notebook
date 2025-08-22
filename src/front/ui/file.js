(function () {
    notebook.file = {
        open: async (path) => {
            const content = await window.api.read_file(path);
            data = JSON.parse(content);
            notebook.canvas.load(data.canvas);
            notebook.toolbar.manager.load(data.toolbar);

            notebook.Env.current_file = path;
        },
        open_folder: async () => {
            try {
                const filePath = '/';
                if (!filePath) return;
                notebook.tree.set_path(filePath);
                notebook.info('Folder opened');
            } catch (error) {
                console.error('Error while saving a folder:', error);
                notebook.info('Error while saving a folder: ' + error);
            }
        },
        save_file: async () => {
            try {
                const content = JSON.stringify({
                    canvas: notebook.canvas.save(),
                    toolbar: notebook.toolbar.manager.save()
                });
                const filePath = notebook.Env.current_file;
                if (!filePath) throw new Error("No file path");

                await window.api.save_file(filePath, content);
                notebook.info('File saved');
            } catch (error) {
                console.error('Error while saving a file:', error);
                notebook.info('Error while saving a file: ' + error);
            }
        }

    };

})();