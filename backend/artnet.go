package dmx

import (
	"fmt"
	"log"
	"net"

	"github.com/google/uuid"
	"github.com/jsimonetti/go-artnet/packet"
	"github.com/jsimonetti/go-artnet/packet/code"
	"github.com/libp2p/go-reuseport"
)

var server *net.UDPConn
var artnetCallbacks map[string]func(uuid.UUID)

func InitArtnetReceiver() {
	log.Println("Init ArtNet receiver")

	addr := fmt.Sprintf(":%d", packet.ArtNetPort)
	listener, err := reuseport.ListenPacket("udp4", addr)
	if err != nil {
		log.Panic(err)
	}
	server = listener.(*net.UDPConn)

	artnetCallbacks = make(map[string]func(uuid.UUID))

	go recvPackets()
}

func recvPackets() {
	defer server.Close()

	for {
		buf := make([]byte, 1024)
		_, source, err := server.ReadFromUDP(buf)
		if err != nil {
			log.Panicln(err)
			continue
		}

		p, err := packet.Unmarshal(buf)
		if p.GetOpCode() != code.OpDMX {
			continue
		}
		packet := p.(*packet.ArtDMXPacket)
		// fmt.Println("received universe :", packet.SubUni, packet.Net)

		uni := Universe{
			Protocol: "artnet",
			Num:      uint16(packet.Net<<16 | packet.SubUni),
			Source:   source.IP.String(),
			data:     packet.Data,
		}

		exist := false
		for i, u := range Universes {
			if u.Protocol == "artnet" && u.Num == uni.Num && u.Source == uni.Source {
				exist = true
				Universes[i].data = uni.data // copy array in original struct
				callback := artnetCallbacks["data"]
				if callback != nil {
					callback(u.Id)
				}
				break
			}
		}
		if exist == false {
			uni.Id = uuid.New()
			Universes = append(Universes, uni)
			callback := artnetCallbacks["universe"]
			if callback != nil {
				callback(uni.Id)
			}
		}
	}
}

func RegisterArtnetCallback(name string, fn func(uuid.UUID)) {
	artnetCallbacks[name] = fn
}
