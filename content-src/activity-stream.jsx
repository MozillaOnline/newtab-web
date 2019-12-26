/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import "content-src/styles/activity-stream-mac.scss";
import "content-src/styles/mococn.scss";

import "mococn/fluent-web";

import "gecko-dev/contentSearchUI";
import "gecko-dev/contentSearchHandoffUI";
import "gecko-dev/contentTheme";

import { actionCreators as ac, actionTypes as at } from "common/Actions.jsm";
import { Base } from "content-src/components/Base/Base";
import { DetectUserSessionStart } from "content-src/lib/detect-user-session-start";
import { initStore } from "content-src/lib/init-store";
import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom";
import { reducers } from "common/Reducers.jsm";

const store = initStore(reducers);

new DetectUserSessionStart(store).sendEventOrAddListener();

store.dispatch(ac.AlsoToMain({ type: at.NEW_TAB_STATE_REQUEST }));

ReactDOM.hydrate(
  <Provider store={store}>
    <Base
      isFirstrun={global.document.location.href === "about:welcome"}
      strings={global.gActivityStreamStrings}
    />
  </Provider>,
  document.getElementById("root")
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").then(registration => {
      global.console.log("SW registered: ", registration);
    }).catch(registrationError => {
      global.console.log("SW registration failed: ", registrationError);
    });
  });
}
