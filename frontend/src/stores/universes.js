import { createStore } from "solid-js/store";
import { Events, Window } from '@wailsio/runtime'
import { GetUniverses, GetUniverse, JoinUniverse } from '../../bindings/sacn-monitor/backend/dmxservice'
import { OpenNewWindowWithUniverse, GetPendingUniverse } from '../../bindings/sacn-monitor/appservice.js';
import { settings, SettingsActions } from './settings.js'

export const [universes, setUniverses] = createStore({
  list: [],
  selected_key: null,
  selected_channel: null,
  data: new Array(512).fill(0),
})

let listeners = [];

export const UniversesActions = {
  init: async function() {
    listeners.push(Events.On("universes.new", () => this.get_universes()))
    listeners.push(Events.On("universes.clear", () => this.clear_universes()))
    listeners.push(Events.On("universe.data", (event) => {
      if (JSON.stringify(event.data) === JSON.stringify(universes.selected_key)) {
        this.get_data()
      }
    }))

    try {
      const universe = await GetPendingUniverse()
      if (universe && !universes.selected_key) {
        console.log("New window: selecting universe", universe)
        this.select_universe(universe)
        SettingsActions.set_protocol(universe.protocol)
      }
    } 
    catch (e) {
      console.error("Failed to get pending universe from backend:", e)
    }
  },

  cleanup: function() {
    listeners.forEach(unsub => unsub())
    listeners = []
  },

  get_list: function() {
    if (settings.protocol === 'mixed') {
      return universes.list;
    } else {
      return universes.list.filter((u) => u.protocol === settings.protocol);
    }
  },
  
  get_universes: async function() {
    const unis = await GetUniverses();
    if (!unis) return;
    
    const sorted = [...unis].sort((a, b) => a.num - b.num);
    setUniverses("list", sorted);
  },
  
  join_universe: function(uni) {
    JoinUniverse(uni);
  },
  
  clear_universes: async function() {
    setUniverses({ 
      list: [], 
      data: new Array(512).fill(0), 
      selected: null, 
      selected_key: null 
    });
    await this.get_universes();
    await this.get_data();
  },

  select_universe: async function(key) {
    setUniverses("selected_key", key);
    await this.get_data();
    let title = "";
    if (key.protocol == "artnet") title += "ArtNet"; 
    if (key.protocol == "sacn") title += "sACN"; 
    title += ` ${key.num}`
    await Window.SetTitle(title)
  },

  open_new_window(key) {
    OpenNewWindowWithUniverse(key);
  },

  get_data: async function() {
    const key = universes.selected_key;
    if (!key) return;
    
    const universe = await GetUniverse(key);
    setUniverses({
      selected: universe,
      data: universe.data
    });
  },

  select_channel: function(channel) {
    setUniverses("selected_channel", channel);
  },
};
