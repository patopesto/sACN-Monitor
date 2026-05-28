import { For, createSignal, createMemo, createEffect } from "solid-js";
import { SegmentedControl } from "@kobalte/core/segmented-control";
import { Select } from "@kobalte/core/select";
import { Dialog } from "@kobalte/core/dialog";
import { TextField } from "@kobalte/core/text-field";
import { ContextMenu } from "@kobalte/core/context-menu";
import { twMerge } from "tailwind-merge";
import { FaSolidPlus, FaSolidCheck, FaSolidClose, FaSolidMousePointer, FaSolidExternalLinkAlt } from 'solid-icons/fa'
import { VsLayoutSidebarLeft, VsLayoutSidebarLeftOff, VsLayoutSidebarRight, VsLayoutSidebarRightOff } from 'solid-icons/vs'
import { appTheme } from "../theme.js";
import { universes, UniversesActions } from '../stores/universes';
import { settings, SettingsActions } from '../stores/settings';


const UNIVERSE_TIMEOUT = 2500;

export function DMX() {
  onMount(() => {
    SettingsActions.init();
    UniversesActions.init();
  });

  onCleanup(() => {
    SettingsActions.cleanup();
    UniversesActions.cleanup();
  });

  const theme = () => ({
    base: "flex flex-row h-screen overflow-hidden bg-zinc-900/60 select-none cursor-default",
    column: "h-full",
    sidebar: {
      base: "shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden",
      visible: "w-[20%]",
      hidden: "w-0",
    },
    center: {
      base: "flex-grow border-x border-zinc-700",
    },
    toggle: "p-1 rounded hover:bg-zinc-700 transition-colors",
  });

  return (
    <div class={theme().base}>
      {/* Left Sidebar - UNIVERSES */}
      <Column class={twMerge(theme().column, theme().sidebar.base, theme().sidebar[settings.sidebar.left ? "visible" : "hidden"])}>
        <Column.Title>UNIVERSES</Column.Title>
        <UniverseList />
      </Column>

      {/* Center - DMX Channels */}
      <Column class={twMerge(theme().column, theme().center.base)}>
        <Column.Title class={"justify-between items-center"}>
          <button
            title={settings.sidebar.left ? "Hide sidebar" : "Show sidebar"}
            class={theme().toggle}
            onClick={() => SettingsActions.toggle_sidebar("left")}
          >
            {settings.sidebar.left ? <VsLayoutSidebarLeftOff size="14" /> : <VsLayoutSidebarLeft size="14" />}
          </button>
          <h2>DMX</h2>
          <button 
            title={settings.sidebar.right ? "Hide sidebar" : "Show sidebar"}
            class={theme().toggle}
            onClick={() => SettingsActions.toggle_sidebar("right")}
          >
            {settings.sidebar.right ? <VsLayoutSidebarRightOff size="14" /> : <VsLayoutSidebarRight size="14" />}
          </button>
        </Column.Title>
        <Channels />
      </Column>

      {/* Right Sidebar - STATISTICS + SETTINGS */}
      <Column class={twMerge(theme().column, theme().sidebar.base, theme().sidebar[settings.sidebar.right ? "visible" : "hidden"])}>
        <Column.Title>STATISTICS</Column.Title>
        <Stats />
        <Column>
          <Column.Title>SETTINGS</Column.Title>
          <SettingsPane />
        </Column>
      </Column>
    </div>
  );
}

function Column(props) {
  return (
    <div class={twMerge("flex flex-col", props.class)}>
      {props.children}
    </div>
  );
}

Column.Title = function ColumnTitle(props) {
  const isString = typeof props.children === 'string';
  return (
    <header class={twMerge("flex p-1 w-full justify-center items-center bg-zinc-800/60 text-neutral-300 text-center", props.class)}>
      {isString ? <h2>{props.children}</h2> : props.children}
    </header>
  );
};


function UniverseList() {
  const list = () => UniversesActions.get_list();
  onMount(() => {
    UniversesActions.get_universes();
  });

  const color = () => appTheme[settings.theme];
  const theme = () => ({
    base: "flex flex-col pt-2 pb-10 overflow-auto overscroll-none",
    row: {
      base: twMerge("flex flex-row min-h-8 h-8 items-center focus:outline-none", "hover:" + color().secondary),
      off: "",
      on: color().secondary,
    },
    value: {
      base: "basis-14 flex shrink-0 h-full items-center justify-center text-xs font-bold",
      off: "text-slate-100",
      on: twMerge("text-black", color().primary),
    },
    source: "pl-1 w-full shrink text-xs text-slate-300",
    badge: "justify-end m-3 px-2 py-0.5 rounded bg-zinc-700/80 text-slate-300 text-xs font-medium",
    menu: {
      content: "min-w-[180px] p-1.5 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg outline-none z-50",
      animation: "origin-[var(--kb-menu-content-transform-origin)] animate-contextmenu-content-hide data-[expanded]:animate-contextmenu-content-show",
      item: "flex items-center justify-between px-3 py-2 rounded-md text-[13px] text-slate-300 cursor-pointer outline-none transition-colors duration-150 hover:bg-zinc-700 hover:text-white data-[highlighted]:bg-zinc-700 data-[highlighted]:text-white data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
      separator: "h-px my-1.5 bg-zinc-700",
    },
  });

  const navigate = (event, index, universe) => {
    if (event.key === "ArrowUp" && index - 1 >= 0) {
      event.preventDefault();
      UniversesActions.select_universe(list()[index - 1]);
      document.getElementById(JSON.stringify(list()[index - 1]))?.focus();
    } else if (event.key === "ArrowDown" && index + 1 < list().length) {
      event.preventDefault();
      UniversesActions.select_universe(list()[index + 1]);
      document.getElementById(JSON.stringify(list()[index + 1]))?.focus();
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault(); // Prevent scrolling when at edges
    }
  };

  return (
    <>
      <div class={theme().base}>
        <For each={list()}>
          {(universe, index) => {
            const selected = () => JSON.stringify(universes.selected_key) === JSON.stringify(universe);
            const rowSelected = () => theme().row[selected() ? "on" : "off"];
            const valueSelected = () => theme().value[selected() ? "on" : "off"];
            const label = universe.protocol === "sacn" ? "sACN" : "ArtNet";
            const keyStr = JSON.stringify(universe);

            return (
              <ContextMenu>
                <ContextMenu.Trigger class="w-full">
                  <div
                    id={keyStr}
                    tabindex="-1"
                    title={`Select universe ${universe.num}`}
                    class={twMerge(theme().row.base, rowSelected())}
                    onClick={() => UniversesActions.select_universe(universe)}
                    onKeyDown={(e) => navigate(e, index(), universe)}
                  >
                    <div class={twMerge(theme().value.base, valueSelected())}>
                      {universe.num}
                    </div>
                    <div class={theme().source}>
                      {universe.source}
                    </div>
                    {settings.protocol === "mixed" && (
                      <div class={theme().badge}>
                        {label}
                      </div>
                    )}
                  </div>
                </ContextMenu.Trigger>
                <ContextMenu.Portal>
                  <ContextMenu.Content class={twMerge(theme().menu.content, theme().menu.animation)}>
                    <ContextMenu.Item 
                      class={theme().menu.item}
                      onSelect={() => UniversesActions.select_universe(universe)}
                    >
                      <div class="flex items-center gap-2">
                        <FaSolidMousePointer size="12" />
                        <span>Select Universe</span>
                      </div>
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      class={theme().menu.item}
                      onSelect={() => UniversesActions.open_new_window(universe)}
                    >
                      <div class="flex items-center gap-2">
                        <FaSolidExternalLinkAlt size="12" />
                        <span>Open in New Window</span>
                      </div>
                    </ContextMenu.Item>
                  </ContextMenu.Content>
                </ContextMenu.Portal>
              </ContextMenu>
            );
          }}
        </For>
      </div>
      <AddUniverseModal />
    </>
  );
}


function AddUniverseModal() {
  const [universe, setUniverse] = createSignal("");
  const MIN_UNIVERSE = 1;
  const MAX_UNIVERSE = 63999;

  const open = () => settings.modal;
  const setOpen = (value) => SettingsActions.set_modal(value);

  createEffect(() => {
    if (open()) {
      setUniverse("");
    }
  });

  const numValue = createMemo(() => {
    const val = universe().trim();
    if (val === "") return undefined;
    const num = Number(val);
    return Number.isNaN(num) ? undefined : num;
  });

  const isValid = createMemo(() => {
    const val = numValue();
    return val !== undefined && Number.isInteger(val) && val >= MIN_UNIVERSE && val <= MAX_UNIVERSE;
  });

  const validationState = createMemo(() => {
    if (universe() === "") return "valid";
    return isValid() ? "valid" : "invalid";
  });

  const errorMessage = createMemo(() => {
    const val = numValue();
    if (universe() === "") return "";
    if (val === undefined) return "Universe number must be a whole number";
    if (!Number.isInteger(val)) return "Universe number must be a whole number";
    if (val < MIN_UNIVERSE || val > MAX_UNIVERSE) return `Universe number must be between ${MIN_UNIVERSE} and ${MAX_UNIVERSE}`;
    return "";
  });

  const join_universe = () => {
    if (isValid()) {
      UniversesActions.join_universe(numValue());
      setUniverse("");
      setOpen(false);
    }
  };

  const color = () => appTheme[settings.theme];
  const theme = () => ({
    trigger: twMerge("fixed bottom-0 self-end m-3 rounded-md bg-blue-600 p-1", color().primary),
    dialog: {
      base: "fixed inset-0 flex items-center justify-center z-50 outline-none",
      overlay: {
        base: "fixed inset-0 bg-black/50 z-50",
        animation: "animate-dialog-overlay-hide data-[expanded]:animate-dialog-overlay-show",
      },
      content: {
        base: "p-6 mx-4 w-full max-w-md rounded-xl bg-zinc-800 shadow-xl",
        animation: "animate-dialog-content-hide data-[expanded]:animate-dialog-content-show",
      },
      header: {
        base: "flex justify-between items-start mb-4",
        title: "text-lg font-medium text-slate-300",
        close: "text-slate-300 outline-none"
      },
      input: "w-full p-2 bg-zinc-900 text-white border border-zinc-700 rounded outline-none hover:border-zinc-500 focus:border-zinc-500 transition-[border] data-[invalid]:border-red-500 data-[invalid]:hover:border-red-400 data-[invalid]:focus:border-red-400",
      error: "text-red-400 text-sm",
      footer: {
        base: "mt-2 flex justify-end gap-2",
        close: "px-4 py-2 rounded-lg text-white bg-zinc-700 hover:bg-zinc-600 transition-colors",
        join: twMerge("px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-80", color().primary),
      }
    }
  })

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <Dialog.Trigger class={theme().trigger} title="Join multicast universe">
        <FaSolidPlus size="15" class="text-slate-300" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class={twMerge(theme().dialog.overlay.base, theme().dialog.overlay.animation)} />
        <div class={theme().dialog.base}>
          <Dialog.Content class={twMerge(theme().dialog.content.base, theme().dialog.content.animation)}>
            <div class={theme().dialog.header.base}>
              <Dialog.Title class={theme().dialog.header.title}>
                Join multicast sACN universe
              </Dialog.Title>
              <Dialog.CloseButton class={theme().dialog.header.close} title="Close">
                <FaSolidClose/>
              </Dialog.CloseButton>
            </div>
            <div class="space-y-4">
              <TextField
                value={universe()}
                onChange={setUniverse}
                validationState={validationState()}
              >
                <TextField.Input
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="123"
                  class={theme().dialog.input}
                  onKeyDown={(e) => e.code === "Enter" && isValid() && join_universe()}
                  autoFocus
                />
                <TextField.ErrorMessage class={theme().dialog.error}>
                  {errorMessage()}
                </TextField.ErrorMessage>
              </TextField>
              <div class={theme().dialog.footer.base}>
                <Dialog.CloseButton class={theme().dialog.footer.close}>
                  Cancel
                </Dialog.CloseButton>
                <button
                  class={twMerge(theme().dialog.footer.join, !isValid() && "opacity-50 cursor-not-allowed")}
                  onClick={join_universe}
                  disabled={!isValid()}
                >
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
  onMount(() => {
    UniversesActions.get_data();
  });

  const navigate = (event) => {
    const index = universes.selected_channel;
    const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

    if (!arrowKeys.includes(event.key)) {
      return; // Let other keys pass through
    }

    event.preventDefault(); // Always prevent scroll for arrow keys

    if (event.key === "ArrowRight" && index + 1 < universes.data.length) {
      UniversesActions.select_channel(index + 1)
      document.getElementById(`channel-${index + 1}`).focus()
    }
    else if (event.key === "ArrowLeft" && index - 1 >= 0) {
      UniversesActions.select_channel(index - 1)
      document.getElementById(`channel-${index - 1}`).focus()
    }
    else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const getRect = (id) => {
        const el = document.getElementById(id)
        const rect = el.getBoundingClientRect()
        const x = rect.left + window.scrollX
        const y = rect.top + window.scrollY
        return { el, x, y }
      }
      const { x, y } = getRect(`channel-${index}`)

      if (event.key === "ArrowDown") {
        // select the first element that is below the current element with same x coordinate
        for (let i = index + 1; i < universes.data.length; i++) {
          const { el, x: tx, y: ty } = getRect(`channel-${i}`)

          if (x === tx && y < ty) {
            UniversesActions.select_channel(i)
            el.focus()
            break
          }
        }
      }
      else if (event.key === "ArrowUp") {
        // select the first element that is above the current element with same x coordinate
        for (let i = index; i >= 0; i--) {
          const { el, x: tx, y: ty } = getRect(`channel-${i}`)

          if (x === tx && y > ty) {
            UniversesActions.select_channel(i)
            el.focus()
            break
          }
        }
      }
    }
  };

  const color = () => appTheme[settings.theme];
  const theme = () => ({
    base: "flex flex-row flex-wrap overflow-auto overscroll-none",
    item: "relative w-10 h-8 flex justify-center items-center focus:outline-none",
    content: twMerge("absolute border-box self-end w-full", color().primary),
    active: {
      off: "text-xs text-white opacity-50",
      on: "text-xs text-white opacity-90",
    },
    selected: {
      off: "",
      on: "border-2 border-slate-300",
    },
  });

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
              title={`Select Channel ${index() + 1}`}
              class={twMerge(theme().item, highlight())}
              onClick={() => UniversesActions.select_channel(index())}
              onKeyDown={navigate}
            >
              <div class={theme().content} style={height} />
              {settings.view === "channels" &&
                <div class={active()}>{index() + 1}</div>
              }
              {settings.view === "values" &&
                <div class={active()}>{value}</div>
              }
              {settings.view === "both" && (
                <div class="flex flex-col items-center">
                  <div class={theme().active.off}>{index() + 1}</div>
                  <div class={active()}>{value}</div>
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

  const color = () => appTheme[settings.theme];
  const theme = () => ({
    label: "text-sm text-slate-300 mb-2",
    toggle: {
      base: "bg-zinc-800 m-1 rounded-lg relative",
      indicator: twMerge("absolute rounded-lg transition-all duration-200 ease-in-out shadow-sm", color().primary),
      items: "flex",
      item: {
        base: twMerge("relative after:absolute after:right-0 after:top-1/4 after:bottom-1/4 after:w-px after:bg-zinc-700 last:after:hidden", "hover:" + color().secondary),
        control: "flex text-xs transition-colors duration-200",
        label: "px-4 py-2",
      },
    },
    select: {
      base: "w-full",
      trigger: "mt-1 px-2 py-1 w-full rounded bg-zinc-800 border border-zinc-700 outline-none hover:border-zinc-500 transition-[border] text-xs text-left text-slate-300",
      content: "bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg outline-none",
      animation: "origin-[var(--kb-select-content-transform-origin)] animate-select-content-hide data-[expanded]:animate-select-content-show",
      items: "p-2 overflow-y-auto",
      item: {
        base: "flex justify-between items-baseline text-left px-3 py-2 text-xs rounded-md cursor-pointer outline-none hover:bg-zinc-700 text-slate-300 hover:text-white",
        active: "bg-gray-600",
      }
    }
  })

  return (
    <div class="flex flex-col items-center gap-3 px-5 py-3">
      {/* Protocol */}
      <SegmentedControl
        class={theme().toggle.base}
        value={settings.protocol}
        title="Select protocol"
        onChange={(v) => SettingsActions.set_protocol(v)}
      >
        <div role="presentation" class="relative flex">
          <SegmentedControl.Indicator class={theme().toggle.indicator} />
          <div role="presentation" class={theme().toggle.items}>
            <SegmentedControl.Item class={theme().toggle.item.base} value="sacn">
              <SegmentedControl.ItemInput />
              <SegmentedControl.ItemControl class={theme().toggle.item.control}>
                <SegmentedControl.ItemLabel class={theme().toggle.item.label}>sACN</SegmentedControl.ItemLabel>
              </SegmentedControl.ItemControl>
            </SegmentedControl.Item>
            <SegmentedControl.Item class={theme().toggle.item.base} value="artnet">
              <SegmentedControl.ItemInput />
              <SegmentedControl.ItemControl class={theme().toggle.item.control}>
                <SegmentedControl.ItemLabel class={theme().toggle.item.label}>ArtNet</SegmentedControl.ItemLabel>
              </SegmentedControl.ItemControl>
            </SegmentedControl.Item >
            <SegmentedControl.Item class={theme().toggle.item.base} value="mixed">
              <SegmentedControl.ItemInput />
              <SegmentedControl.ItemControl class={theme().toggle.item.control}>
                <SegmentedControl.ItemLabel class={theme().toggle.item.label}>Both</SegmentedControl.ItemLabel>
              </SegmentedControl.ItemControl>
            </SegmentedControl.Item>
          </div>
        </div>
      </SegmentedControl>
      
      {/* Channel views */}
      <SegmentedControl
        class={theme().toggle.base}
        value={settings.view}
        title="Select channel view mode"
        onChange={(v) => SettingsActions.set_view(v)}
      >
        <div role="presentation" class="relative flex">
          <SegmentedControl.Indicator class={theme().toggle.indicator} />
          <div role="presentation" class={theme().toggle.items}>
            <SegmentedControl.Item class={theme().toggle.item.base} value="channels">
              <SegmentedControl.ItemInput />
              <SegmentedControl.ItemControl class={theme().toggle.item.control}>
                <SegmentedControl.ItemLabel class={theme().toggle.item.label}>Channels</SegmentedControl.ItemLabel>
              </SegmentedControl.ItemControl>
            </SegmentedControl.Item>
            <SegmentedControl.Item class={theme().toggle.item.base} value="values">
              <SegmentedControl.ItemInput />
              <SegmentedControl.ItemControl class={theme().toggle.item.control}>
                <SegmentedControl.ItemLabel class={theme().toggle.item.label}>Values</SegmentedControl.ItemLabel>
              </SegmentedControl.ItemControl>
            </SegmentedControl.Item>
            <SegmentedControl.Item class={theme().toggle.item.base} value="both">
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
        class={theme().select.base}
        value={settings.selected_interface}
        onChange={SettingsActions.set_interface}
        options={settings.interfaces}
        optionValue="name"
        optionTextValue="name"
        placeholder="Select network interface"
        title="Select network interface"
        itemComponent={(props) => (
            <Select.Item item={props.item} class={theme().select.item.base}>
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
          <Select.Content class={twMerge(theme().select.content, theme().select.animation)}>
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
                title={value.charAt(0).toUpperCase() + value.slice(1)}
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
