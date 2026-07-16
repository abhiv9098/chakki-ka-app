package com.chakkimitra.app

import android.app.Application
import androidx.appcompat.app.AppCompatDelegate
import com.chakkimitra.app.data.local.AppDatabase
import com.chakkimitra.app.data.repository.ChakkiRepository
import com.chakkimitra.app.utils.PreferencesManager

class ChakkiApp : Application() {

    val database by lazy { AppDatabase.getDatabase(this) }
    val repository by lazy { ChakkiRepository(database.customerDao(), database.orderDao(), database.creditDao()) }

    override fun onCreate() {
        super.onCreate()
        
        // Apply saved Dark Mode preference
        val preferencesManager = PreferencesManager(this)
        if (preferencesManager.isDarkModeEnabled) {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
        } else {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
        }
    }
}
