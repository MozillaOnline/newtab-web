/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import "content-src/styles/activity-stream-mac.scss";
import "content-src/styles/mococn.scss";

import "mococn/fluent-web";

import "gecko-dev/contentSearchUI";
import "gecko-dev/contentSearchHandoffUI";
import "gecko-dev/contentTheme";

import {
  actionCreators as ac,
  actionTypes as at,
} from "common/Actions.sys.mjs";
import { Base } from "content-src/components/Base/Base";
import { DetectUserSessionStart } from "content-src/lib/detect-user-session-start";
import { initStore, initMoCoCNPrefs } from "content-src/lib/init-store";
import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom";
import { reducers } from "common/Reducers.sys.mjs";
import * as Sentry from "@sentry/react";

if (SENTRY_DSN) {
  Sentry.init({
    beforeSend(event, hint) {
      try {
        if (
          hint &&
          hint.originalException &&
          hint.originalException.message === "Element is not a row"
        ) {
          let [arg0] = event.extra.arguments;
          if (
            arg0.type === "mouseout" && [
              "table#searchSuggestionTable.contentSearchSuggestionTable",
              "table.contentSearchOneOffsTable.contentSearchSuggestionsContainer",
            ].includes(arg0.target)
          ) {
            return null;
          }
        }
      } catch (ex) {
        global.console.error(ex);
      }
      return event;
    },
    denyUrls: [
      /^moz-extension:\/\//i,
    ],
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
    sampleRate: SENTRY_SAMPLE_RATE,
  });
}

export const NewTab = ({ store }) => (
  <Provider store={store}>
    <Base />
  </Provider>
);

export function renderWithoutState() {
  const store = initStore(reducers);
  initMoCoCNPrefs(store);
  new DetectUserSessionStart(store).sendEventOrAddListener();

  // If this document has already gone into the background by the time we've reached
  // here, we can deprioritize requesting the initial state until the event loop
  // frees up. If, however, the visibility changes, we then send the request.
  let didRequest = false;
  let requestIdleCallbackId = 0;
  function doRequest() {
    if (!didRequest) {
      if (requestIdleCallbackId) {
        cancelIdleCallback(requestIdleCallbackId);
      }
      didRequest = true;
      store.dispatch(ac.AlsoToMain({ type: at.NEW_TAB_STATE_REQUEST }));
    }
  }

  if (document.hidden) {
    requestIdleCallbackId = requestIdleCallback(doRequest);
    addEventListener("visibilitychange", doRequest, { once: true });
  } else {
    doRequest();
  }

  ReactDOM.hydrate(<NewTab store={store} />, document.getElementById("root"));
}

export function renderCache(initialState) {
  const store = initStore(reducers, initialState);
  initMoCoCNPrefs(store);
  new DetectUserSessionStart(store).sendEventOrAddListener();

  ReactDOM.hydrate(<NewTab store={store} />, document.getElementById("root"));
}

// Equivalent to that from data/content/newtab-render.js ?
renderWithoutState();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").then(registration => {
      global.console.log("SW registered: ", registration);
    }).catch(registrationError => {
      global.console.log("SW registration failed: ", registrationError);
    });
  });
}
