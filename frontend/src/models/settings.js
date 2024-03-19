import { GetInterfaces, SetInterface } from '../../wailsjs/go/main/App'

export const Settings = {

  // Protocol filter
  protocol: 'sacn',
  set_protocol: function(protocol) {
    console.log("Setting protocol:", protocol)
    this.protocol = protocol
  },

  // Interfaces
  interfaces: [],
  get_interfaces: function() {
    GetInterfaces().then((list) => {
      console.log(list)
      this.interfaces = list
    })
  },
  set_interface: function(itf) {
    for (const i of this.interfaces) {
      if (i.name == itf.name) {
        i.active = true
      }
      else {
        i.active = false
      }
    }
    SetInterface(itf)
  },

  // Opacity
  // opacity: 50,
  // set_opacity: function(opacity) {
  //   console.log("Setting opacity:", opacity)
  //   this.opacity = opacity
  // },

  // Theme
  theme: "cyan",
  set_theme: function(theme) {
    console.log("Setting theme:", theme)
    this.theme = theme
  },
}