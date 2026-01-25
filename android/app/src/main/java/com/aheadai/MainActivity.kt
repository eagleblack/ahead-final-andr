package com.aheadai

import android.os.Bundle
import android.view.View
import android.widget.FrameLayout
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactRootView
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    private var splashContainer: FrameLayout? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-Edge UI
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

        // Inflate splash.xml layout
        val splashView = layoutInflater.inflate(R.layout.splash, null)
        splashContainer = splashView.findViewById(R.id.splash_container)

        // Attach splash above React Root
        addContentView(
                splashView, // <-- use the full layout, not only the FrameLayout
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )
    }

    fun hideSplash() {
        runOnUiThread {
            splashContainer?.animate()
                ?.alpha(0f)
                ?.setDuration(500)
                ?.withEndAction {
                    splashContainer?.visibility = View.GONE
                    splashContainer = null
                }
                ?.start()
        }
    }

    override fun getMainComponentName(): String = "aheadai"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
            override fun createRootView(): ReactRootView {
                return ReactRootView(this@MainActivity)
            }
        }
    }
}
