package com.chakkimitra.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.chakkimitra.app.data.local.entity.Customer
import kotlinx.coroutines.flow.Flow

@Dao
interface CustomerDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomer(customer: Customer): Long

    @Update
    suspend fun updateCustomer(customer: Customer)

    @Delete
    suspend fun deleteCustomer(customer: Customer)

    @Query("SELECT * FROM customers ORDER BY name ASC")
    fun getAllCustomers(): Flow<List<Customer>>

    @Query("SELECT * FROM customers WHERE id = :id")
    fun getCustomerById(id: Long): Flow<Customer?>

    @Query("SELECT * FROM customers WHERE id = :id")
    suspend fun getCustomerByIdSync(id: Long): Customer?

    @Query("SELECT * FROM customers WHERE name LIKE :query OR phone LIKE :query ORDER BY name ASC")
    fun searchCustomers(query: String): Flow<List<Customer>>

    @Query("UPDATE customers SET outstandingBalance = :balance WHERE id = :customerId")
    suspend fun updateOutstandingBalance(customerId: Long, balance: Double)
    
    @Query("SELECT SUM(outstandingBalance) FROM customers")
    fun getTotalOutstandingBalanceFlow(): Flow<Double?>
    
    @Query("SELECT SUM(outstandingBalance) FROM customers")
    suspend fun getTotalOutstandingBalanceSync(): Double?
}
