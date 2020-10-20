/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { actionCreators as ac, actionTypes as at } from "common/Actions.jsm";
import { ASRouterUISurface } from "../../asrouter/asrouter-content";
import { ConfirmDialog } from "content-src/components/ConfirmDialog/ConfirmDialog";
import { connect } from "react-redux";
import { DiscoveryStreamBase } from "content-src/components/DiscoveryStreamBase/DiscoveryStreamBase";
import { MoCoCNEB as ErrorBoundary } from "content-src/components/ErrorBoundary/ErrorBoundary";
import { MoCoCNPromo } from "content-src/components/MoCoCNPromo/MoCoCNPromo";
import { CustomizeMenu } from "content-src/components/CustomizeMenu/CustomizeMenu";
import React from "react";
import { Search } from "content-src/components/Search/Search";
import { Sections } from "content-src/components/Sections/Sections";

export const PrefsButton = ({ onClick, icon }) => (
  <div className="prefs-button">
    <button
      className={`icon ${icon || "icon-settings"}`}
      onClick={onClick}
      data-l10n-id="newtab-settings-button"
    />
  </div>
);

// Returns a function will not be continuously triggered when called. The
// function will be triggered if called again after `wait` milliseconds.
function debounce(func, wait) {
  let timer;
  return (...args) => {
    if (timer) {
      return;
    }

    let wakeUp = () => {
      timer = null;
    };

    timer = setTimeout(wakeUp, wait);
    func.apply(this, args);
  };
}

export class _Base extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      message: {},
    };
    this.notifyContent = this.notifyContent.bind(this);
  }

  notifyContent(state) {
    this.setState(state);
  }

  componentWillUnmount() {
    this.updateTheme();
  }

  componentWillUpdate() {
    this.updateTheme();
  }

  updateTheme() {
    const bodyClassName = [
      "activity-stream",
      // If we skipped the about:welcome overlay and removed the CSS classes
      // we don't want to add them back to the Activity Stream view
      document.body.classList.contains("inline-onboarding")
        ? "inline-onboarding"
        : "",
    ]
      .filter(v => v)
      .join(" ");
    global.document.body.className = bodyClassName;
  }

  render() {
    const { props } = this;
    const { App } = props;

    if (!App.initialized) {
      return null;
    }

    return (
      <ErrorBoundary className="base-content-fallback">
        <React.Fragment>
          <BaseContent {...this.props} adminContent={this.state} />
        </React.Fragment>
      </ErrorBoundary>
    );
  }
}

export class BaseContent extends React.PureComponent {
  constructor(props) {
    super(props);
    this.openPreferences = this.openPreferences.bind(this);
    this.openCustomizationMenu = this.openCustomizationMenu.bind(this);
    this.closeCustomizationMenu = this.closeCustomizationMenu.bind(this);
    this.handleOnKeyDown = this.handleOnKeyDown.bind(this);
    this.onWindowScroll = debounce(this.onWindowScroll.bind(this), 5);
    this.setPref = this.setPref.bind(this);
    this.state = { fixedSearch: false, customizeMenuVisible: false };

    this.state.mococnShowLogo = false;
    this.onIntersectionChange = this.onIntersectionChange.bind(this);
    this.onTargetMount = this.onTargetMount.bind(this);
  }

  componentDidMount() {
    global.addEventListener("scroll", this.onWindowScroll);
    global.addEventListener("keydown", this.handleOnKeyDown);
  }

  componentWillUnmount() {
    global.removeEventListener("scroll", this.onWindowScroll);
    global.removeEventListener("keydown", this.handleOnKeyDown);
  }

  onIntersectionChange(entries, observer) {
    const [entry] = entries;
    const mococnShowLogo = entry.intersectionRatio === 1.0;
    this.setState({mococnShowLogo});
  }

  // Target `.search-inner-wrapper` since `padding-top` of `.search-wrapper` may change
  onTargetMount(target) {
    if (!IS_MOCOCN_NEWTAB) {
      return;
    }

    if (!this.intersectionObserver) {
      this.intersectionObserver = new global.IntersectionObserver(this.onIntersectionChange, {
        rootMargin: "-211px 0px 0px",
        threshold: 1.0,
      });
    }

    if (target) {
      this.intersectionObserver.observe(target);
    } else {
      this.intersectionObserver.disconnect();
    }
  }

  onWindowScroll() {
    const prefs = this.props.Prefs.values;
    const SCROLL_THRESHOLD = prefs["logowordmark.alwaysVisible"] ? 179 : 34;
    if (global.scrollY > SCROLL_THRESHOLD && !this.state.fixedSearch) {
      this.setState({ fixedSearch: true });
    } else if (global.scrollY <= SCROLL_THRESHOLD && this.state.fixedSearch) {
      this.setState({ fixedSearch: false });
    }
  }

  openPreferences() {
    this.props.dispatch(ac.OnlyToMain({ type: at.SETTINGS_OPEN }));
    this.props.dispatch(ac.UserEvent({ event: "OPEN_NEWTAB_PREFS" }));
  }

  openCustomizationMenu() {
    this.setState({ customizeMenuVisible: true });
    this.props.dispatch(ac.UserEvent({ event: "SHOW_PERSONALIZE" }));
  }

  closeCustomizationMenu() {
    if (this.state.customizeMenuVisible) {
      this.setState({ customizeMenuVisible: false });
      this.props.dispatch(ac.UserEvent({ event: "HIDE_PERSONALIZE" }));
    }
  }

  handleOnKeyDown(e) {
    if (e.key === "Escape") {
      this.closeCustomizationMenu();
    }
  }

  setPref(pref, value) {
    this.props.dispatch(ac.SetPref(pref, value));
  }

  renderPromosFromDS() {
    const dsLayout = this.props.DiscoveryStream.layout;
    if (dsLayout.length < 1) {
      return null;
    }
    const lastRow = dsLayout[dsLayout.length - 1];

    if (lastRow.components.length !== 2 || !lastRow.components.every(component => {
      return component.type === "MoCoCNPromo";
    })) {
      return null;
    }

    const promos = [];
    for (let component of lastRow.components) {
      const { options, shownUntil, type, url, variant } = component.properties;
      promos.push((
        <MoCoCNPromo
          options={options}
          shownUntil={shownUntil}
          type={type}
          url={url}
          variant={variant}
        />
      ));
    }
    return promos;
  }

  render() {
    const { props } = this;
    const { App } = props;
    const { initialized } = App;
    const prefs = props.Prefs.values;

    const isDiscoveryStream =
      props.DiscoveryStream.config && props.DiscoveryStream.config.enabled;
    if (!isDiscoveryStream) {
      this.setPref("discoverystream.config", JSON.stringify({
        "collapsible": true,
        "enabled": true,
        "show_spocs": false,
        "hardcoded_layout": false,
        "personalized": false,
        "layout_endpoint": "https://newtab.firefoxchina.cn/newtab/ds/china-basic.json",
      }));
      this.setPref("discoverystream.enabled", true);
    }
    let filteredSections = props.Sections.filter(
      section => section.id !== "topstories"
    );

    const pocketEnabled =
      prefs["feeds.section.topstories"] && prefs["feeds.system.topstories"];
    const noSectionsEnabled =
      !prefs["feeds.topsites"] &&
      !pocketEnabled &&
      filteredSections.filter(section => section.enabled).length === 0;
    const searchHandoffEnabled = prefs["improvesearch.handoffToAwesomebar"];
    const showCustomizationMenu = this.state.customizeMenuVisible;
    const enabledSections = {
      topSitesEnabled: prefs["feeds.topsites"],
      pocketEnabled: prefs["feeds.section.topstories"],
      highlightsEnabled: prefs["feeds.section.highlights"],
      showSponsoredTopSitesEnabled: prefs.showSponsoredTopSites,
      showSponsoredPocketEnabled: prefs.showSponsored,
      showRecentSavesEnabled: prefs.showRecentSaves,
      topSitesRowsCount: prefs.topSitesRows,
    };

    const pocketRegion = prefs["feeds.system.topstories"];
    const { mayHaveSponsoredTopSites } = prefs;

    const outerClassName = [
      "outer-wrapper",
      isDiscoveryStream && pocketEnabled && "ds-outer-wrapper-search-alignment",
      isDiscoveryStream && "ds-outer-wrapper-breakpoint-override",
      prefs.showSearch &&
        this.state.fixedSearch &&
        !noSectionsEnabled &&
        "fixed-search",
      prefs.showSearch && noSectionsEnabled && "only-search",
      prefs["logowordmark.alwaysVisible"] && "visible-logo",
    ]
      .filter(v => v)
      .join(" ");

    const hasSnippet =
      prefs["feeds.snippets"] &&
      this.props.adminContent &&
      this.props.adminContent.message &&
      this.props.adminContent.message.id;
    const promos = isDiscoveryStream ? this.renderPromosFromDS() : null;

    return (
      <div>
        <CustomizeMenu
          onClose={this.closeCustomizationMenu}
          onOpen={this.openCustomizationMenu}
          openPreferences={this.openPreferences}
          setPref={this.setPref}
          enabledSections={enabledSections}
          pocketRegion={pocketRegion}
          mayHaveSponsoredTopSites={mayHaveSponsoredTopSites}
          showing={showCustomizationMenu}
        />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions*/}
        <div className={outerClassName} onClick={this.closeCustomizationMenu}>
          <main className={hasSnippet ? "has-snippet" : ""}>
            {prefs.showSearch && (
              <div className="non-collapsible-section">
                <ErrorBoundary>
                  <Search                    
                    showLogo={
                      noSectionsEnabled ||
                      prefs["logowordmark.alwaysVisible"] ||
                      this.state.mococnShowLogo
                    }
                    onMoCoCNTargetMount={this.onTargetMount}
                    handoffEnabled={searchHandoffEnabled}
                    {...props.Search}
                  />
                </ErrorBoundary>
              </div>
            )}
            <ASRouterUISurface
              adminContent={this.props.adminContent}
              appUpdateChannel={this.props.Prefs.values.appUpdateChannel}
              fxaEndpoint={this.props.Prefs.values.fxa_endpoint}
              dispatch={this.props.dispatch}
            />
            <div className={`body-wrapper${initialized ? " on" : ""}`}>
              {isDiscoveryStream ? (
                <ErrorBoundary className="borderless-error">
                  <DiscoveryStreamBase locale={props.App.locale} />
                </ErrorBoundary>
              ) : (
                <Sections />
              )}
            </div>
            <ConfirmDialog />
          </main>

          {promos || (
            <React.Fragment>
              <MoCoCNPromo
                type="placeholder"
                variant="left"
              />
              <MoCoCNPromo
                type="placeholder"
                variant="right"
              />
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}

export const Base = connect(state => {
  let prefs = state.Prefs;
  // No search handoff, we want the different `tn` for `urlbar` & `newtab`
  prefs.values["improvesearch.handoffToAwesomebar"] = false;
  // We have taller top sites and don't want the logo (always) shown
  prefs.values["logowordmark.alwaysVisible"] = false;
  // Hide the sponsored topsites checkbox
  prefs.values.mayHaveSponsoredTopSites = false;

  return {
    App: state.App,
    Prefs: prefs,
    Sections: state.Sections,
    DiscoveryStream: state.DiscoveryStream,
    Search: state.Search,
  };
})(_Base);
