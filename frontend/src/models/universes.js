import { createStore } from "solid-js/store";
import { GetUniverses, GetUniverse, JoinUniverse } from '../../bindings/sacn-monitor/backend/dmxservice'
import { Events } from '@wailsio/runtime'
import { settings } from './settings.js'

export const [universes, setUniverses] = createStore({
  list: [],
  selected_key: null,
  selected: null,
  data: new Array(512).fill(0),
  selected_channel: null,
});

export const UniversesActions = {
  init: function() {
    Events.On("universes.new", () => this.get_universes());
    Events.On("universes.clear", () => this.clear_universes());
    Events.On("universe.data", (event) => {
      if (JSON.stringify(event.data) === JSON.stringify(universes.selected_key)) {
        this.get_data();
      }
    });
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
