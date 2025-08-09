// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    read_file: (path) => ipcRenderer.invoke('read_file', path),
    save_file: (path,content) => ipcRenderer.invoke('save_file', path, content),
    read_folder: (path) => ipcRenderer.invoke('read_folder', path),
    showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
    showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
    showFolderDialog: () => ipcRenderer.invoke('show-folder-dialog')
});
