package com.glasstabs

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.graphics.*
import android.graphics.drawable.Drawable
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.widget.FrameLayout
import eightbitlab.com.blurview.BlurView
import eightbitlab.com.blurview.RenderEffectBlur

/**
 * Native frosted glass bar using Dimezis/BlurView.
 *
 * BlurView hooks into Android's actual drawing pipeline — it uses hardware-
 * accelerated view snapshotting with near-zero overhead, blurring on the system
 * RenderThread. This is the same library used by @react-native-community/blur
 * under the hood.
 *
 * We embed it directly so users don't need to install any blur package.
 *
 * The blur requires android.graphics.RenderEffect and is therefore gated to
 * Android 13+ (see [BLUR_MIN_SDK]). Below that the bar still draws — flat and
 * translucent, no blur — rather than crashing on the missing platform class.
 */
class GlassBarView(context: Context) : FrameLayout(context) {

  private val blurView: BlurView
  private val tintOverlay: View
  private var cornerRadiusPx: Float = 28f * resources.displayMetrics.density
  private var bgOpacity: Float = 0.85f
  private var bgColor: Int = Color.WHITE
  private var isDarkMode: Boolean = false
  private var isSetup: Boolean = false

  init {
    // BlurView — the frosted glass background
    blurView = BlurView(context)
    addView(blurView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))

    // Tint overlay — semi-transparent color on top of blur
    tintOverlay = View(context)
    addView(tintOverlay, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))

    // Make this container transparent
    setBackgroundColor(Color.TRANSPARENT)
    clipToOutline = true
  }

  fun configure(
    cornerRadius: Float,
    backgroundColor: Int,
    opacity: Float,
    blurRadius: Float,
    darkMode: Boolean
  ) {
    val density = resources.displayMetrics.density
    this.cornerRadiusPx = cornerRadius * density
    this.bgColor = backgroundColor
    this.bgOpacity = opacity
    this.isDarkMode = darkMode

    // Apply rounded corners via outline
    outlineProvider = object : ViewOutlineProvider() {
      override fun getOutline(view: View, outline: Outline) {
        outline.setRoundRect(0, 0, view.width, view.height, cornerRadiusPx)
      }
    }
    clipToOutline = true

    // Tint overlay color
    val r = Color.red(bgColor)
    val g = Color.green(bgColor)
    val b = Color.blue(bgColor)
    val tintAlpha = (opacity * 0.55f * 255).toInt().coerceIn(0, 255)
    tintOverlay.setBackgroundColor(Color.argb(tintAlpha, r, g, b))

    // Setup BlurView with the root decorView
    setupBlur(blurRadius)
  }

  private fun setupBlur(blurRadius: Float) {
    // BlurView's RenderEffectBlur resolves android.graphics.RenderEffect, which
    // only exists from API 31. On an older device that reference throws
    // NoClassDefFoundError from inside setupWith(), taking down every launch on
    // Android 11 and below. Under the cutoff there is no blur at all: the bar
    // degrades to a flat translucent slab.
    if (Build.VERSION.SDK_INT < BLUR_MIN_SDK) {
      applyFlatBackground()
      return
    }

    val activity = getActivity()
    val decorView = activity?.window?.decorView as? ViewGroup
    if (activity == null || decorView == null) {
      applyFlatBackground()
      return
    }

    // Get the window background for the clear drawable
    val windowBackground: Drawable = activity.window.decorView.background
      ?: android.graphics.drawable.ColorDrawable(Color.TRANSPARENT)

    try {
      blurView.setupWith(decorView, RenderEffectBlur())
        .setBlurRadius(blurRadius.coerceIn(1f, 25f))
        .setFrameClearDrawable(windowBackground)
        .setBlurAutoUpdate(true)

      isSetup = true
    } catch (t: Throwable) {
      // Throwable, not Exception: a missing platform class arrives as
      // NoClassDefFoundError, which extends Error. Catching Exception left this
      // fallback unreachable for the one failure it exists to absorb.
      applyFlatBackground()
    }
  }

  /** No-blur bar: solid semi-transparent fill, matching the tint overlay. */
  private fun applyFlatBackground() {
    isSetup = false
    val r = Color.red(bgColor)
    val g = Color.green(bgColor)
    val b = Color.blue(bgColor)
    val alpha = (bgOpacity * 255).toInt().coerceIn(0, 255)
    blurView.setBackgroundColor(Color.argb(alpha, r, g, b))
  }

  private fun getActivity(): Activity? {
    var ctx = context
    while (ctx is ContextWrapper) {
      if (ctx is Activity) return ctx
      ctx = ctx.baseContext
    }
    return null
  }

  companion object {
    /**
     * Lowest API level that gets the real blur. RenderEffect itself landed in
     * API 31, so 31 and 32 would also work — this sits at 33 deliberately:
     * Android 12 and below render flat, Android 13+ render blurred.
     */
    private const val BLUR_MIN_SDK = Build.VERSION_CODES.TIRAMISU
  }
}
