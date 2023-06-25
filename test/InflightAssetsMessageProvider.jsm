/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// This file is generated by:
// https://github.com/mozilla/messaging-system-inflight-assets/tree/master/scripts/export-all.py

const EXPORTED_SYMBOLS = ["InflightAssetsMessageProvider"];

const InflightAssetsMessageProvider = {
  getMessages() {
    return [
      {
        id: "MILESTONE_MESSAGE",
        groups: ["cfr"],
        content: {
          anchor_id: "tracking-protection-icon-container",
          bucket_id: "CFR_MILESTONE_MESSAGE",
          buttons: {
            primary: {
              action: {
                type: "OPEN_PROTECTION_REPORT",
              },
              event: "PROTECTION",
              label: {
                string_id: "cfr-doorhanger-milestone-ok-button",
              },
            },
            secondary: [
              {
                label: {
                  string_id: "cfr-doorhanger-milestone-close-button",
                },
                action: {
                  type: "CANCEL",
                },
                event: "DISMISS",
              },
            ],
          },
          category: "cfrFeatures",
          heading_text: {
            string_id: "cfr-doorhanger-milestone-heading",
          },
          layout: "short_message",
          notification_text: "",
          skip_address_bar_notifier: true,
          text: "",
        },
        frequency: {
          lifetime: 7,
        },
        targeting:
          "pageLoad >= 4 && firefoxVersion < 87 && userPrefs.cfrFeatures",
        template: "milestone_message",
        trigger: {
          id: "contentBlocking",
          params: ["ContentBlockingMilestone"],
        },
      },
      {
        id: "MILESTONE_MESSAGE_87",
        groups: ["cfr"],
        content: {
          anchor_id: "tracking-protection-icon-container",
          bucket_id: "CFR_MILESTONE_MESSAGE",
          buttons: {
            primary: {
              action: {
                type: "OPEN_PROTECTION_REPORT",
              },
              event: "PROTECTION",
              label: {
                string_id: "cfr-doorhanger-milestone-ok-button",
              },
            },
            secondary: [
              {
                label: {
                  string_id: "cfr-doorhanger-milestone-close-button",
                },
                action: {
                  type: "CANCEL",
                },
                event: "DISMISS",
              },
            ],
          },
          category: "cfrFeatures",
          heading_text: {
            string_id: "cfr-doorhanger-milestone-heading2",
          },
          layout: "short_message",
          notification_text: "",
          skip_address_bar_notifier: true,
          text: "",
        },
        frequency: {
          lifetime: 7,
        },
        targeting:
          "pageLoad >= 4 && firefoxVersion >= 87 && userPrefs.cfrFeatures",
        template: "milestone_message",
        trigger: {
          id: "contentBlocking",
          params: ["ContentBlockingMilestone"],
        },
      },
      {
        id: "DOH_ROLLOUT_CONFIRMATION_89",
        groups: ["cfr"],
        targeting:
          "profileAgeCreated < 1572480000000 && ( 'doh-rollout.enabled'|preferenceValue || 'doh-rollout.self-enabled'|preferenceValue || 'doh-rollout.ru.enabled'|preferenceValue || 'doh-rollout.ua.enabled'|preferenceValue ) && !( 'doh-rollout.disable-heuristics'|preferenceValue || 'doh-rollout.skipHeuristicsCheck'|preferenceValue || 'doh-rollout.doorhanger-decision'|preferenceValue ) && firefoxVersion >= 89",
        template: "infobar",
        content: {
          priority: 3,
          type: "global",
          text: {
            string_id: "cfr-doorhanger-doh-body",
          },
          buttons: [
            {
              label: {
                string_id: "cfr-doorhanger-doh-primary-button-2",
              },
              action: {
                type: "ACCEPT_DOH",
              },
              primary: true,
            },
            {
              label: {
                string_id: "cfr-doorhanger-doh-secondary-button",
              },
              action: {
                type: "DISABLE_DOH",
              },
            },
            {
              label: {
                string_id: "notification-learnmore-default-label",
              },
              supportPage: "dns-over-https",
              callback: null,
              action: {
                type: "CANCEL",
              },
            },
          ],
          bucket_id: "DOH_ROLLOUT_CONFIRMATION_89",
          category: "cfrFeatures",
        },
        frequency: {
          lifetime: 3,
        },
        trigger: {
          id: "openURL",
          patterns: ["*://*/*"],
        },
      },
      {
        id: "INFOBAR_DEFAULT_AND_PIN_87",
        groups: ["cfr"],
        content: {
          category: "cfrFeatures",
          bucket_id: "INFOBAR_DEFAULT_AND_PIN_87",
          text: {
            string_id: "default-browser-notification-message",
          },
          type: "global",
          buttons: [
            {
              label: {
                string_id: "default-browser-notification-button",
              },
              action: {
                type: "PIN_AND_DEFAULT",
              },
              primary: true,
              accessKey: "P",
            },
          ],
        },
        trigger: {
          id: "defaultBrowserCheck",
        },
        template: "infobar",
        frequency: {
          lifetime: 2,
          custom: [
            {
              period: 3024000000,
              cap: 1,
            },
          ],
        },
        targeting:
          "((firefoxVersion >= 87 && firefoxVersion < 89) || (firefoxVersion >= 89 && source == 'startup')) && !isDefaultBrowser && !'browser.shell.checkDefaultBrowser'|preferenceValue && isMajorUpgrade != true && platformName != 'linux' && ((currentDate|date - profileAgeCreated) / 604800000) >= 5 && !activeNotifications && 'browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features'|preferenceValue && ((currentDate|date - profileAgeCreated) / 604800000) < 15",
      },
      {
        id: "CFR_FULL_VIDEO_SUPPORT_EN",
        groups: ["cfr"],
        targeting:
          "firefoxVersion < 88 && firefoxVersion != 78 && localeLanguageCode in ['en', 'fr', 'de', 'ru', 'zh', 'es', 'it', 'pl']",
        template: "cfr_doorhanger",
        content: {
          skip_address_bar_notifier: true,
          persistent_doorhanger: true,
          anchor_id: "PanelUI-menu-button",
          layout: "icon_and_message",
          text: {
            string_id: "cfr-doorhanger-video-support-body",
          },
          buttons: {
            secondary: [
              {
                label: {
                  string_id: "cfr-doorhanger-extension-cancel-button",
                },
                action: {
                  type: "CANCEL",
                },
              },
            ],
            primary: {
              label: {
                string_id: "cfr-doorhanger-video-support-primary-button",
              },
              action: {
                type: "OPEN_URL",
                data: {
                  args: "https://support.mozilla.org/kb/update-firefox-latest-release",
                  where: "tabshifted",
                },
              },
            },
          },
          bucket_id: "CFR_FULL_VIDEO_SUPPORT_EN",
          heading_text: {
            string_id: "cfr-doorhanger-video-support-header",
          },
          info_icon: {
            label: {
              string_id: "cfr-doorhanger-extension-sumo-link",
            },
            sumo_path: "extensionrecommendations",
          },
          notification_text: "Message from Firefox",
          category: "cfrFeatures",
        },
        frequency: {
          lifetime: 3,
        },
        trigger: {
          id: "openURL",
          patterns: ["https://*/Amazon-Video/*", "https://*/Prime-Video/*"],
          params: [
            "www.hulu.com",
            "hulu.com",
            "www.netflix.com",
            "netflix.com",
            "www.disneyplus.com",
            "disneyplus.com",
            "www.hbomax.com",
            "hbomax.com",
            "www.sho.com",
            "sho.com",
            "www.directv.com",
            "directv.com",
            "www.starzplay.com",
            "starzplay.com",
            "www.sling.com",
            "sling.com",
            "www.facebook.com",
            "facebook.com",
          ],
        },
      },
      {
        id: "WNP_MOMENTS_12",
        groups: ["moments-pages"],
        content: {
          action: {
            data: {
              expire: 1640908800000,
              url: "https://www.mozilla.org/firefox/welcome/12",
            },
            id: "moments-wnp",
          },
          bucket_id: "WNP_MOMENTS_12",
        },
        targeting:
          'localeLanguageCode == "en" && region in ["DE", "AT", "BE", "CA", "FR", "IE", "IT", "MY", "NL", "NZ", "SG", "CH", "US", "GB", "ES"]  && (addonsInfo.addons|keys intersect ["@testpilot-containers"])|length == 1 && \'browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features\'|preferenceValue && \'browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons\'|preferenceValue',
        template: "update_action",
        trigger: {
          id: "momentsUpdate",
        },
      },
      {
        id: "WNP_MOMENTS_13",
        groups: ["moments-pages"],
        content: {
          action: {
            data: {
              expire: 1640908800000,
              url: "https://www.mozilla.org/firefox/welcome/13",
            },
            id: "moments-wnp",
          },
          bucket_id: "WNP_MOMENTS_13",
        },
        targeting:
          '(localeLanguageCode in ["en", "de", "fr", "nl", "it", "ms"] || locale == "es-ES") && region in ["DE", "AT", "BE", "CA", "FR", "IE", "IT", "MY", "NL", "NZ", "SG", "CH", "US", "GB", "ES"]  && (addonsInfo.addons|keys intersect ["@testpilot-containers"])|length == 0 && \'browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features\'|preferenceValue && \'browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons\'|preferenceValue',
        template: "update_action",
        trigger: {
          id: "momentsUpdate",
        },
      },
      {
        id: "WNP_MOMENTS_14",
        groups: ["moments-pages"],
        content: {
          action: {
            data: {
              expire: 1668470400000,
              url: "https://www.mozilla.org/firefox/welcome/14",
            },
            id: "moments-wnp",
          },
          bucket_id: "WNP_MOMENTS_14",
        },
        targeting:
          'localeLanguageCode in ["en", "de", "fr"] && region in ["AT", "BE", "CA", "CH", "DE", "ES", "FI", "FR", "GB", "IE", "IT", "MY", "NL", "NZ", "SE", "SG", "US"]  && \'browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features\'|preferenceValue && \'browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons\'|preferenceValue',
        template: "update_action",
        trigger: {
          id: "momentsUpdate",
        },
      },
    ];
  },
};
