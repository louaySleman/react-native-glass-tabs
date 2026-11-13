package com.glasstabs

import android.app.ActivityManager
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.animation.ArgbEvaluator
import android.animation.ValueAnimator
import android.graphics.Outline
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.SweepGradient
import android.graphics.Paint
import android.graphics.RecordingCanvas
import android.graphics.RectF
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.RuntimeShader
import android.graphics.Shader
import android.os.Build
import android.os.SystemClock
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.view.ViewTreeObserver
import android.widget.TextView
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
 * Liquid glass (`effect: 'liquid'`, Android 13+): a lighter blur, then a small AGSL shader on
 * the same node bends what's behind the edges (like a lens), adds a touch of saturation, and a
 * crisp light rim is drawn on top. Same capture, so nearly the same cost.
 *
 * Android 11 and below, low-RAM phones, `blurRadius` 0, or [liveBlur] off: a flat tinted bar
 * (no capture at all).
 *
 * Used as the tab bar's background and, with React children, as the standalone BlurView /
 * LiquidGlassView: there, text and icons inside fade to white over dark content (or to near-black
 * over light content in dark mode) by themselves.
 */
class GlassBarView(context: Context) : FrameLayout(context), ViewTreeObserver.OnPreDrawListener {

  private val tintPaint = Paint()
  private var backgroundOpacity: Float? = null
  private var cornerRadiusPx = 28f * resources.displayMetrics.density
  private var bgColor = Color.WHITE
  private var bgOpacity = 0.85f
  private var blurRadiusPx = 0f
  private var liquid = false
  private var darkMode = false
  private val rimPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
  private val sheenPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val rimRect = RectF()
  private val visibleRect = android.graphics.Rect()
  private var lastCaptureAt = 0L
  private var lastPreDrawAt = 0L
  private fun activity(): android.app.Activity? {
    var c: Context? = context
    while (c is android.content.ContextWrapper) {
      if (c is android.app.Activity) return c
      (c as? com.facebook.react.bridge.ReactContext)?.currentActivity?.let { return it }
      c = c.baseContext
    }
    return null
  }

  private val deferredCapture = Runnable {
    lastCaptureAt = 0L
    lastPreDrawAt = 0L
    invalidate() // asks for one more frame; its pre-draw captures the settled backdrop
  }

  /**
   * Called (on the main thread) when what shows through the bar turns dark or light, so the
   * icons can switch between dark and light. Only fires when it changes.
   */
  var onBackdropDarkChange: ((Boolean, BooleanArray) -> Unit)? = null
  private var backdropDark: Boolean? = null

  /** Tab bar: measure each tab's part of the bar separately (equal slices, left to right). */
  private var segments = 0
  private var segmentDark = BooleanArray(0)
  private var adaptive = true

  /** Recolour text and icons inside (standalone glass views) to stay readable. */
  private var adaptiveContent = false
  private var contentColor = Color.TRANSPARENT
  private var contentAnim: ValueAnimator? = null
  private val relayout = ViewTreeObserver.OnGlobalLayoutListener { applyContentColor(contentColor) }

  /** API 31+ only; typed as Any so older devices never load RenderNode / RenderEffect. */
  private var backdrop: Any? = null
  private var observed: ViewTreeObserver? = null

  init {
    setBackgroundColor(Color.TRANSPARENT)
    setWillNotDraw(false)
    outlineProvider = object : ViewOutlineProvider() {
      override fun getOutline(view: View, outline: Outline) {
        outline.setRoundRect(0, 0, view.width, view.height, cornerRadiusPx)
      }
    }
    clipToOutline = true
  }

  fun configure(
    cornerRadius: Float,
    backgroundColor: Int,
    opacity: Float,
    blurRadius: Float,
    darkMode: Boolean,
    liquid: Boolean = false,
    adaptiveIcons: Boolean = true,
    backgroundOpacity: Float? = null,
    adaptiveContent: Boolean = false,
    segments: Int = 0,
  ) {
    this.segments = segments.coerceIn(0, LUM_W)
    segmentDark = BooleanArray(0)
    adaptive = adaptiveIcons || adaptiveContent
    this.backgroundOpacity = backgroundOpacity?.coerceIn(0f, 1f)
    if (this.adaptiveContent != adaptiveContent) {
      this.adaptiveContent = adaptiveContent
      if (!adaptiveContent) animateContentColor(Color.TRANSPARENT)
    }
    // Report the next measurement again (the JS side starts over after a look / theme change).
    backdropDark = null
    val density = resources.displayMetrics.density
    cornerRadiusPx = cornerRadius * density
    bgColor = backgroundColor
    bgOpacity = opacity
    blurRadiusPx = blurRadius.coerceIn(0f, 25f) * density
    this.darkMode = darkMode
    this.liquid = liquid && Build.VERSION.SDK_INT >= LIQUID_MIN_SDK
    rimPaint.shader = null
    invalidateOutline()
    applyMode()
  }

  /** React Native positions the children (standalone glass view); the frame layout must not. */
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) = Unit

  private fun blurWanted(): Boolean {
    // Liquid glass works even with no blur at all (a perfectly clear lens); blur needs a radius.
    if (!liveBlur || Build.VERSION.SDK_INT < BLUR_MIN_SDK || (blurRadiusPx < 1f && !liquid)) return false
    val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
    return am?.isLowRamDevice != true
  }

  /** Switches between live blur and the flat bar. Cheap to call on every prop change. */
  private fun applyMode() {
    val blur = blurWanted()
    val r = Color.red(bgColor)
    val g = Color.green(bgColor)
    val b = Color.blue(bgColor)
    // Over the blur the tint is lighter (liquid glass lighter still); flat shows the full opacity.
    // `backgroundOpacity` (a percentage on the JS side) sets it exactly for blur and liquid glass.
    val tint = if (!blur) bgOpacity else backgroundOpacity ?: if (liquid) bgOpacity * 0.22f else bgOpacity * 0.55f
    val alpha = (tint * 255).toInt().coerceIn(0, 255)
    tintPaint.color = Color.argb(alpha, r, g, b)
    if (blur && Build.VERSION.SDK_INT >= BLUR_MIN_SDK) {
      val bd = (backdrop as? Backdrop) ?: Backdrop().also { backdrop = it }
      bd.setup(blurRadiusPx, liquid)
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
    QualityGovernor.attach(activity())
    if (backdrop != null) startObserving()
  }

  override fun onDetachedFromWindow() {
    QualityGovernor.detach()
    removeCallbacks(deferredCapture)
    stopObserving()
    contentAnim?.cancel()
    viewTreeObserver.removeOnGlobalLayoutListener(relayout)
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

  /** Light selection haptic (respects the phone's touch-feedback setting). */
  fun tick() {
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.SEGMENT_TICK else HapticFeedbackConstants.CLOCK_TICK
    performHapticFeedback(type)
  }

  /** Runs only when the window is about to draw a frame (something changed). */
  override fun onPreDraw(): Boolean {
    if (Build.VERSION.SDK_INT >= BLUR_MIN_SDK && width > 0 && height > 0 && isShown) {
      (backdrop as? Backdrop)?.let {
        // Scrolled off screen (e.g. glass cards in a long list): no work at all.
        if (!getGlobalVisibleRect(visibleRect)) {
          it.releaseSampler()
          return true
        }
        // While things move every frame (scrolling, animations), refresh the backdrop at most
        // ~30 times a second (less when the phone is dropping frames, or not at all while
        // moving on a struggling phone / in battery saver — see QualityGovernor). Under a blur
        // the difference can't be seen. A last refresh always follows once the motion stops.
        val now = SystemClock.uptimeMillis()
        val interval = when (QualityGovernor.level) {
          QualityGovernor.FULL -> CAPTURE_INTERVAL_MS
          QualityGovernor.REDUCED -> CAPTURE_INTERVAL_MS * 2
          else -> Long.MAX_VALUE
        }
        val moving = now - lastPreDrawAt < MOTION_GAP_MS
        lastPreDrawAt = now
        val skip = if (interval == Long.MAX_VALUE) moving && lastCaptureAt > 0 else now - lastCaptureAt < interval
        if (skip) {
          removeCallbacks(deferredCapture)
          postDelayed(deferredCapture, if (interval == Long.MAX_VALUE) SETTLE_MS else CAPTURE_INTERVAL_MS)
          return true
        }
        lastCaptureAt = now
        it.capture()
        if (adaptive && onBackdropDarkChange != null) it.sampleLuminance()
      }
    }
    return true
  }

  override fun dispatchDraw(canvas: Canvas) {
    if (Build.VERSION.SDK_INT >= BLUR_MIN_SDK && canvas.isHardwareAccelerated) {
      (backdrop as? Backdrop)?.draw(canvas)
    }
    if (Color.alpha(tintPaint.color) > 0) canvas.drawPaint(tintPaint)
    super.dispatchDraw(canvas)
    if (liquid && backdrop != null) drawRim(canvas)
  }

  /** What shows through turned dark or light: recolour the content (standalone views). */
  private fun onBackdrop(dark: Boolean) {
    if (!adaptiveContent) return
    // Light theme: content is designed dark, so only dark backdrops need it white. Dark theme:
    // content is designed light, so only light backdrops need it near-black.
    val target = when {
      dark && !darkMode -> Color.WHITE
      !dark && darkMode -> CONTENT_DARK
      else -> Color.TRANSPARENT
    }
    animateContentColor(target)
  }

  /** Fades text and icons from their colour to [target] (transparent = their own colour). */
  private fun animateContentColor(target: Int) {
    val from = contentColor
    if (from == target) return
    contentAnim?.cancel()
    // Fading towards "own colour" keeps the old colour's hue and just drops its strength.
    val end = if (target == Color.TRANSPARENT) from and 0x00FFFFFF else target
    val start = if (from == Color.TRANSPARENT) target and 0x00FFFFFF else from
    contentAnim = ValueAnimator.ofObject(ArgbEvaluator(), start, end).apply {
      duration = CONTENT_FADE_MS
      addUpdateListener { applyContentColor(it.animatedValue as Int) }
      start()
    }
    contentColor = target
    if (target != Color.TRANSPARENT) viewTreeObserver.addOnGlobalLayoutListener(relayout)
    else viewTreeObserver.removeOnGlobalLayoutListener(relayout)
  }

  /** Recolours every text (labels, and icon fonts) inside: `color` over them by its alpha. */
  private fun applyContentColor(color: Int) {
    if (Build.VERSION.SDK_INT < BLUR_MIN_SDK) return
    val effect = if (Color.alpha(color) == 0) null
      else RenderEffect.createColorFilterEffect(PorterDuffColorFilter(color, PorterDuff.Mode.SRC_ATOP))
    fun walk(v: View) {
      if (v is TextView) v.setRenderEffect(effect)
      else if (v is ViewGroup) for (i in 0 until v.childCount) walk(v.getChildAt(i))
    }
    for (i in 0 until childCount) walk(getChildAt(i))
  }

  /**
   * Liquid glass light (as on iOS 26): a hairline rim that catches the light on two opposite
   * corners — top-left strongest, bottom-right softer — and almost disappears in between, plus
   * a faint sheen just inside the top edge.
   */
  private fun drawRim(canvas: Canvas) {
    val d = resources.displayMetrics.density
    if (rimPaint.shader == null) {
      val k = if (darkMode) 0.7f else 1f
      fun white(a: Float) = Color.argb((a * k * 255).toInt().coerceIn(0, 255), 255, 255, 255)
      // Angles run clockwise from 3 o'clock: 0.125 = bottom-right, 0.625 = top-left.
      rimPaint.shader = SweepGradient(
        width / 2f, height / 2f,
        intArrayOf(white(0.18f), white(0.38f), white(0.05f), white(0.05f), white(0.62f), white(0.05f), white(0.05f), white(0.18f)),
        floatArrayOf(0f, 0.125f, 0.3f, 0.45f, 0.625f, 0.8f, 0.95f, 1f),
      )
      rimPaint.strokeWidth = 0.8f * d
      sheenPaint.shader = LinearGradient(
        0f, 0f, 0f, height * 0.5f,
        intArrayOf(white(0.14f), white(0f)),
        null,
        Shader.TileMode.CLAMP,
      )
    }
    val inset = rimPaint.strokeWidth / 2f
    rimRect.set(inset, inset, width - inset, height - inset)
    val r = (cornerRadiusPx - inset).coerceAtLeast(0f)
    canvas.drawRoundRect(rimRect, r, r, sheenPaint)
    canvas.drawRoundRect(rimRect, r, r, rimPaint)
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    rimPaint.shader = null
  }

  @RequiresApi(BLUR_MIN_SDK)
  private inner class Backdrop {
    private val node = RenderNode("GlassBarBackdrop")
    private var scale = 4f
    private var pad = 0f
    private var ready = false
    private var liquidOn = false
    private var blurPx = 0f
    private var shader: Any? = null
    private var shaderW = -1
    private var shaderH = -1
    private val loc = IntArray(2)
    private val rootLoc = IntArray(2)
    private val path = ArrayList<View>(16)

    fun setup(radiusPx: Float, liquid: Boolean) {
      val d = resources.displayMetrics.density
      liquidOn = liquid
      // Liquid glass is mostly clear: a much lighter blur, sampled at 1/2 to keep detail.
      blurPx = if (liquid) radiusPx * 0.35f else radiusPx
      // Strong blur hides detail anyway: sample at 1/4. Light blur keeps more detail: 1/2.
      // (Liquid glass keeps more detail: 1/3, still a ninth of the pixels.)
      scale = if (liquid) 3f else if (blurPx >= 12f * d) 4f else 2f
      // Margin around the bar: what the blur (and the liquid edge) reach for.
      pad = blurPx
      shaderW = -1
      applyEffect()
    }

    /** Edge bend: 14dp on a tab bar, less on small glass (a quarter of its short side). */
    private fun liquidDepthPx(): Float {
      val d = resources.displayMetrics.density
      val short = minOf(width, height).toFloat()
      return if (short > 0f) minOf(LIQUID_DEPTH_DP * d, short * 0.25f) else LIQUID_DEPTH_DP * d
    }

    private fun applyEffect() {
      val r = blurPx / scale
      // Liquid glass with blur 0: no blur pass at all, only the lens.
      val blur = if (r >= 0.5f) RenderEffect.createBlurEffect(r, r, Shader.TileMode.CLAMP) else null
      if (!liquidOn || Build.VERSION.SDK_INT < LIQUID_MIN_SDK || width == 0) {
        node.setRenderEffect(blur ?: RenderEffect.createBlurEffect(0.5f, 0.5f, Shader.TileMode.CLAMP))
        return
      }
      node.setRenderEffect(if (blur != null) RenderEffect.createChainEffect(liquidEffect(), blur) else liquidEffect())
    }

    @RequiresApi(LIQUID_MIN_SDK)
    private fun liquidEffect(): RenderEffect {
      val d = resources.displayMetrics.density
      val sh = (shader as? RuntimeShader) ?: RuntimeShader(LIQUID_AGSL).also { shader = it }
      sh.setFloatUniform("origin", pad / scale, pad / scale)
      sh.setFloatUniform("bar", width / scale, height / scale)
      sh.setFloatUniform("radius", minOf(cornerRadiusPx, minOf(width, height) / 2f) / scale)
      sh.setFloatUniform("depth", liquidDepthPx() / scale)
      shaderW = width
      shaderH = height
      return RenderEffect.createRuntimeShaderEffect(sh, "content")
    }

    fun release() {
      node.discardDisplayList()
      ready = false
      releaseSampler()
    }

    // ---- How dark is what shows through? ------------------------------------------------------
    // The strip under the view is drawn again, tiny (24x6), and read back by one sampler shared
    // by every glass view (see [LuminanceSampler]). At most a few times a second, only while
    // frames are drawn and the view is on screen.

    private var lastSample = 0L
    private var queued = false

    /** Nothing per view to free: the sampler is shared. Kept for the off-screen path. */
    fun releaseSampler() = Unit

    fun sampleLuminance() {
      val now = SystemClock.uptimeMillis()
      if (queued || now - lastSample < LUM_INTERVAL_MS) return
      lastSample = now
      queued = true
      LuminanceSampler.request(
        record = record@{ c ->
          val root = rootView as? ViewGroup
          if (root == null || !isAttachedToWindow || width == 0 || height == 0) return@record false
          getLocationInWindow(loc)
          root.getLocationInWindow(rootLoc)
          c.scale(LUM_W.toFloat() / width, LUM_H.toFloat() / height)
          c.translate(-(loc[0] - rootLoc[0]).toFloat(), -(loc[1] - rootLoc[1]).toFloat())
          c.drawColor(bgColor)
          drawBehind(c, root)
          true
        },
        done = { cols ->
          queued = false
          if (cols != null) onLuminance(cols)
        },
      )
    }

    private fun onLuminance(cols: DoubleArray) {
      // What the eye sees is the backdrop under the tint: blend the two.
      val tintA = Color.alpha(tintPaint.color) / 255.0
      val tintL = (0.2126 * Color.red(bgColor) + 0.7152 * Color.green(bgColor) + 0.0722 * Color.blue(bgColor)) / 255.0
      fun seen(from: Int, to: Int): Double {
        var sum = 0.0
        for (x in from until to) sum += cols[x]
        return (sum / (to - from)) * (1 - tintA) + tintL * tintA
      }
      // Hysteresis, so it doesn't flicker on mid-grey content.
      fun darkness(was: Boolean?, v: Double) = when (was) {
        true -> v < 0.62
        false -> v < 0.55
        null -> v < 0.58
      }
      val was = backdropDark
      val dark = darkness(was, seen(0, cols.size))
      var changed = dark != was
      if (segments > 0) {
        val prev = segmentDark
        val next = BooleanArray(segments) { k ->
          val from = k * cols.size / segments
          val to = maxOf(from + 1, (k + 1) * cols.size / segments)
          darkness(prev.getOrNull(k), seen(from, to))
        }
        if (!next.contentEquals(prev)) changed = true
        segmentDark = next
      }
      if (changed) {
        if (dark != was) onBackdrop(dark)
        backdropDark = dark
        onBackdropDarkChange?.invoke(dark, segmentDark)
      }
    }

    fun capture() {
      val root = rootView as? ViewGroup ?: return
      if (liquidOn && (width != shaderW || height != shaderH)) applyEffect()
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

    private const val CONTENT_DARK = 0xFF1C1C1E.toInt()
    private const val CAPTURE_INTERVAL_MS = 32L

    /** Frames closer than this mean "still moving". */
    private const val MOTION_GAP_MS = 50L

    /** STILL level: refresh this long after the motion stops. */
    private const val SETTLE_MS = 120L

    private const val CONTENT_FADE_MS = 280L
    internal const val LUM_W = 24
    internal const val LUM_H = 6
    private const val LUM_INTERVAL_MS = 250L

    /** AGSL RuntimeShader (liquid glass). */
    const val LIQUID_MIN_SDK = Build.VERSION_CODES.TIRAMISU

    /** How far in from the edge the glass bends what's behind it. */
    private const val LIQUID_DEPTH_DP = 14f

    /**
     * Runs on the (already blurred, low-res) backdrop. Near the rounded edge, samples are pulled
     * inwards along the edge normal, so what's behind is magnified and bent at the rim like light
     * through a thick lens. The middle stays clear.
     */
    private const val LIQUID_AGSL = """
      uniform shader content;
      uniform float2 origin;
      uniform float2 bar;
      uniform float radius;
      uniform float depth;

      half4 main(float2 p) {
        float2 hb = bar * 0.5;
        float2 c = p - origin - hb;
        float2 k = max(hb - radius, float2(0.0));
        float2 d = abs(c) - k;
        float sd = length(max(d, float2(0.0))) + min(max(d.x, d.y), 0.0) - radius;
        // 1 at the edge, 0 from `depth` inwards; eased so the bend hugs the rim.
        float t = clamp(1.0 + sd / depth, 0.0, 1.0);
        t = t * t;
        float2 n = (d.x > 0.0 && d.y > 0.0) ? normalize(d) : (d.x > d.y ? float2(1.0, 0.0) : float2(0.0, 1.0));
        n *= sign(c + float2(0.0001));
        // The whole glass is a slightly convex lens: what's behind looks a touch bigger...
        float2 lens = -c * 0.03;
        // ...and towards the rim it magnifies strongly, like the thick edge of a lens (samples
        // are pulled inwards, so it never reads anything outside the glass).
        float2 off = lens - n * depth * t;
        half4 col = content.eval(p + off);
        // Glass gathers light: a little brighter and more colourful than what's behind it.
        half l = dot(col.rgb, half3(0.2126, 0.7152, 0.0722));
        col.rgb = clamp(mix(half3(l), col.rgb, 1.25) * 1.04, 0.0, 1.0);
        return col;
      }
    """

    /**
     * Global switch: apps can turn the live blur off (e.g. a "reduce transparency" setting) and
     * every bar becomes a flat tinted bar. Takes effect for bars configured afterwards.
     */
    @JvmStatic var liveBlur: Boolean = true
  }
}
