package com.aheadai

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SplashModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SplashModule"

    @ReactMethod
    fun hide() {
        val activity = reactContext.currentActivity
        if (activity is MainActivity) {
            activity.hideSplash()
        }
    }
}
