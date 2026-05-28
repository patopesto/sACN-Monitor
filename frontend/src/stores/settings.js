import { createStore } from "solid-js/store";
import { Events, Window } from '@wailsio/runtime'
import { GetInterfaces, SetInterface } from '../../bindings/sacn-monitor/backend/networkservice'

export const [settings, setSettings] = createStore({
  protocol: 'sacn',
  view: 'channels',
  theme: 'cyan',
  interfaces: [],
  selected_interface: null,

  sidebar: {
    left: true,
    right: true,
  },
  modal: false,
})

let listeners = [];

export const SettingsActions = {
  init: async function() {
    this.get_interfaces()
    const window_name = await Window.Name()
    console.log("Hello from window:", window_name)

    listeners.push(Events.On("protocol.selected", (event) => {
      this.set_protocol(event.data)
    }))
    listeners.push(Events.On("view.selected", (event) => {
      this.set_view(event.data)
    }))
    listeners.push(Events.On("interface.selected", (event) => {
      this.on_interface_selected(event.data)
    }))
    listeners.push(Events.On("sidebar.left.toggle", (event) => {
      if (event.sender == window_name) {
        this.toggle_sidebar("left")
      }
    }))
    listeners.push(Events.On("sidebar.right.toggle", (event) => {
      if (event.sender == window_name) {
        this.toggle_sidebar("right")
      }
    }))
    listeners.push(Events.On("universe.add", (event) => {
      if (event.sender == window_name) {
        this.set_modal(true)
      }
    }))
  },

  cleanup: function() {
    listeners.forEach(unsub => unsub())
    listeners = []
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

  set_sidebar(side, state) {
    setSettings("sidebar", { [side]: state });
  },

  toggle_sidebar(side) {
    setSettings("sidebar", { [side]: !settings.sidebar[side] })
  },

  set_modal(state) {
    console.log("Set modal to ", state);
    setSettings("modal", state);
  }
};
