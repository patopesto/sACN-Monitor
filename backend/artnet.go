package dmx

import (
	"fmt"
	"log"
	"net"
	"strings"

	"github.com/jsimonetti/go-artnet/packet"
	"github.com/jsimonetti/go-artnet/packet/code"
	"github.com/libp2p/go-reuseport"
	"golang.org/x/net/ipv4"
)

var artnetNodes map[string]string

type artNetReceiver struct {
	service        *DMXService
	server         *ipv4.PacketConn
	localAddr      net.IPNet
	localBcastAddr net.IP
	stop           chan bool
}

func NewArtnetReceiver(iface NetInterface, service *DMXService) (*artNetReceiver, error) {
	log.Println("Init ArtNet receiver")

	if artnetNodes == nil {
		artnetNodes = make(map[string]string)
	}

	addr := fmt.Sprintf(":%d", packet.ArtNetPort)
	listener, err := reuseport.ListenPacket("udp4", addr)
	if err != nil {
		return nil, err
	}

	server := ipv4.NewPacketConn(listener)
	if err := server.SetControlMessage(ipv4.FlagDst, true); err != nil { // Enable receiving of destination address info
		log.Printf("Error SetControlMessage: %v", err)
	}

	_, ipNet, _ := net.ParseCIDR(iface.IPNet)
	localAddr := *ipNet

	r := &artNetReceiver{
		service:        service,
		server:         server,
		localAddr:      localAddr,
		localBcastAddr: GetBroadcastIP(localAddr.IP, localAddr.Mask),
		stop:           make(chan bool),
	}

	go r.recvPackets()

	return r, nil
}

func (r *artNetReceiver) Stop() {
	if r.stop != nil {
		close(r.stop)
	}
}

func (r *artNetReceiver) recvPackets() {
	defer r.server.Close()

	for {
		select {
		case <-r.stop:
			return
		default:
			buf := make([]byte, 1024)
			n, cm, src, err := r.server.ReadFrom(buf)
			if err != nil {
				log.Panicln(err)
				continue
			}

			// Filter packets based on currently selected interface's network addr
			source := src.(*net.UDPAddr)
			if r.localAddr.Contains(source.IP) == false {
				continue
			}
			var dest *net.IP = nil
			if cm != nil && cm.Dst != nil {
				dest = &cm.Dst
			}

			p, err := packet.Unmarshal(buf[:n])
			switch p.GetOpCode() {
			case code.OpDMX:
				pkt := p.(*packet.ArtDMXPacket)
				r.handleArtDMX(pkt, source, dest)
			case code.OpPollReply:
				pkt := p.(*packet.ArtPollReplyPacket)
				r.handleArtPollReply(pkt, source)
			}
		}
	}
}

func (r *artNetReceiver) handleArtDMX(p *packet.ArtDMXPacket, source *net.UDPAddr, dest *net.IP) {
	// fmt.Println("received universe :", packet.SubUni, packet.Net)

	destination := ""
	if dest != nil {
		if dest.Equal(net.IPv4bcast) || dest.Equal(r.localBcastAddr) {
			destination = "Broadcast"
		} else if dest.IsMulticast() {
			destination = "Multicast"
		} else {
			destination = "Unicast"
		}
	}
	sourceIP := source.IP.String()

	uni := Universe{
		Protocol:    "artnet",
		Num:         uint16(p.Net)<<8 | uint16(p.SubUni),
		Source:      sourceIP,
		Data:        p.Data,
		Destination: destination,
	}

	sourceName, ok := artnetNodes[sourceIP]
	if ok {
		uni.SourceName = sourceName
	}

	r.service.updateUniverse(uni)
}

func (r *artNetReceiver) handleArtPollReply(p *packet.ArtPollReplyPacket, addr *net.UDPAddr) {
	// log.Println("Received ArtPollReply from %v", addr)
	sourceName := string(p.LongName[:])
	sourceName = strings.Trim(sourceName, "\x00") // remove trailing zeros from array

	sourceIP := addr.IP.String()
	artnetNodes[sourceIP] = sourceName
}
