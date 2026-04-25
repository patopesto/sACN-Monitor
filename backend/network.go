package dmx

import (
	"context"
	"encoding/binary"
	"fmt"
	"log"
	"net"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type NetInterface struct {
	Name   string `json:"name"`
	IP     string `json:"ip"`
	IPNet  string `json:"ipnet"`
	Active bool   `json:"active"`
}

func (i NetInterface) String() string {
	return fmt.Sprintf("%v : %s", i.Name, i.IPNet)
}

type NetworkService struct {
	app        *application.App
	interfaces []NetInterface
}

func NewNetworkService(app *application.App) *NetworkService {
	return &NetworkService{
		app:        app,
		interfaces: make([]NetInterface, 0),
	}
}

func (n *NetworkService) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	n.updateInterfaces()
	if len(n.interfaces) > 0 {
		n.SetInterface(n.interfaces[0])
	}
	return nil
}

func (n *NetworkService) GetInterfaces() []NetInterface {
	n.updateInterfaces()
	return n.interfaces
}

func (n *NetworkService) SetInterface(itf NetInterface) {
	n.app.Event.Emit("interface.selected", itf)
}

func (n *NetworkService) updateInterfaces() {
	ifaces, err := net.Interfaces()
	if err != nil {
		log.Println(err)
		return
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
						Name:  iface.Name,
						IP:    v.IP.String(),
						IPNet: v.String(),
					}
					// fmt.Printf("%v : %s\n", itf.Name, itf.IP)
					found := false
					for _, i := range n.interfaces {
						if i.Name == itf.Name && i.IP == itf.IP {
							found = true
						}
					}
					if found == false {
						n.interfaces = append(n.interfaces, itf)
					}
				}
			}
		}
	}

	log.Println("Interfaces found:")
	for _, itf := range n.interfaces {
		log.Println(itf)
	}
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
