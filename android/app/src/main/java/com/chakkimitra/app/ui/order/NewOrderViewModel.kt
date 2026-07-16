package com.chakkimitra.app.ui.order

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.asLiveData
import androidx.lifecycle.viewModelScope
import com.chakkimitra.app.data.local.entity.Customer
import com.chakkimitra.app.data.local.entity.Order
import com.chakkimitra.app.data.repository.ChakkiRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class NewOrderViewModel(private val repository: ChakkiRepository) : ViewModel() {

    val customers: LiveData<List<Customer>> = repository.allCustomers.asLiveData()

    private val _orderSaved = MutableLiveData<Boolean>()
    val orderSaved: LiveData<Boolean> get() = _orderSaved

    fun saveOrder(
        customerName: String,
        customerPhone: String,
        grainType: String,
        weight: Double,
        rate: Double,
        paymentType: String
    ) {
        viewModelScope.launch {
            val totalAmount = weight * rate
            
            // Search if customer already exists (exact match name)
            val existingCustomers = repository.allCustomers.first()
            val matchedCustomer = existingCustomers.find { 
                it.name.equals(customerName.trim(), ignoreCase = true) 
            }

            val customerId = if (matchedCustomer != null) {
                // Update customer phone if it was empty before
                if (matchedCustomer.phone.isEmpty() && customerPhone.isNotEmpty()) {
                    repository.insertCustomer(matchedCustomer.copy(phone = customerPhone))
                }
                matchedCustomer.id
            } else {
                // Register a new customer
                val newCustomer = Customer(
                    name = customerName.trim(),
                    phone = customerPhone.trim()
                )
                repository.insertCustomer(newCustomer)
            }

            val order = Order(
                customerId = customerId,
                customerName = customerName.trim(),
                grainType = grainType,
                weight = weight,
                rate = rate,
                totalAmount = totalAmount,
                paymentType = paymentType
            )

            repository.insertOrder(order)
            _orderSaved.value = true
        }
    }
}

class NewOrderViewModelFactory(private val repository: ChakkiRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(NewOrderViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return NewOrderViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
