const { app, BrowserWindow, Menu, shell } = require('electron');
const defaultMenu = require('electron-default-menu');
const path = require('path');
const sacn = require('./sacn_receiver');
const interface = require('./interface');

const isDevelopment = process.env.APP_ENV === 'dev';


/* -------- Electron app --------- */
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
        width: 1280,
        height: 720,
        title: "sACN Monitor",
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


const createMenu = () => {
    // const default_menu = Menu.getApplicationMenu();
    const menu = defaultMenu(app, shell);
    const ifaces = interface.get();
    const iface_submenu = [];
    for (const name in ifaces) {
        const ip = ifaces[name][0].address;
        iface_submenu.push({
            label: name + " (" + ip + ")",
            click: (item, focusedWindow) => {
              interface.select(name, ip);
            },
        })
    }

    const custom_menu = {
        label: "Settings",
        submenu: [
            { 
                label: "Interfaces",
                submenu: iface_submenu,
            },
            { type:  "separator" },
            { label: "Test" },
        ]
    };

    // const menu_template = [ ...default_menu?.items||[], custom_menu ];
    menu.splice(1, 0, custom_menu);
    // const menu = Menu.buildFromTemplate([custom_menu])
    // default_menu.items.insert(1, menu)
    // Menu.setApplicationMenu(default_menu);
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
};


app.whenReady().then(() => {
    console.log("Hello from Electron");
    if (isDevelopment) {
        console.log("Installing extensions");
        installExtensions();
    }

    createMenu();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

})


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
})



/* -------- sACN --------- */
sacn.init();
sacn.init_receiver(interface.selected);

sacn.on_packet((packet) => {
    // console.log("new packet for universe", packet.universe);
    if (mainWindow != null) {
        mainWindow.webContents.send("dmx-data", packet);
    }
})

interface.on_change((iface) => {
    sacn.close_receiver(iface);
    sacn.init_receiver(iface);
});

