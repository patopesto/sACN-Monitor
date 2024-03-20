package main

import (
	"context"
	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"log"

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

	ifaces := dmx.GetInterfaces()
	dmx.InitArtnetReceiver()
	dmx.RegisterArtnetCallback("universe", a.newUniverseEvent)
	dmx.RegisterArtnetCallback("data", a.newDataEvent)
	a.SetInterface(ifaces[0])
	dmx.InitSACNReceiver(ifaces[0])
	dmx.RegisterSACNCallback("universe", a.newUniverseEvent)
	dmx.RegisterSACNCallback("data", a.newDataEvent)
}

func (b *App) shutdown(ctx context.Context) {
	log.Println("Shutting down")
}

func (a *App) GetInterfaces() []dmx.Interface {
	return dmx.GetInterfaces()
}

func (a *App) SetInterface(iface dmx.Interface) {
	log.Println("Setting interface to", iface)
	for idx, itf := range dmx.Interfaces {
		if iface.Name == itf.Name && iface.Name == itf.Name {
			dmx.Interfaces[idx].Active = true
		} else {
			dmx.Interfaces[idx].Active = false
		}
	}
	dmx.InitSACNReceiver(iface)
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

func (a *App) JoinUniverse(universe uint16) {
	log.Printf("Joining universe %d\n", universe)
	dmx.JoinSACNUniverse(universe)
}

func (a *App) newUniverseEvent(id uuid.UUID) {

	runtime.EventsEmit(a.ctx, "universes.new")
}

func (a *App) newDataEvent(id uuid.UUID) {

	if a.selected_universe == id {
		runtime.EventsEmit(a.ctx, "universe.data")
	}
}
