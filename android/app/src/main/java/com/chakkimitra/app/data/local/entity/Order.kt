package com.chakkimitra.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "orders")
data class Order(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val customerId: Long,
    val customerName: String,
    val grainType: String,
    val weight: Double,
    val rate: Double,
    val totalAmount: Double,
    val paymentType: String, // "CASH" or "CREDIT"
    val createdAt: Long = System.currentTimeMillis()
)
