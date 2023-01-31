const { app, BrowserWindow } = require('electron');
const path = require('path');
const { Receiver } = require('sacn');

let win;

const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        title: "sACN View",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: __dirname + '/preload.js'
        }
    });

    if (app.isPackaged) {
        win.loadURL(`file://${path.join(__dirname, "/../index.html")}`);
    }
    else {
        win.loadURL("http://localhost:3000");

        win.webContents.openDevTools();

        console.log("_dirname",__dirname);

        require('electron-reload')(__dirname, {
            electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
            forceHardReset: true,
            hardResetMethod: 'exit'
        });
    }  
};


app.whenReady().then(() => {
    createWindow();
    console.log("Hello from Electron");

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })

})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
})



const receiver = new Receiver({
    universes: [1, 2],
    reuseAddr: true
})

receiver.on('packet', (packet) => {
    // console.log("new packet: ", packet.payload);
    if (win != null) {
        win.webContents.send("dmx-data", packet);
    }
})