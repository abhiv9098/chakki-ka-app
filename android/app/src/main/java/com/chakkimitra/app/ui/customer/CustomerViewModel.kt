package com.chakkimitra.app.ui.customer

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.asLiveData
import androidx.lifecycle.switchMap
import androidx.lifecycle.viewModelScope
import com.chakkimitra.app.data.local.entity.Customer
import com.chakkimitra.app.data.local.entity.Order
import com.chakkimitra.app.data.local.entity.CreditRecord
import com.chakkimitra.app.data.repository.ChakkiRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.launch

class CustomerViewModel(private val repository: ChakkiRepository) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")

    @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
    val customersList: LiveData<List<Customer>> = _searchQuery.flatMapLatest { query ->
        if (query.isEmpty()) {
            repository.allCustomers
        } else {
            repository.searchCustomers(query)
        }
    }.asLiveData()

    fun search(query: String) {
        _searchQuery.value = query
    }

    fun addCustomer(name: String, phone: String) {
        viewModelScope.launch {
            repository.insertCustomer(Customer(name = name, phone = phone))
        }
    }

    // Customer detail specific mappings
    private val _selectedCustomerId = MutableLiveData<Long>()

    val selectedCustomer: LiveData<Customer?> = _selectedCustomerId.switchMap { id ->
        repository.getCustomerById(id).asLiveData()
    }

    val selectedCustomerOrders: LiveData<List<Order>> = _selectedCustomerId.switchMap { id ->
        repository.getOrdersByCustomer(id).asLiveData()
    }

    val selectedCustomerCredits: LiveData<List<CreditRecord>> = _selectedCustomerId.switchMap { id ->
        repository.getCreditRecordsByCustomer(id).asLiveData()
    }

    fun setSelectedCustomer(customerId: Long) {
        _selectedCustomerId.value = customerId
    }

    fun recordKhataLedger(amount: Double, type: String, description: String) {
        val id = _selectedCustomerId.value ?: return
        viewModelScope.launch {
            repository.recordKhataTransaction(id, amount, type, description)
        }
    }
}

class CustomerViewModelFactory(private val repository: ChakkiRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(CustomerViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return CustomerViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
