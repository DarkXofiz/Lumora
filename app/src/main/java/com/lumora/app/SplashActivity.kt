package com.lumora.app

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.graphics.Typeface
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.view.animation.LinearInterpolator
import android.view.animation.PathInterpolator
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import kotlin.math.min
import kotlin.math.sin

/** Animated Lumora orb: rises with a soft glow, two light rings expand outward, then it breathes. */
class LumoraOrbView(context: Context) : View(context) {
    /** 0..1 – orb entrance */
    var rise = 0f
        set(v) { field = v; invalidate() }
    /** 0..1 – ring burst */
    var burst = 0f
        set(v) { field = v; invalidate() }
    /** 0..1 – looping breathing phase */
    var breathe = 0f
        set(v) { field = v; invalidate() }

    private val glow = Paint(Paint.ANTI_ALIAS_FLAG)
    private val orb = Paint(Paint.ANTI_ALIAS_FLAG)
    private val shine = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(95, 255, 255, 255) }
    private val ring = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }

    override fun onDraw(c: Canvas) {
        val cx = width / 2f
        val cy = height / 2f
        val base = min(width, height) * 0.17f
        val pulse = 1f + 0.035f * sin(breathe * 2f * Math.PI.toFloat())
        val r = base * rise * pulse
        if (r <= 1f) return
        val a = (rise * 255).toInt().coerceIn(0, 255)

        // glow
        val gr = r * (2.6f + 0.25f * sin(breathe * 2f * Math.PI.toFloat()))
        glow.shader = RadialGradient(cx, cy, gr, intArrayOf(Color.argb((a * 0.38f).toInt(), 255, 207, 92), Color.argb((a * 0.12f).toInt(), 224, 69, 122), Color.TRANSPARENT), floatArrayOf(0.25f, 0.6f, 1f), Shader.TileMode.CLAMP)
        c.drawCircle(cx, cy, gr, glow)

        // expanding rings
        if (burst in 0.001f..0.999f) {
            for (i in 0..1) {
                val p = (burst - i * 0.18f).coerceIn(0f, 1f)
                if (p <= 0f) continue
                val e = 1f - (1f - p) * (1f - p)
                ring.strokeWidth = base * 0.035f * (1f - p) + 1f
                ring.color = Color.argb(((1f - p) * 150).toInt(), 255, 207, 92)
                c.drawCircle(cx, cy, r * (1.15f + 2.4f * e), ring)
            }
        }

        // orb body
        orb.shader = RadialGradient(cx - r * 0.3f, cy - r * 0.4f, r * 1.45f, intArrayOf(0xFFFFF3C4.toInt(), 0xFFFFCF5C.toInt(), 0xFFE0457A.toInt()), floatArrayOf(0f, 0.45f, 1f), Shader.TileMode.CLAMP)
        orb.alpha = a
        c.drawCircle(cx, cy, r, orb)

        // specular highlight
        shine.alpha = (a * 0.37f).toInt()
        c.save(); c.rotate(-18f, cx - r * 0.3f, cy - r * 0.42f)
        c.drawOval(cx - r * 0.55f, cy - r * 0.62f, cx - r * 0.05f, cy - r * 0.3f, shine)
        c.restore()

        // fine outer ring
        ring.strokeWidth = 1.5f; ring.color = Color.argb((a * 0.35f).toInt(), 255, 207, 92)
        c.drawCircle(cx, cy, r * 1.32f, ring)
    }
}

class SplashActivity : AppCompatActivity() {
    private val anims = mutableListOf<ValueAnimator>()
    private var launched = false

    private fun sp(v: Float) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, v, resources.displayMetrics)
    private fun dp(v: Float) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, resources.displayMetrics)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = FrameLayout(this).apply { setBackgroundColor(0xFF14111F.toInt()) }
        val orb = LumoraOrbView(this)
        root.addView(orb, FrameLayout.LayoutParams(-1, -1))

        val title = TextView(this).apply {
            text = "Lumora"; setTextColor(0xFFF1EEFC.toInt()); setTextSize(TypedValue.COMPLEX_UNIT_PX, sp(40f))
            typeface = Typeface.create("sans-serif-light", Typeface.NORMAL); letterSpacing = 0.35f; alpha = 0f; gravity = Gravity.CENTER
        }
        val tag = TextView(this).apply {
            text = "Aç ve kes."; setTextColor(0xFF8A82A8.toInt()); setTextSize(TypedValue.COMPLEX_UNIT_PX, sp(14f))
            letterSpacing = 0.18f; alpha = 0f; gravity = Gravity.CENTER
        }
        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER_HORIZONTAL
            addView(title); addView(tag, LinearLayout.LayoutParams(-2, -2).apply { topMargin = dp(10f).toInt() })
        }
        root.addView(col, FrameLayout.LayoutParams(-2, -2, Gravity.CENTER).apply { topMargin = dp(150f).toInt() })
        setContentView(root)

        val smooth = PathInterpolator(0.2f, 0.8f, 0.2f, 1f)
        fun anim(d: Long, delay: Long = 0, loop: Boolean = false, ip: android.animation.TimeInterpolator = smooth, end: (() -> Unit)? = null, f: (Float) -> Unit) =
            ValueAnimator.ofFloat(0f, 1f).apply {
                duration = d; startDelay = delay; interpolator = ip
                if (loop) { repeatCount = ValueAnimator.INFINITE }
                addUpdateListener { f(it.animatedValue as Float) }
                if (end != null) addListener(object : AnimatorListenerAdapter() { override fun onAnimationEnd(a: Animator) { end() } })
                anims += this; start()
            }
        anim(1500) { orb.rise = it }
        anim(1400, 750, ip = DecelerateInterpolator(1.6f)) { orb.burst = it }
        anim(2600, 0, loop = true, ip = LinearInterpolator()) { orb.breathe = it }
        anim(1100, 600) { title.alpha = it; title.letterSpacing = 0.35f - 0.29f * it; title.translationY = (1f - it) * dp(10f) }
        anim(800, 1250) { tag.alpha = it * 0.9f; tag.translationY = (1f - it) * dp(6f) }
        // hold, then dissolve into the app
        anim(450, 2450, ip = LinearInterpolator(), end = { go() }) { root.alpha = 1f - it }
        root.setOnClickListener { go() } // tap to skip
    }

    private fun go() {
        if (launched || isFinishing) return
        launched = true
        startActivity(Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION))
        @Suppress("DEPRECATION") overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }

    override fun onDestroy() { anims.forEach { it.cancel() }; super.onDestroy() }
}
