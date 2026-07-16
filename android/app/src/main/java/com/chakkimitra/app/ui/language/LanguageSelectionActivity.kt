package com.chakkimitra.app.ui.language

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.chakkimitra.app.R
import com.chakkimitra.app.databinding.ActivityLanguageSelectionBinding
import com.chakkimitra.app.ui.MainActivity
import com.chakkimitra.app.utils.LocaleHelper
import com.chakkimitra.app.utils.PreferencesManager

class LanguageSelectionActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLanguageSelectionBinding
    private lateinit var prefsManager: PreferencesManager

    override fun attachBaseContext(newBase: Context) {
        val manager = PreferencesManager(newBase)
        val context = LocaleHelper.applyLocale(newBase, manager.appLanguage)
        super.attachBaseContext(context)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        prefsManager = PreferencesManager(this)
        
        // If not first launch, skip and go directly to MainActivity
        if (!prefsManager.isFirstLaunch) {
            startMainActivity()
            return
        }

        binding = ActivityLanguageSelectionBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Set default check based on preferences
        if (prefsManager.appLanguage == "hi") {
            binding.rbHindi.isChecked = true
        } else {
            binding.rbEnglish.isChecked = true
        }

        binding.btnContinue.setOnClickListener {
            val selectedLang = if (binding.rbHindi.isChecked) "hi" else "en"
            prefsManager.appLanguage = selectedLang
            prefsManager.isFirstLaunch = false
            
            // Reapply locale and navigate
            LocaleHelper.applyLocale(this, selectedLang)
            startMainActivity()
        }
    }

    private fun startMainActivity() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
