import { createStore } from "solid-js/store";
import { Events } from '@wailsio/runtime'
import { GetInterfaces, SetInterface } from '../../bindings/sacn-monitor/backend/networkservice'

export const [settings, setSettings] = createStore({
  protocol: 'sacn',
  view: 'channels',
  interfaces: [],
  selected_interface: undefined,
  theme: "cyan",
});

export const SettingsActions = {
  init: function() {
    this.get_interfaces();

    Events.On("interface.selected", (event) => {
      this.on_interface_selected(event.data);
    });
  },

  set_protocol: function(protocol) {
    console.log("Setting protocol to", protocol);
    setSettings("protocol", protocol);
  },

  set_view: function(view) {
    setSettings("view", view);
  },

  set_theme: function(theme) {
    setSettings("theme", theme);
  },

  get_interfaces: async function() {
    const list = await GetInterfaces();
    const selected = list.find(i => i.active === true);
    
    setSettings("interfaces", list);    
    if (selected) {
      setSettings('selected_interface', selected);
    }
  },

  set_interface: async function(itf) {
    if (!itf) {
      return;
    }
    
    console.log("Setting interface to", itf);
    setSettings("selected_interface", itf);
    await SetInterface(itf);
  },

  on_interface_selected: function(itf) {
    console.log("Interface selected event received:", itf);
    setSettings("selected_interface", itf);
  },
};
