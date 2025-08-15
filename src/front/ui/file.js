(function () {
    notebook.file = {
        open_file: async () => {
            try {
                const filePath = await window.api.showOpenDialog();
                if (!filePath) return;
                const content = await window.api.read_file(filePath);
                notebook.canvas.load(content);
                notebook.Config.current_file = filePath;
                notebook.info('File opened');
            } catch (error) {
                console.error('Error while openning a file:', error);
                notebook.info('Error while openning a file: ' + error);
            }
        },
        new_file: () => {
            notebook.canvas.load(JSON.stringify(notebook.Config.empty_file_template));
            notebook.Config.current_file = null;
            notebook.info('New file created');
        },
        save_file: async () => {
            try {
                const content = notebook.canvas.save();
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
                document.getElementById('tree-panel').classList.toggle('show');
                notebook.info('Folder opened');
            } catch (error) {
                console.error('Error while saving a folder:', error);
                notebook.info('Error while saving a folder: ' + error);
            }
        },

    };

})();