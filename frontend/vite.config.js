import { defineConfig } from "vite";
import wails from "@wailsio/runtime/plugins/vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    wails("./bindings"),
    solid(),
    tailwindcss(),
  ],
  server: {
    host: "127.0.0.1",
    port: Number(process.env.WAILS_VITE_PORT) || 9245,
    strictPort: true,
  }
});
