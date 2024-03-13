package main

import (
	"embed"
	"fmt"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/tidwall/gjson"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed wails.json
var configWails string

func main() {
	// Create an instance of the app structure
	app := NewApp()
	// Load variables from embedded wails config file
	name := gjson.Get(configWails , "name")
	version := gjson.Get(configWails , "info.productVersion")
	copyright := gjson.Get(configWails , "info.copyright")

	// Create application with options
	err := wails.Run(&options.App{
		Title:  fmt.Sprintf("%s", name),
		Width:  1280,
		Height: 720,
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
            Appearance: mac.NSAppearanceNameDarkAqua,
            About: &mac.AboutInfo{
                Title: fmt.Sprintf("%s", name),
                Message: fmt.Sprintf("%s\n%s", version, copyright),
            },
        },
        Windows: &windows.Options{
            WebviewIsTransparent: true,
            WindowIsTranslucent:  true,
            Theme: windows.Dark,
        },
        Linux: &linux.Options{
            WindowIsTranslucent: true,
        },
	})

	if err != nil {
		log.Fatalf(err.Error())
	}
}
