package com.chakkimitra.app.utils

import android.content.Context
import android.content.SharedPreferences

class PreferencesManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "chakki_mitra_prefs"
        private const val KEY_LANG = "app_language"
        private const val KEY_DARK_MODE = "dark_mode"
        private const val KEY_FIRST_LAUNCH = "first_launch"
    }

    var appLanguage: String
        get() = prefs.getString(KEY_LANG, "en") ?: "en"
        set(value) = prefs.edit().putString(KEY_LANG, value).apply()

    var isDarkModeEnabled: Boolean
        get() = prefs.getBoolean(KEY_DARK_MODE, false)
        set(value) = prefs.edit().putBoolean(KEY_DARK_MODE, value).apply()

    var isFirstLaunch: Boolean
        get() = prefs.getBoolean(KEY_FIRST_LAUNCH, true)
        set(value) = prefs.edit().putBoolean(KEY_FIRST_LAUNCH, value).apply()
}
