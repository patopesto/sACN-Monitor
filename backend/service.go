package dmx

import (
	"context"
	"fmt"
	"log"
	"sync"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type DMXService struct {
	app               *application.App

	universes         []Universe
	selected_universe uuid.UUID
	mu        		  sync.RWMutex

	sacn   *sACNReceiver
	artnet *artNetReceiver
}

func NewDMXService(app *application.App) *DMXService {
	return &DMXService{
		app:       app,
		universes: make([]Universe, 0),
	}
}

// ServiceStartup is called when the app starts. This replaces v2's startup method.
func (s *DMXService) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	s.app.Event.On("interface.selected", func(e *application.CustomEvent) {
		itf, _ := e.Data.(NetInterface)
		s.SetInterface(itf)
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

// SetInterface sets the active network interface
func (s *DMXService) SetInterface(iface NetInterface) {
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

func (s *DMXService) GetUniverses() []Universe {
	return s.universes
}

// GetUniverse returns a specific universe by ID
func (s *DMXService) GetUniverse(id string) Universe {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, u := range s.universes {
		if u.Id.String() == id {
			if s.selected_universe.String() != id {
				s.selected_universe, _ = uuid.Parse(id)
			}
			return u
		}
	}
	return Universe{}
}

// JoinUniverse joins an sACN universe manually
func (s *DMXService) JoinUniverse(universe uint16) {
	s.sacn.JoinUniverse(universe)
}

// ClearUniverses clears all universe data
func (s *DMXService) ClearUniverses() {
	log.Println("Clearing universes")
	s.mu.Lock()
	s.universes = nil
	s.mu.Unlock()
	s.app.Event.Emit("universes.clear")
}

// newUniverseEvent is called when a new universe is discovered
func (s *DMXService) newUniverseEvent(id uuid.UUID) {
	s.app.Event.Emit("universes.new")
}

// newDataEvent is called when new DMX data is received
func (s *DMXService) newDataEvent(id uuid.UUID) {
	s.mu.RLock()
	selected := s.selected_universe
	s.mu.RUnlock()

	if selected == id {
		s.app.Event.Emit("universe.data")
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
	
	for i, u := range s.universes {
		if u.Protocol == uni.Protocol && u.Num == uni.Num && u.Source == uni.Source {
			s.universes[i].Update(uni)
			s.universes[i].UpdateFPS()
			s.mu.Unlock()
			s.newDataEvent(u.Id)
			return
		}
	}

	// universe does not exist, add to list
	uni.Id = uuid.New()
	s.universes = append(s.universes, uni)
	s.mu.Unlock()
	s.newUniverseEvent(uni.Id)
}
