import { GetUniverses, GetUniverse, JoinUniverse } from '../../wailsjs/go/main/App'
// import { EventsOn } from '../../wailsjs/runtime/runtime'
import { Settings } from './settings.js'

export const Universes = {
  // All Universes
  list: [],
  get_list: function() {
    if (Settings.protocol === 'mixed') {
      return this.list
    }
    else {
      return this.list.filter((u) => {
        return u.protocol === Settings.protocol
      })
    }
  },
  get_universes: function() {
    GetUniverses().then((unis) => {
      if (unis == null) {
        return
      }
      let diff = unis.filter((u) => {
        return !this.list.some((v) => {
          return u.num === v.num && u.source === v.source
        })
      })
      this.list = unis.sort((a, b) => {
          return a.num - b.num
      })

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
  clear_universes: function() {
    this.list = []
    this.get_universes()
    this.data = []
    this.get_data()
    this.selected = null
  },

  callback_fn: null,
  on_change: function(callback) {
    window.runtime.EventsOn("universes.new", () => {
      // console.log("Event: universes.new")
      this.get_universes()
    })
    window.runtime.EventsOn("universes.clear", () => {
      // console.log("Event: universes.clear")
      this.clear_universes()
    })
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
    return this.list.find(u => u.id === this.selected)
  },
  get_data: function() {
    const selected = this.selected
    GetUniverse(selected).then((universe) => {
      this.data = universe.data
      const index = this.list.findIndex(u => u.id === selected)
      if (index >= 0) {
        this.list[index] = universe
      }
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
    })
    this.data_callback_fn = callback
  },

  // Channel
  selected_channel: null,
  select_channel: function(channel) {
    this.selected_channel = channel
  },

}