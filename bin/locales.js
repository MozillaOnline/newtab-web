if (!process.env.npm_lifecycle_event) {
  throw Error("You should only run this from npm script contexts");
}

exports.DEFAULT_LOCALE = process.env.npm_package_config_default_locale;

exports.LOCALES_SOURCE_DIRECTORY = process.env.npm_package_config_locales_dir;

// This locales list is to find any similar locales that we can reuse strings
// instead of falling back to the default, e.g., use bn-BD strings for bn-IN.
// https://hg.mozilla.org/mozilla-central/file/tip/browser/locales/l10n.toml
exports.CENTRAL_LOCALES = [
  "zh-CN",
];
