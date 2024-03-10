package dmx

import (
    "fmt"
    "net"
    "log"

    "gitlab.com/patopest/go-sacn"
    "gitlab.com/patopest/go-sacn/packet"
    "github.com/google/uuid"
)


var receiver *sacn.Receiver 
var sacnCallbacks map[string]func(uuid.UUID)
var discoveredUniverses map[uint16]bool


func InitSACNReceiver() {
    log.Println("Init sACN receiver")

    sacnCallbacks = make(map[string]func(uuid.UUID))
    discoveredUniverses = make(map[uint16]bool)

    itf, _ := net.InterfaceByName("en0") // specific to your machine
    receiver = sacn.NewReceiver(itf)
    receiver.JoinUniverse(sacn.DISCOVERY_UNIVERSE)
    receiver.JoinUniverse(1)
    receiver.RegisterPacketCallback(packet.PacketTypeDiscovery, discoveryPacketCallback)
    receiver.RegisterPacketCallback(packet.PacketTypeData, dataPacketCallback)
    receiver.Start()
}

func discoveryPacketCallback(p packet.SACNPacket, source string) {
    d, ok := p.(*packet.DiscoveryPacket)
    if ok == false {
        return
    }

    fmt.Printf("Discovered universes from %s:\n", string(d.SourceName[:]))
    for i := 0; i < d.GetNumUniverses(); i++ {
        var universe = d.Universes[i]
        _, exists := discoveredUniverses[universe]
        if !exists {
            log.Printf("Joining universe: %d\n", universe)
            receiver.JoinUniverse(universe)
            discoveredUniverses[universe] = true
        }
    }
}

func dataPacketCallback(p packet.SACNPacket, source string) {
    d, ok := p.(*packet.DataPacket)
    if ok == false {
        return
    }
    log.Printf("Received Data Packet for universe %d from %s\n", d.Universe, source)

    uni := Universe {
        Protocol: "sacn",
        Num: d.Universe,
        Source: source, 
    }
    copy(uni.data[:], d.Data[1:]) // skip zero-start value

    exist := false
    for i, u := range Universes {
        if u.Protocol == "sacn" && u.Num == uni.Num && u.Source == uni.Source {
            exist = true
            Universes[i].data = uni.data // copy array in original struct
            callback := sacnCallbacks["data"]
            if callback != nil {
                callback(u.Id)
            }
            break
        }
    }
    if (exist == false) {
        uni.Id = uuid.New()
        Universes = append(Universes, uni)
        callback := sacnCallbacks["universe"]
        if callback != nil {
            callback(uni.Id)
        }
    }
}

func RegisterSACNCallback(name string, fn func(uuid.UUID)) {
    sacnCallbacks[name] = fn
}
