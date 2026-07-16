package com.chakkimitra.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.chakkimitra.app.data.local.entity.Order
import kotlinx.coroutines.flow.Flow

@Dao
interface OrderDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: Order): Long

    @Query("SELECT * FROM orders ORDER BY createdAt DESC")
    fun getAllOrders(): Flow<List<Order>>

    @Query("SELECT * FROM orders WHERE customerId = :customerId ORDER BY createdAt DESC")
    fun getOrdersByCustomer(customerId: Long): Flow<List<Order>>

    @Query("SELECT * FROM orders WHERE createdAt >= :startTimestamp ORDER BY createdAt DESC")
    fun getOrdersFromDate(startTimestamp: Long): Flow<List<Order>>

    @Query("SELECT * FROM orders WHERE createdAt >= :startTimestamp ORDER BY createdAt DESC LIMIT :limit")
    fun getRecentOrders(startTimestamp: Long, limit: Int = 10): Flow<List<Order>>

    @Query("SELECT SUM(totalAmount) FROM orders WHERE createdAt >= :startTimestamp")
    fun getEarningsFromDateFlow(startTimestamp: Long): Flow<Double?>

    @Query("SELECT SUM(totalAmount) FROM orders WHERE createdAt >= :startTimestamp")
    suspend fun getEarningsFromDateSync(startTimestamp: Long): Double?

    @Query("SELECT COUNT(*) FROM orders WHERE createdAt >= :startTimestamp")
    fun getOrderCountFromDateFlow(startTimestamp: Long): Flow<Int>

    @Query("SELECT COUNT(*) FROM orders WHERE createdAt >= :startTimestamp")
    suspend fun getOrderCountFromDateSync(startTimestamp: Long): Int

    @Query("SELECT * FROM orders WHERE createdAt BETWEEN :start AND :end ORDER BY createdAt DESC")
    suspend fun getOrdersBetweenDates(start: Long, end: Long): List<Order>

    @Query("SELECT SUM(totalAmount) FROM orders WHERE createdAt BETWEEN :start AND :end")
    suspend fun getEarningsBetweenDates(start: Long, end: Long): Double?
}
