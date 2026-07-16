package com.chakkimitra.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.chakkimitra.app.data.local.entity.CreditRecord
import kotlinx.coroutines.flow.Flow

@Dao
interface CreditDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCreditRecord(record: CreditRecord): Long

    @Query("SELECT * FROM credit_records ORDER BY createdAt DESC")
    fun getAllCreditRecords(): Flow<List<CreditRecord>>

    @Query("SELECT * FROM credit_records WHERE customerId = :customerId ORDER BY createdAt DESC")
    fun getCreditRecordsByCustomer(customerId: Long): Flow<List<CreditRecord>>

    @Query("SELECT SUM(amount) FROM credit_records WHERE customerId = :customerId AND type = 'DUE'")
    suspend fun getTotalDueByCustomer(customerId: Long): Double?

    @Query("SELECT SUM(amount) FROM credit_records WHERE customerId = :customerId AND type = 'PAID'")
    suspend fun getTotalPaidByCustomer(customerId: Long): Double?
}
