package dmx

import (
	"context"
	"fmt"
	"log"
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type DMXService struct {
	app *application.App

	universes         map[UniverseKey]Universe
	selected_universe UniverseKey
	mu                sync.RWMutex

	sacn   *sACNReceiver
	artnet *artNetReceiver
}

func NewDMXService(app *application.App) *DMXService {
	return &DMXService{
		app:       app,
		universes: make(map[UniverseKey]Universe),
	}
}

// ServiceStartup is called when the app starts. This replaces v2's startup method.
func (s *DMXService) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	s.app.Event.On("interface.selected", func(e *application.CustomEvent) {
		if itf, ok := e.Data.(NetInterface); ok {
			s.setInterface(itf)
		}
	})
	return nil
}

// ServiceShutdown is called when the app shuts down
func (s *DMXService) ServiceShutdown() error {
	log.Println("Shutting down, DMXService")
	if s.sacn != nil {
		s.sacn.Stop()
	}
	if s.artnet != nil {
		s.artnet.Stop()
	}
	return nil
}

// setInterface sets the active network interface (called via event from NetworkService)
func (s *DMXService) setInterface(iface NetInterface) {
	log.Println("Setting interface to", iface)
	if s.sacn != nil {
		s.sacn.Stop()
	}
	if s.artnet != nil {
		s.artnet.Stop()
	}
	s.ClearUniverses()

	artnetReceiver, err := NewArtnetReceiver(iface, s)
	if err != nil {
		s.showMessage(fmt.Sprintf("Error initialising ArtNet interface \n%v", err.Error()))
	} else {
		s.artnet = artnetReceiver
	}

	sacnReceiver, err := NewSACNReceiver(iface, s)
	if err != nil {
		s.showMessage(fmt.Sprintf("Error initialising sACN interface \n%v", err.Error()))
	} else {
		s.sacn = sacnReceiver
	}
}

func (s *DMXService) GetUniverses() []UniverseKey {
	s.mu.RLock()
	defer s.mu.RUnlock()

	unis := make([]UniverseKey, 0, len(s.universes))
	for _, u := range s.universes {
		unis = append(unis, u.GetKey())
	}
	return unis
}

// GetUniverse returns a specific universe by key
func (s *DMXService) GetUniverse(key UniverseKey) Universe {
	s.mu.Lock()
	defer s.mu.Unlock()

	if u, ok := s.universes[key]; ok {
		if s.selected_universe != key {
			s.selected_universe = key
		}
		return u
	}
	return Universe{}
}

// JoinUniverse joins an sACN universe manually
func (s *DMXService) JoinUniverse(universe uint16) {
	if s.sacn != nil {
		s.sacn.JoinUniverse(universe)
	}
}

// ClearUniverses clears all universe data
func (s *DMXService) ClearUniverses() {
	log.Println("Clearing universes")
	s.mu.Lock()
	s.universes = make(map[UniverseKey]Universe)
	s.mu.Unlock()
	s.app.Event.Emit("universes.clear")
}

// newUniverseEvent is called when a new universe is discovered
func (s *DMXService) newUniverseEvent(key UniverseKey) {
	s.app.Event.Emit("universes.new", key)
}

// newDataEvent is called when new DMX data is received
func (s *DMXService) newDataEvent(uni Universe) {
	s.mu.RLock()
	selected := s.selected_universe
	s.mu.RUnlock()

	if selected == uni.GetKey() {
		s.app.Event.Emit("universe.data", uni.GetKey())
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

func (s *DMXService) updateUniverse(uni Universe) {
	s.mu.Lock()

	key := uni.GetKey()

	if u, ok := s.universes[key]; ok {
		u.Update(uni)
		u.UpdateFPS()
		s.universes[key] = u
		s.mu.Unlock()
		s.newDataEvent(uni)
		return
	}

	// universe does not exist, add to list
	s.universes[key] = uni
	s.mu.Unlock()
	s.newUniverseEvent(key)
}
