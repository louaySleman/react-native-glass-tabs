/**
 * Expo config plugin for react-native-glass-tabs.
 *
 *   // app.json
 *   { "expo": { "plugins": ["react-native-glass-tabs"] } }
 *
 * Android: makes the app theme a Material 3 theme (the glass tab bar and the native
 * Material 3 tabs need it). Nothing else is needed: the glass is built in, with no extra
 * repositories or permissions. iOS needs no changes.
 */
const MATERIAL3_PARENT = 'Theme.Material3.DayNight.NoActionBar';

/**
 * Sets the parent of the app's theme (`AppTheme` by default) to Material 3 in a parsed
 * styles.xml (the shape Expo's `withAndroidStyles` gives). Pure: returns the edited object.
 */
function setMaterial3Theme(styles, themeName = 'AppTheme', parent = MATERIAL3_PARENT) {
  const resources = styles.resources || (styles.resources = {});
  const list = resources.style || (resources.style = []);
  const theme = list.find((s) => s && s.$ && s.$.name === themeName);
  if (theme) {
    if (!String(theme.$.parent || '').startsWith('Theme.Material3')) theme.$.parent = parent;
  } else {
    list.push({ $: { name: themeName, parent }, item: [] });
  }
  return styles;
}

function loadPlugins() {
  try {
    return require('expo/config-plugins');
  } catch (e) {
    return require('@expo/config-plugins');
  }
}

function withGlassTabs(config, options = {}) {
  const { withAndroidStyles } = loadPlugins();
  return withAndroidStyles(config, (cfg) => {
    cfg.modResults = setMaterial3Theme(cfg.modResults, options.themeName, options.parent);
    return cfg;
  });
}

module.exports = withGlassTabs;
module.exports.setMaterial3Theme = setMaterial3Theme;
module.exports.MATERIAL3_PARENT = MATERIAL3_PARENT;
