package main

import (
	"context"
	"log"
	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	dmx "dmx-monitor/backend"
)

// App struct
type App struct {
	ctx context.Context

	selected_universe uuid.UUID
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	dmx.InitReceiver()
	dmx.RegisterCallback("universe" ,a.newUniverseEvent)
	dmx.RegisterCallback("data", a.newDataEvent)
}

func (b *App) shutdown(ctx context.Context) {
	log.Println("Shutting down")
}


func (a *App) GetUniverses() []dmx.Universe {
	return dmx.Universes
}

func (a *App) GetUniverseData(id string) [512]byte {

	for _, u := range dmx.Universes {
		if u.Id.String() == id {
			// log.Println("found universe ", id)

			if a.selected_universe.String() != id {
				a.selected_universe, _ = uuid.Parse(id)
			}
			return u.GetData()
		}
	}
	// log.Println("NOT FOUND",id)
	var empty [512]byte 
	return empty
}

func (a *App) newUniverseEvent(id uuid.UUID) {

	runtime.EventsEmit(a.ctx, "universes.new")
}

func (a *App) newDataEvent(id uuid.UUID) {

	if a.selected_universe == id {
		runtime.EventsEmit(a.ctx, "universe.data")
	}
}
