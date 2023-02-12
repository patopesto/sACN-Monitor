const { Receiver } = require('sacn');

const receivers = {};
var packet_cb = null;

const NUM_UNIVERSES = 512;
const universes = [];


function init() {
    // hack to listen for multiple universes
    for (let i = 1; i < NUM_UNIVERSES; i++) {
        universes.push(i);
    }
}


function init_receiver(iface) {

    console.log("Init receiver for", iface.name, iface.ip);

    const receiver = new Receiver({
        universes: universes,
        reuseAddr: true,
        iface: iface.ip,
    });

    receiver.on('packet', (packet) => {
        if (packet_cb) {
            packet_cb(packet);
        }
    })

    receivers[iface.name] = receiver;

}


function close_receiver(iface) {

    if (receivers[iface.name] !== undefined) {
        console.log("Closing receiver for", iface.name);
        receivers[iface.name].close();
        delete receivers[iface.name];
    }
}



module.exports = {
    init: init,
    init_receiver: init_receiver,
    close_receiver: close_receiver,
    on_packet: function(callback) { packet_cb = callback },
}