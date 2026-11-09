const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "game.js",
    chunkFilename: "world-loader.worker.js",
    publicPath: "",
    clean: true,
  },
  mode: "production",
  devtool: false,
  optimization: {
    splitChunks: false,
    runtimeChunk: false,
    minimize: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.WORLD_ASSETS_ROOT": JSON.stringify("./assets/world3-files"),
    }),
  ],
  performance: {
    hints: false,
  },
};
