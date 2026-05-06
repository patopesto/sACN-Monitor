import { defineConfig } from "vite";
import wails from "@wailsio/runtime/plugins/vite";
import solid from "vite-plugin-solid";
import devtools from 'solid-devtools/vite';
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    wails("./bindings"),
    solid(),
    devtools({
      autoname: true,
    }),
    tailwindcss(),
  ],
});
