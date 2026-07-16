package com.chakkimitra.app.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.asLiveData
import com.chakkimitra.app.data.repository.ChakkiRepository
import java.util.Calendar

class DashboardViewModel(private val repository: ChakkiRepository) : ViewModel() {

    private fun getTodayStartTimestamp(): Long {
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return calendar.timeInMillis
    }

    val todayOrdersCount = repository.getOrderCountFromDate(getTodayStartTimestamp()).asLiveData()
    val todayEarnings = repository.getEarningsFromDate(getTodayStartTimestamp()).asLiveData()
    val totalCustomersCount = repository.allCustomers.asLiveData()
    val totalPendingCredit = repository.totalOutstandingCredit.asLiveData()
    val recentOrders = repository.getRecentOrders(0, 10).asLiveData()
}

class DashboardViewModelFactory(private val repository: ChakkiRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(DashboardViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return DashboardViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
