import "content-src/styles/activity-stream-mac.scss";
import "content-src/styles/mococn.scss";

import "gecko-dev/contentSearchUI";
import "gecko-dev/contentTheme";
import "prerendered/locales/zh-CN/activity-stream-strings.js";

import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import {Base} from "content-src/components/Base/Base";
import {DetectUserSessionStart} from "content-src/lib/detect-user-session-start";
import {initStore} from "content-src/lib/init-store";
import {Provider} from "react-redux";
import React from "react";
import ReactDOM from "react-dom";
import {reducers} from "common/Reducers.jsm";

const store = initStore(reducers, global.gActivityStreamPrerenderedState);

new DetectUserSessionStart(store).sendEventOrAddListener();

// If we are starting in a prerendered state, we must wait until the first render
// to request state rehydration (see Base.jsx). If we are NOT in a prerendered state,
// we can request it immedately.
if (!global.gActivityStreamPrerenderedState) {
  store.dispatch(ac.AlsoToMain({type: at.NEW_TAB_STATE_REQUEST}));
}

ReactDOM.hydrate(<Provider store={store}>
  <Base
    isFirstrun={global.document.location.href === "about:welcome"}
    isPrerendered={!!global.gActivityStreamPrerenderedState}
    locale={global.document.documentElement.lang}
    strings={global.gActivityStreamStrings} />
</Provider>, document.getElementById("root"));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").then(registration => {
      global.console.log("SW registered: ", registration);
    }).catch(registrationError => {
      global.console.log("SW registration failed: ", registrationError);
    });
  });
}
