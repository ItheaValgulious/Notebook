(function () {
    notebook.file = {
        cache: null,
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
                if (notebook.file.cache == content) {
                    return;
                }
                const filePath = notebook.Env.current_file;
                if (!filePath) throw new Error("No file path");

                await window.api.save_file(filePath, content);
                notebook.info('File saved');
            } catch (error) {
                console.error('Error while saving a file:', error);
                notebook.info('Error while saving a file: ' + error);
            }
        },
        upload_picture: async () => {
            try {
                // Create a file input element
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*'; // Only accept image files

                // Create a promise to handle the file selection
                const filePromise = new Promise((resolve, reject) => {
                    fileInput.onchange = (event) => {
                        const file = event.target.files[0];
                        if (file) {
                            resolve(file);
                        } else {
                            reject(new Error('No file selected'));
                        }
                    };

                    fileInput.oncancel = () => {
                        reject(new Error('File selection cancelled'));
                    };
                });

                // Trigger the file selection dialog
                fileInput.click();

                // Wait for the user to select a file
                const file = await filePromise;

                // Upload the file using the API
                const result = await window.api.upload_picture(file);

                if (result.success) {
                    notebook.info('Picture uploaded successfully: ' + result.url);
                    return result.url;
                } else {
                    throw new Error('Failed to upload picture');
                }
            } catch (error) {
                console.error('Error while uploading picture:', error);
                notebook.info('Error while uploading picture: ' + error.message);
                throw error;
            }
        }

    };

})();