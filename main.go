package main

import (
	"embed"
	"fmt"
	"log"
	"runtime"
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"

	dmx "sacn-monitor/backend"
)

//go:embed frontend/dist
var assets embed.FS

const name = "sACN Monitor"
const url = "https://sacn-monitor.bambinito.net"

func main() {
	app := application.New(application.Options{
		Name: fmt.Sprintf("%s", name),
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
	})

	appService := NewAppService(app)
	app.RegisterService(application.NewService(appService))
	dmxService := dmx.NewDMXService(app)
	app.RegisterService(application.NewService(dmxService))
	networkService := dmx.NewNetworkService(app)
	app.RegisterService(application.NewService(networkService))

	// Setup menu (disabled on Windows for dark theme compatibility)
	if runtime.GOOS != "windows" {
		menu := app.NewMenu()

		if runtime.GOOS == "darwin" {
        	menu.AddRole(application.AppMenu)  // macOS only
    	}

    	// File: extend default menu
    	menu.AddRole(application.FileMenu)
    	fileMenu := menu.FindByRole(application.FileMenu).GetSubmenu()
    	fileMenu.Add("New Window").
			SetAccelerator("CmdOrCtrl+N").
			OnClick(func(ctx *application.Context) {
				appService.OpenNewWindow()
			})
		fileMenu.AddSeparator()
		fileMenu.Add("Add Universe").
			SetAccelerator("CmdOrCtrl+U").
			OnClick(func(ctx *application.Context) {
				currentWindow := app.Window.Current()
				if currentWindow != nil {
					currentWindow.EmitEvent("universe.add")
				}
			})
		fileMenu.Add("Reload Universes").
			SetAccelerator("CmdOrCtrl+R").
			OnClick(func(ctx *application.Context) {
				dmxService.ClearUniverses()
			})

		// View: custom menu
		viewMenu := menu.AddSubmenu("View")
		// Protocol submenu
		protocolMenu := viewMenu.AddSubmenu("Protocol")
		protocolMenu.Add("sACN").
			SetAccelerator("CmdOrCtrl+1").
			OnClick(func(ctx *application.Context) {
				app.Event.Emit("protocol.selected", "sacn")
			})
		protocolMenu.Add("ArtNet").
			SetAccelerator("CmdOrCtrl+2").
			OnClick(func(ctx *application.Context) {
				app.Event.Emit("protocol.selected", "artnet")
			})
		protocolMenu.Add("Both").
			SetAccelerator("CmdOrCtrl+3").
			OnClick(func(ctx *application.Context) {
				app.Event.Emit("protocol.selected", "mixed")
			})

		// Channel View submenu
		channelViewMenu := viewMenu.AddSubmenu("Channel View")
		channelViewMenu.Add("Channels").
			SetAccelerator("CmdOrCtrl+C").
			OnClick(func(ctx *application.Context) {
				app.Event.Emit("view.selected", "channels")
			})
		channelViewMenu.Add("Values").
			SetAccelerator("CmdOrCtrl+V").
			OnClick(func(ctx *application.Context) {
				app.Event.Emit("view.selected", "values")
			})
		channelViewMenu.Add("Both").
			SetAccelerator("CmdOrCtrl+B").
			OnClick(func(ctx *application.Context) {
				app.Event.Emit("view.selected", "both")
			})

		viewMenu.AddSeparator()
		viewMenu.Add("Toggle Left Sidebar").
			SetAccelerator("CmdOrCtrl+Shift+L").
			OnClick(func(ctx *application.Context) {
				currentWindow := app.Window.Current()
				if currentWindow != nil {
					currentWindow.EmitEvent("sidebar.left.toggle")
				}
			})
		viewMenu.Add("Toggle Right Sidebar").
			SetAccelerator("CmdOrCtrl+Shift+R").
			OnClick(func(ctx *application.Context) {
				currentWindow := app.Window.Current()
				if currentWindow != nil {
					currentWindow.EmitEvent("sidebar.right.toggle")
				}
			})
		viewMenu.AddSeparator()
		
		// Add other defaults
		menu.AddRole(application.WindowMenu)

    	// Help: custom menu
		helpMenu := menu.AddSubmenu("Help")
    	helpMenu.Add("Learn More").OnClick(func(ctx *application.Context) {
			err := app.Browser.OpenURL(url)
	        if err != nil {
	            log.Printf("Failed to open help url %v %v", url, err)
	        }
		})

		app.Menu.Set(menu)
	}

	// Create main window
	window := createWindow(app)
	window.Show()

	err := app.Run()
	if err != nil {
		log.Fatalf("Error running application: %v", err)
	}
}

func createWindow(app *application.App) *application.WebviewWindow {
	return app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:  name,
		Width:  1280,
		Height: 720,
		UseApplicationMenu: true,
		BackgroundType: application.BackgroundTypeTranslucent,
		Mac: application.MacWindow{
			Backdrop: application.MacBackdropTranslucent,
			Appearance: application.NSAppearanceNameDarkAqua,
		},
		Windows: application.WindowsWindow{
			BackdropType: application.Mica,
			Theme:        application.Dark,
		},
		Linux: application.LinuxWindow{
			WindowIsTranslucent: true,
		},
	})
}

type AppService struct {
	app             *application.App
	pendingUniverse *dmx.UniverseKey
	pendingMu       sync.Mutex
}

func NewAppService(app *application.App) *AppService {
	return &AppService{
		app: app,
	}
}

func (a *AppService) OpenNewWindow() {
	window := createWindow(a.app)
	window.Show()
}

func (a *AppService) OpenNewWindowWithUniverse(key dmx.UniverseKey) {
	a.pendingMu.Lock()
	a.pendingUniverse = &key
	a.pendingMu.Unlock()
	window := createWindow(a.app)
	window.Show()
}

func (a *AppService) GetPendingUniverse() *dmx.UniverseKey {
	a.pendingMu.Lock()
	defer a.pendingMu.Unlock()
	if a.pendingUniverse != nil {
		universe := *a.pendingUniverse
		a.pendingUniverse = nil
		return &universe
	}
	return nil
}
