import { For, createSignal } from "solid-js";
import { SegmentedControl } from "@kobalte/core/segmented-control";
import { Select } from "@kobalte/core/select";
import { Dialog } from "@kobalte/core/dialog";
import { twMerge } from "tailwind-merge";
import { FaSolidPlus, FaSolidCheck, FaSolidClose } from 'solid-icons/fa'
import { appTheme } from "../theme.js";
import { universes, UniversesActions } from '../models/universes';
import { settings, SettingsActions } from '../models/settings';


const UNIVERSE_TIMEOUT = 2500;

export function DMX() {
  return (
    <div class="flex flex-row justify-items-center h-screen overflow-hidden bg-zinc-900 bg-opacity-60 select-none cursor-default">
      <Column title="UNIVERSES" class="basis-1/5">
        <UniverseList />
      </Column>
      <Column title="DMX" class="basis-3/5 border-x border-zinc-700">
        <Channels />
      </Column>
      <Column title="STATISTICS" class="basis-1/5">
        <Stats />
        <Column title="SETTINGS">
          <SettingsPane />
        </Column>
      </Column>
    </div>
  );
}

function Column(props) {
  return (
    <div class={twMerge(props.class, "flex flex-col")}>
      <header class="flex justify-center bg-zinc-800 text-neutral-300 bg-opacity-60 p-1">
        <h2>{props.title}</h2>
      </header>
      {props.children}
    </div>
  );
}


function UniverseList() {
  UniversesActions.get_universes();

  const color = () => appTheme[settings.theme];
  const theme = () => ({
    base: {
      root: "hover:" + color().secondary,
      off: "",
      on: color().secondary,
    },
    value: {
      off: "text-slate-100",
      on: twMerge("text-black", color().primary),
    },
    badge: "font-medium dark:bg-opacity-15 dark:text-slate-300",
  });

  const list = () => UniversesActions.get_list();

  const navigate = (event, index, universe) => {
    event.preventDefault();
    if (event.key === "ArrowUp" && index - 1 >= 0) {
      UniversesActions.select_universe(list()[index - 1]);
      document.getElementById(JSON.stringify(list()[index - 1]))?.focus();
    } else if (event.key === "ArrowDown" && index + 1 < list().length) {
      UniversesActions.select_universe(list()[index + 1]);
      document.getElementById(JSON.stringify(list()[index + 1]))?.focus();
    }
  };

  return (
    <div class="flex flex-col pt-2 pb-9 overflow-auto overscroll-none">
      <For each={list()}>
        {(universe, index) => {
          const selected = () => universes.selected_key === universe;
          const highlight = () => theme().base[selected() ? "on" : "off"];
          const valueClass = () => theme().value[selected() ? "on" : "off"];
          const label = universe.protocol === "sacn" ? "sACN" : "ArtNet";
          const keyStr = JSON.stringify(universe);

          return (
            <div 
              id={keyStr}
              tabindex="-1"
              class={twMerge("flex flex-row min-h-8 h-8 items-center focus:outline-none", theme().base.root, highlight())}
              onClick={() => UniversesActions.select_universe(universe)}
              onKeyDown={(e) => navigate(e, index(), universe)}
            >
              <div class={twMerge("basis-14 text-xs font-bold flex h-full items-center justify-center shrink-0", valueClass())}>
                {universe.num}
              </div>
              <div class="shrink w-full text-xs text-slate-300 pl-1">
                {universe.source}
              </div>
              {settings.protocol === "mixed" && (
                <div class={twMerge("justify-end shrink-0 m-3 px-2 py-0.5 rounded bg-zinc-700 text-xs", theme().badge)}>
                  {label}
                </div>
              )}
            </div>
          );
        }}
      </For>
      <AddUniverseModal />
    </div>
  );
}


function AddUniverseModal() {
  const [universe, setUniverse] = createSignal("");

  const join_universe = () => {
    if (universe()) {
      UniversesActions.join_universe(Number(universe));
      setUniverse("");
    }
  };

  const color = () => appTheme[settings.theme];
  const theme = () => ({
    trigger: twMerge("fixed bottom-0 self-end m-3 rounded-md bg-blue-600 p-1", color().primary),
    dialog: {
      overlay: "fixed inset-0 bg-black bg-opacity-50 z-50",
      root: "fixed inset-0 flex items-center justify-center z-50 outline-none",
      content: "p-6 mx-4 w-full max-w-md rounded-xl bg-zinc-800 shadow-xl",
      header: {
        root: "flex justify-between items-start mb-4",
        title: "text-lg font-medium text-slate-300",
        close: "text-slate-300"
      },
      input: "w-full p-2 bg-zinc-900 text-white border border-zinc-700 rounded outline-none hover:border-zinc-500 focus:border-zinc-500",
      footer: {
        root: "mt-2 flex justify-end gap-2",
        close: "px-4 py-2 rounded-lg text-white bg-zinc-700 hover:bg-zinc-600 transition-colors",
        join: twMerge("px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90", color().primary),
      }

    }
  })

  return (
    <Dialog>
      <Dialog.Trigger class={theme().trigger}>
        <FaSolidPlus size="15" class="text-slate-300" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class={theme().dialog.overlay} />
        <div class={theme().dialog.root}>
          <Dialog.Content class={theme().dialog.content}>
            <div class={theme().dialog.header.root}>
              <Dialog.Title class={theme().dialog.header.title}>
                Manually add a sACN universe to listen to
              </Dialog.Title>
              <Dialog.CloseButton class={theme().dialog.header.close}>
                <FaSolidClose/>
              </Dialog.CloseButton>
            </div>
            <div class="space-y-4">
              <input 
                type="number" 
                placeholder="123"
                value={universe()}
                min="1"
                max="64000"
                class={theme().dialog.input}
                onInput={(e) => setUniverse(e.target.value)}
                onKeyDown={(e) => e.code === "Enter" && join_universe()}
                autoFocus
              />
              <div class={theme().dialog.footer.root}>
                <Dialog.CloseButton class={theme().dialog.footer.close}>
                  Cancel
                </Dialog.CloseButton>
                <button class={theme().dialog.footer.join} onClick={join_universe} >
                  Add Universe
                </button>
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}


function Channels() {
  UniversesActions.get_data();

  const color = () => appTheme[settings.theme];
  const theme = () => ({
    base: "flex flex-row flex-wrap overflow-auto overscroll-none",
    background: color().primary,
    active: {
      off: "text-white opacity-50",
      on: "text-white opacity-90",
    },
    selected: {
      off: "",
      on: "border-2 border-slate-300",
    },
  });

  const navigate = (event, index) => {
    event.preventDefault();
    if (event.key === "ArrowRight" && index + 1 < universes.data.length) {
      UniversesActions.select_channel(index + 1);
      document.getElementById(`channel-${index + 1}`)?.focus();
    } else if (event.key === "ArrowLeft" && index - 1 >= 0) {
      UniversesActions.select_channel(index - 1);
      document.getElementById(`channel-${index - 1}`)?.focus();
    } else {
      // Vertical navigation logic (simplified for snippet)
      const getRect = (id) => {
        const el = document.getElementById(id);
        if (!el) return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      };
      const { x, y } = getRect(`channel-${index}`);

      if (event.key === "ArrowDown") {
        for (let i = index + 1; i < universes.data.length; i++) {
          const { x: tx, y: ty } = getRect(`channel-${i}`);
          if (x === tx && y < ty) {
            UniversesActions.select_channel(i);
            document.getElementById(`channel-${i}`)?.focus();
            break;
          }
        }
      } else if (event.key === "ArrowUp") {
        for (let i = index; i >= 0; i--) {
          const { x: tx, y: ty } = getRect(`channel-${i}`);
          if (x === tx && y > ty) {
            UniversesActions.select_channel(i);
            document.getElementById(`channel-${i}`)?.focus();
            break;
          }
        }
      }
    }
  };

  return (
    <div class={theme().base}>
      <For each={universes.data}>
        {(value, index) => {
          const selected = () => universes.selected_channel === index();
          const highlight = () => theme().selected[selected() ? "on" : "off"];
          const active = () => theme().active[value > 0 ? "on" : "off"];
          const height = `height: ${ (value * 100) / 255 }%`;

          return (
            <div 
              id={`channel-${index()}`}
              tabindex="-1"
              class={twMerge("relative w-10 h-8 flex justify-center items-center focus:outline-none", highlight())}
              onClick={() => UniversesActions.select_channel(index())}
              onKeyDown={(e) => navigate(e, index())}
            >
              <div class={twMerge("absolute border-box self-end w-full", theme().background)} style={height} />
              {settings.view === "channels" && <div class={twMerge("text-xs", active())}>{index() + 1}</div>}
              {settings.view === "values" && <div class={twMerge("text-xs", active())}>{value}</div>}
              {settings.view === "both" && (
                <div class="flex flex-col items-center">
                  <div class={twMerge("text-xs", theme().active.off)}>{index() + 1}</div>
                  <div class={twMerge("text-xs", active())}>{value}</div>
                </div>
              )}
            </div>
          );
        }}
      </For>
    </div>
  );
}


function Stats() {
  const universe = () => universes.selected;
  const channel = () => universes.selected_channel;
  
  const universeHex = () => universe() ? Number(universe().num).toString(16).toUpperCase() : "";
  const lastHeard = () => {
    if (!universe()) return "";
    const diff = Date.now() - Date.parse(universe().last_received);
    return diff < UNIVERSE_TIMEOUT ? "Receiving" : "Timeout";
  };
  const channelStr = () => channel() !== null ? channel() + 1 : "";
  const channelValue = () => {
    if (channel() === null || !universe()) return "";
    const val = universes.data[channel()];
    return `${val} (${Math.ceil((val / 255) * 100)}%)`;
  };

  return (
    <div class="h-full flex flex-col py-2">
      <StatsBox name="Universe" value={() => universe()?.num} />
      <StatsBox name="Universe Hex" value={universeHex} />
      <StatsBox name="Sender" value={() => universe()?.source} />
      {universe()?.source_name && <StatsBox name="Source Name" value={() => universe()?.source_name} /> }
      <StatsBox name="Status" value={lastHeard} />
      {universe()?.destination && <StatsBox name="Mode" value={() => universe()?.destination} /> }
      <StatsBox name="FPS" value={() => universe()?.fps} />
      {universe()?.protocol === "sacn" && (
        <>
          <StatsBox name="Priority" value={() => universe()?.priority} />
          {universe()?.sync_address > 0 && <StatsBox name="Sync Address" value={() => universe()?.sync_address} /> }
        </>
      )}
      <div class="mx-6 my-2 border-t border-zinc-700" />
      <StatsBox name="Selected Channel" value={channelStr} />
      <StatsBox name="Selected Value" value={channelValue} />
    </div>
  );
} 

function StatsBox(props) {
  return (
    <div class="flex flex-row justify-between items-center mx-3.5 my-1 text-slate-300 text-xs">
      <div>{props.name}</div>
      <div class="text-right select-all">{props.value() !== undefined && props.value() !== null ? props.value() : ""}</div>
    </div>
  );
}


function SettingsPane() {
  SettingsActions.init();

  const color = () => appTheme[settings.theme];
  const theme = () => ({
    label: "text-sm text-slate-300 mb-1",
    toggle: {
      root: "bg-zinc-800 m-1 rounded-lg relative",
      indicator: twMerge("absolute rounded-lg transition-all duration-200 ease-in-out shadow-sm", color().primary),
      items: "flex",
      item: {
        root: twMerge("relative after:absolute after:right-0 after:top-1/4 after:bottom-1/4 after:w-px after:bg-zinc-700 last:after:hidden", "hover:" + color().secondary),
        control: "flex text-xs transition-colors duration-200",
        label: "px-4 py-2",
      },
    },
    select: {
      root: "w-full",
      trigger: "mt-1 px-2 py-1 w-full rounded bg-zinc-800 border border-zinc-700 outline-none hover:border-zinc-500 text-xs text-left text-slate-300",
      content: "bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg outline-none",
      items: "p-2 overflow-y-auto",
      item: {
        root: "flex justify-between items-baseline text-left px-3 py-2 text-xs rounded-md cursor-pointer outline-none hover:bg-zinc-700 text-slate-300 hover:text-white",
        active: "bg-gray-600",
      }
    }
  })

  return (
    <div class="flex flex-col items-center gap-3 px-5 py-3">
      {/* Protocol */}
      <SegmentedControl class={theme().toggle.root} value={settings.protocol} onChange={(v) => SettingsActions.set_protocol(v)}>
        <div role="presentation" class="relative flex">
          <SegmentedControl.Indicator class={theme().toggle.indicator} />
          <div role="presentation" class={theme().toggle.items}>
            <SegmentedControl.Item class={theme().toggle.item.root} value="sacn">
              <SegmentedControl.ItemInput />
              <SegmentedControl.ItemControl class={theme().toggle.item.control}>
                <SegmentedControl.ItemLabel class={theme().toggle.item.label}>sACN</SegmentedControl.ItemLabel>
              </SegmentedControl.ItemControl>
            </SegmentedControl.Item>
            <SegmentedControl.Item class={theme().toggle.item.root} value="artnet">
              <SegmentedControl.ItemInput />
              <SegmentedControl.ItemControl class={theme().toggle.item.control}>
                <SegmentedControl.ItemLabel class={theme().toggle.item.label}>ArtNet</SegmentedControl.ItemLabel>
              </SegmentedControl.ItemControl>
            </SegmentedControl.Item >
            <SegmentedControl.Item class={theme().toggle.item.root} value="mixed">
              <SegmentedControl.ItemInput />
              <SegmentedControl.ItemControl class={theme().toggle.item.control}>
                <SegmentedControl.ItemLabel class={theme().toggle.item.label}>Both</SegmentedControl.ItemLabel>
              </SegmentedControl.ItemControl>
            </SegmentedControl.Item>
          </div>
        </div>
      </SegmentedControl>
      
      {/* Channel views */}
      <SegmentedControl class={theme().toggle.root} value={settings.view} onChange={(v) => SettingsActions.set_view(v)}>
        <div role="presentation" class="relative flex">
          <SegmentedControl.Indicator class={theme().toggle.indicator} />
          <div role="presentation" class={theme().toggle.items}>
            <SegmentedControl.Item class={theme().toggle.item.root} value="channels">
              <SegmentedControl.ItemInput />
              <SegmentedControl.ItemControl class={theme().toggle.item.control}>
                <SegmentedControl.ItemLabel class={theme().toggle.item.label}>Channels</SegmentedControl.ItemLabel>
              </SegmentedControl.ItemControl>
            </SegmentedControl.Item>
            <SegmentedControl.Item class={theme().toggle.item.root} value="values">
              <SegmentedControl.ItemInput />
              <SegmentedControl.ItemControl class={theme().toggle.item.control}>
                <SegmentedControl.ItemLabel class={theme().toggle.item.label}>Values</SegmentedControl.ItemLabel>
              </SegmentedControl.ItemControl>
            </SegmentedControl.Item>
            <SegmentedControl.Item class={theme().toggle.item.root} value="both">
              <SegmentedControl.ItemInput />
              <SegmentedControl.ItemControl class={theme().toggle.item.control}>
                <SegmentedControl.ItemLabel class={theme().toggle.item.label}>Both</SegmentedControl.ItemLabel>
              </SegmentedControl.ItemControl>
            </SegmentedControl.Item>
          </div>
        </div>
      </SegmentedControl>

      {/* Network interface */}
      <Select
        class={theme().select.root}
        value={settings.selected_interface}
        onChange={SettingsActions.set_interface}
        options={settings.interfaces}
        optionValue="name"
        optionTextValue="name"
        placeholder="Select network interface"
        itemComponent={(props) => (
            <Select.Item item={props.item} class={theme().select.item.root}>
              <Select.ItemLabel>{props.item.rawValue.name} ({props.item.rawValue.ip})</Select.ItemLabel>
              <Select.ItemIndicator>
                <FaSolidCheck />
              </Select.ItemIndicator>
            </Select.Item>
        )}
      >
        <Select.Label class={theme().label}>Interfaces</Select.Label>
        <Select.Trigger class={theme().select.trigger}>
          <Select.Value>
            {(state) => (state.selectedOption() !== undefined && `${state.selectedOption().name} (${state.selectedOption().ip})`)}
          </Select.Value>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content class={theme().select.content}>
            <Select.Listbox  class={theme().select.items}/>
          </Select.Content>
        </Select.Portal>
      </Select>

      {/* Theme */}
      <div class="w-full">
        <div class={theme().label}>Theme</div>
        <div class="px-2 py-2 flex justify-between gap-3">
          <For each={Object.keys(appTheme)}>
            {(value, index) => (
              <button
                class={twMerge("flex w-4 h-4 rounded-full", appTheme[value].primary)}
                onClick={() => SettingsActions.set_theme(value)}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
