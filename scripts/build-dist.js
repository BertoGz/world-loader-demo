#!/usr/bin/env node
/**
 * Builds a self-contained dist/index.html (inlined JS + embedded assets).
 * Optional: --with-assets-folder copies assets/ beside index.html for debugging.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const publicAssets = path.join(root, "public", "assets");
const worldFilesDir = path.join(publicAssets, "world3-files");

const withAssetsFolder = process.argv.includes("--with-assets-folder");

const ASSET_FILES = [
  "monster-ghost.png",
  "nature-tile.png",
  "icons_16x16.png",
  "air-balloon.png",
  "tree.png",
];

const HTML_SHELL = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1,user-scalable=no, viewport-fit=cover"
    />
    <title>World Loader Demo</title>
    <style type="text/css">
      html,
      canvas {
        image-rendering: pixelated;
        image-rendering: crisp-edges;
      }

      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: white;
      }
    </style>
  </head>
  <body>
    __EMBEDDED_ASSETS__
    __WORKER_BOOTSTRAP__
    __GAME_SCRIPT__

    <div style="display: flex">
      <fieldset>
        <legend>controls</legend>
        <p>press/touch to move</p>
      </fieldset>
      <fieldset style="display: flex;">
        <legend>debug parameters:</legend>
        <div>
          <input type="checkbox" id="zoom-out" name="zoom-out" />
          <label for="zoom-out">Zoom Out</label>
        </div>
        <div>
          <input type="checkbox" id="clear storage" name="clear storage" />
          <label for="clear storage">Clear Storage</label>
        </div>
      </fieldset>
    </div>
  </body>
</html>
`;

const FETCH_SHIM_SOURCE = `
(function () {
  var jsonAssets = window.__FETCH_JSON__ || {};
  var nativeFetch = window.fetch.bind(window);

  function normalizeFetchUrl(url) {
    if (typeof url !== "string") return url;
    if (jsonAssets[url] !== undefined) return url;
    try {
      var resolved = new URL(url, window.location.href).href;
      if (jsonAssets[resolved] !== undefined) return resolved;
    } catch (e) {}
    var assetIndex = url.indexOf("/assets/");
    if (assetIndex !== -1) {
      var relative = "." + url.slice(assetIndex);
      if (jsonAssets[relative] !== undefined) return relative;
    }
    return url;
  }

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : input && input.url;
    var key = normalizeFetchUrl(url);
    if (jsonAssets[key] !== undefined) {
      return Promise.resolve(
        new Response(JSON.stringify(jsonAssets[key]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
    return nativeFetch(input, init);
  };
})();
`;

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      copyFile(from, to);
    }
  }
}

function escapeScriptContents(js) {
  return js.replace(/<\/script/gi, "<\\/script");
}

function mimeForExt(ext) {
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function buildEmbeddedAssets() {
  const fetchJson = {};
  const assetUrls = {};

  for (const file of ASSET_FILES) {
    const relative = `./assets/${file}`;
    const buffer = fs.readFileSync(path.join(publicAssets, file));
    const mime = mimeForExt(path.extname(file));
    assetUrls[relative] = `data:${mime};base64,${buffer.toString("base64")}`;
  }

  for (const name of fs.readdirSync(worldFilesDir)) {
    if (!name.endsWith(".json")) continue;
    const relative = `./assets/world3-files/${name}`;
    fetchJson[relative] = JSON.parse(
      fs.readFileSync(path.join(worldFilesDir, name), "utf8")
    );
  }

  const payload = `window.__FETCH_JSON__ = ${JSON.stringify(fetchJson)};
window.__ASSET_URLS__ = ${JSON.stringify(assetUrls)};`;

  return `<script>\n${payload}\n${FETCH_SHIM_SOURCE}\n</script>`;
}

function cleanDistOutput() {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
}

function main() {
  cleanDistOutput();

  console.log("Running webpack (production)...");
  execSync("npx webpack --config webpack.config.dist.js", {
    cwd: root,
    stdio: "inherit",
  });

  const jsFiles = fs
    .readdirSync(distDir)
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join(distDir, name));

  const workerFile = jsFiles.find((p) => /worker/i.test(path.basename(p)));
  const gameFile =
    jsFiles.find((p) => path.basename(p) === "game.js") ||
    jsFiles.find((p) => p !== workerFile);

  if (!gameFile) {
    throw new Error("Webpack did not emit game.js in dist/");
  }
  if (!workerFile) {
    throw new Error("Webpack did not emit a worker bundle in dist/");
  }

  const workerSource = fs.readFileSync(workerFile, "utf8");
  const gameSource = fs.readFileSync(gameFile, "utf8");

  const embeddedAssets = buildEmbeddedAssets();

  const workerBootstrap = `<script>
(function () {
  var workerSource = ${JSON.stringify(workerSource)};
  var blob = new Blob([workerSource], { type: "application/javascript" });
  window.__WORLD_LOADER_WORKER_URL__ = URL.createObjectURL(blob);
})();
</script>`;

  const gameScript = `<script>\n${escapeScriptContents(gameSource)}\n</script>`;

  const html = HTML_SHELL.replace("__EMBEDDED_ASSETS__", embeddedAssets)
    .replace("__WORKER_BOOTSTRAP__", workerBootstrap)
    .replace("__GAME_SCRIPT__", gameScript);

  for (const file of jsFiles) {
    fs.unlinkSync(file);
  }
  for (const name of fs.readdirSync(distDir)) {
    if (name.endsWith(".map") || name.endsWith(".txt")) {
      fs.unlinkSync(path.join(distDir, name));
    }
  }

  fs.writeFileSync(path.join(distDir, "index.html"), html, "utf8");
  fs.writeFileSync(path.join(distDir, ".nojekyll"), "");

  if (withAssetsFolder) {
    const distAssets = path.join(distDir, "assets");
    fs.mkdirSync(distAssets, { recursive: true });
    for (const file of ASSET_FILES) {
      copyFile(path.join(publicAssets, file), path.join(distAssets, file));
    }
    copyDir(worldFilesDir, path.join(distAssets, "world3-files"));
  }

  const htmlSizeMb = (
    fs.statSync(path.join(distDir, "index.html")).size /
    (1024 * 1024)
  ).toFixed(2);

  console.log("");
  console.log("Dist build complete:");
  console.log(
    `  ${path.join(distDir, "index.html")} (${htmlSizeMb} MB, self-contained)`
  );
  if (withAssetsFolder) {
    console.log(`  ${path.join(distDir, "assets")} (optional external assets)`);
  }
  console.log("");
  console.log("Preview: npx serve dist");
}

main();
