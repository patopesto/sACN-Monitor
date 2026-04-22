package main

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v3/pkg/application"

	dmx "sacn-monitor/backend"
)

// DMXService struct replaces the v2 App struct
type DMXService struct {
	app               *application.App
	selected_universe uuid.UUID
}

// NewDMXService creates a new DMXService application struct
func NewDMXService(app *application.App) *DMXService {
	return &DMXService{
		app: app,
	}
}

// ServiceStartup is called when the app starts. This replaces v2's startup method.
func (s *DMXService) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	ifaces := dmx.GetInterfaces()
	s.SetInterface(ifaces[0]) // also inits receivers
	dmx.RegisterArtnetCallback("universe", s.newUniverseEvent)
	dmx.RegisterArtnetCallback("data", s.newDataEvent)
	dmx.RegisterSACNCallback("universe", s.newUniverseEvent)
	dmx.RegisterSACNCallback("data", s.newDataEvent)
	return nil
}

// ServiceShutdown is called when the app shuts down
func (s *DMXService) ServiceShutdown() error {
	log.Println("Shutting down")
	return nil
}

// GetInterfaces returns available network interfaces
func (s *DMXService) GetInterfaces() []dmx.NetInterface {
	return dmx.GetInterfaces()
}

// SetInterface sets the active network interface
func (s *DMXService) SetInterface(wanted dmx.NetInterface) {
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
		s.showMessage("Interface not found")
	}

	log.Println("Setting interface to", wanted)
	s.ClearUniverses()

	var err error
	err = dmx.InitArtnetReceiver(iface)
	if err != nil {
		s.showMessage(fmt.Sprintf("Error initialising ArtNet interface \n%v", err.Error()))
	}
	err = dmx.InitSACNReceiver(iface)
	if err != nil {
		s.showMessage(fmt.Sprintf("Error initialising sACN interface \n%v", err.Error()))
	}
}

// GetUniverses returns all discovered universes
func (s *DMXService) GetUniverses() []dmx.Universe {
	return dmx.Universes
}

// GetUniverse returns a specific universe by ID
func (s *DMXService) GetUniverse(id string) dmx.Universe {
	for _, u := range dmx.Universes {
		if u.Id.String() == id {
			if s.selected_universe.String() != id {
				s.selected_universe, _ = uuid.Parse(id)
			}
			return u
		}
	}
	return dmx.Universe{}
}

// JoinUniverse joins an sACN universe manually
func (s *DMXService) JoinUniverse(universe uint16) {
	dmx.JoinSACNUniverse(universe)
}

// ClearUniverses clears all universe data
func (s *DMXService) ClearUniverses() {
	log.Println("Clearing universes")
	dmx.Universes = nil
	s.app.Event.Emit("universes.clear", nil)
}

// newUniverseEvent is called when a new universe is discovered
func (s *DMXService) newUniverseEvent(id uuid.UUID) {
	s.app.Event.Emit("universes.new", nil)
}

// newDataEvent is called when new DMX data is received
func (s *DMXService) newDataEvent(id uuid.UUID) {
	if s.selected_universe == id {
		s.app.Event.Emit("universe.data", nil)
	}
}

// showMessage displays a message dialog
func (s *DMXService) showMessage(msg string) {
	dialog := s.app.Dialog.Warning().
		SetTitle("Interface Error").
		SetMessage(msg)
	dialog.AddButton("OK")
	dialog.Show()
}
