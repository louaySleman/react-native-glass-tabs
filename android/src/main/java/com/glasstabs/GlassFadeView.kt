package com.glasstabs

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View

/**
 * Native view that renders a smooth linear gradient fade from transparent
 * at the top to the background color at the bottom.
 *
 * Uses a real LinearGradient shader for perfectly smooth rendering —
 * no banding, no visible steps.
 */
class GlassFadeView @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
  defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

  private val fadePaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private var fadeColor: Int = Color.WHITE
  private var isDarkMode: Boolean = false

  fun configure(backgroundColor: Int, darkMode: Boolean) {
    this.fadeColor = backgroundColor
    this.isDarkMode = darkMode
    updateShader()
    invalidate()
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    if (w > 0 && h > 0) {
      updateShader()
    }
  }

  private fun updateShader() {
    if (width <= 0 || height <= 0) return

    val r = Color.red(fadeColor)
    val g = Color.green(fadeColor)
    val b = Color.blue(fadeColor)

    // Telegram's alpha stops: 0x00, 0x60, 0xB0, 0xE8, 0xFF
    // Scaled by /285 in opacity mode for a slightly softer fade
    // Softer gradient — starts fully transparent, builds slowly
    val colors = intArrayOf(
      Color.argb(0x00, r, g, b),  // 0% — fully transparent at top
      Color.argb(0x00, r, g, b),  // still transparent
      Color.argb(0x30, r, g, b),  // ~19% — gentle start
      Color.argb(0x80, r, g, b),  // ~50%
      Color.argb(0xCC, r, g, b),  // ~80%
      Color.argb(0xFF, r, g, b),  // 100% — opaque at bottom
    )

    val positions = floatArrayOf(
      0.0f,
      0.20f,
      0.45f,
      0.65f,
      0.85f,
      1.0f,
    )

    fadePaint.shader = LinearGradient(
      0f, 0f,
      0f, height.toFloat(),
      colors, positions,
      Shader.TileMode.CLAMP
    )
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), fadePaint)
  }
}
