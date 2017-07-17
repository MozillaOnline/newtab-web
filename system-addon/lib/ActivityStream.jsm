/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;

// NB: Eagerly load modules that will be loaded/constructed/initialized in the
// common case to avoid the overhead of wrapping and detecting lazy loading.
const {actionTypes: at} = Cu.import("resource://activity-stream/common/Actions.jsm", {});
const {DefaultPrefs} = Cu.import("resource://activity-stream/lib/ActivityStreamPrefs.jsm", {});
const {LocalizationFeed} = Cu.import("resource://activity-stream/lib/LocalizationFeed.jsm", {});
const {NewTabInit} = Cu.import("resource://activity-stream/lib/NewTabInit.jsm", {});
const {PlacesFeed} = Cu.import("resource://activity-stream/lib/PlacesFeed.jsm", {});
const {PrefsFeed} = Cu.import("resource://activity-stream/lib/PrefsFeed.jsm", {});
const {Store} = Cu.import("resource://activity-stream/lib/Store.jsm", {});
const {TelemetryFeed} = Cu.import("resource://activity-stream/lib/TelemetryFeed.jsm", {});
const {TopSitesFeed} = Cu.import("resource://activity-stream/lib/TopSitesFeed.jsm", {});
const {DummySectionFeed} = Cu.import("resource://activity-stream/lib/DummySectionFeed.jsm", {});

const REASON_ADDON_UNINSTALL = 6;

// Sections, keyed by section id
const SECTIONS = new Map([
  ["dummy_section", {
    feed: DummySectionFeed,
    showByDefault: false
  }]
]);

const SECTION_FEEDS_CONFIG = Array.from(SECTIONS.entries()).map(entry => {
  const id = entry[0];
  const {feed: Feed, showByDefault: value} = entry[1];
  return {
    name: `section.${id}`,
    factory: () => new Feed(),
    title: `${id} section feed`,
    value
  };
});

const PREFS_CONFIG = new Map([
  ["default.sites", {
    title: "Comma-separated list of default top sites to fill in behind visited sites",
    value: "https://www.facebook.com/,https://www.youtube.com/,https://www.amazon.com/,https://www.yahoo.com/,https://www.ebay.com/,https://twitter.com/"
  }],
  ["showSearch", {
    title: "Show the Search bar on the New Tab page",
    value: true
  }],
  ["showTopSites", {
    title: "Show the Top Sites section on the New Tab page",
    value: true
  }],
  ["telemetry", {
    title: "Enable system error and usage data collection",
    value: true,
    value_local_dev: false
  }],
  ["telemetry.log", {
    title: "Log telemetry events in the console",
    value: false,
    value_local_dev: true
  }],
  ["telemetry.ping.endpoint", {
    title: "Telemetry server endpoint",
    value: "https://onyx_tiles.stage.mozaws.net/v4/links/activity-stream"
  }]
]);

const FEEDS_CONFIG = new Map();
for (const {name, factory, title, value} of SECTION_FEEDS_CONFIG.concat([
  {
    name: "localization",
    factory: () => new LocalizationFeed(),
    title: "Initialize strings and detect locale for Activity Stream",
    value: true
  },
  {
    name: "newtabinit",
    factory: () => new NewTabInit(),
    title: "Sends a copy of the state to each new tab that is opened",
    value: true
  },
  {
    name: "places",
    factory: () => new PlacesFeed(),
    title: "Listens for and relays various Places-related events",
    value: true
  },
  {
    name: "prefs",
    factory: () => new PrefsFeed(PREFS_CONFIG),
    title: "Preferences",
    value: true
  },
  {
    name: "telemetry",
    factory: () => new TelemetryFeed(),
    title: "Relays telemetry-related actions to TelemetrySender",
    value: true
  },
  {
    name: "topsites",
    factory: () => new TopSitesFeed(),
    title: "Queries places and gets metadata for Top Sites section",
    value: true
  }
])) {
  const pref = `feeds.${name}`;
  FEEDS_CONFIG.set(pref, factory);
  PREFS_CONFIG.set(pref, {title, value});
}

this.ActivityStream = class ActivityStream {

  /**
   * constructor - Initializes an instance of ActivityStream
   *
   * @param  {object} options Options for the ActivityStream instance
   * @param  {string} options.id Add-on ID. e.g. "activity-stream@mozilla.org".
   * @param  {string} options.version Version of the add-on. e.g. "0.1.0"
   * @param  {string} options.newTabURL URL of New Tab page on which A.S. is displayed. e.g. "about:newtab"
   */
  constructor(options = {}) {
    this.initialized = false;
    this.options = options;
    this.store = new Store();
    this.feeds = FEEDS_CONFIG;
    this._defaultPrefs = new DefaultPrefs(PREFS_CONFIG);
  }
  init() {
    this._defaultPrefs.init();
    this.store.init(this.feeds);
    this.store.dispatch({
      type: at.INIT,
      data: {version: this.options.version}
    });
    this.initialized = true;
  }
  uninit() {
    this.store.dispatch({type: at.UNINIT});
    this.store.uninit();

    this.initialized = false;
  }
  uninstall(reason) {
    if (reason === REASON_ADDON_UNINSTALL) {
      // This resets all prefs in the config to their default values,
      // so we DON'T want to do this on an upgrade/downgrade, only on a
      // real uninstall
      this._defaultPrefs.reset();
    }
  }
};

this.PREFS_CONFIG = PREFS_CONFIG;
this.EXPORTED_SYMBOLS = ["ActivityStream", "SECTIONS"];
