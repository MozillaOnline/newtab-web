/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

{
  const prefersDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const rgbaBlack = { r: 0, g: 0, b: 0, a: 1 };
  const rgbaWhite = { r: 255, g: 255, b: 255, a: 1 };

  function _isTextColorDark(r, g, b) {
    return 0.2125 * r + 0.7154 * g + 0.0721 * b <= 110;
  }

  function _opaqueColorMix(rgb1, rgb2, weight1) {
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * (100 - weight1) / 100);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * (100 - weight1) / 100);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * (100 - weight1) / 100);
    return `rgb(${r}, ${g}, ${b})`;
  }

  const inContentVariableMap = [
    [
      "--newtab-background-color",
      {
        lwtProperty: "ntp_background",
        processColor(rgbaChannels) {
          if (!rgbaChannels) {
            return null;
          }
          const { r, g, b } = rgbaChannels;
          // Drop alpha channel
          return `rgb(${r}, ${g}, ${b})`;
        },
      },
    ],
    [
      "--newtab-background-color-secondary",
      {
        lwtProperty: "ntp_card_background",
      },
    ],
    [
      "--newtab-text-primary-color",
      {
        lwtProperty: "ntp_text",
        processColor(rgbaChannels, element) {
          // We only have access to the browser when we're in a chrome
          // docshell, so for now only set the color scheme in that case, and
          // use the `lwt-newtab-brighttext` attribute as a fallback mechanism.
          let browserStyle =
            element.ownerGlobal?.docShell?.chromeEventHandler.style;

          if (!rgbaChannels) {
            element.removeAttribute("lwt-newtab");
            element.toggleAttribute(
              "lwt-newtab-brighttext",
              prefersDarkQuery.matches
            );
            if (browserStyle) {
              browserStyle.colorScheme = "";
            }
            return null;
          }

          element.setAttribute("lwt-newtab", "true");
          const { r, g, b, a } = rgbaChannels;
          let darkMode = !_isTextColorDark(r, g, b);
          element.toggleAttribute("lwt-newtab-brighttext", darkMode);
          if (browserStyle) {
            browserStyle.colorScheme = darkMode ? "dark" : "light";
          }

          return `rgba(${r}, ${g}, ${b}, ${a})`;
        },
      },
    ],
    [
      "--in-content-zap-gradient",
      {
        lwtProperty: "zap_gradient",
        processColor(value) {
          return value;
        },
      },
    ],
    [
      "--newtab-text-secondary-color",
      {
        lwtProperty: "ntp_text",
        processColor(rgbaChannels) {
          if (!rgbaChannels) {
            return null;
          }

          const { r, g, b, a } = rgbaChannels;
          // See `content-src/styles/_theme.scss`, 70% mix with `transparent`
          return `rgba(${r}, ${g}, ${b}, ${a * 0.7})`;
        }
      }
    ],
    [
      "--newtab-element-hover-color",
      {
        lwtProperty: "ntp_background",
        processColor(rgbaChannels, element) {
          if (!rgbaChannels) {
            return null;
          }

          const colorToMix =
            element.hasAttribute("lwt-newtab-brighttext") ?
            rgbaWhite : rgbaBlack;
          const weight1 = 
            element.hasAttribute("lwt-newtab-brighttext") ?
            80 : 90;
          // See `content-src/styles/_theme.scss`
          return _opaqueColorMix(rgbaChannels, colorToMix, weight1);
        }
      }
    ],
    [
      "--newtab-element-active-color",
      {
        lwtProperty: "ntp_background",
        processColor(rgbaChannels, element) {
          if (!rgbaChannels) {
            return null;
          }

          const colorToMix =
            element.hasAttribute("lwt-newtab-brighttext") ?
            rgbaWhite : rgbaBlack;
          const weight1 = 
            element.hasAttribute("lwt-newtab-brighttext") ?
            60 : 80;
          // See `content-src/styles/_theme.scss`
          return _opaqueColorMix(rgbaChannels, colorToMix, weight1);
        }
      }
    ],
    [
      "--newtab-border-color",
      {
        lwtProperty: "ntp_background",
        processColor(rgbaChannels, element) {
          if (!rgbaChannels) {
            return null;
          }

          const colorToMix =
            element.hasAttribute("lwt-newtab-brighttext") ?
            rgbaWhite : rgbaBlack;
          // See `content-src/styles/_theme.scss`
          return _opaqueColorMix(rgbaChannels, colorToMix, 75);
        }
      }
    ],
    [
      "--newtab-overlay-color",
      {
        lwtProperty: "ntp_background",
        processColor(rgbaChannels) {
          if (!rgbaChannels) {
            return null;
          }

          const { r, g, b } = rgbaChannels;
          // See `content-src/styles/_theme.scss`, 85% mix with `transparent`
          return `rgba(${r}, ${g}, ${b}, 0.85)`;
        }
      }
    ],
    [
      "--lwt-sidebar-background-color",
      {
        lwtProperty: "sidebar",
        processColor(rgbaChannels) {
          if (!rgbaChannels) {
            return null;
          }
          const { r, g, b } = rgbaChannels;
          // Drop alpha channel
          return `rgb(${r}, ${g}, ${b})`;
        },
      },
    ],
    [
      "--lwt-sidebar-text-color",
      {
        lwtProperty: "sidebar_text",
        processColor(rgbaChannels, element) {
          if (!rgbaChannels) {
            element.removeAttribute("lwt-sidebar");
            element.removeAttribute("lwt-sidebar-brighttext");
            return null;
          }

          element.setAttribute("lwt-sidebar", "true");
          const { r, g, b, a } = rgbaChannels;
          if (!_isTextColorDark(r, g, b)) {
            element.setAttribute("lwt-sidebar-brighttext", "true");
          } else {
            element.removeAttribute("lwt-sidebar-brighttext");
          }

          return `rgba(${r}, ${g}, ${b}, ${a})`;
        },
      },
    ],
    [
      "--lwt-sidebar-highlight-background-color",
      {
        lwtProperty: "sidebar_highlight",
        processColor(rgbaChannels, element) {
          if (!rgbaChannels) {
            element.removeAttribute("lwt-sidebar-highlight");
            return null;
          }
          element.setAttribute("lwt-sidebar-highlight", "true");

          const { r, g, b, a } = rgbaChannels;
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        },
      },
    ],
    [
      "--lwt-sidebar-highlight-text-color",
      {
        lwtProperty: "sidebar_highlight_text",
      },
    ],
  ];

  /**
   * ContentThemeController handles theme updates sent by the frame script.
   * To be able to use ContentThemeController, you must add your page to the whitelist
   * in LightweightThemeChildListener.jsm
   */
  const ContentThemeController = {
    /**
     * Listen for theming updates from the LightweightThemeChild actor, and
     * begin listening to changes in preferred color scheme.
     */
    init() {
      addEventListener("LightweightTheme:Set", this);

      // We don't sync default theme attributes in `init()`, as we may not have
      // a body element to attach the attribute to yet. They will be set when
      // the first LightweightTheme:Set event is delivered during pageshow.
      prefersDarkQuery.addEventListener("change", this);
    },

    /**
     * Handle theme updates from the LightweightThemeChild actor or due to
     * changes to the prefers-color-scheme media query.
     * @param {Object} event object containing the theme or query update.
     */
    handleEvent(event) {
      // XUL documents don't have a body
      const element = document.body ? document.body : document.documentElement;

      if (event.type == "LightweightTheme:Set") {
        let { data } = event.detail;
        if (!data) {
          data = {};
        }
        this._setProperties(element, data);
      } else if (event.type == "change") {
        // If a lightweight theme doesn't apply, update lwt-newtab-brighttext to
        // reflect prefers-color-scheme.
        if (!element.hasAttribute("lwt-newtab")) {
          element.toggleAttribute("lwt-newtab-brighttext", event.matches);
        }
      }
    },

    /**
     * Set a CSS variable to a given value
     * @param {Element} elem The element where the CSS variable should be added.
     * @param {string} variableName The CSS variable to set.
     * @param {string} value The new value of the CSS variable.
     */
    _setProperty(elem, variableName, value) {
      if (value) {
        elem.style.setProperty(variableName, value);
      } else {
        elem.style.removeProperty(variableName);
      }
    },

    /**
     * Apply theme data to an element
     * @param {Element} root The element where the properties should be applied.
     * @param {Object} themeData The theme data.
     */
    _setProperties(elem, themeData) {
      for (let [cssVarName, definition] of inContentVariableMap) {
        const { lwtProperty, processColor } = definition;
        let value = themeData[lwtProperty];

        if (processColor) {
          value = processColor(value, elem);
        } else if (value) {
          const { r, g, b, a } = value;
          value = `rgba(${r}, ${g}, ${b}, ${a})`;
        }

        this._setProperty(elem, cssVarName, value);
      }
    },
  };
  ContentThemeController.init();
}
