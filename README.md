# World Loader

Phaser 3 demo for streaming large Tiled worlds with chunked loading, IndexedDB caching (Dexie), and RBush culling.

**Live demo (after Pages is set up):** https://bertogz.github.io/world-loader-demo/

## Local development

```bash
npm install
npm run dev-start
```

Open [http://localhost:3000](http://localhost:3000).

## Compile

```bash
npm run compile
```

Output: `dist/index.html` (self-contained).

---

## GitHub Pages — get the live URL

Your Actions runs were succeeding, but **Pages was not wired to the built game**, so GitHub showed the README or no URL.

### 1. Turn on Pages (this is what creates the link)

1. Repo: **https://github.com/BertoGz/world-loader-demo**
2. **Settings → Pages**
3. **Build and deployment → Source:** **`GitHub Actions`** (not “Deploy from a branch”)
4. Save if prompted — you will **not** pick `main` or `gh-pages` here

The public URL appears at the top of that **Pages** screen **after** step 3 below succeeds:

**https://bertogz.github.io/world-loader-demo/**

### 2. Push the workflow fix and run it

```bash
git pull
git add .github/workflows/github-pages.yml README.md
git commit -m "Fix GitHub Pages deploy"
git push origin main
```

### 3. Approve the environment (first time only)

1. **Actions → Publish live demo** — wait for green checkmarks on **both** `build` and `deploy`
2. If you see **“Waiting for approval”** on `deploy`, open it → **Review deployments** → approve **github-pages**
3. Go back to **Settings → Pages** — you should see **“Your site is live at …”**

### If there is still no link

| Check | What to do |
|--------|------------|
| Source is **Deploy from a branch** | Change to **GitHub Actions** |
| Only `build` ran, not `deploy` | Approve **github-pages** environment (Settings → Environments) |
| `publish live demo` failed | Open the failed run → read the **Build single-page demo** log |
| Old **gh-pages** branch | Ignore it; this workflow no longer uses that branch |

---

## Production build (Node server)

```bash
npm run build
npm start
```
