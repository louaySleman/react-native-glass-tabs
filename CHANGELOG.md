# Changelog

## 1.1.0

- **New Android glass engine.** The floating bar's blur no longer uses BlurView, which redrew the whole window in software on every frame. The bar now records only the views behind it (reusing their display lists) and blurs that strip on the GPU at reduced resolution. On an Android 15 emulator flinging a long list, total CPU dropped from ~56% to ~36% (main thread ~22% → ~6%). An idle screen costs nothing, and off-screen glass does no work. No JitPack repository or blur dependency is needed any more.
- **Liquid glass on Android 13+** (`glassEffect="liquid"`): edge refraction, a hairline light rim and a clear centre, iOS 26-style. Works with or without blur (`blurRadius={0}` gives a perfectly clear lens).
- **Adaptive icon colours** (`adaptiveIconColors`, default on): the bar measures what shows through it and fades icons and labels between dark and light, like iOS.
- **`backgroundOpacity`**: the glass tint coverage as a percentage, for blur and liquid glass.
- **`<BlurView>`, `<LiquidGlassView>` and `<GlassView>`**: the same glass around any content. Text and icons inside fade to white over dark content (and back) natively, with no extra code.
- **Liquid selection pill**: one pill springs between tabs, stretching like a drop of liquid and squishing when pressed (native driver).
- **Automatic quality**: the glass watches frame times and, on phones that keep dropping frames (over 25 ms), re-records its backdrop less often while scrolling, down to only once motion stops; battery saver does the same. Level changes are logged under the `GlassTabs` tag.
- **iOS glass views**: `BlurView` / `LiquidGlassView` use the system materials on iOS, with real `UIGlassEffect` liquid glass on iOS 26+.
- **Expo config plugin**: `"plugins": ["react-native-glass-tabs"]` sets the Material 3 theme.
- **CI** builds the example app for Android and iOS.
- **Haptics on Android**: `hapticFeedback` now ticks on tab press on Android too, and is passed to the Material 3 bar.
- Inactive icon colours now default per look for contrast on the glass. The liquid glass selection is a neutral glass capsule.
- Android 12 and below and low-RAM phones keep the flat translucent bar (never a crash), as in 1.0.1.
- The example app is redesigned around real photos (from Unsplash), with new icons and the glass views.

## 1.0.1

- Fixed a crash on Android 12 and below, where the floating glass tab bar took down the app on launch. `RenderEffectBlur` resolves `android.graphics.RenderEffect`, which does not exist before API 31, and the surrounding `catch (Exception)` could not absorb the resulting `NoClassDefFoundError`. The blur is now gated to Android 13+; below that the bar renders flat and translucent instead of crashing.

## 1.0.0

- First release.
