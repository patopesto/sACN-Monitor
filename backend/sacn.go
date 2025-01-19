package dmx

import (
	"fmt"
	"log"
	"net"
	"strings"
	"errors"

	"github.com/google/uuid"
	"gitlab.com/patopest/go-sacn"
	"gitlab.com/patopest/go-sacn/packet"
)

var receiver *sacn.Receiver
var sacnCallbacks map[string]func(uuid.UUID)
var discoveredUniverses map[uint16]bool

func InitSACNReceiver(iface NetInterface) error {
	log.Println("Init sACN receiver")

	if sacnCallbacks == nil {
		sacnCallbacks = make(map[string]func(uuid.UUID))
		discoveredUniverses = make(map[uint16]bool)
	}

	if iface.Name == "" {
		return errors.New(fmt.Sprintf("No interface specified for sACN receiver"))
	}
	itf, _ := net.InterfaceByName(iface.Name)

	if receiver != nil {
		receiver.Stop()
	}
	var err error
	receiver, err = sacn.NewReceiver(itf)
	if err != nil {
		return err
	}

	receiver.RegisterPacketCallback(packet.PacketTypeDiscovery, discoveryPacketCallback)
	receiver.RegisterPacketCallback(packet.PacketTypeData, dataPacketCallback)

	receiver.JoinUniverse(sacn.DISCOVERY_UNIVERSE)
	// Join already discovered universes
	for uni := range discoveredUniverses {
		log.Println("Joining known universe", uni)
		receiver.JoinUniverse(uni)
	}

	receiver.Start()
	return nil
}

func discoveryPacketCallback(p packet.SACNPacket, source string) {
	d, ok := p.(*packet.DiscoveryPacket)
	if ok == false {
		return
	}

	log.Printf("Discovered universes from %s:\n", string(d.SourceName[:]))
	for i := 0; i < d.GetNumUniverses(); i++ {
		var universe = d.Universes[i]
		_, exists := discoveredUniverses[universe]
		if !exists {
			JoinSACNUniverse(universe)
		}
	}
}

func dataPacketCallback(p packet.SACNPacket, source string) {
	d, ok := p.(*packet.DataPacket)
	if ok == false {
		return
	}
	log.Printf("Received Data Packet for universe %d from %s\n", d.Universe, source)

	sourceName := string(d.SourceName[:])
	sourceName = strings.Trim(sourceName, "\x00") // remove trailing zeros from array

	uni := Universe{
		Protocol:     "sacn",
		Num:          d.Universe,
		Source:       source,
		SourceName:   sourceName,
		Priority:     d.Priority,
		SyncAddress:  d.SyncAddress,
	}
	copy(uni.Data[:], d.Data[1:]) // skip zero-start value

	exist := false
	for i, u := range Universes {
		if u.Protocol == "sacn" && u.Num == uni.Num && u.Source == uni.Source {
			exist = true
			Universes[i].Update(uni)
			Universes[i].UpdateFPS()
			callback := sacnCallbacks["data"]
			if callback != nil {
				callback(u.Id)
			}
			break
		}
	}
	if exist == false {
		uni.Id = uuid.New()
		Universes = append(Universes, uni)
		callback := sacnCallbacks["universe"]
		if callback != nil {
			callback(uni.Id)
		}
	}
}

func JoinSACNUniverse(universe uint16) {
	log.Printf("Joining universe: %d\n", universe)
	if receiver != nil {
		err := receiver.JoinUniverse(universe)
		if err != nil {
			log.Println(err)
		}
		discoveredUniverses[universe] = true
	}
}

func RegisterSACNCallback(name string, fn func(uuid.UUID)) {
	sacnCallbacks[name] = fn
}
