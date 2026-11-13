package com.glasstabs

import android.app.ActivityManager
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Outline
import android.graphics.RecordingCanvas
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.view.ViewTreeObserver
import android.widget.FrameLayout
import androidx.annotation.RequiresApi
import kotlin.math.ceil

/**
 * Frosted glass bar: a live, GPU-blurred copy of whatever is drawn behind it, under a tint.
 *
 * How it stays cheap (Android 12+):
 *  - Nothing is redrawn in software. Before each frame the bar records, into its own RenderNode,
 *    only the views that sit *behind* it (ancestors' backgrounds and the siblings below it, at
 *    every level). Those views are drawn through their existing display lists, so recording is a
 *    handful of references, not a re-render of the screen.
 *  - Only the strip under the bar is recorded, at 1/4 (or 1/2) resolution, and the blur runs on
 *    the GPU as a RenderEffect on that small node.
 *  - Work only happens on frames the app draws anyway: an idle screen costs nothing.
 *
 * Android 11 and below, low-RAM phones, `blurRadius` 0, or [liveBlur] off: a flat tinted bar
 * (no capture at all).
 */
class GlassBarView(context: Context) : FrameLayout(context), ViewTreeObserver.OnPreDrawListener {

  private val tintOverlay = View(context)
  private var cornerRadiusPx = 28f * resources.displayMetrics.density
  private var bgColor = Color.WHITE
  private var bgOpacity = 0.85f
  private var blurRadiusPx = 0f

  /** API 31+ only; typed as Any so older devices never load RenderNode / RenderEffect. */
  private var backdrop: Any? = null
  private var observed: ViewTreeObserver? = null

  init {
    addView(tintOverlay, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    setBackgroundColor(Color.TRANSPARENT)
    outlineProvider = object : ViewOutlineProvider() {
      override fun getOutline(view: View, outline: Outline) {
        outline.setRoundRect(0, 0, view.width, view.height, cornerRadiusPx)
      }
    }
    clipToOutline = true
  }

  fun configure(cornerRadius: Float, backgroundColor: Int, opacity: Float, blurRadius: Float, darkMode: Boolean) {
    val density = resources.displayMetrics.density
    cornerRadiusPx = cornerRadius * density
    bgColor = backgroundColor
    bgOpacity = opacity
    blurRadiusPx = blurRadius.coerceIn(0f, 25f) * density
    invalidateOutline()
    applyMode()
  }

  private fun blurWanted(): Boolean {
    if (!liveBlur || Build.VERSION.SDK_INT < BLUR_MIN_SDK || blurRadiusPx < 1f) return false
    val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
    return am?.isLowRamDevice != true
  }

  /** Switches between live blur and the flat bar. Cheap to call on every prop change. */
  private fun applyMode() {
    val blur = blurWanted()
    val r = Color.red(bgColor)
    val g = Color.green(bgColor)
    val b = Color.blue(bgColor)
    // Over the blur the tint is lighter; without blur the bar shows the full opacity.
    val alpha = ((if (blur) bgOpacity * 0.55f else bgOpacity) * 255).toInt().coerceIn(0, 255)
    tintOverlay.setBackgroundColor(Color.argb(alpha, r, g, b))
    if (blur && Build.VERSION.SDK_INT >= BLUR_MIN_SDK) {
      val bd = (backdrop as? Backdrop) ?: Backdrop().also { backdrop = it }
      bd.setRadius(blurRadiusPx)
      if (isAttachedToWindow) startObserving()
    } else {
      stopObserving()
      if (Build.VERSION.SDK_INT >= BLUR_MIN_SDK) (backdrop as? Backdrop)?.release()
      backdrop = null
    }
    invalidate()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (backdrop != null) startObserving()
  }

  override fun onDetachedFromWindow() {
    stopObserving()
    if (Build.VERSION.SDK_INT >= BLUR_MIN_SDK) (backdrop as? Backdrop)?.release()
    super.onDetachedFromWindow()
  }

  private fun startObserving() {
    val vto = rootView.viewTreeObserver
    if (observed === vto) return
    stopObserving()
    vto.addOnPreDrawListener(this)
    observed = vto
  }

  private fun stopObserving() {
    observed?.let { if (it.isAlive) it.removeOnPreDrawListener(this) }
    observed = null
  }

  /** Runs only when the window is about to draw a frame (something changed). */
  override fun onPreDraw(): Boolean {
    if (Build.VERSION.SDK_INT >= BLUR_MIN_SDK && width > 0 && height > 0 && isShown) {
      (backdrop as? Backdrop)?.capture()
    }
    return true
  }

  override fun dispatchDraw(canvas: Canvas) {
    if (Build.VERSION.SDK_INT >= BLUR_MIN_SDK && canvas.isHardwareAccelerated) {
      (backdrop as? Backdrop)?.draw(canvas)
    }
    super.dispatchDraw(canvas)
  }

  @RequiresApi(BLUR_MIN_SDK)
  private inner class Backdrop {
    private val node = RenderNode("GlassBarBackdrop")
    private var scale = 4f
    private var pad = 0f
    private var ready = false
    private val loc = IntArray(2)
    private val rootLoc = IntArray(2)
    private val path = ArrayList<View>(16)

    fun setRadius(radiusPx: Float) {
      // Strong blur hides detail anyway: sample at 1/4. Light blur keeps more detail: 1/2.
      scale = if (radiusPx >= 12f * resources.displayMetrics.density) 4f else 2f
      pad = radiusPx
      val r = (radiusPx / scale).coerceAtLeast(0.5f)
      node.setRenderEffect(RenderEffect.createBlurEffect(r, r, Shader.TileMode.CLAMP))
    }

    fun release() {
      node.discardDisplayList()
      ready = false
    }

    fun capture() {
      val root = rootView as? ViewGroup ?: return
      // The strip under the bar plus a margin, so the blur has real pixels to sample at the edges.
      val sw = ceil((width + 2 * pad) / scale).toInt()
      val sh = ceil((height + 2 * pad) / scale).toInt()
      node.setPosition(0, 0, sw, sh)
      getLocationInWindow(loc)
      root.getLocationInWindow(rootLoc)
      val c = node.beginRecording(sw, sh)
      try {
        c.scale(1f / scale, 1f / scale)
        c.translate(pad - (loc[0] - rootLoc[0]), pad - (loc[1] - rootLoc[1]))
        c.drawColor(bgColor)
        drawBehind(c, root)
      } finally {
        node.endRecording()
      }
      if (!ready) {
        ready = true
        invalidate() // first capture: our own display list must start referencing the node
      }
    }

    /** Everything below this bar in drawing order, level by level from the window root down. */
    private fun drawBehind(c: RecordingCanvas, root: ViewGroup) {
      path.clear()
      var v: View = this@GlassBarView
      while (v !== root) {
        path.add(v)
        v = v.parent as? View ?: return
      }
      var group: ViewGroup = root
      for (i in path.indices.reversed()) {
        val onPath = path[i]
        group.background?.let { bg ->
          c.save()
          c.translate(group.scrollX.toFloat(), group.scrollY.toFloat())
          bg.draw(c)
          c.restore()
        }
        for (k in 0 until group.childCount) {
          val child = group.getChildAt(k)
          if (child === onPath) break
          drawChild(c, child)
        }
        enter(c, onPath)
        group = onPath as? ViewGroup ?: return
      }
    }

    private fun enter(c: Canvas, v: View) {
      c.translate(v.left.toFloat(), v.top.toFloat())
      if (!v.matrix.isIdentity) c.concat(v.matrix)
      c.translate(-v.scrollX.toFloat(), -v.scrollY.toFloat())
    }

    private fun drawChild(c: RecordingCanvas, child: View) {
      if (child.visibility != View.VISIBLE || child.alpha <= 0f || child.width == 0 || child.height == 0) return
      c.save()
      c.translate(child.left.toFloat(), child.top.toFloat())
      val identity = child.matrix.isIdentity
      if (!identity) c.concat(child.matrix)
      // Skip views that don't reach the strip under the bar.
      if (identity && c.quickReject(0f, 0f, child.width.toFloat(), child.height.toFloat())) {
        c.restore()
        return
      }
      if (child.alpha < 1f) c.saveLayerAlpha(0f, 0f, child.width.toFloat(), child.height.toFloat(), (child.alpha * 255).toInt())
      c.translate(-child.scrollX.toFloat(), -child.scrollY.toFloat())
      // On a hardware canvas this reuses the child's display list (and its children's):
      // nothing is re-rendered.
      child.draw(c)
      c.restore()
    }

    fun draw(canvas: Canvas) {
      if (!ready || !node.hasDisplayList()) return
      canvas.save()
      canvas.translate(-pad, -pad)
      canvas.scale(scale, scale)
      canvas.drawRenderNode(node)
      canvas.restore()
    }
  }

  companion object {
    /** RenderNode + RenderEffect blur. */
    const val BLUR_MIN_SDK = Build.VERSION_CODES.S

    /**
     * Global switch: apps can turn the live blur off (e.g. a "reduce transparency" setting) and
     * every bar becomes a flat tinted bar. Takes effect for bars configured afterwards.
     */
    @JvmStatic var liveBlur: Boolean = true
  }
}
