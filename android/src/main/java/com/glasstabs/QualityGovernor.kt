package com.glasstabs

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.HandlerThread
import android.os.PowerManager
import android.view.FrameMetrics
import android.view.Window

/**
 * Keeps the glass from ever being the reason a phone lags. It watches how long the app's frames
 * take and picks how often glass may refresh its backdrop while things move:
 *
 *  - [FULL]: up to ~30 times a second (smooth phones).
 *  - [REDUCED]: ~15 times a second (frames are being dropped).
 *  - [STILL]: not while moving — the glass keeps its last picture and refreshes once the
 *    motion stops (still dropping frames, or battery saver on).
 *
 * It steps back up by itself once frames are smooth again. One per window, shared by every
 * glass view in it; it only listens while at least one glass view is attached.
 */
internal object QualityGovernor {
  const val FULL = 0
  const val REDUCED = 1
  const val STILL = 2

  @Volatile private var frameLevel = FULL
  @Volatile private var powerSave = false

  /** Current level (battery saver forces [STILL]). */
  val level: Int get() = if (powerSave) STILL else frameLevel

  private var users = 0
  private var window: Window? = null
  private var context: Context? = null
  private val thread by lazy { HandlerThread("GlassFrameMetrics").also { it.start() } }

  // Rolling count over the last WINDOW frames.
  private const val WINDOW = 45
  private var seen = 0
  private var slow = 0
  private var smoothStreak = 0

  private val listener = Window.OnFrameMetricsAvailableListener { _, metrics, _ ->
    val total = metrics.getMetric(FrameMetrics.TOTAL_DURATION)
    // A frame that took over ~1.5 refresh intervals was felt as a stutter — but never count
    // less than 25 ms: on 90/120 Hz screens, dropping to 60 fps for a moment isn't a lag.
    if (total > maxOf(frameBudgetNs * 3 / 2, MIN_SLOW_NS)) slow++
    seen++
    if (seen >= WINDOW) {
      val ratio = slow.toFloat() / seen
      when {
        ratio > 0.25f -> {
          frameLevel = minOf(STILL, frameLevel + 1)
          smoothStreak = 0
        }
        ratio < 0.05f -> {
          // Three smooth windows in a row before raising quality again (no ping-pong).
          if (++smoothStreak >= 3 && frameLevel > FULL) {
            frameLevel--
            smoothStreak = 0
          }
        }
        else -> smoothStreak = 0
      }
      if (frameLevel != lastLogged) {
        android.util.Log.i("GlassTabs", "glass refresh level: ${listOf("full", "reduced", "still")[frameLevel]} (slow frames ${(ratio * 100).toInt()}%)")
        lastLogged = frameLevel
      }
      seen = 0
      slow = 0
    }
  }
  private var lastLogged = FULL

  @Volatile private var frameBudgetNs = 16_666_666L
  private const val MIN_SLOW_NS = 25_000_000L

  private val powerReceiver = object : BroadcastReceiver() {
    override fun onReceive(c: Context, intent: Intent) {
      powerSave = (c.getSystemService(Context.POWER_SERVICE) as? PowerManager)?.isPowerSaveMode == true
    }
  }

  /** A glass view attached to [activity]'s window. */
  fun attach(activity: Activity?) {
    users++
    if (users > 1 || activity == null) return
    val w = activity.window ?: return
    try {
      val hz = activity.display?.refreshRate ?: 60f
      frameBudgetNs = (1_000_000_000L / hz.coerceIn(30f, 240f)).toLong()
    } catch (_: Throwable) {}
    try {
      w.addOnFrameMetricsAvailableListener(listener, Handler(thread.looper))
      window = w
    } catch (_: Throwable) {}
    val app = activity.applicationContext
    powerSave = (app.getSystemService(Context.POWER_SERVICE) as? PowerManager)?.isPowerSaveMode == true
    try {
      app.registerReceiver(powerReceiver, IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED))
      context = app
    } catch (_: Throwable) {}
  }

  /** A glass view detached; the last one stops listening. */
  fun detach() {
    users = maxOf(0, users - 1)
    if (users > 0) return
    try { window?.removeOnFrameMetricsAvailableListener(listener) } catch (_: Throwable) {}
    window = null
    try { context?.unregisterReceiver(powerReceiver) } catch (_: Throwable) {}
    context = null
  }
}
