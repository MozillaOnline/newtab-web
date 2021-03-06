/* eslint-env browser */
/* @fluent/web/src/index.js but with many variables hardcoded */

import { negotiateLanguages } from "@fluent/langneg";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { DOMLocalization } from "@fluent/dom";

function documentReady() {
  const rs = document.readyState;
  if (rs === "interactive" || rs === "completed") {
    return Promise.resolve();
  }

  return new Promise(
    resolve => document.addEventListener(
      "readystatechange", resolve, { once: true },
    ),
  );
}

function getMeta(elem) {
  return {
    available: elem.querySelector('meta[name="availableLanguages"]')
      .getAttribute("content")
      .split(",").map(s => s.trim()),
    default: elem.querySelector('meta[name="defaultLanguage"]')
      .getAttribute("content"),
  };
}

function getResourceLinks(elem) {
  return Array.prototype.map.call(
    elem.querySelectorAll('link[rel="localization"]'),
    el => el.getAttribute("href"),
  );
}

async function fetchResource(locale, id) {
  const localizedModule = await import(
    /* webpackInclude: /index\.js$/ */
    /* webpackChunkName: "[request]" */
    /* webpackMode: "lazy" */
    `./l10n/${locale}`
  );

  return new FluentResource(localizedModule[id]);
}

async function createContext(locale, resourceIds) {
  const ctx = new FluentBundle([locale]);

  // First fetch all resources
  const resources = await Promise.all(
    resourceIds.map(id => fetchResource(locale, id)),
  );

  // Then apply them preserving order
  for (const resource of resources) {
    ctx.addResource(resource);
  }
  return ctx;
}

const meta = getMeta(document.head);

async function* generateMessages(resourceIds) {
  const locales = negotiateLanguages(
    navigator.languages,
    meta.available,
    {
      defaultLocale: meta.default,
    },
  );
  for (const locale of locales) {
    yield createContext(locale, resourceIds);
  }
}

const resourceIds = getResourceLinks(document.head);
document.l10n = new DOMLocalization(
  resourceIds, generateMessages,
);
window.addEventListener("languagechange", document.l10n);

document.l10n.ready = documentReady().then(() => {
  document.l10n.connectRoot(document.documentElement);
  return document.l10n.translateRoots();
});
