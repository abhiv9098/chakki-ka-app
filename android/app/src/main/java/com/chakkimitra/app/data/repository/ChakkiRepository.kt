package com.chakkimitra.app.data.repository

import com.chakkimitra.app.data.local.dao.CustomerDao
import com.chakkimitra.app.data.local.dao.OrderDao
import com.chakkimitra.app.data.local.dao.CreditDao
import com.chakkimitra.app.data.local.entity.Customer
import com.chakkimitra.app.data.local.entity.Order
import com.chakkimitra.app.data.local.entity.CreditRecord
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull

class ChakkiRepository(
    private val customerDao: CustomerDao,
    private val orderDao: OrderDao,
    private val creditDao: CreditDao
) {
    // Customers
    val allCustomers: Flow<List<Customer>> = customerDao.getAllCustomers()
    val totalOutstandingCredit: Flow<Double?> = customerDao.getTotalOutstandingBalanceFlow()

    fun getCustomerById(id: Long): Flow<Customer?> = customerDao.getCustomerById(id)
    
    fun searchCustomers(query: String): Flow<List<Customer>> = customerDao.searchCustomers("%$query%")

    suspend fun insertCustomer(customer: Customer): Long {
        return customerDao.insertCustomer(customer)
    }

    // Orders
    val allOrders: Flow<List<Order>> = orderDao.getAllOrders()

    fun getOrdersByCustomer(customerId: Long): Flow<List<Order>> = orderDao.getOrdersByCustomer(customerId)

    fun getRecentOrders(startTimestamp: Long, limit: Int): Flow<List<Order>> =
        orderDao.getRecentOrders(startTimestamp, limit)

    fun getEarningsFromDate(startTimestamp: Long): Flow<Double?> = orderDao.getEarningsFromDateFlow(startTimestamp)

    fun getOrderCountFromDate(startTimestamp: Long): Flow<Int> = orderDao.getOrderCountFromDateFlow(startTimestamp)

    suspend fun insertOrder(order: Order): Long {
        val orderId = orderDao.insertOrder(order)
        if (order.paymentType == "CREDIT") {
            // Update Customer Outstanding Balance & Log Credit Record
            val customer = customerDao.getCustomerByIdSync(order.customerId)
            if (customer != null) {
                val updatedBalance = customer.outstandingBalance + order.totalAmount
                customerDao.updateOutstandingBalance(customer.id, updatedBalance)
                
                val creditRecord = CreditRecord(
                    customerId = customer.id,
                    amount = order.totalAmount,
                    type = "DUE",
                    description = "Order #${orderId} ${order.grainType} Grinding"
                )
                creditDao.insertCreditRecord(creditRecord)
            }
        }
        return orderId
    }

    // Credit Ledger (Khata)
    fun getCreditRecordsByCustomer(customerId: Long): Flow<List<CreditRecord>> =
        creditDao.getCreditRecordsByCustomer(customerId)

    suspend fun recordKhataTransaction(customerId: Long, amount: Double, type: String, description: String): Long {
        val record = CreditRecord(
            customerId = customerId,
            amount = amount,
            type = type,
            description = description
        )
        val recordId = creditDao.insertCreditRecord(record)
        
        // Update Customer Outstanding Balance
        val customer = customerDao.getCustomerByIdSync(customerId)
        if (customer != null) {
            val delta = if (type == "DUE") amount else -amount
            val updatedBalance = customer.outstandingBalance + delta
            customerDao.updateOutstandingBalance(customerId, updatedBalance)
        }
        return recordId
    }

    // Report Summaries
    suspend fun getDailyReport(startTimestamp: Long): Pair<Double, Int> {
        val earnings = orderDao.getEarningsFromDateSync(startTimestamp) ?: 0.0
        val count = orderDao.getOrderCountFromDateSync(startTimestamp)
        return Pair(earnings, count)
    }

    suspend fun getEarningsBetween(start: Long, end: Long): Double {
        return orderDao.getEarningsBetweenDates(start, end) ?: 0.0
    }

    suspend fun getOrdersCountBetween(start: Long, end: Long): Int {
        return orderDao.getOrdersBetweenDates(start, end).size
    }

    suspend fun getOrdersBetween(start: Long, end: Long): List<Order> {
        return orderDao.getOrdersBetweenDates(start, end)
    }
}
