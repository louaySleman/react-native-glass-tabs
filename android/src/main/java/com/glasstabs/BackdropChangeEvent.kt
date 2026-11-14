package com.glasstabs

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/** Sent when what shows through the glass turns dark (`dark: true`) or light, overall or per tab. */
class BackdropChangeEvent(surfaceId: Int, viewId: Int, private val dark: Boolean, private val segments: BooleanArray) :
  Event<BackdropChangeEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap().apply {
    putBoolean("dark", dark)
    // Tab bar: dark/light per tab, left to right (empty for other glass views).
    putArray("segments", Arguments.createArray().apply { segments.forEach { pushBoolean(it) } })
  }

  companion object {
    const val EVENT_NAME = "topBackdropChange"
  }
}
