package dmx

import (
	"fmt"
	"log"
	"net"
)

type Interface struct {
	Name string `json:"name"`
	IP   string `json:"ip"`
	itf  net.Interface
}

func (i Interface) String() string {
	return fmt.Sprintf("%v : %s", i.Name, i.IP)
}

func GetInterfaces() []Interface {
	interfaces := make([]Interface, 0)

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
					interfaces = append(interfaces, itf)
					// fmt.Printf("%v : %s\n", itf.Name, itf.IP)
				}
			}
		}
	}

	log.Println("Interfaces found:")
	for _, itf := range interfaces {
		log.Println(itf)
	}

	return interfaces
}
