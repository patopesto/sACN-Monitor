import { GetUniverses, GetUniverse, JoinUniverse } from '../../bindings/sacn-monitor/backend/dmxservice'
import { Universe, UniverseKey } from '../../bindings/sacn-monitor/backend/models'
import { Events } from '@wailsio/runtime'
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
    Events.On("universes.new", (event) => {
      // console.log("Event: universes.new")
      this.get_universes()
    })
    Events.On("universes.clear", () => {
      // console.log("Event: universes.clear")
      this.clear_universes()
    })
    this.callback_fn = callback
  },

  // Universe of interest
  selected_key: null,
  selected: null,
  data: [],
  select: function(key) {
    console.log("selecting ", key)
    this.selected_key = key
    this.get_data()
  },
  get_data: function() {
    const selected_key = this.selected_key
    if (!selected_key) return

    GetUniverse(selected_key).then((universe) => {
      this.selected = universe
      this.data = universe.data
      if (this.data_callback_fn) {
        this.data_callback_fn()
      }
    })
  },
  data_callback_fn: null,
  on_data_change: function(callback) {
    Events.On("universe.data", (event) => {
      if (JSON.stringify(event.data) === JSON.stringify(this.selected_key)) {
        this.get_data()
      }
    })
    this.data_callback_fn = callback
  },

  // Channel
  selected_channel: null,
  select_channel: function(channel) {
    this.selected_channel = channel
  },

}
