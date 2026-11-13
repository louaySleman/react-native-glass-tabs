package com.glasstabs

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * Standalone glass container (`<BlurView>` / `<LiquidGlassView>`): the same live blur / liquid
 * glass as the tab bar, around any React children. Text and icons inside adapt to what shows
 * through by themselves (fading to white over dark content).
 */
class GlassViewManager : ViewGroupManager<GlassBarView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): GlassBarView =
    GlassBarView(reactContext).also { GlassConfig.dispatchBackdropEvents(reactContext, it) }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> = GlassConfig.eventTypes

  @ReactProp(name = "glassConfig")
  fun setGlassConfig(view: GlassBarView, config: ReadableMap?) {
    if (config != null) GlassConfig.apply(view, config, defaultAdaptiveContent = true)
  }

  companion object {
    const val REACT_CLASS = "GlassNativeView"
  }
}
