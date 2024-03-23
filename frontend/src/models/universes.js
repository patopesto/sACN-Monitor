import { GetUniverses, GetUniverseData, JoinUniverse } from '../../wailsjs/go/main/App'
// import { EventsOn } from '../../wailsjs/runtime/runtime';
import { Settings } from './settings.js'

export const Universes = {
  // All Universes
  list: [],
  get_list: function() {
    if (Settings.protocol === 'mixed') {
      return this.list;
    }
    else {
      return this.list.filter((u) => {
        return u.protocol === Settings.protocol;
      });
    }
  },
  get_universes: function() {
    GetUniverses().then((unis) => {
      if (unis == null) {
        return
      }
      let diff = unis.filter((u) => {
        return !this.list.some((v) => {
          return u.num === v.num && u.source === v.source;
        });
      })
      this.list = unis.sort((a, b) => {
          return a.num - b.num;
      });
      // console.log(this.list)

      if (diff.length > 0) {
        if (this.callback_fn) {
          this.callback_fn()
        }
      }
    })
  },
  join_universe: function(uni) {
    console.log(uni)
    JoinUniverse(uni)
  },

  callback_fn: null,
  on_change: function(callback) {
    window.runtime.EventsOn("universes.new", () => {
      // console.log("Event: universes.new")
      this.get_universes()
    });
    this.callback_fn = callback
  },

  // Universe of interest
  selected: null,
  data: [],
  select: function(id) {
    console.log("selecting ", id)
    this.selected = id
    this.get_data()
  },
  get_selected: function() {
    return this.list.find(u => u.id === this.selected);
  },
  get_data: function() {
    GetUniverseData(this.selected).then((data) => {
      this.data = data
      if (this.data_callback_fn) {
        this.data_callback_fn()
      }
    })
  },
  data_callback_fn: null,
  on_data_change: function(callback) {
    window.runtime.EventsOn("universe.data", () => {
      // console.log("Event: universe.data")
      this.get_data()
    });
    this.data_callback_fn = callback
  },

  // Channel
  selected_channel: null,
  select_channel: function(channel) {
    this.selected_channel = channel
  },

}