const { Receiver, DiscoveryReceiver } = require('sacn');

var receiver = null;
var receiver_iface = {};
var discovery_receiver = null;
var packet_cb = null;

// Number of universes to statically create receivers for (if the senders do not implement sACN discovery)
const NUM_UNIVERSES = 20;
const DISCOVERY_INTERVAL = 10; // in seconds
var universes = [];

function init(iface) {
    // hack to immediately start listening for common used universes
    for (let i = 1; i < NUM_UNIVERSES; i++) {
        if (universes.includes(i) == false) {
            universes.push(i);
        }
    }

    console.log("Init discovery on", iface.name, iface.ip);

    discovery_receiver = new DiscoveryReceiver({
        reuseAddr: true,
        iface: iface.ip,
    });

    // Add receivers for universes when new source is detected
    discovery_receiver.on('sourceDetected', (source) => {
        console.log("sourceDetected", source.sourceName, source.sourceAddress);
        const unis = get_discovery_universes(source);
        add_universes(unis);
    })

    // Remove universes from receiver when source disconnects
    discovery_receiver.on('sourceTimeout', (source) => {
        console.log("sourceTimeout", source.sourceName, source.sourceAddress);
        const unis = get_discovery_universes(source);
        remove_universes(unis);
    })

    // Check all discovered sources and their advertised universes periodically
    setInterval(() => {
        var unis = [];
        console.log("checking sources");
        for (let s in discovery_receiver.sources) {
            const source = discovery_receiver.sources[s];
            const source_unis = get_discovery_universes(source);
            unis = unis.concat(source_unis);
        }
        add_universes(unis);

    }, DISCOVERY_INTERVAL * 1000);

}


function get_discovery_universes(source) {
    const unis = [];
    for (let i in source.pages) {
        for (let j in source.pages[i]) {
            unis.push(source.pages[i][j]);
        }
    }
    return unis;
}


function init_receiver(iface) {

    console.log("Init receiver on", iface.name, iface.ip);

    receiver = new Receiver({
        universes: universes,
        reuseAddr: true,
        iface: iface.ip,
    });

    receiver.on('packet', (packet) => {
        console.log("new packet for universe", packet.universe);
        if (packet_cb) {
            packet_cb(packet);
        }
    });

    receiver.on('PacketCorruption', (err) => {
        console.log("PacketCorruption", err);
    });

    receiver.on('PacketOutOfOrder', (err) => {
        console.log("PacketOutOfOrder", err);
    });

    receiver.on('error', (err) => {
        console.log("error", err);
    });

    receiver_iface = iface;

}


function close_receiver() {

    if (receiver !== null) {
        receiver.close();
        receiver = null;
    }
}


function add_universes(unis) {

    unis.forEach(uni => {
        if (universes.includes(uni) == false) {
            universes.push(uni);
        }
    });

    // For whatever reason, doing receiver.addUniverse lead to new universe packet never being received
    // for this reason, the receiver is destroyed and recreated immediately with all new universe list

    close_receiver();
    init_receiver(receiver_iface);
}


function remove_universes(unis) {

    const del_universes = [];
    unis.forEach(uni => {
        if (universes.includes(uni) == true) {
            const index = universes.indexOf(uni);
            del_universes.push(uni)
            universes.splice(index, 1);
        }
    })

    console.log("Deleting following universes from receiver", del_universes);

    for (const uni of del_universes) {
        receiver.removeUniverse(uni);
    }
}



module.exports = {
    init: init,
    init_receiver: init_receiver,
    close_receiver: close_receiver,
    on_packet: function(callback) { packet_cb = callback },
}