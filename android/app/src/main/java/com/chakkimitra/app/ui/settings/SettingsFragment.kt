package com.chakkimitra.app.ui.settings

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AppCompatDelegate
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.chakkimitra.app.R
import com.chakkimitra.app.databinding.FragmentSettingsBinding
import com.chakkimitra.app.utils.LocaleHelper
import com.chakkimitra.app.utils.PreferencesManager

class SettingsFragment : Fragment() {

    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    private val viewModel: SettingsViewModel by viewModels()
    private lateinit var prefsManager: PreferencesManager

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        prefsManager = PreferencesManager(requireContext())

        setupUIState()
        observeViewModel()
        setupListeners()
    }

    private fun setupUIState() {
        // Dark Mode switch state
        binding.switchDarkMode.isChecked = prefsManager.isDarkModeEnabled

        // Language toggle state
        if (prefsManager.appLanguage == "hi") {
            binding.toggleLanguage.check(R.id.btn_lang_hi)
        } else {
            binding.toggleLanguage.check(R.id.btn_lang_en)
        }
    }

    private fun observeViewModel() {
        viewModel.backupStatus.observe(viewLifecycleOwner) { success ->
            if (success != null) {
                if (success) {
                    Toast.makeText(context, getString(R.string.backup_success), Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(context, getString(R.string.backup_fail), Toast.LENGTH_SHORT).show()
                }
                viewModel.resetStatus()
            }
        }

        viewModel.restoreStatus.observe(viewLifecycleOwner) { success ->
            if (success != null) {
                if (success) {
                    Toast.makeText(context, getString(R.string.restore_success), Toast.LENGTH_LONG).show()
                    // Restart app to reload database
                    requireActivity().finishAffinity()
                    val intent = requireActivity().intent
                    startActivity(intent)
                } else {
                    Toast.makeText(context, getString(R.string.restore_fail), Toast.LENGTH_SHORT).show()
                }
                viewModel.resetStatus()
            }
        }
    }

    private fun setupListeners() {
        // Dark Mode Toggle
        binding.switchDarkMode.setOnCheckedChangeListener { _, isChecked ->
            prefsManager.isDarkModeEnabled = isChecked
            if (isChecked) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
            } else {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
            }
        }

        // Language Selection
        binding.toggleLanguage.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                val newLang = if (checkedId == R.id.btn_lang_hi) "hi" else "en"
                if (prefsManager.appLanguage != newLang) {
                    prefsManager.appLanguage = newLang
                    LocaleHelper.applyLocale(requireContext(), newLang)
                    // Recreate activity to update layout languages
                    requireActivity().recreate()
                }
            }
        }

        // Backup Button
        binding.btnBackup.setOnClickListener {
            viewModel.performBackup(requireContext())
        }

        // Restore Button
        binding.btnRestore.setOnClickListener {
            viewModel.performRestore(requireContext())
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
