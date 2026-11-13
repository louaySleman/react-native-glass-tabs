package com.glasstabs

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * The tab bar's glass background (GlassBarView: GPU backdrop blur / liquid glass).
 */
class GlassBarViewManager : SimpleViewManager<GlassBarView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): GlassBarView =
    GlassBarView(reactContext).also { GlassConfig.dispatchBackdropEvents(reactContext, it) }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> = GlassConfig.eventTypes

  @ReactProp(name = "glassConfig")
  fun setGlassConfig(view: GlassBarView, config: ReadableMap?) {
    // The tab bar colours its own icons in JS (with a cross-fade), so no content recolouring.
    if (config != null) GlassConfig.apply(view, config, defaultAdaptiveContent = false)
  }

  /** A new value means a tab was pressed: play the system's light "tick" haptic. */
  @ReactProp(name = "hapticToken")
  fun setHapticToken(view: GlassBarView, token: Int) {
    if (token > 0) view.tick()
  }

  companion object {
    const val REACT_CLASS = "GlassBarNativeView"
  }
}
