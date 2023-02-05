# sACNView

An app to view DMX data received over sACN (ANSI E1.31) in the style of Haute Technique's [ArtNetView](https://artnetview.com/).  
Built using [ElectronJS](https://www.electronjs.org/) and [React](https://reactjs.org/).


## Install

Precompiled binaries for macOS, Windows and Linux (AppImage) can be found on the [Releases](https://gitlab.com/patopest/sacnview/-/releases) page.


## Dev

- Install dependencies

```shell
yarn install
```

- Run App 

```shell
yarn start
```
This starts the React frontend with webpack and a local dev server then launches electron loading this frontend.

- Build App

```shell
yarn build
yarn build --mac --windows --linux   # for all platforms
```

## References

- sACN (ANSI E1.31) [specification](https://tsp.esta.org/tsp/documents/docs/ANSI_E1-31-2018.pdf).  
- Haute Technique's [ArtNetView](https://artnetview.com/).
- Open Lighting Architecure (OLA) [framework](https://github.com/OpenLightingProject/ola) (low-level implementations of control protocols).