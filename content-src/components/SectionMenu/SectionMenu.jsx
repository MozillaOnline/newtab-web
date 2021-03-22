/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { actionCreators as ac } from "common/Actions.jsm";
import { ContextMenu } from "content-src/components/ContextMenu/ContextMenu";
import { IS_MOCOCN_NEWTAB } from "content-src/lib/constants";
import React from "react";
import { connect } from "react-redux";
import { SectionMenuOptions } from "content-src/lib/section-menu-options";

const DEFAULT_SECTION_MENU_OPTIONS = [
  "MoveUp",
  "MoveDown",
  "Separator",
  "RemoveSection",
  "CheckCollapsed",
  "Separator",
  "ManageSection",
];
const MOCOCN_SECTION_MENU_OPTIONS = [
  "MoveUp",
  "MoveDown",
  "Separator",
  "MoCoCNLessRows",
  "MoCoCNMoreRows",
  "Separator",
  "MoCoCNCheckCollapsed"
];
const WEBEXT_SECTION_MENU_OPTIONS = [
  "MoveUp",
  "MoveDown",
  "Separator",
  "CheckCollapsed",
  "Separator",
  "ManageWebExtension",
];

export class _SectionMenu extends React.PureComponent {
  handleAddWhileCollapsed() {
    const { action, userEvent } = SectionMenuOptions.ExpandSection(this.props);
    this.props.dispatch(action);
    if (userEvent) {
      this.props.dispatch(
        ac.UserEvent({
          event: userEvent,
          source: this.props.source,
        })
      );
    }
  }

  getOptions() {
    const { props } = this;

    // Only keep "CheckCollapsed" in our version
    const contextMenuOptions = IS_MOCOCN_NEWTAB
      ? MOCOCN_SECTION_MENU_OPTIONS
      : DEFAULT_SECTION_MENU_OPTIONS;
    const propOptions = props.isWebExtension
      ? [...WEBEXT_SECTION_MENU_OPTIONS]
      : [...contextMenuOptions];

    // `featureConfig` only available in `Prefs` since Fx 85,
    // see https://bugzil.la/1677180,1692227
    const { DiscoveryStream, Prefs: { values: prefs } } = this.props;
    const isDiscoveryStream =
      DiscoveryStream.config && DiscoveryStream.config.enabled;
    const {
      newNewtabExperienceEnabled
    } = isDiscoveryStream ? (prefs.featureConfig || {}) : {};
    // Remove Collapse/Expand related option if the `newNewtabExperience.enabled`
    // pref is set to true.
    if (newNewtabExperienceEnabled) {
      if (props.isWebExtension) {
        propOptions.splice(2, 2);
      } else if (IS_MOCOCN_NEWTAB) {
        propOptions.splice(5, 2);
      } else {
        propOptions.splice(4, 1);
      }
    }

    // Remove the move related options if the section is fixed
    if (props.isFixed || IS_MOCOCN_NEWTAB) {
      propOptions.splice(propOptions.indexOf("MoveUp"), 3);
    }
    // Prepend custom options and a separator
    if (props.extraOptions && props.extraOptions.length) {
      propOptions.splice(0, 0, ...props.extraOptions, "Separator");
    }
    // Insert privacy notice before the last option ("ManageSection")
    if (props.privacyNoticeURL) {
      propOptions.splice(-1, 0, "PrivacyNotice");
    }

    const options = propOptions
      .map(o => SectionMenuOptions[o](props))
      .map(option => {
        const { action, id, type, userEvent } = option;
        if (!type && id) {
          option.onClick = () => {
            const hasAddEvent =
              userEvent === "MENU_ADD_TOPSITE" ||
              userEvent === "MENU_ADD_SEARCH";

            if (props.collapsed && hasAddEvent) {
              this.handleAddWhileCollapsed();
            }

            props.dispatch(action);
            if (userEvent) {
              props.dispatch(
                ac.UserEvent({
                  event: userEvent,
                  source: props.source,
                })
              );
            }
          };
        }
        return option;
      });

    // This is for accessibility to support making each item tabbable.
    // We want to know which item is the first and which item
    // is the last, so we can close the context menu accordingly.
    options[0].first = true;
    options[options.length - 1].last = true;
    return options;
  }

  render() {
    return (
      <ContextMenu
        onUpdate={this.props.onUpdate}
        options={this.getOptions()}
        keyboardAccess={this.props.keyboardAccess}
      />
    );
  }
}

export const SectionMenu = connect(state => ({
  Prefs: state.Prefs,
  DiscoveryStream: state.DiscoveryStream,
}))(_SectionMenu);
