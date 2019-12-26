/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require("path");
const webpack = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const SriPlugin = require("webpack-subresource-integrity");
const WorkboxPlugin = require("workbox-webpack-plugin");

const absolute = relPath => path.join(__dirname, relPath);

const resourcePathRegEx = /^resource:\/\/activity-stream\//;

module.exports = (env = {}) => ({
  mode: "none",
  entry: {
    "activity-stream": absolute("content-src/activity-stream.jsx"),
  },
  output: {
    path: absolute("dist"),
    filename: "[name].[contenthash].js",
    crossOriginLoading: "anonymous",
  },
  optimization: {
    // moduleIds: "hashed",
    splitChunks: {
      cacheGroups: {
        // I don't really understand how this works, yet
        "gecko": {
          test: /[\\/]gecko-dev[\\/]\w+\.js$/,
          name: "gecko",
          chunks: "all",
        },
        "vendors": {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },
  devtool: "source-map",
  plugins: [
    new HtmlWebpackPlugin({
      filename: "activity-stream.html",
      minify: {
        collapseWhitespace: true,
        maxLineLength: 80,
      },
      // Need a better template
      template: "mococn/china-newtab.html",
    }),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
    new SriPlugin({
      hashFuncNames: ["sha512"],
    }),
    new WorkboxPlugin.GenerateSW({
      importWorkboxFrom: "local",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules\/(?!(fluent|fluent-react)\/).*/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-react"],
          plugins: [
            "@babel/plugin-proposal-optional-chaining",
            "@babel/plugin-syntax-dynamic-import",
          ],
        },
      },
      {
        test: /\.jsm$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        // Converts .jsm files into common-js modules
        options: {
          plugins: [
            [
              "jsm-to-esmodules",
              {
                basePath: resourcePathRegEx,
                removeOtherImports: true,
                replace: true,
              },
            ],
          ],
        },
      },
      {
        test: /\.ftl$/i,
        use: "raw-loader",
      },
      {
        test: /\.scss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
            },
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(gif|jpe?g|png|svg)$/i,
        use: "file-loader",
      },
      {
        test: require.resolve("./gecko-dev/contentSearchUI.js"),
        use: "imports-loader?this=>window",
      },
    ],
  },
  // This resolve config allows us to import with paths relative to the root directory, e.g. "lib/ActivityStream.jsm"
  resolve: {
    extensions: [".js", ".jsx"],
    modules: ["node_modules", "."],
  },
});
