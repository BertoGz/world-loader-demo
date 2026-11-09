# World Loader

Phaser 3 demo for streaming large Tiled worlds with chunked loading, IndexedDB caching (Dexie), and RBush culling.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev-start
```

Open [http://localhost:3000](http://localhost:3000).

## Production build (local server)

```bash
npm run build
npm start
```

## Compile single-page demo

```bash
npm run compile
```

Output: **`dist/index.html`** (self-contained, ~2.5 MB).

## GitHub Pages (live demo)

If the site shows this README instead of the game, Pages is publishing **`main`**, not the built demo.

### Repo settings (one-time)

1. **Settings → Pages**
2. **Build and deployment → Source:** **Deploy from a branch**
3. **Branch:** **`gh-pages`** · **Folder:** **`/ (root)`** · **Save**

### Deploy the game

Push to **`main`** (include `.github/workflows/github-pages.yml`). The workflow runs `npm run compile` and pushes **`dist/`** to the **`gh-pages`** branch. The live URL is at the top of **Settings → Pages** (e.g. `https://<user>.github.io/<repo>/`).

You can also run the workflow manually: **Actions → Publish live demo → Run workflow**.

### Troubleshooting

| What you see | Fix |
|--------------|-----|
| README / install instructions | Pages source is **`main`**, not **`gh-pages`** |
| 404 | Wait for the Actions run to finish; confirm **`gh-pages`** exists |
| Old build | **Actions → Publish live demo → Run workflow** |
