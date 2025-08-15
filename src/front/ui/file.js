(function () {
    notebook.file = {
        open:async (path)=>{
            const content = await window.api.read_file(path);
            data=JSON.parse(content);
            notebook.canvas.load(data.canvas);
            notebook.toolbar.manager.load(data.toolbar);

            notebook.Config.current_file = path;
        },
        open_file: async () => {
            try {
                const filePath = await window.api.showOpenDialog();
                if (!filePath) return;
                notebook.file.open(filePath);
                notebook.info('File opened');
            } catch (error) {
                console.error('Error while openning a file:', error);
                notebook.info('Error while openning a file: ' + error);
            }
        },
        new_file: () => {
            notebook.canvas.load(notebook.Config.empty_file_template);
            notebook.Config.current_file = null;
            notebook.info('New file created');
        },
        save_file: async () => {
            try {
                const content = JSON.stringify({
                    canvas:notebook.canvas.save(),
                    toolbar:notebook.toolbar.manager.save()

                });
                const filePath = notebook.Config.current_file || await window.api.showSaveDialog();
                if (!filePath) return;
                await window.api.save_file(filePath, content);
                notebook.Config.current_file = filePath;
                notebook.info('File saved');
            } catch (error) {
                console.error('Error while saving a file:', error);
                notebook.info('Error while saving a file: ' + error);
            }
        },
        open_folder: async () => {
            try {
                const filePath = await window.api.showFolderDialog();
                if (!filePath) return;
                notebook.tree.set_path(filePath);
                notebook.info('Folder opened');
            } catch (error) {
                console.error('Error while saving a folder:', error);
                notebook.info('Error while saving a folder: ' + error);
            }
        },

    };

})();