const { app, BrowserWindow } = require('electron');
const path = require('path');
const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');
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

    if (!app.isPackaged) {
        const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
        const tools = [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS]
        installExtension(tools, forceDownload)
            .then((name) => console.log(`Added Extension:  ${name}`))
            .catch((err) => console.log('An error occurred: ', err));
    }

})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
})

// hack to listen for multiple universes
const NUM_UNIVERSES = 512;
const universes = []
for (let i = 1; i < NUM_UNIVERSES; i++) {
    universes.push(i);
}
const receiver = new Receiver({
    universes: universes,
    reuseAddr: true,
    iface: "0.0.0.0"
})

receiver.on('packet', (packet) => {
    // console.log("new packet for universe", packet.universe);
    if (win != null) {
        win.webContents.send("dmx-data", packet);
    }
})