package main

import (
	"embed"
	"fmt"
	"log"
	"runtime"

	"github.com/tidwall/gjson"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed frontend/dist
var assets embed.FS

//go:embed wails.json
var configWails string

func main() {
	// Load variables from embedded wails config file
	name := gjson.Get(configWails, "name")

	// Create application
	app := application.New(application.Options{
		Name: fmt.Sprintf("%s", name),
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
	})

	// Create service instance and register it
	dmxService := NewDMXService(app)
	app.RegisterService(application.NewService(dmxService))

	// Create main window
	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:  fmt.Sprintf("%s", name),
		Width:  1280,
		Height: 720,
		// Menu disabled on Windows for dark theme compatibility
		Mac: application.MacWindow{
			Appearance: application.NSAppearanceNameDarkAqua,
		},
		Windows: application.WindowsWindow{
			BackdropType: application.Mica,
			Theme:        application.Dark,
		},
	})

	// Setup menu (except on Windows)
	if runtime.GOOS != "windows" {
		setupMenu(app, window, dmxService)
	}

	// Run application
	err := app.Run()
	if err != nil {
		log.Fatalf("Error running application: %v", err)
	}
}

func setupMenu(app *application.App, window *application.WebviewWindow, dmxService *DMXService) {
	appMenu := app.NewMenu()

	// Options Menu
	optionsMenu := appMenu.AddSubmenu("Options")
	optionsMenu.AddSeparator()
	optionsMenu.Add("Clear Universe list").
		SetAccelerator("CmdOrCtrl+R").
		OnClick(func(ctx *application.Context) {
			// Call method directly on service instance
			dmxService.ClearUniverses()
		})

	// Set menu on the window
	window.SetMenu(appMenu)
}
