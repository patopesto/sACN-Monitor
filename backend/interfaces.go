package dmx

import (
	"fmt"
	"log"
	"net"
)

type Interface struct {
	Name   string `json:"name"`
	IP     string `json:"ip"`
	Active bool   `json:"active"`
	itf    net.Interface
}

func (i Interface) String() string {
	return fmt.Sprintf("%v : %s", i.Name, i.IP)
}

var Interfaces []Interface

func GetInterfaces() []Interface {
	if Interfaces == nil { // Init master list the first time
		Interfaces = make([]Interface, 0)
	}

	ifaces, err := net.Interfaces()
	if err != nil {
		log.Println(err)
		return nil
	}
	for _, iface := range ifaces {
		switch {
		case iface.Flags&net.FlagUp == 0:
			continue // Ignore interfaces that are down
		case iface.Flags&net.FlagLoopback != 0:
			continue // Ignore loopback interfaces
		case iface.Flags&net.FlagMulticast == 0:
			continue // Ignore non-multicast interfaces
		case iface.Flags&net.FlagPointToPoint != 0:
			continue // Ignore point-to-point interfaces
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
					itf := Interface{
						Name: iface.Name,
						IP:   v.IP.String(),
						itf:  iface,
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
