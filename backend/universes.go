package dmx

import (
	"github.com/google/uuid"
)

// Common struct to store universe data received by Receivers
type Universe struct {
	Id       uuid.UUID `json:"id"`
	Protocol string    `json:"protocol"`
	Num      uint16    `json:"num"`
	Source   string    `json:"source"`
	data     [512]byte
}

func (u Universe) GetData() [512]byte {
	return u.data
}

// List of all currently received universes
var Universes []Universe
