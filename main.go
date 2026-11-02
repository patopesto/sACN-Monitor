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

const APP_NAME = "sACN Monitor"
const APP_URL = "https://sacn-monitor.bambinito.net"

func main() {
	app := application.New(application.Options{
		Name: fmt.Sprintf("%s", APP_NAME),
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ActivationPolicy: application.ActivationPolicyRegular,
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
		Windows: application.WindowsOptions{
			DisableQuitOnLastWindowClosed: false,
			UseVisualHosting:              true,
		},
		Linux: application.LinuxOptions{
			DisableQuitOnLastWindowClosed: false,
		},
	})

	appService := NewAppService(app)
	app.RegisterService(application.NewService(appService))
	dmxService := dmx.NewDMXService(app)
	app.RegisterService(application.NewService(dmxService))
	networkService := dmx.NewNetworkService(app)
	app.RegisterService(application.NewService(networkService))

	// Setup menu
	menu := app.NewMenu()

	if runtime.GOOS == "darwin" {
		menu.AddRole(application.AppMenu) // macOS only
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
		SetAccelerator("CmdOrCtrl+Shift+C").
		OnClick(func(ctx *application.Context) {
			app.Event.Emit("view.selected", "channels")
		})
	channelViewMenu.Add("Values").
		SetAccelerator("CmdOrCtrl+Shift+V").
		OnClick(func(ctx *application.Context) {
			app.Event.Emit("view.selected", "values")
		})
	channelViewMenu.Add("Both").
		SetAccelerator("CmdOrCtrl+Shift+B").
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
	if runtime.GOOS == "darwin" {
		viewMenu.AddSeparator() // macOS adds items below
	}

	// Add other defaults
	menu.AddRole(application.WindowMenu)
	windowMenu := menu.FindByRole(application.WindowMenu).GetSubmenu()
	windowMenu.Add("New Window").
		SetAccelerator("CmdOrCtrl+N").
		OnClick(func(ctx *application.Context) {
			appService.OpenNewWindow()
		})

	// Help: custom menu
	helpMenu := menu.AddSubmenu("Help")
	helpMenu.Add("Website").OnClick(func(ctx *application.Context) {
		err := app.Browser.OpenURL(APP_URL)
		if err != nil {
			log.Printf("Failed to open help url %v %v", APP_URL, err)
		}
	})

	app.Menu.Set(menu)

	// Create main window
	window := createWindow(app)
	window.Show()

	err := app.Run()
	if err != nil {
		log.Fatalf("Error running application: %v", err)
	}
}

func createWindow(app *application.App) *application.WebviewWindow {
	backgroundType := application.BackgroundTypeTranslucent
	if runtime.GOOS == "windows" {
		backgroundType = application.BackgroundTypeSolid
	}
	return app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:              APP_NAME,
		Width:              1280,
		Height:             720,
		UseApplicationMenu: true,
		BackgroundType:     backgroundType,
		BackgroundColour:   application.NewRGBA(24, 24, 27, 255),
		Mac: application.MacWindow{
			Backdrop:    application.MacBackdropTranslucent,
			Appearance:  application.NSAppearanceNameDarkAqua,
			TabbingMode: application.MacWindowTabbingModeAutomatic,
		},
		Windows: application.WindowsWindow{
			Theme:        application.SystemDefault,
			BackdropType: application.Mica,
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
