/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.js",
    "./node_modules/flowbite-mithril/**/*.js"
  ],
  theme: {},
  darkMode: 'class',
  plugins: [
    require("flowbite/plugin")
  ],
}

