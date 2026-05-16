package main

import (
	"flag"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net"
	"time"

	artnetpacket "github.com/jsimonetti/go-artnet/packet"
	"gitlab.com/patopest/go-sacn"
	sacnpacket "gitlab.com/patopest/go-sacn/packet"
)

// dmxGenerator is a function that fills a 512-byte DMX slice.
// count increments every tick. tick is the current time.
type dmxGenerator func(data []byte, count int, tick time.Time)

var universes = []struct {
	num       uint16
	mode      string
	priority  uint8
	generator dmxGenerator
}{
	{
		num:       0, // available in artnet, not in sacn
		mode:      "broadcast",
		generator: generateRamp,
	},
	{
		num:       1,
		mode:      "unicast",
		generator: generateRandom,
	},
	{
		num:       2,
		mode:      "broadcast",
		generator: generateSineWave,
	},
	{
		num:       3,
		mode:      "unicast",
		generator: generateChase,
	},
	{
		num:       4,
		mode:      "broadcast",
		generator: generateFadeAll,
	},
	{
		num:       5,
		mode:      "broadcast",
		generator: generateRGBChase,
	},
	{
		num:       6,
		mode:      "broadcast",
		generator: generateCheckerboard,
	},
	{
		num:       7,
		mode:      "broadcast",
		generator: generateRandomHold,
	},
	{
		num:       8,
		mode:      "broadcast",
		generator: generatePulse,
	},
	{
		num:       9,
		mode:      "broadcast",
		generator: generateStep,
	},
	{
		num:       10,
		mode:      "broadcast",
		priority:  200,
		generator: generateAllOn,
	},
	{
		num:       223,
		mode:      "unicast",
		generator: generateAudioSim,
	},
	{
		num:       255,
		mode:      "broadcast",
		generator: generateAllOn,
	},
	{
		num:       256,
		mode:      "broadcast",
		generator: generateAllOff,
	},
	{
		num:       3047,
		mode:      "unicast",
		generator: generateBarcode,
	},
	{
		num:       4095,
		mode:      "broadcast",
		generator: generateRamp,
	},
	{
		num:       4096,
		mode:      "unicast",
		generator: generateAllOff,
	},
	{
		num:       32767, // max artnet universe number
		mode:      "broadcast",
		generator: generatePerlinNoise,
	},
	{
		num:       63999, // max sacn universe number
		mode:      "broadcast",
		generator: generateAllOn,
	},
}

// ----- Generators -----

// generateRamp creates a diagonal ramp pattern that shifts over time.
func generateRamp(data []byte, count int, tick time.Time) {
	for i := 0; i < len(data); i++ {
		data[i] = byte((i + count) % 256)
	}
}

// generateRandom sets each channel to a random value every tick.
func generateRandom(data []byte, count int, tick time.Time) {
	for i := 0; i < len(data); i++ {
		data[i] = byte(rand.Intn(256))
	}
}

// generateSineWave creates a smooth sine wave across channels with time animation.
func generateSineWave(data []byte, count int, tick time.Time) {
	for i := 0; i < len(data); i++ {
		// Period of ~63 channels, animated by count
		v := math.Sin(float64(i)*0.1 + float64(count)*0.2)
		// Map -1..1 to 0..255
		data[i] = byte((v + 1.0) * 127.5)
	}
}

// generateChase creates a moving single-channel chase.
func generateChase(data []byte, count int, tick time.Time) {
	for i := 0; i < len(data); i++ {
		data[i] = 0
	}
	pos := count % len(data)
	data[pos] = 255
}

// generateAllOn sets all channels to maximum.
func generateAllOn(data []byte, count int, tick time.Time) {
	for i := 0; i < len(data); i++ {
		data[i] = 255
	}
}

// generateAllOff sets all channels to zero.
func generateAllOff(data []byte, count int, tick time.Time) {
	for i := 0; i < len(data); i++ {
		data[i] = 0
	}
}

// generateStrobe creates rapid on/off blinking of all channels.
func generateStrobe(data []byte, count int, tick time.Time) {
	var v byte
	if count%2 == 0 {
		v = 255
	} else {
		v = 0
	}
	for i := 0; i < len(data); i++ {
		data[i] = v
	}
}

// generateBarcode creates fixed-width bars of alternating intensity.
func generateBarcode(data []byte, count int, tick time.Time) {
	barWidth := 8
	for i := 0; i < len(data); i++ {
		if (i/barWidth)%2 == 0 {
			r := rand.New(rand.NewSource(int64(i)))
			data[i] = byte(r.Intn(256))
		} else {
			data[i] = 0
		}
	}
}

func fract(x float64) float64 {
	return x - math.Floor(x)
}

func valueNoise(x float64) float64 {
	i := math.Floor(x)
	f := fract(x)
	// Smoothstep interpolation
	f = f * f * (3 - 2*f)

	a := fract(math.Sin(i*12.9898) * 43758.5453)
	b := fract(math.Sin((i+1)*12.9898) * 43758.5453)

	return a + (b-a)*f
}

// generatePerlinNoise creates smooth coherent noise across channels.
func generatePerlinNoise(data []byte, count int, tick time.Time) {
	for i := 0; i < len(data); i++ {
		x := float64(i)*0.03 + float64(count)*0.05
		v := valueNoise(x) + 0.5*valueNoise(x*2) + 0.25*valueNoise(x*4)
		v = v / 1.75
		if v < 0 {
			v = 0
		}
		if v > 1 {
			v = 1
		}
		data[i] = byte(v * 255)
	}
}

// generateAudioSim simulates an audio spectrum: low channels = bass, high = treble.
func generateAudioSim(data []byte, count int, tick time.Time) {
	for i := 0; i < len(data); i++ {
		t := float64(count)
		freq := float64(i) / 512.0 // 0..1 across channels
		// Bass: slow wave, stronger on low channels
		bass := math.Sin(t*0.1) * (1.0 - freq) * 255
		// Treble: faster wave, stronger on high channels
		treble := math.Sin(t*0.5+float64(i)*0.2) * freq * 255
		v := bass + treble + 20 // small base level
		if v < 0 {
			v = 0
		}
		if v > 255 {
			v = 255
		}
		data[i] = byte(v)
	}
}

// generateFadeAll fades all channels up and down together using a sine wave.
func generateFadeAll(data []byte, count int, tick time.Time) {
	v := byte((math.Sin(float64(count)*0.2) + 1.0) * 127.5)
	for i := 0; i < len(data); i++ {
		data[i] = v
	}
}

// generateRGBChase lights groups of 3 channels as RGB fixtures cycling colors.
func generateRGBChase(data []byte, count int, tick time.Time) {
	for i := 0; i < len(data); i++ {
		data[i] = 0
	}
	group := 3
	numGroups := len(data) / group
	pos := count % numGroups
	for g := 0; g < 8; g++ {
		idx := ((pos + g) % numGroups) * group
		phase := float64(count)*0.15 + float64(g)*0.5
		if idx < len(data) {
			data[idx] = byte((math.Sin(phase) + 1) * 127.5) // R
		}
		if idx+1 < len(data) {
			data[idx+1] = byte((math.Sin(phase+2.1) + 1) * 127.5) // G
		}
		if idx+2 < len(data) {
			data[idx+2] = byte((math.Sin(phase+4.2) + 1) * 127.5) // B
		}
	}
}

// generateCheckerboard creates alternating on/off blocks every N channels.
func generateCheckerboard(data []byte, count int, tick time.Time) {
	blockSize := 1
	for i := 0; i < len(data); i++ {
		if (i/blockSize)%2 == 0 {
			data[i] = 255
		} else {
			data[i] = 0
		}
	}
}

// generateRandomHold picks random values and holds them for N ticks before changing.
func generateRandomHold(data []byte, count int, tick time.Time) {
	holdTicks := 3
	seed := count / holdTicks
	r := rand.New(rand.NewSource(int64(seed)))
	for i := 0; i < len(data); i++ {
		data[i] = byte(r.Intn(256))
	}
}

// generatePulse sends a bright pulse across channels with a fading tail.
func generatePulse(data []byte, count int, tick time.Time) {
	for i := 0; i < len(data); i++ {
		data[i] = 0
	}
	pos := count % len(data)
	for i := 0; i < len(data); i++ {
		dist := math.Abs(float64(i - pos))
		if dist < 20 {
			v := 255 * (1.0 - dist/20.0)
			data[i] = byte(v)
		}
	}
}

// generateStep creates a stair-step pattern with discrete levels every N channels.
func generateStep(data []byte, count int, tick time.Time) {
	stepSize := 20
	levels := 256 / stepSize // 8 levels
	for i := 0; i < len(data); i++ {
		step := (i / stepSize) % levels
		data[i] = byte(step * stepSize)
	}
}

// ----- Program -----

func main() {
	var localIP string
	var destinationIP string
	var interval uint

	flag.StringVar(&localIP, "local", "192.168.1.46", "Local interface IP address")
	flag.StringVar(&destinationIP, "dest", "192.168.1.46", "Unicast destination IP address")
	flag.UintVar(&interval, "interval", 1000, "Tick interval between data sends, in milliseconds")
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

	ticker := time.NewTicker(time.Duration(interval) * time.Millisecond)
	count := 0

	for range ticker.C {
		count++
		tick := time.Now()

		for _, u := range universes {
			var dmxData [512]byte
			if u.generator != nil {
				u.generator(dmxData[:], count, tick)
			}

			// sACN
			p1 := sacnpacket.NewDataPacket()
			p1.Universe = u.num
			p1.Sequence = uint8(count)
			p1.Priority = u.priority
			p1.SetData(dmxData[:])
			if err := sacnSender.Send(u.num, p1); err != nil {
				fmt.Printf("sACN Error: %v\n", err)
			}

			// ArtNet
			p2 := &artnetpacket.ArtDMXPacket{
				Sequence: uint8(count),
				SubUni:   uint8(u.num & 0xFF),
				Net:      uint8(u.num >> 8 & 0x7F),
				Data:     dmxData,
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
