import m from "mithril";
import { twMerge } from "tailwind-merge";
import { Button, Range, Label, Dropdown, Modal, Input, Badge } from 'flowbite-mithril';
import { PlusIcon } from "flowbite-icons-mithril/solid";

import { appTheme } from "../theme.js";
import { Universes } from '../models/universes';
import { Settings } from '../models/settings';


export const DMX = {
  view: function(vnode) {

    return m("div", { class: "flex flex-row justify-items-center h-screen overflow-hidden bg-zinc-900 bg-opacity-60" }, // min-h-screen
      m(Column, { title: "UNIVERSES", class: "basis-1/5" },
        m(UniverseList),
      ),
      m(Column, { title: "DMX", class: "basis-3/5 border-x border-zinc-700" },
        m(Channels),
      ),
      m(Column, { title: "STATISTICS", class: "basis-1/5" },
        m(Stats),
        m(Column, { title: "SETTINGS", class: "" },
          m(SettingsPane),
        ),
      ),
    );
  }
}

const Column = {
  view({ attrs, children }) {
    const { title, class: className, ...props } = attrs;

    return m("column", { class: twMerge(className, "flex flex-col") },
      m("header", { class: "flex justify-center bg-zinc-800 text-neutral-300 bg-opacity-60 p-1" },
        m("h2", { class: "" }, title),
      ),
      children,
    );
  }
}



const UniverseList = {
  oncreate: function(vnode) {
    Universes.get_universes();
    Universes.on_change(() => { m.redraw() });
  },

  view: function(vnode) {
    const color = appTheme[Settings.theme];
    const theme = {
      base: {
        root: "hover:" + color.secondary,
        off: "",
        on: color.secondary,
      },
      value: {
        off: "text-slate-100",
        on:  twMerge("text-black", color.primary),
      },
      badge: "font-medium dark:bg-opacity-15 dark:text-slate-300",
    };

    const universes = Universes.get_list();
    const protocol = Settings.protocol;

    return m("div", { class: "flex flex-col py-2 overflow-auto overscroll-none" },
      universes.map((universe, index) => {
        const selected = Universes.selected === universe.id;
        const highlight = theme.base[selected ? "on" : "off"];
        const value = theme.value[selected ? "on" : "off"];
        const label = universe.protocol === "sacn" ? "sACN" : "ArtNet";

        return m("div", { class: twMerge("flex flex-row h-8 items-center", theme.base.root, highlight),
            onclick: () => { Universes.select(universe.id) } },
          m("div", { class: twMerge("basis-14 text-xs font-bold flex h-full items-center justify-center shrink-0", value) }, 
            universe.num
          ),
          m("div", { class: "shrink w-full text-xs text-slate-300 pl-1" },
            universe.source
          ),
          protocol === "mixed" && m(Badge, { class: twMerge("justify-end shrink-0 m-3", theme.badge) },
            label,
          ),
        )
      }),
      m(AddUniverseModal),
    );
  }
}


const AddUniverseModal = {
  universe: null,

  view({attrs, state}) {
    const color = Settings.theme;
    const modalTheme = {
      background: "dark:bg-neutral-900 dark:bg-opacity-10",
      content: {
        inner: "dark:bg-zinc-800",
      }
    }

    const join_universe = () => {
      if (state.universe) {
        const uni = Number(state.universe);
        Universes.join_universe(uni);
        state.universe = null;
      }
    };

    return [
      m("button", { 'data-modal-target': 'add-modal', 'data-modal-toggle': 'add-modal',class: twMerge("fixed bottom-0 self-end m-2 rounded-md bg-blue-600", appTheme[Settings.theme].primary) },
        m(PlusIcon, { class: "w-3 h-3 m-1 text-slate-300" }),
      ),
      m(Modal, { id: "add-modal", popup: true, size: "md", theme: modalTheme, class: modalTheme.background },
        m(Modal.Header),
        m(Modal.Body,
          m("div", { class: "space-y-6" },
            m("h2", { class: "text-lg font-medium text-gray-900 dark:text-slate-300" },
              "Manually add a sACN universe to listen to",
            ),
            m("div",
              m(Input, { type: "number", id: "universe", placeholder: "123",
                oninput: (e) => { state.universe = e.target.value } }),
            ),
            m("div", { class: "flex justify-end" },
              m(Button, { color: color, onclick: join_universe },
                "Add Universe",
              ),
            ),
          ),
        ),
      ),
    ]
  }
}



const Channels = {
  oncreate: function(vnode) {
    Universes.get_data();
    Universes.on_data_change(() => { m.redraw() });
  },

  view: function(vnode) {
    const theme = {
      base: "flex flex-row flex-wrap overflow-auto overscroll-none",
      background: appTheme[Settings.theme].primary,
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

    return m("div", { class: "h-full flex flex-col py-2" },
      m(StatsBox, { name: "Universe", value: universe?.num } ),
      m(StatsBox, { name: "Universe Hex", value: universe_hex } ),
      m(StatsBox, { name: "Sender", value: universe?.source } ),
      universe?.protocol === "sacn" && [
      m(StatsBox, { name: "Source Name", value: universe?.source_name } ),
      m(StatsBox, { name: "Priority", value: universe?.priority } ),
      universe?.sync_address > 0 &&
        m(StatsBox, { name: "Sync Address", value: universe?.sync_address } ),
      ],
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



const SettingsPane = {
  oncreate: function(vnode) {
    Settings.get_interfaces()
  },

  view: function(vnode) {
    const protocol = Settings.protocol;
    const interfaces = Settings.interfaces;
    // const opacity = Settings.opacity;
    const color = Settings.theme;

    const set_mode = (mode) => {
      Settings.set_protocol(mode);
    };

    const set_interface = (itf) => {
      Settings.set_interface(itf);
      m.redraw();
    };

    // const set_opacity = (opacity) => {
    //   Settings.set_opacity(opacity);
    // };

    const set_theme = (theme) => {
      Settings.set_theme(theme);
    };

    // theme overide for the protocol button group
    const themeOn = {
      outline: {
        on: "dark:" + appTheme[color].secondary,
      }
    };
    const themeOff = {
      outline: {
        on: "dark:bg-zinc-800",
      }
    };

    // additional class for the interfaces dropdown
    const themeItfSelected = {
      on: "bg-gray-600",
      off: "",
    };


    return  m("div", { class: "flex flex-col items-center gap-2 px-5 py-3" }, [
      m("div",
        m(Button.Group, { outline: true }, [
          m(Button, { theme: protocol === "sacn" ? themeOn : themeOff,   color: color, onclick: () => {set_mode("sacn")} },   "sACN"),
          m(Button, { theme: protocol === "artnet" ? themeOn : themeOff, color: color, onclick: () => {set_mode("artnet")} }, "ArtNet"),
          m(Button, { theme: protocol === "mixed" ? themeOn : themeOff,  color: color, onclick: () => {set_mode("mixed")} },  "Both"),
        ]),
      ),
      m("div", { class: "pt-3" },
        m(Dropdown, { label: "Interfaces", dismissOnClick: true, color: color }, [
          interfaces.map((itf) => {
            return m(Dropdown.Item, { onclick: () => {set_interface(itf)}, class: themeItfSelected[itf.active ? "on" : "off"] },
              `${itf.name} (${itf.ip})`
            )
          })
        ]),
      ),
      // m("div", { class: "pt-5 w-full" },
      //   m(Label, { for: "opacity", class: "text-xs dark:text-slate-300" }, "Opacity"),
      //   m(Range, { id: "opacity", min: 0, max: 100, value: opacity, step: 10, size: "sm", oninput: (e) => {set_opacity(e.target.value)} }),
      // ),
      m("div", { class: "w-full" },
        m(Label, { class: "text-xs dark:text-slate-300" }, "Theme"),
        m("div", { class: "py-3 grid justify-items-center grid-cols-5 gap-3"},
          m("button", { onclick: () => {set_theme("cyan")},   class: "flex w-4 h-4 bg-cyan-500 rounded-full" }),
          m("button", { onclick: () => {set_theme("blue")},   class: "flex w-4 h-4 bg-blue-600 rounded-full" }),
          m("button", { onclick: () => {set_theme("purple")}, class: "flex w-4 h-4 bg-purple-500 rounded-full" }),
          m("button", { onclick: () => {set_theme("red")},    class: "flex w-4 h-4 bg-red-500 rounded-full" }),
          m("button", { onclick: () => {set_theme("dark")},   class: "flex w-4 h-4 bg-gray-900 rounded-full dark:bg-gray-700" }),
        ),
      ),
    ]);
  }
}

