const { app, BrowserWindow } = require('electron');
const path = require('path');
const { Receiver } = require('sacn');

const isDevelopment = process.env.APP_ENV === 'dev';

let mainWindow = null;
let forceQuit = false;

const installExtensions = () => {
    const installer = require('electron-devtools-installer');
    const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    for (const name of extensions) {
        try {
            installer.default(installer[name], forceDownload);
        } catch (e) {
            console.log(`Error installing ${name} extension: ${e.message}`);
        }
    }
};

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: "sACN View",
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: __dirname + '/preload.js'
        }
    });

    console.log(__dirname);

    if (app.isPackaged) {
        mainWindow.loadURL(`file://${path.join(__dirname, "/../build/index.html")}`);
    }
    else {
        mainWindow.loadURL("http://localhost:3000");

        mainWindow.webContents.openDevTools();

        console.log("_dirname",__dirname);

        require('electron-reload')(__dirname, {
            electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
            forceHardReset: true,
            hardResetMethod: 'exit'
        });
    }

    // show window once on first load
    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.show();
    });

    mainWindow.webContents.on('did-finish-load', () => {
    // Handle window logic properly on macOS:
    // 1. App should not terminate if window has been closed
    // 2. Click on icon in dock should re-open the window
    // 3. ⌘+Q should close the window and quit the app
    if (process.platform === 'darwin') {
      mainWindow.on('close', function (e) {
        if (!forceQuit) {
          e.preventDefault();
          mainWindow.hide();
        }
      });

      app.on('activate', () => {
        mainWindow.show();
      });

      app.on('before-quit', () => {
        forceQuit = true;
      });
    } else {
      mainWindow.on('closed', () => {
        mainWindow = null;
      });
    }
  });
};


app.whenReady().then(() => {
    console.log("Hello from Electron");
    if (isDevelopment) {
        console.log("Installing extensions");
        installExtensions();
    }

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

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
    if (mainWindow != null) {
        mainWindow.webContents.send("dmx-data", packet);
    }
})