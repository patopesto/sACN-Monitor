package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"time"

	"gitlab.com/patopest/go-sacn"
	sacnpacket "gitlab.com/patopest/go-sacn/packet"
	artnetpacket "github.com/jsimonetti/go-artnet/packet"
)

var universes = []struct {
	num uint16
	mode string
	priority uint8
}{
	{
		num: 0, // available in artnet, not in sacn
		mode: "broadcast",
	},
	{
		num: 1,
		mode: "unicast",
	},
	{
		num: 2,
		mode: "broadcast",
	},
	{
		num: 3,
		mode: "unicast",
	},
	{
		num: 10,
		mode: "broadcast",
		priority: 200,
	},
	{
		num: 223,
		mode: "unicast",
	},
	{
		num: 256,
		mode: "broadcast",
	},
	{
		num: 3047,
		mode: "unicast",
	},
	{
		num: 32767, // max artnet universe nunber
		mode: "broadcast",
	},
	{
		num: 63999, // max sacn universe number
		mode: "broadcast",
	},
}

func main() {
	var localIP string
	var destinationIP string

	flag.StringVar(&localIP, "local", "192.168.1.46", "Local interface IP address")
	flag.StringVar(&destinationIP, "dest", "192.168.1.46", "Unicast destination IP address")
	flag.Parse()

	broadcastIP := "255.255.255.255"

	fmt.Printf("Starting DMX Data Generator...\n")
	fmt.Printf("Local IP: %s\n", localIP)
	fmt.Printf("Destination IP: %s\n", destinationIP)

	// sACN Sender
	fmt.Println("Setting up sACN")
	sacnSender, err := sacn.NewSender(localIP, &sacn.SenderOptions{
		SourceName: "Test sACN Generator",
	})
	if err != nil {
		log.Fatal(err)
	}

	for _, u := range universes {
		sacnSender.StartUniverse(u.num)
		if u.mode == "broadcast" {
			sacnSender.SetMulticast(u.num, true)
		} else {
			sacnSender.AddDestination(u.num, destinationIP)
		}
	}

	// ArtNet Controller
	fmt.Println("Setting up ArtNet")
	src := fmt.Sprintf("%s:", localIP)
	localAddr, _ := net.ResolveUDPAddr("udp", src)

	artnetConn, err := net.ListenUDP("udp", localAddr)
	if err != nil {
		log.Fatal(err)
	}

	dmxDataRaw := make([]byte, 512)
	ticker := time.NewTicker(1000 * time.Millisecond)
	count := 0

	for range ticker.C {
		count++
		for i := 0; i < 512; i++ {
			dmxDataRaw[i] = byte((i + count) % 256)
		}

		var dmxArray [512]byte
		copy(dmxArray[:], dmxDataRaw)

		for _, u := range universes {
			// sACN
			p1 := sacnpacket.NewDataPacket()
			p1.Universe = u.num
			p1.Sequence = uint8(count)
			p1.Priority = u.priority
			p1.SetData(dmxDataRaw)
			if err := sacnSender.Send(u.num, p1); err != nil {
				fmt.Printf("sACN Error: %v\n", err)
			}

			// ArtNet
			p2 := &artnetpacket.ArtDMXPacket{
				Sequence: uint8(count),
				SubUni:   uint8(u.num & 0xFF),
				Net:      uint8(u.num >> 8 & 0x7F),
				Data:     dmxArray,
			}
			b2, err := p2.MarshalBinary()

			var dst string
			if u.mode == "unicast" {
				dst = fmt.Sprintf("%s:%d", destinationIP, artnetpacket.ArtNetPort)
			} else {
				dst = fmt.Sprintf("%s:%d", broadcastIP, artnetpacket.ArtNetPort)
			}
			node, _ := net.ResolveUDPAddr("udp", dst)

			_, err = artnetConn.WriteTo(b2, node)
			if err != nil {
				log.Printf("Error writing artnet packet: %v\n", err)
			}
		}

		if count%25 == 0 {
			fmt.Printf("Sent packet batch %d\n", count/25)
		}
	}
}
