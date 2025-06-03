const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: true
        }
    });

    mainWindow.loadFile('index.html');
    
    // Open DevTools for debugging
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Handle file dialog open
ipcMain.on('open-file-dialog', (event) => {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'DICOM Files', extensions: ['dcm', 'dicom', 'DCM', 'DICOM'] }
        ]
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            console.log('Selected file:', filePath);
            event.reply('file-selected', filePath);
        }
    }).catch(err => {
        console.error('Error in file dialog:', err);
    });
});

// Handle directory dialog open
ipcMain.on('open-directory-dialog', (event) => {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            const dirPath = result.filePaths[0];
            console.log('Selected directory:', dirPath);
            event.reply('directory-selected', dirPath);
        }
    }).catch(err => {
        console.error('Error in directory dialog:', err);
    });
});
