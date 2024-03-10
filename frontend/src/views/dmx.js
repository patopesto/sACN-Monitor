import m from "mithril";
import { twMerge } from "tailwind-merge";

import { GetUniverses } from '../../wailsjs/go/main/App';
import { Universes } from '../models/universes';


export const DMX = {
  view: function(vnode) {

    return m("div", { class: "flex flex-row justify-items-center h-screen bg-zinc-900 bg-opacity-75" }, // min-h-screen
      m(Column, { title: "UNIVERSES", class: "basis-1/5" },
        m(UniverseList),
      ),
      m(Column, { title: "DMX", class: "basis-3/5 border-x border-zinc-700" },
        m(Channels),
      ),
      m(Column, { title: "STATISTICS", class: "basis-1/5" },
        m(Stats),
      ),
    );
  }
}

const Column = {
  view({ attrs, children }) {
    const { title, class: className, ...props } = attrs;

    return m("column", { class: twMerge(className, "flex flex-col") },
      m("header", { class: "flex justify-center bg-zinc-800 text-neutral-300 bg-opacity-75 p-1" },
        m("h2", { class: "" }, title),
      ),
      children,
    );
  }
}


const UniverseList = {

  oncreate: function(vnode) {
    Universes.get_universes();
    Universes.on_change(() => {
      console.log("universe redraw()");
      m.redraw();
    })
  },

  view: function(vnode) {
    const theme = {
      base: {
        off: "",
        on: "bg-sky-800",
      },
      value: {
        off: "text-slate-100",
        on:  "text-black bg-sky-500",
      },
    };

    console.log("universes view()");

    return m("div", { class: "flex flex-col py-2" },
      Universes.list.map((universe, index) => {
        const selected = Universes.selected === universe.id;
        const highlight = theme.base[selected ? "on" : "off"];
        const value = theme.value[selected ? "on" : "off"];

        return m("div", { class: twMerge("flex flex-row h-8 items-center hover:bg-sky-800", highlight),
            onclick: () => { Universes.select(universe.id) } },
          m("div", { class: twMerge("basis-14 text-xs font-medium flex h-full items-center justify-center", value) }, 
            universe.num
          ),
          m("div", { class: "text-xs text-slate-300 pl-1" }, universe.source),
        )
      })
    );
  }
}


const Channels = {

  oncreate: function(vnode) {
    Universes.get_data();
    Universes.on_data_change(() => {
      console.log("channels redraw()");
      m.redraw();
    });
  },

  view: function(vnode) {
    const theme = {
      base: "flex flex-row flex-wrap overflow-auto overscroll-none",
      background: "bg-sky-500",
      active: {
        off: "text-white opacity-50",
        on: "text-white opacity-90",
      },
      selected: {
        off: "",
        on:  "border-2 border-slate-300",
      },
    };

    return m("div", { class: theme.base },
      Universes.data.map((value, index) => {
        const selected = Universes.selected_channel == index;
        const highlight = theme.selected[selected ? "on" : "off"];
        const active = theme.active[value > 0 ? "on" : "off"];
        const height = "height: "+(value * 100 / 255)+"%";

        return m("div", { id: index, class: twMerge("relative w-10 h-8 flex justify-center items-center", highlight),
              onclick: () => { Universes.select_channel(index) } },
          m("div", { class: twMerge("absolute border-box self-end w-full", theme.background), style: height} ), 
          m("div", { class: twMerge("text-xs", active) }, index + 1),
        )
      })
    );
  }
}


const Stats = {

  view: function(vnode) {
    const universe = Universes.get_selected();
    const channel = Universes.selected_channel;
    var universe_hex, channel_str, channel_value = "";
    if (universe) {
      universe_hex = Number(universe.num).toString(16).toUpperCase();
    }
    if (channel !== null) {
      const value = Universes.data[channel]
      channel_str = channel + 1;
      channel_value = value + " (" + Math.ceil(value / 255 * 100) + "%)";
    }

    return m("div", { class: "flex flex-col py-2" },
      m(StatsBox, { name: "Universe", value: universe?.num } ),
      m(StatsBox, { name: "Universe Hex", value: universe_hex } ),
      m(StatsBox, { name: "Node", value: universe?.source } ),
      m(StatsBox, { name: "Selected Channel", value: channel_str } ),
      m(StatsBox, { name: "Selected Value", value: channel_value } ),
    );
  }
}

const StatsBox = {
  view({ attrs }) {
    const { name, value, ...props } = attrs;

    return m("div", { class: "flex flex-row justify-between items-center mx-3.5 my-1 text-slate-300 text-xs" },
      m("div", { class: "" }, name),
      m("div", { class: "" }, value),
    );
  }
}