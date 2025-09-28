package dmx

import (
	"encoding/binary"
	"fmt"
	"log"
	"net"
)

type NetInterface struct {
	Name   string `json:"name"`
	IP     string `json:"ip"`
	Active bool   `json:"active"`
	itf    net.Interface
	addr   net.IPNet
}

func (i NetInterface) String() string {
	return fmt.Sprintf("%v : %s", i.Name, i.IP)
}

var Interfaces []NetInterface

func GetInterfaces() []NetInterface {
	if Interfaces == nil { // Init master list the first time
		Interfaces = make([]NetInterface, 0)
	}

	ifaces, err := net.Interfaces()
	if err != nil {
		log.Println(err)
		return nil
	}
	for _, iface := range ifaces {
		switch {
		case iface.Flags&net.FlagUp == 0:
			continue // Ignore NetInterfaces that are down
		case iface.Flags&net.FlagLoopback != 0:
			continue // Ignore loopback NetInterfaces
		case iface.Flags&net.FlagMulticast == 0:
			continue // Ignore non-multicast NetInterfaces
		case iface.Flags&net.FlagPointToPoint != 0:
			continue // Ignore point-to-point NetInterfaces
		}

		addrs, err := iface.Addrs()
		if err != nil {
			fmt.Println(err)
			continue
		}
		for _, a := range addrs {
			switch v := a.(type) {
			case *net.IPNet:
				if v.IP.To4() != nil { // Only IPv4 for now
					itf := NetInterface{
						Name: iface.Name,
						IP:   v.IP.String(),
						itf:  iface,
						addr: *v,
					}
					// fmt.Printf("%v : %s\n", itf.Name, itf.IP)
					found := false
					for _, i := range Interfaces {
						if i.Name == itf.Name && i.IP == itf.IP {
							found = true
						}
					}
					if found == false {
						Interfaces = append(Interfaces, itf)
					}
				}
			}
		}
	}

	log.Println("Interfaces found:")
	for _, itf := range Interfaces {
		log.Println(itf)
	}

	return Interfaces
}

// IP utility functions
func GetBroadcastIP(ip net.IP, mask net.IPMask) net.IP {
	ip4 := ip.To4()
	if ip4 == nil || len(mask) != net.IPv4len {
		return nil
	}

	ipInt := binary.BigEndian.Uint32(ip4)
	maskInt := binary.BigEndian.Uint32(mask)

	broadcastInt := ipInt | ^maskInt

	bcstIP := make(net.IP, net.IPv4len)
	binary.BigEndian.PutUint32(bcstIP, broadcastInt)
	return bcstIP
}
