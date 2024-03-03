# sACN Monitor

An app to view DMX data received over sACN (ANSI E1.31) in the style of Haute Technique's [ArtNetView](https://artnetview.com/). 

Built using:

- [Wails](https://wails.io/): Go backend
- [Mithril](https://mithril.js.org/): JS frontend framework
- [TailwindCSS](https://tailwindcss.com/) and [Flowbite](https://flowbite.com/) on top of Mithril


## Install

Precompiled binaries for macOS, Windows and Linux (AppImage) can be found on the [Releases](https://gitlab.com/patopest/sacn-monitor/-/releases) page.


## Dev

- Install dependencies

Follow the Wails [Getting Started](https://wails.io/docs/gettingstarted/installation).

You need `go` installed and `GOPATH` set in you `PATH`.

```shell
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

- Run App 

```shell
wails dev
```
This will start a Vite development server.
The app can also be developed in a browser at [http://localhost:34115]().

- Build App

```shell
wails build
```

## References

- sACN (ANSI E1.31) [specification](https://tsp.esta.org/tsp/documents/docs/ANSI_E1-31-2018.pdf).  
- ArtNet v4 [specification](https://www.artisticlicence.com/WebSiteMaster/User%20Guides/art-net.pdf) from (c) Artistic Licence Holding Ltd.
- Haute Technique's [ArtNetView](https://artnetview.com/).
- Open Lighting Architecure (OLA) [framework](https://github.com/OpenLightingProject/ola) (low-level implementations of control protocols).