import fs from 'fs'
import path from 'path'
import { dialog } from 'electron'

export class Dialoger {
    async openFileDialog() {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: '所有文件', extensions: ['*'] }
            ]
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    }

    async saveFileDialog() {
        const result = await dialog.showSaveDialog({
            filters: [
                { name: '所有文件', extensions: ['*'] }
            ]
        });
        if (!result.canceled) {
            return result.filePath;
        }
        return null;
    }

    async selectFolderDialog() {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    }
}

export class FileSystem {
    constructor() {
        this.fileTree = {};
    }

    load_folder(folderPath) {
        this.fileTree = this._scanDirectory(folderPath);
        return this.fileTree;
    }

    _scanDirectory(currentPath) {
        const stats = fs.statSync(currentPath);
        
        if (stats.isFile()) {
            return {
                type: 'file',
                path: currentPath,
                name: path.basename(currentPath)
            };
        }

        if (stats.isDirectory()) {
            const items = fs.readdirSync(currentPath);
            const children = [];
            
            items.forEach(item => {
                const fullPath = path.join(currentPath, item);
                children.push(this._scanDirectory(fullPath));
            });

            return {
                type: 'directory',
                path: currentPath,
                name: path.basename(currentPath),
                children: children
            };
        }
    }

    save(filePath, content) {
        const dirname = path.dirname(filePath);
        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, { recursive: true });
        }
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }

    open(filePath) {
        return fs.readFileSync(filePath, 'utf8');
    }

    new_folder(folderPath) {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            return true;
        }
        return false;
    }

    delete(filePath) {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(filePath);
            }
            return true;
        }
        return false;
    }

    rename(oldPath, newName) {
        if (!fs.existsSync(oldPath)) {
            return false;
        }
        
        const dirname = path.dirname(oldPath);
        const newPath = path.join(dirname, newName);
        
        // 检查新名称是否已存在
        if (fs.existsSync(newPath)) {
            return false;
        }
        
        try {
            fs.renameSync(oldPath, newPath);
            return true;
        } catch (error) {
            return false;
        }
    }
}
