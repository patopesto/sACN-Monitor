package dmx

import (
	"fmt"
	"log"
	"net"
	"strings"

	"github.com/google/uuid"
	"github.com/jsimonetti/go-artnet/packet"
	"github.com/jsimonetti/go-artnet/packet/code"
	"github.com/libp2p/go-reuseport"
	"golang.org/x/net/ipv4"
)

var server *ipv4.PacketConn
var currentAddr net.IPNet
var currentBcastAddr net.IP

var artnetCallbacks map[string]func(uuid.UUID)
var artnetNodes map[string]string

func InitArtnetReceiver(iface NetInterface) error {
	log.Println("Init ArtNet receiver")

	if artnetCallbacks == nil {
		artnetCallbacks = make(map[string]func(uuid.UUID))
		artnetNodes = make(map[string]string)
	}

	currentAddr = iface.addr
	currentBcastAddr = GetBroadcastIP(currentAddr.IP, currentAddr.Mask)

	if server == nil {
		addr := fmt.Sprintf(":%d", packet.ArtNetPort)
		listener, err := reuseport.ListenPacket("udp4", addr)
		if err != nil {
			return err
		}

		server = ipv4.NewPacketConn(listener)
		if err := server.SetControlMessage(ipv4.FlagDst, true); err != nil { // Enable receiving of destination address info
			log.Printf("Error set ctrl msg: %v", err)
		}

		go recvPackets()
	}
	return nil
}

func recvPackets() {
	defer server.Close()

	for {
		buf := make([]byte, 1024)
		n, cm, src, err := server.ReadFrom(buf)
		if err != nil {
			log.Panicln(err)
			continue
		}

		// Filter packets based on currently selected interface's network addr
		source := src.(*net.UDPAddr)
		if currentAddr.Contains(source.IP) == false {
			continue
		}

		p, err := packet.Unmarshal(buf[:n])
		switch p.GetOpCode() {
		case code.OpDMX:
			pkt := p.(*packet.ArtDMXPacket)
			handleArtDMX(pkt, source, &cm.Dst)
		case code.OpPollReply:
			pkt := p.(*packet.ArtPollReplyPacket)
			handleArtPollReply(pkt, source)
		}
	}
}

func handleArtDMX(p *packet.ArtDMXPacket, source *net.UDPAddr, dest *net.IP) {
	// fmt.Println("received universe :", packet.SubUni, packet.Net)

	var destination string
	if dest.Equal(net.IPv4bcast) || dest.Equal(currentBcastAddr) {
		destination = "Broadcast"
	} else if dest.IsMulticast() {
		destination = "Multicast"
	} else {
		destination = "Unicast"
	}
	sourceIP := source.IP.String()

	uni := Universe{
		Protocol:    "artnet",
		Num:         uint16(p.Net<<16 | p.SubUni),
		Source:      sourceIP,
		Data:        p.Data,
		Destination: destination,
	}

	sourceName, ok := artnetNodes[sourceIP]
	if ok {
		uni.SourceName = sourceName
	}

	exist := false
	for i, u := range Universes {
		if u.Protocol == "artnet" && u.Num == uni.Num && u.Source == uni.Source {
			exist = true
			Universes[i].Update(uni)
			Universes[i].UpdateFPS()
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

func handleArtPollReply(p *packet.ArtPollReplyPacket, addr *net.UDPAddr) {
	// log.Println("Received ArtPollReply from %v", addr)
	sourceName := string(p.LongName[:])
	sourceName = strings.Trim(sourceName, "\x00") // remove trailing zeros from array

	sourceIP := addr.IP.String()
	artnetNodes[sourceIP] = sourceName
}

func RegisterArtnetCallback(name string, fn func(uuid.UUID)) {
	artnetCallbacks[name] = fn
}
