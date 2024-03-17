module.exports = {
  darkMode: "media",
  content: [
    "./node_modules/flowbite/**/*.js",
    "./content/**/*.md",
    "./layouts/**/*.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [require("flowbite/plugin")],
};
