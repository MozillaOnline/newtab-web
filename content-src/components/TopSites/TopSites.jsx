/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { actionCreators as ac, actionTypes as at } from "common/Actions.jsm";
import {
  MIN_CORNER_FAVICON_SIZE,
  MIN_RICH_FAVICON_SIZE,
  MOCOCN_MAX_TOP_SITES_FOR_WIDE_LAYOUT,
  TOP_SITES_SOURCE,
} from "./TopSitesConstants";
import { CollapsibleSection } from "content-src/components/CollapsibleSection/CollapsibleSection";
import { ComponentPerfTimer } from "content-src/components/ComponentPerfTimer/ComponentPerfTimer";
import { connect } from "react-redux";
import { IS_MOCOCN_NEWTAB } from "content-src/lib/constants";
import { ModalOverlayWrapper } from "../../asrouter/components/ModalOverlay/ModalOverlay";
import React from "react";
import { SearchShortcutsForm } from "./SearchShortcutsForm";
import { TOP_SITES_MAX_SITES_PER_ROW } from "common/Reducers.jsm";
import { TopSiteForm } from "./TopSiteForm";
import { TopSiteList } from "./TopSite";

function topSiteIconType(link) {
  if (link.customScreenshotURL) {
    return "custom_screenshot";
  }
  if (link.tippyTopIcon || link.faviconRef === "tippytop") {
    return "tippytop";
  }
  if (link.faviconSize >= MIN_RICH_FAVICON_SIZE) {
    return "rich_icon";
  }
  if (link.screenshot && link.faviconSize >= MIN_CORNER_FAVICON_SIZE) {
    return "screenshot_with_icon";
  }
  if (link.screenshot) {
    return "screenshot";
  }
  return "no_image";
}

/**
 * Iterates through TopSites and counts types of images.
 * @param acc Accumulator for reducer.
 * @param topsite Entry in TopSites.
 */
function countTopSitesIconsTypes(topSites) {
  const countTopSitesTypes = (acc, link) => {
    acc[topSiteIconType(link)]++;
    return acc;
  };

  return topSites.reduce(countTopSitesTypes, {
    custom_screenshot: 0,
    screenshot_with_icon: 0,
    screenshot: 0,
    tippytop: 0,
    rich_icon: 0,
    no_image: 0,
  });
}

export class _TopSites extends React.PureComponent {
  get mococnWideLayout() {
    return IS_MOCOCN_NEWTAB &&
      this.props.TopSites.rows.length <= MOCOCN_MAX_TOP_SITES_FOR_WIDE_LAYOUT;
  }

  constructor(props) {
    super(props);
    this.onEditFormClose = this.onEditFormClose.bind(this);
    this.onSearchShortcutsFormClose = this.onSearchShortcutsFormClose.bind(
      this
    );
  }

  /**
   * Dispatch session statistics about the quality of TopSites icons and pinned count.
   */
  _dispatchTopSitesStats() {
    const topSites = this._getVisibleTopSites().filter(
      topSite => topSite !== null && topSite !== undefined
    );
    const topSitesIconsStats = countTopSitesIconsTypes(topSites);
    const topSitesPinned = topSites.filter(site => !!site.isPinned).length;
    const searchShortcuts = topSites.filter(site => !!site.searchTopSite)
      .length;
    // Dispatch telemetry event with the count of TopSites images types.
    this.props.dispatch(
      ac.AlsoToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data: {
          topsites_icon_stats: topSitesIconsStats,
          topsites_pinned: topSitesPinned,
          topsites_search_shortcuts: searchShortcuts,
        },
      })
    );
  }

  /**
   * Return the TopSites that are visible based on prefs and window width.
   */
  _getVisibleTopSites() {
    // We hide 2 sites per row when not in the wide layout.
    let sitesPerRow = TOP_SITES_MAX_SITES_PER_ROW;
    // $break-point-widest = 1072px (from _variables.scss)
    if (!global.matchMedia(`(min-width: 1072px)`).matches) {
      sitesPerRow -= 2;
    }

    if (this.mococnWideLayout) {
      sitesPerRow /= 2;
    }
    return this.props.TopSites.rows.slice(
      0,
      this.props.TopSitesRows * sitesPerRow
    );
  }

  componentDidUpdate() {
    this._dispatchTopSitesStats();
  }

  componentDidMount() {
    this._dispatchTopSitesStats();
  }

  onEditFormClose() {
    this.props.dispatch(
      ac.UserEvent({
        source: TOP_SITES_SOURCE,
        event: "TOP_SITES_EDIT_CLOSE",
      })
    );
    this.props.dispatch({ type: at.TOP_SITES_CANCEL_EDIT });
  }

  onSearchShortcutsFormClose() {
    this.props.dispatch(
      ac.UserEvent({
        source: TOP_SITES_SOURCE,
        event: "SEARCH_EDIT_CLOSE",
      })
    );
    this.props.dispatch({ type: at.TOP_SITES_CLOSE_SEARCH_SHORTCUTS_MODAL });
  }

  render() {
    const { props } = this;
    const { editForm, showSearchShortcutsForm } = props.TopSites;
    const extraMenuOptions = ["AddTopSite"];
    const {
      customizationMenuEnabled,
      newNewtabExperienceEnabled,
    } = props.Prefs.values.featureConfig;
    const colors = props.Prefs.values["newNewtabExperience.colors"];

    if (props.Prefs.values["improvesearch.topSiteSearchShortcuts"]) {
      extraMenuOptions.push("AddSearchShortcut");
    }

    const canShowCustomizationMenu =
      newNewtabExperienceEnabled || customizationMenuEnabled;
    const hideTitle =
      props.Prefs.values.hideTopSitesTitle || canShowCustomizationMenu;

    // `collapsed` should be sent to CollapsibleSection as undefined if
    // `props.TopSites.pref` is not set to true.
    let collapsed;
    if (props.TopSites.pref) {
      collapsed = canShowCustomizationMenu
        ? false
        : props.TopSites.pref.collapsed;
    }

    return (
      <ComponentPerfTimer
        id="topsites"
        initialized={props.TopSites.initialized}
        dispatch={props.dispatch}
      >
        <CollapsibleSection
          className="top-sites"
          icon="topsites"
          id="topsites"
          title={props.title || { id: "newtab-section-header-topsites" }}
          hideTitle={hideTitle}
          extraMenuOptions={extraMenuOptions}
          showPrefName="feeds.topsites"
          eventSource={TOP_SITES_SOURCE}
          collapsed={collapsed}
          isFixed={props.isFixed}
          isFirst={props.isFirst}
          isLast={props.isLast}
          dispatch={props.dispatch}
        >
          <TopSiteList
            TopSites={props.TopSites}
            TopSitesRows={props.TopSitesRows}
            dispatch={props.dispatch}
            mococnWideLayout={this.mococnWideLayout}
            topSiteIconType={topSiteIconType}
            newNewtabExperienceEnabled={newNewtabExperienceEnabled}
            colors={colors}
          />
          <div className="edit-topsites-wrapper">
            {editForm && (
              <div className="edit-topsites">
                <ModalOverlayWrapper
                  unstyled={true}
                  onClose={this.onEditFormClose}
                  innerClassName="modal"
                >
                  <TopSiteForm
                    site={props.TopSites.rows[editForm.index]}
                    onClose={this.onEditFormClose}
                    dispatch={this.props.dispatch}
                    mococnWideLayout={this.mococnWideLayout}
                    {...editForm}
                    newNewtabExperienceEnabled={newNewtabExperienceEnabled}
                    customizationMenuEnabled={customizationMenuEnabled}
                  />
                </ModalOverlayWrapper>
              </div>
            )}
            {showSearchShortcutsForm && (
              <div className="edit-search-shortcuts">
                <ModalOverlayWrapper
                  unstyled={true}
                  onClose={this.onSearchShortcutsFormClose}
                  innerClassName="modal"
                >
                  <SearchShortcutsForm
                    TopSites={props.TopSites}
                    onClose={this.onSearchShortcutsFormClose}
                    dispatch={this.props.dispatch}
                  />
                </ModalOverlayWrapper>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </ComponentPerfTimer>
    );
  }
}

export const TopSites = connect((state, props) => {
  // For SPOC Experiment only, take TopSites from DiscoveryStream TopSites that takes in SPOC Data
  let topSites = props.TopSitesWithSpoc || state.TopSites;

  if (IS_MOCOCN_NEWTAB) {
    // Keep pinned sites only
    let pinnedOnlyRows = [];
    topSites.rows.forEach((site, index) => {
      if (site && site.isPinned && !site.searchTopSite) {
        pinnedOnlyRows[index] = site;
      }
    });

    // Prefer screenshot to large favicon for mococn-wide layout
    const {
      newNewtabExperienceEnabled,
    } = state.Prefs.values.featureConfig;
    if (
      !newNewtabExperienceEnabled &&
      pinnedOnlyRows.length <= MOCOCN_MAX_TOP_SITES_FOR_WIDE_LAYOUT
    ) {
      pinnedOnlyRows = pinnedOnlyRows.map((site, index) => {
        if (site.faviconSize >= MIN_RICH_FAVICON_SIZE) {
          site.faviconSize = MIN_CORNER_FAVICON_SIZE;
          // Should trigger capturing of an extra screenshot here
        }
        return site;
      });
    }

    topSites.rows = pinnedOnlyRows;
  }

  return {
    TopSites: topSites,
    Prefs: state.Prefs,
    TopSitesRows: state.Prefs.values.topSitesRows,
  };
})(_TopSites);
