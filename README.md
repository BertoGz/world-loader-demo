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

## Compile single-page `dist/index.html`

```bash
npm run compile
```

Builds one **self-contained** `dist/index.html` (~2.5 MB): game code, worker, Tiled world JSON, and sprites are embedded. No separate `assets/` folder is required.

Preview:

```bash
npx serve dist
```

Optional: emit a separate `dist/assets/` tree for debugging:

```bash
node scripts/build-dist.js --with-assets-folder
```

## GitHub Pages

**Settings → Pages → Source → GitHub Actions.** The workflow runs `npm run compile` and publishes `dist/`.
