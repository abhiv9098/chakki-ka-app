package com.chakkimitra.app.ui.credit

import androidx.lifecycle.LiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.asLiveData
import com.chakkimitra.app.data.local.entity.Customer
import com.chakkimitra.app.data.repository.ChakkiRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map

class CreditViewModel(private val repository: ChakkiRepository) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")

    val totalOutstanding = repository.totalOutstandingCredit.asLiveData()

    @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
    val debtorsList: LiveData<List<Customer>> = _searchQuery.flatMapLatest { query ->
        val flow = if (query.isEmpty()) {
            repository.allCustomers
        } else {
            repository.searchCustomers(query)
        }
        flow.map { list ->
            // Filter only customers with pending balance > 0
            list.filter { it.outstandingBalance > 0.0 }
        }
    }.asLiveData()

    fun search(query: String) {
        _searchQuery.value = query
    }
}

class CreditViewModelFactory(private val repository: ChakkiRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(CreditViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return CreditViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
