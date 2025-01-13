import m from "mithril"
import './app.css'

import { DMX } from './views/dmx'

m.route.prefix = ""
m.route(document.body, "/", {
  "/": {
    render: () => [
      m(DMX),
    ],
  },
})
