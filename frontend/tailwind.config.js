/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.js",
    "./node_modules/flowbite-mithril/**/*.js"
  ],
  theme: {},
  plugins: [
    require("flowbite/plugin")
  ],
}

