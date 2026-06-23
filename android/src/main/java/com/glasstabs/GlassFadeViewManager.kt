package com.glasstabs

import android.graphics.Color
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * ViewManager that exposes GlassFadeView as a native React Native component.
 * Renders a smooth LinearGradient fade from transparent to background color.
 */
class GlassFadeViewManager : SimpleViewManager<GlassFadeView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): GlassFadeView {
    return GlassFadeView(reactContext)
  }

  @ReactProp(name = "fadeConfig")
  fun setFadeConfig(view: GlassFadeView, config: ReadableMap?) {
    if (config == null) return

    val darkMode = if (config.hasKey("darkMode")) config.getBoolean("darkMode") else false

    var bgColor = Color.WHITE
    if (config.hasKey("backgroundColor")) {
      try {
        bgColor = Color.parseColor(config.getString("backgroundColor"))
      } catch (_: Exception) {}
    }

    view.configure(bgColor, darkMode)
  }

  companion object {
    const val REACT_CLASS = "GlassFadeNativeView"
  }
}
