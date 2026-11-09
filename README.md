# World Loader

Phaser 3 demo for streaming large Tiled worlds with chunked loading, IndexedDB caching (Dexie), and RBush culling.

## Installation

```bash
npm install
```

## Development

Builds with webpack and starts the server on file changes:

```bash
npm run dev-start
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
npm start
```

## Single-page static dist

Builds `dist/index.html` with all JavaScript inlined (worker via blob URL) and copies game assets to `dist/assets/`:

```bash
npm run build:dist
npx serve dist
```

Open the URL from `serve` (must use HTTP; `file://` will not load assets).
