/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { IS_MOCOCN_NEWTAB } from "content-src/lib/constants";
import { LinkMenu } from "content-src/components/LinkMenu/LinkMenu";
import { ContextMenuButton } from "content-src/components/ContextMenu/ContextMenuButton";
import { actionCreators as ac } from "common/Actions.jsm";
import React from "react";

export class DSLinkMenu extends React.PureComponent {
  render() {
    const { index, dispatch } = this.props;
    let pocketMenuOptions = [];
    let TOP_STORIES_CONTEXT_MENU_OPTIONS = [
      "OpenInNewWindow",
      "OpenInPrivateWindow",
    ];
    if (!this.props.isRecentSave) {
      if (this.props.pocket_button_enabled) {
        pocketMenuOptions = this.props.saveToPocketCard
          ? ["CheckDeleteFromPocket"]
          : ["CheckSavedToPocket"];
      }
      TOP_STORIES_CONTEXT_MENU_OPTIONS = [
        "CheckBookmark",
        "CheckArchiveFromPocket",
        ...pocketMenuOptions,
        "Separator",
        "OpenInNewWindow",
        "OpenInPrivateWindow",
        "Separator",
        "BlockUrl",
        ...(this.props.showPrivacyInfo ? ["ShowPrivacyInfo"] : []),
      ];
    }
    const MOCOCN_TOP_STORIES_CONTEXT_MENU_OPTIONS = [
      "MoCoCNBlockUrl",
      "Separator",
      "OpenInNewWindow",
      "OpenInPrivateWindow"
    ];
    const type = this.props.type || "DISCOVERY_STREAM";
    const title = this.props.title || this.props.source;

    return (
      <div className="context-menu-position-container">
        <ContextMenuButton
          tooltip={"newtab-menu-content-tooltip"}
          tooltipArgs={{ title }}
          onUpdate={this.props.onMenuUpdate}
        >
          <LinkMenu
            dispatch={dispatch}
            index={index}
            source={type.toUpperCase()}
            onShow={this.props.onMenuShow}
            options={
              IS_MOCOCN_NEWTAB
                ? MOCOCN_TOP_STORIES_CONTEXT_MENU_OPTIONS
                : TOP_STORIES_CONTEXT_MENU_OPTIONS
            }
            shouldSendImpressionStats={true}
            userEvent={ac.DiscoveryStreamUserEvent}
            site={{
              referrer: (
                IS_MOCOCN_NEWTAB
                  ? ""
                  : "https://getpocket.com/recommendations"
              ),
              title: this.props.title,
              type: this.props.type,
              url: this.props.url,
              guid: this.props.id,
              pocket_id: this.props.pocket_id,
              shim: this.props.shim,
              bookmarkGuid: this.props.bookmarkGuid,
              flight_id: this.props.flightId,
            }}
          />
        </ContextMenuButton>
      </div>
    );
  }
}
