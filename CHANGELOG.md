# Changelog

## 1.0.1

- Fixed a crash on Android 12 and below, where the floating glass tab bar took down the app on launch. `RenderEffectBlur` resolves `android.graphics.RenderEffect`, which does not exist before API 31, and the surrounding `catch (Exception)` could not absorb the resulting `NoClassDefFoundError`. The blur is now gated to Android 13+; below that the bar renders flat and translucent instead of crashing.

## 1.0.0

- First release.
