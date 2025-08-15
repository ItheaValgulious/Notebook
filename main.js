const { app, BrowserWindow,ipcMain } = require('electron/main')
const { FileSystem, Dialoger } = require('./src/back/system')

var file_system = new FileSystem();
var dialoger = new Dialoger();
ipcMain.handle('read_file', async (event, filePath) => {
    return await file_system.open(filePath);
});

ipcMain.handle('save_file', async (event, filePath, content) => {
    return await file_system.save(filePath, content);
});

ipcMain.handle('read_folder', async (event, folderPath) => {
    return await file_system.load_folder(folderPath);
});

ipcMain.handle('show-open-dialog', async () => {
    return await dialoger.openFileDialog();
});

ipcMain.handle('show-save-dialog', async () => {
    return await dialoger.saveFileDialog();
});

ipcMain.handle('show-folder-dialog', async () => {
    return await dialoger.selectFolderDialog();
});

ipcMain.handle('new_folder', async (event, folderPath) => {
    return await file_system.new_folder(folderPath);
});

ipcMain.handle('delete', async (event, filePath) => {
    return await file_system.delete(filePath);
});

ipcMain.handle('rename', async (event, oldPath, newName) => {
    return await file_system.rename(oldPath, newName);
});

const createWindow = () => {
    const win = new BrowserWindow({
        fullscreen: true,
        webPreferences: {
            preload: __dirname + '/src/back/preload.js',
            contextIsolation: true
        }
    });

    win.loadFile('./src/front/index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
