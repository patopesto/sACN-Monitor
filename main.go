package main

import (
	"embed"
	"fmt"
	"log"
	"runtime"

	"github.com/tidwall/gjson"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed wails.json
var configWails string

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Menus
	AppMenu := menu.NewMenu()
	if runtime.GOOS == "darwin" {
		AppMenu.Append(menu.AppMenu())
	}
	OptionsMenu := AppMenu.AddSubmenu("Options")
	OptionsMenu.AddSeparator()
	// OptionsMenu.AddRadio("Radio", false, nil, nil)
	// OptionsMenu.AddCheckbox("Checkbox", false, keys.CmdOrCtrl("c"), nil)
	OptionsMenu.AddText("Clear Universe list", keys.CmdOrCtrl("r"), func(_ *menu.CallbackData) {
		app.ClearUniverses()
	})

	// Load variables from embedded wails config file
	name := gjson.Get(configWails, "name")
	version := gjson.Get(configWails, "info.productVersion")
	copyright := gjson.Get(configWails, "info.copyright")

	// Create application with options
	err := wails.Run(&options.App{
		Title:  fmt.Sprintf("%s", name),
		Width:  1280,
		Height: 720,
		Menu:   AppMenu,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 0},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			Appearance:           mac.NSAppearanceNameDarkAqua,
			About: &mac.AboutInfo{
				Title:   fmt.Sprintf("%s", name),
				Message: fmt.Sprintf("%s\n%s", version, copyright),
			},
		},
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			BackdropType:         windows.Mica,
			Theme:                windows.Dark,
		},
		Linux: &linux.Options{
			WindowIsTranslucent: true,
		},
	})

	if err != nil {
		log.Fatalf(err.Error())
	}
}
