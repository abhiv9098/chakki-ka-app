package com.chakkimitra.app.ui.reports

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.chakkimitra.app.data.local.entity.Order
import com.chakkimitra.app.data.repository.ChakkiRepository
import kotlinx.coroutines.launch
import java.util.Calendar

class ReportsViewModel(private val repository: ChakkiRepository) : ViewModel() {

    private val _dailyEarnings = MutableLiveData<Double>()
    val dailyEarnings: LiveData<Double> get() = _dailyEarnings

    private val _dailyOrders = MutableLiveData<Int>()
    val dailyOrders: LiveData<Int> get() = _dailyOrders

    private val _weeklyEarnings = MutableLiveData<Double>()
    val weeklyEarnings: LiveData<Double> get() = _weeklyEarnings

    private val _weeklyOrders = MutableLiveData<Int>()
    val weeklyOrders: LiveData<Int> get() = _weeklyOrders

    private val _monthlyEarnings = MutableLiveData<Double>()
    val monthlyEarnings: LiveData<Double> get() = _monthlyEarnings

    private val _monthlyOrders = MutableLiveData<Int>()
    val monthlyOrders: LiveData<Int> get() = _monthlyOrders

    // Grain performance percentages (0 to 100)
    private val _grainPercentages = MutableLiveData<Map<String, Int>>()
    val grainPercentages: LiveData<Map<String, Int>> get() = _grainPercentages

    fun loadReports() {
        viewModelScope.launch {
            // Get boundaries
            val now = System.currentTimeMillis()
            
            // Start of today
            val todayStart = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }.timeInMillis

            // Start of week
            val weekStart = now - (7 * 24 * 60 * 60 * 1000L)

            // Start of month
            val monthStart = now - (30 * 24 * 60 * 60 * 1000L)

            // Load Daily stats
            val (dEarn, dCount) = repository.getDailyReport(todayStart)
            _dailyEarnings.value = dEarn
            _dailyOrders.value = dCount

            // Load Weekly stats
            val wEarn = repository.getEarningsBetween(weekStart, now)
            val wCount = repository.getOrdersCountBetween(weekStart, now)
            _weeklyEarnings.value = wEarn
            _weeklyOrders.value = wCount

            // Load Monthly stats
            val mEarn = repository.getEarningsBetween(monthStart, now)
            val mCount = repository.getOrdersCountBetween(monthStart, now)
            _monthlyEarnings.value = mEarn
            _monthlyOrders.value = mCount

            // Load Monthly orders for grain distribution calculation
            val monthlyOrdersList = repository.getOrdersBetween(monthStart, now)
            calculateGrainPercentages(monthlyOrdersList)
        }
    }

    private fun calculateGrainPercentages(orders: List<Order>) {
        if (orders.isEmpty()) {
            _grainPercentages.value = mapOf(
                "Wheat" to 0,
                "Maize" to 0,
                "Millet" to 0,
                "Other" to 0
            )
            return
        }

        val totalWeight = orders.sumOf { it.weight }
        if (totalWeight == 0.0) return

        var wheatWeight = 0.0
        var maizeWeight = 0.0
        var milletWeight = 0.0
        var otherWeight = 0.0

        for (order in orders) {
            val type = order.grainType.lowercase()
            when {
                type.contains("wheat") || type.contains("गेहूं") -> wheatWeight += order.weight
                type.contains("maize") || type.contains("मक्का") -> maizeWeight += order.weight
                type.contains("millet") || type.contains("बाजरा") -> milletWeight += order.weight
                else -> otherWeight += order.weight
            }
        }

        _grainPercentages.value = mapOf(
            "Wheat" to ((wheatWeight / totalWeight) * 100).toInt(),
            "Maize" to ((maizeWeight / totalWeight) * 100).toInt(),
            "Millet" to ((milletWeight / totalWeight) * 100).toInt(),
            "Other" to ((otherWeight / totalWeight) * 100).toInt()
        )
    }
}

class ReportsViewModelFactory(private val repository: ChakkiRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ReportsViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return ReportsViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
