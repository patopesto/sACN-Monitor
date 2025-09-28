package main

import (
	"context"
	"fmt"
	"log"
	// "time"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	dmx "sacn-monitor/backend"
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
	a.SetInterface(ifaces[0]) // also inits receivers
	dmx.RegisterArtnetCallback("universe", a.newUniverseEvent)
	dmx.RegisterArtnetCallback("data", a.newDataEvent)
	dmx.RegisterSACNCallback("universe", a.newUniverseEvent)
	dmx.RegisterSACNCallback("data", a.newDataEvent)
}

func (b *App) shutdown(ctx context.Context) {
	log.Println("Shutting down")
}

func (a *App) GetInterfaces() []dmx.NetInterface {
	return dmx.GetInterfaces()
}

func (a *App) SetInterface(wanted dmx.NetInterface) {
	var iface dmx.NetInterface
	found := false
	for idx, itf := range dmx.Interfaces {
		if wanted.Name == itf.Name && wanted.IP == itf.IP {
			iface = dmx.Interfaces[idx]
			dmx.Interfaces[idx].Active = true
			found = true
		} else {
			dmx.Interfaces[idx].Active = false
		}
	}
	if found == false {
		a.showMessage("Interface not found")
	}

	log.Println("Setting interface to", wanted)
	a.ClearUniverses()

	var err error
	err = dmx.InitArtnetReceiver(iface)
	if err != nil {
		a.showMessage(fmt.Sprintf("Error initialising ArtNet interface \n%v", err.Error()))
	}
	err = dmx.InitSACNReceiver(iface)
	if err != nil {
		a.showMessage(fmt.Sprintf("Error initialising sACN interface \n%v", err.Error()))
	}
}

func (a *App) GetUniverses() []dmx.Universe {
	return dmx.Universes
}

func (a *App) GetUniverse(id string) dmx.Universe {

	for _, u := range dmx.Universes {
		if u.Id.String() == id {
			// log.Println("found universe ", id)

			if a.selected_universe.String() != id {
				a.selected_universe, _ = uuid.Parse(id)
			}
			return u
		}
	}

	return dmx.Universe{}
}

func (a *App) JoinUniverse(universe uint16) {
	dmx.JoinSACNUniverse(universe)
}

func (a *App) ClearUniverses() {
	log.Println("Clearing universes")
	dmx.Universes = nil
	runtime.EventsEmit(a.ctx, "universes.clear")
}

func (a *App) newUniverseEvent(id uuid.UUID) {

	runtime.EventsEmit(a.ctx, "universes.new")
}

func (a *App) newDataEvent(id uuid.UUID) {

	if a.selected_universe == id {
		runtime.EventsEmit(a.ctx, "universe.data")
	}
}

func (a *App) showMessage(msg string) {

	runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:          runtime.WarningDialog,
		Title:         "Interface Error",
		Message:       msg,
		DefaultButton: "Ok",
	})
}
