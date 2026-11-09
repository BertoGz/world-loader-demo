#!/usr/bin/env node
/**
 * Builds dist/index.html (single-page app with inlined JS) plus dist/assets/.
 * Serve dist with any static file server, e.g. npx serve dist
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const publicAssets = path.join(root, "public", "assets");

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

function main() {
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

  const workerBootstrap = `<script>
(function () {
  var workerSource = ${JSON.stringify(workerSource)};
  var blob = new Blob([workerSource], { type: "application/javascript" });
  window.__WORLD_LOADER_WORKER_URL__ = URL.createObjectURL(blob);
})();
</script>`;

  const gameScript = `<script>\n${escapeScriptContents(gameSource)}\n</script>`;

  const html = HTML_SHELL.replace("__WORKER_BOOTSTRAP__", workerBootstrap).replace(
    "__GAME_SCRIPT__",
    gameScript
  );

  for (const file of jsFiles) {
    fs.unlinkSync(file);
  }

  fs.writeFileSync(path.join(distDir, "index.html"), html, "utf8");

  const distAssets = path.join(distDir, "assets");
  fs.mkdirSync(distAssets, { recursive: true });

  for (const file of ASSET_FILES) {
    copyFile(path.join(publicAssets, file), path.join(distAssets, file));
  }

  copyDir(
    path.join(publicAssets, "world3-files"),
    path.join(distAssets, "world3-files")
  );

  const htmlSizeMb = (
    fs.statSync(path.join(distDir, "index.html")).size /
    (1024 * 1024)
  ).toFixed(2);

  console.log("");
  console.log("Dist build complete:");
  console.log(`  ${path.join(distDir, "index.html")} (${htmlSizeMb} MB, JS inlined)`);
  console.log(`  ${path.join(distAssets)} (sprites + world JSON)`);
  console.log("");
  console.log('Preview: npx serve dist  →  open the URL shown (e.g. http://localhost:3000)');
}

main();
