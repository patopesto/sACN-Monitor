package dmx

import (
	"math"
	"time"
	// "fmt"
)

const smoothing float32 = 0.9

// A Custom struct to use as key to store universes for easy differentiation
type UniverseKey struct {
	Protocol string `json:"protocol"`
	Num      uint16 `json:"num"`
	Source   string `json:"source"`
}

// Common struct to store universe data received by Receivers
type Universe struct {
	// Common data
	Protocol     string    `json:"protocol"`
	Num          uint16    `json:"num"`
	Source       string    `json:"source"` // string of the sender's IP address
	Data         [512]byte `json:"data"`
	LastReceived time.Time `json:"last_received"`
	FPS          uint8     `json:"fps"`
	Destination  string    `json:"destination"` // Unicast | Broadcast | Multicast
	period       uint

	// sACN specific
	SourceName  string `json:"source_name"`
	Priority    uint8  `json:"priority"`
	SyncAddress uint16 `json:"sync_address"`
}

func (u *Universe) GetKey() UniverseKey {
	return UniverseKey{
		Protocol: u.Protocol,
		Num:      u.Num,
		Source:   u.Source,
	}
}

func (u *Universe) GetData() [512]byte {
	return u.Data
}

func (u *Universe) UpdateFPS() {
	period := time.Since(u.LastReceived).Microseconds()
	if u.LastReceived.IsZero() != true {
		u.period = uint((float32(u.period) * smoothing) + (float32(period) * (1.0 - smoothing)))
		u.FPS = uint8(math.Round(1000000.0 / float64(u.period)))
	}
	u.LastReceived = time.Now()
}

func (u *Universe) Update(new Universe) {
	// u.Data = new.Data
	copy(u.Data[:], new.Data[:])
	u.SourceName = new.SourceName
	u.Priority = new.Priority
	u.SyncAddress = new.SyncAddress
	u.Destination = new.Destination
}
