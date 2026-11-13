package com.glasstabs

import android.graphics.HardwareRenderer
import android.graphics.PixelFormat
import android.graphics.RecordingCanvas
import android.graphics.RenderNode
import android.hardware.HardwareBuffer
import android.media.ImageReader
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import androidx.annotation.RequiresApi

/**
 * Measures how bright the content behind a glass view is: the view records what's behind it into
 * a tiny 24x6 node, this renders it offscreen and averages the pixels on a background thread.
 *
 * One renderer, one surface and one thread for every glass view in the app, used one request at
 * a time (creating a renderer per view, as views scroll in and out, is what would cost).
 * All calls on the main thread.
 */
@RequiresApi(GlassBarView.BLUR_MIN_SDK)
internal object LuminanceSampler {

  private class Request(val record: (RecordingCanvas) -> Boolean, val done: (Double?) -> Unit)

  private val main = Handler(Looper.getMainLooper())
  private val worker by lazy { Handler(HandlerThread("GlassLuminance").also { it.start() }.looper) }
  private val node = RenderNode("GlassLuminance")
  private var renderer: HardwareRenderer? = null
  private var reader: ImageReader? = null
  private var broken = false
  private val queue = ArrayDeque<Request>()
  private var current: Request? = null
  private var generation = 0

  fun request(record: (RecordingCanvas) -> Boolean, done: (Double?) -> Unit) {
    if (broken) return done(null)
    queue.addLast(Request(record, done))
    pump()
  }

  private fun ensure(): Boolean {
    if (renderer != null) return true
    return try {
      val r = ImageReader.newInstance(
        GlassBarView.LUM_W, GlassBarView.LUM_H, PixelFormat.RGBA_8888, 2,
        HardwareBuffer.USAGE_GPU_COLOR_OUTPUT or HardwareBuffer.USAGE_CPU_READ_OFTEN,
      )
      r.setOnImageAvailableListener({ read(it) }, worker)
      val hr = HardwareRenderer()
      hr.setContentRoot(node)
      hr.setSurface(r.surface)
      reader = r
      renderer = hr
      true
    } catch (e: Throwable) {
      broken = true // no offscreen rendering on this device: icons just follow the theme
      false
    }
  }

  private fun pump() {
    if (current != null) return
    val req = queue.removeFirstOrNull() ?: return
    if (!ensure()) {
      req.done(null)
      queue.forEach { it.done(null) }
      queue.clear()
      return
    }
    node.setPosition(0, 0, GlassBarView.LUM_W, GlassBarView.LUM_H)
    val c = node.beginRecording(GlassBarView.LUM_W, GlassBarView.LUM_H)
    val ok = try {
      req.record(c)
    } catch (e: Throwable) {
      false
    } finally {
      node.endRecording()
    }
    if (!ok) {
      req.done(null)
      return pump()
    }
    current = req
    val gen = ++generation
    renderer?.createRenderRequest()?.setWaitForPresent(false)?.syncAndDraw()
    // Never let one lost frame block every other view.
    main.postDelayed({ if (generation == gen) finish(null) }, 500)
  }

  private fun read(r: ImageReader) {
    val avg = try {
      r.acquireLatestImage()?.use { image ->
        val plane = image.planes[0]
        val buf = plane.buffer
        var sum = 0.0
        for (y in 0 until GlassBarView.LUM_H) {
          for (x in 0 until GlassBarView.LUM_W) {
            val i = y * plane.rowStride + x * plane.pixelStride
            sum += 0.2126 * (buf.get(i).toInt() and 0xFF) +
              0.7152 * (buf.get(i + 1).toInt() and 0xFF) +
              0.0722 * (buf.get(i + 2).toInt() and 0xFF)
          }
        }
        sum / (255.0 * GlassBarView.LUM_W * GlassBarView.LUM_H)
      }
    } catch (e: Throwable) {
      null
    }
    main.post { finish(avg) }
  }

  private fun finish(avg: Double?) {
    val req = current ?: return
    current = null
    generation++
    req.done(avg)
    pump()
  }
}
