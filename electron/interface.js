const { networkInterfaces } = require('os');

const interface_selected = {
    name: "",
    ip: undefined,
};
var interface_cb = null;


function select_interface(name, ip) {
    console.log("Selected interface", name, ip);
    selectedInterface = {
        name: name,
        ip: ip,
    };
    if (interface_cb) {
        interface_cb(selectedInterface);
    }
}


function get_interfaces() {
    const v4ifaces = {}
    const interfaces = networkInterfaces();

    for (const name in interfaces) {
        v4ifaces[name] = interfaces[name].filter((iface) => {
            return iface.family === 'IPv4' && iface.internal != true;
        });
        if (v4ifaces[name].length === 0) {
            delete v4ifaces[name];
        }
    }

    return v4ifaces;
};



module.exports = {
    get: get_interfaces,
    select: select_interface,
    selected: interface_selected,
    on_change: function(callback) { interface_cb = callback },
}