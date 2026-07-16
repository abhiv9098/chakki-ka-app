package com.chakkimitra.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "credit_records")
data class CreditRecord(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val customerId: Long,
    val amount: Double,
    val type: String, // "DUE" or "PAID"
    val description: String,
    val createdAt: Long = System.currentTimeMillis()
)
