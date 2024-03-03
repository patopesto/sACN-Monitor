package dmx

import (
	"fmt"
	"net"
	"log"

    "github.com/libp2p/go-reuseport"
    "github.com/jsimonetti/go-artnet/packet"
    "github.com/jsimonetti/go-artnet/packet/code"
    "github.com/google/uuid"
)


type Universe struct {
	Id 		uuid.UUID 	`json:"id"`
	Num 	uint16  	`json:"num"`
	Source 	string  	`json:"source"`
	data 	[512]byte
}

func (u Universe) GetData() [512]byte {
	return u.data
}


var Universes []Universe

var server *net.UDPConn
var callbacks map[string]func(uuid.UUID)


func InitReceiver() {
	log.Println("Init ArtNet receiver")

	addr := fmt.Sprintf(":%d", packet.ArtNetPort)
	listener, err := reuseport.ListenPacket("udp4", addr)
	if err != nil {
		log.Panic(err)
	}
	server = listener.(*net.UDPConn)

	callbacks = make(map[string]func(uuid.UUID))
	
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

		uni := Universe {
			Num: uint16(packet.Net << 16 | packet.SubUni),
			Source: source.IP.String(), 
			data: packet.Data,
		}

		exist := false
		for i, u := range Universes {
			if u.Num == uni.Num && u.Source == uni.Source {
				exist = true
				Universes[i].data = uni.data // copy array in original struct
				callback := callbacks["data"]
				if callback != nil {
					callback(u.Id)
				}
				break
			}
		}
		if (exist == false) {
			uni.Id = uuid.New()
			Universes = append(Universes, uni)
			callback := callbacks["universe"]
			if callback != nil {
				callback(uni.Id)
			}
		}
	}
}

func RegisterCallback(name string, fn func(uuid.UUID)) {
	callbacks[name] = fn
}
