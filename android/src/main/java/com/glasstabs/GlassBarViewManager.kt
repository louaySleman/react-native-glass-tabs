package com.glasstabs

import android.graphics.Color
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * ViewManager exposing GlassBarView (wraps Dimezis/BlurView)
 * as a React Native native component.
 */
class GlassBarViewManager : SimpleViewManager<GlassBarView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): GlassBarView {
    return GlassBarView(reactContext)
  }

  @ReactProp(name = "glassConfig")
  fun setGlassConfig(view: GlassBarView, config: ReadableMap?) {
    if (config == null) return

    val cornerRadius = if (config.hasKey("cornerRadius")) config.getDouble("cornerRadius").toFloat() else 28f
    val opacity = if (config.hasKey("opacity")) config.getDouble("opacity").toFloat() else 0.85f
    val blurRadius = if (config.hasKey("blurRadius")) config.getDouble("blurRadius").toFloat() else 20f
    val darkMode = if (config.hasKey("darkMode")) config.getBoolean("darkMode") else false

    var bgColor = Color.WHITE
    if (config.hasKey("backgroundColor")) {
      try {
        bgColor = Color.parseColor(config.getString("backgroundColor"))
      } catch (_: Exception) {}
    }

    view.post {
      view.configure(cornerRadius, bgColor, opacity, blurRadius, darkMode)
    }
  }

  companion object {
    const val REACT_CLASS = "GlassBarNativeView"
  }
}
