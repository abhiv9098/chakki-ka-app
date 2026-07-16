package com.chakkimitra.app.utils

import android.content.Context
import android.content.res.Configuration
import java.util.Locale

object LocaleHelper {

    fun applyLocale(context: Context, languageCode: String): Context {
        val locale = Locale(languageCode)
        Locale.setDefault(locale)

        val resources = context.resources
        val configuration = resources.configuration

        return if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
            configuration.setLocale(locale)
            configuration.setLayoutDirection(locale)
            context.createConfigurationContext(configuration)
        } else {
            configuration.locale = locale
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.JELLY_BEAN_MR1) {
                configuration.setLayoutDirection(locale)
            }
            resources.updateConfiguration(configuration, resources.displayMetrics)
            context
        }
    }
}
