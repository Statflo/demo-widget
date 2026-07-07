const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const InterpolateHtmlPlugin = require("interpolate-html-plugin");

module.exports = {
  entry: "./src/index",
  mode: "development",
  output: {
    publicPath: 'http://localhost:3000/'
  },
  devServer: {
    port: 3000,
    allowedHosts: 'all'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
    ],
  },
  plugins: [
    new InterpolateHtmlPlugin({
      PUBLIC_URL: "",
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      filename: "./index.html",
      favicon: "./public/favicon.ico",
      manifest: "./public/manifest.json",
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    // Some dependencies (e.g. @statflo/ui) ship their own nested copy of
    // react/react-dom. If that copy doesn't get deduped by yarn/npm, you end
    // up with two React instances in the bundle, which breaks hooks with
    // "Invalid hook call" / "Cannot read properties of null (reading
    // 'useState')" errors. These aliases force everything — including
    // node_modules — to resolve to this project's single copy.
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  target: "web",
};

