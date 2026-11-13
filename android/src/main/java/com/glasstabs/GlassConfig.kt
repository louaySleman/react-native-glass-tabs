package com.glasstabs

import android.graphics.Color
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper

/** Shared by the tab bar background and the standalone glass view. */
internal object GlassConfig {

  /** Reads the `glassConfig` prop and configures the view (after layout, on the UI thread). */
  fun apply(view: GlassBarView, config: ReadableMap, defaultAdaptiveContent: Boolean) {
    fun num(key: String, fallback: Float) = if (config.hasKey(key) && !config.isNull(key)) config.getDouble(key).toFloat() else fallback
    fun bool(key: String, fallback: Boolean) = if (config.hasKey(key) && !config.isNull(key)) config.getBoolean(key) else fallback

    val cornerRadius = num("cornerRadius", 28f)
    val opacity = num("opacity", 0.85f)
    val blurRadius = num("blurRadius", 20f)
    val darkMode = bool("darkMode", false)
    val liquid = config.hasKey("effect") && config.getString("effect") == "liquid"
    val adaptiveIcons = bool("adaptiveIcons", true)
    val adaptiveContent = bool("adaptiveContent", defaultAdaptiveContent)
    val segments = num("segments", 0f).toInt()
    // JS sends a percentage (0–100).
    val backgroundOpacity = if (config.hasKey("backgroundOpacity") && !config.isNull("backgroundOpacity")) {
      config.getDouble("backgroundOpacity").toFloat() / 100f
    } else null

    var bgColor = Color.WHITE
    if (config.hasKey("backgroundColor") && !config.isNull("backgroundColor")) {
      try {
        bgColor = Color.parseColor(config.getString("backgroundColor"))
      } catch (_: Exception) {}
    }

    view.post {
      view.configure(cornerRadius, bgColor, opacity, blurRadius, darkMode, liquid, adaptiveIcons, backgroundOpacity, adaptiveContent, segments)
    }
  }

  /** Forwards "what shows through turned dark / light" to JS as `onBackdropChange`. */
  fun dispatchBackdropEvents(context: ThemedReactContext, view: GlassBarView) {
    view.onBackdropDarkChange = { dark, segments ->
      UIManagerHelper.getEventDispatcherForReactTag(context, view.id)
        ?.dispatchEvent(BackdropChangeEvent(UIManagerHelper.getSurfaceId(view), view.id, dark, segments))
    }
  }

  val eventTypes: Map<String, Any> =
    mapOf(BackdropChangeEvent.EVENT_NAME to mapOf("registrationName" to "onBackdropChange"))
}
