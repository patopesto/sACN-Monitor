package main

import (
	"embed"
	"fmt"
	"log"
	"runtime"

	"github.com/tidwall/gjson"
	"github.com/wailsapp/wails/v3/pkg/application"

	dmx "sacn-monitor/backend"
)

//go:embed frontend/dist
var assets embed.FS

//go:embed wails.json
var configWails string

var name string

func main() {
	name = fmt.Sprintf("%s", gjson.Get(configWails, "name"))

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

	// Create main window
	window := createWindow(app)
	window.Show()

	// Setup menu (disabled on Windows for dark theme compatibility)
	if runtime.GOOS != "windows" {
		menu := app.NewMenu()

		// Options Menu
		optionsMenu := menu.AddSubmenu("Options")
		optionsMenu.AddSeparator()
		optionsMenu.Add("Clear Universe list").
			SetAccelerator("CmdOrCtrl+R").
			OnClick(func(ctx *application.Context) {
				dmxService.ClearUniverses()
			})
		optionsMenu.Add("Open New Window").
			SetAccelerator("CmdOrCtrl+N").
			OnClick(func(ctx *application.Context) {
				appService.OpenNewWindow()
			})

		app.Menu.Set(menu)
	}

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
		Mac: application.MacWindow{
			Appearance: application.NSAppearanceNameDarkAqua,
		},
		Windows: application.WindowsWindow{
			BackdropType: application.Mica,
			Theme:        application.Dark,
		},
	})
}

type AppService struct {
	app             *application.App
	pendingUniverse *dmx.UniverseKey
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
	a.pendingUniverse = &key
	window := createWindow(a.app)
	window.Show()
}

func (a *AppService) GetPendingUniverse() *dmx.UniverseKey {
	if a.pendingUniverse != nil {
		universe := *a.pendingUniverse
		a.pendingUniverse = nil
		return &universe
	}
	return nil
}
