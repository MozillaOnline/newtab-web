/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const child_process = require("child_process");
const path = require("path");
const webpack = require("webpack");
const { ResourceUriPlugin } = require("./tools/resourceUriPlugin");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { SubresourceIntegrityPlugin } = require("webpack-subresource-integrity");
const WorkboxPlugin = require("workbox-webpack-plugin");

const absolute = relPath => path.join(__dirname, relPath);

const resourcePathRegEx = /^resource:\/\/activity-stream\//;

function git(command) {
  return child_process.execSync(`git ${command}`, { encoding: "utf8" }).trim();
}

module.exports = (env = {}) => ({
  mode: "none",
  entry: {
    "activity-stream": absolute("content-src/activity-stream.jsx"),
  },
  output: {
    filename: "[name].[contenthash].js",
    crossOriginLoading: "anonymous",
  },
  optimization: {
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
      inject: "body",
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
    // The ResourceUriPlugin handles translating resource URIs in import
    // statements in .mjs files, in a similar way to what babel-jsm-to-commonjs
    // does for jsm files.
    new ResourceUriPlugin({ resourcePathRegEx }),
    new SubresourceIntegrityPlugin({
      hashFuncNames: ["sha512"],
    }),
    new webpack.DefinePlugin({
      SENTRY_DSN: JSON.stringify(process.env.SENTRY_DSN),
      SENTRY_ENVIRONMENT: JSON.stringify(process.env.NODE_ENV),
      SENTRY_RELEASE: JSON.stringify(git("describe --dirty")),
      SENTRY_SAMPLE_RATE: JSON.parse(process.env.SENTRY_SAMPLE_RATE),
    }),
    new WorkboxPlugin.GenerateSW(),
  ],
  module: {
    rules: [
      {
        test: require.resolve("./gecko-dev/contentSearchHandoffUI.js"),
        use: [
          {
            loader: "expose-loader",
            options: {
              exposes: {
                globalName: "ContentSearchHandoffUIController",
                moduleLocalName: "ContentSearchHandoffUIController",
              },
            },
          },
          {
            loader: "exports-loader",
            options: {
              exports: {
                syntax: "named",
                name: "ContentSearchHandoffUIController",
              },
            },
          },
        ],
      },
      {
        test: require.resolve("./gecko-dev/contentSearchUI.js"),
        use: [
          {
            loader: "imports-loader",
            options: {
              wrapper: "window",
            },
          },
        ],
      },
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
              "./tools/babel-jsm-to-commonjs.js",
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
        type: "asset/source",
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
        type: "asset/resource",
      },
    ],
  },
  // This resolve config allows us to import with paths relative to the root directory, e.g. "lib/ActivityStream.jsm"
  resolve: {
    extensions: [".js", ".jsx"],
    modules: ["node_modules", __dirname],
    fallback: {
      stream: require.resolve("stream-browserify"),
    },
  },
});
