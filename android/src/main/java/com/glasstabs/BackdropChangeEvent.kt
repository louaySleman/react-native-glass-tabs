package com.glasstabs

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/** Sent when what shows through the glass turns dark (`dark: true`) or light. */
class BackdropChangeEvent(surfaceId: Int, viewId: Int, private val dark: Boolean) :
  Event<BackdropChangeEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap().apply { putBoolean("dark", dark) }

  companion object {
    const val EVENT_NAME = "topBackdropChange"
  }
}
