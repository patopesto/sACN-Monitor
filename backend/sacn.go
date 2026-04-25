package dmx

import (
	"errors"
	"fmt"
	"log"
	"net"
	"strings"

	"gitlab.com/patopest/go-sacn"
	"gitlab.com/patopest/go-sacn/packet"
)

var discoveredUniverses map[uint16]bool

type sACNReceiver struct {
	service  *DMXService
	receiver *sacn.Receiver
}

func NewSACNReceiver(iface NetInterface, service *DMXService) (*sACNReceiver, error) {
	log.Println("Init sACN receiver")

	if discoveredUniverses == nil {
		discoveredUniverses = make(map[uint16]bool)
	}

	if iface.Name == "" {
		return nil, errors.New(fmt.Sprintf("No interface specified for sACN receiver"))
	}
	itf, _ := net.InterfaceByName(iface.Name)

	receiver, err := sacn.NewReceiver(itf)
	if err != nil {
		return nil, err
	}

	r := &sACNReceiver{
		service:  service,
		receiver: receiver,
	}

	receiver.RegisterPacketCallback(packet.PacketTypeDiscovery, r.discoveryPacketCallback)
	receiver.RegisterPacketCallback(packet.PacketTypeData, r.dataPacketCallback)

	receiver.JoinUniverse(sacn.DISCOVERY_UNIVERSE)
	// Join already discovered universes
	for uni := range discoveredUniverses {
		log.Println("Joining known universe", uni)
		receiver.JoinUniverse(uni)
	}

	receiver.Start()

	return r, nil
}

func (r *sACNReceiver) Stop() {
	if r.receiver != nil {
		r.receiver.Stop()
	}
}

func (r *sACNReceiver) discoveryPacketCallback(p packet.SACNPacket, info sacn.PacketInfo) {
	d, ok := p.(*packet.DiscoveryPacket)
	if ok == false {
		return
	}

	log.Printf("Discovered universes from %s:\n", string(d.SourceName[:]))
	for i := 0; i < d.GetNumUniverses(); i++ {
		var universe = d.Universes[i]
		_, exists := discoveredUniverses[universe]
		if !exists {
			r.JoinUniverse(universe)
		}
	}
}

func (r *sACNReceiver) dataPacketCallback(p packet.SACNPacket, info sacn.PacketInfo) {
	d, ok := p.(*packet.DataPacket)
	if ok == false {
		return
	}
	// log.Printf("Received Data Packet for universe %d from %s\n", d.Universe, info.Source.IP.String())

	sourceName := string(d.SourceName[:])
	sourceName = strings.Trim(sourceName, "\x00") // remove trailing zeros from array
	sourceIP := info.Source.IP.String()
	mode := string(info.Mode)
	mode = strings.ToUpper(mode[:1]) + mode[1:] // Capitalise first letter

	uni := Universe{
		Protocol:    "sacn",
		Num:         d.Universe,
		Source:      sourceIP,
		SourceName:  sourceName,
		Priority:    d.Priority,
		SyncAddress: d.SyncAddress,
		Destination: mode,
	}
	copy(uni.Data[:], d.Data[1:]) // skip zero-start value

	r.service.updateUniverse(uni)
}

func (r *sACNReceiver) JoinUniverse(universe uint16) {
	log.Printf("Joining universe: %d\n", universe)
	if r.receiver != nil {
		err := r.receiver.JoinUniverse(universe)
		if err != nil {
			log.Println(err)
		}
		discoveredUniverses[universe] = true
	}
}
