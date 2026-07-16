package com.chakkimitra.app.ui.settings

import android.content.Context
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.chakkimitra.app.utils.BackupRestoreHelper
import kotlinx.coroutines.launch
import java.io.File

class SettingsViewModel : ViewModel() {

    private val _backupStatus = MutableLiveData<Boolean?>()
    val backupStatus: LiveData<Boolean?> get() = _backupStatus

    private val _restoreStatus = MutableLiveData<Boolean?>()
    val restoreStatus: LiveData<Boolean?> get() = _restoreStatus

    fun performBackup(context: Context) {
        viewModelScope.launch {
            val file = BackupRestoreHelper.backupData(context)
            _backupStatus.value = (file != null)
        }
    }

    fun performRestore(context: Context) {
        viewModelScope.launch {
            val backupFile = File(context.getExternalFilesDir(null), "ChakkiMitra_Backup.json")
            if (backupFile.exists()) {
                val success = BackupRestoreHelper.restoreData(context, backupFile)
                _restoreStatus.value = success
            } else {
                _restoreStatus.value = false
            }
        }
    }

    fun resetStatus() {
        _backupStatus.value = null
        _restoreStatus.value = null
    }
}
