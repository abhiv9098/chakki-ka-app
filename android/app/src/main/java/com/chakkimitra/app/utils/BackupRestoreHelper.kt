package com.chakkimitra.app.utils

import android.content.Context
import com.chakkimitra.app.data.local.AppDatabase
import com.chakkimitra.app.data.local.entity.Customer
import com.chakkimitra.app.data.local.entity.Order
import com.chakkimitra.app.data.local.entity.CreditRecord
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

object BackupRestoreHelper {

    suspend fun backupData(context: Context): File? = withContext(Dispatchers.IO) {
        try {
            val db = AppDatabase.getDatabase(context)
            val customers = db.customerDao().getAllCustomers().first()
            val orders = db.orderDao().getAllOrders().first()
            val creditRecords = db.creditDao().getAllCreditRecords().first()

            val backupJson = JSONObject()

            // Map Customers
            val customersArray = JSONArray()
            for (c in customers) {
                val cJson = JSONObject().apply {
                    put("id", c.id)
                    put("name", c.name)
                    put("phone", c.phone)
                    put("outstandingBalance", c.outstandingBalance)
                    put("createdAt", c.createdAt)
                }
                customersArray.put(cJson)
            }
            backupJson.put("customers", customersArray)

            // Map Orders
            val ordersArray = JSONArray()
            for (o in orders) {
                val oJson = JSONObject().apply {
                    put("id", o.id)
                    put("customerId", o.customerId)
                    put("customerName", o.customerName)
                    put("grainType", o.grainType)
                    put("weight", o.weight)
                    put("rate", o.rate)
                    put("totalAmount", o.totalAmount)
                    put("paymentType", o.paymentType)
                    put("createdAt", o.createdAt)
                }
                ordersArray.put(oJson)
            }
            backupJson.put("orders", ordersArray)

            // Map CreditRecords
            val creditArray = JSONArray()
            for (cr in creditRecords) {
                val crJson = JSONObject().apply {
                    put("id", cr.id)
                    put("customerId", cr.customerId)
                    put("amount", cr.amount)
                    put("type", cr.type)
                    put("description", cr.description)
                    put("createdAt", cr.createdAt)
                }
                creditArray.put(crJson)
            }
            backupJson.put("credit_records", creditArray)

            // Save JSON to a local backup file in Documents or App Cache
            val backupFile = File(context.getExternalFilesDir(null), "ChakkiMitra_Backup.json")
            val outputStream = FileOutputStream(backupFile)
            outputStream.write(backupJson.toString(4).toByteArray())
            outputStream.close()
            
            backupFile
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun restoreData(context: Context, backupFile: File): Boolean = withContext(Dispatchers.IO) {
        try {
            val fileInputStream = FileInputStream(backupFile)
            val size = fileInputStream.available()
            val buffer = ByteArray(size)
            fileInputStream.read(buffer)
            fileInputStream.close()

            val jsonString = String(buffer, Charsets.UTF_8)
            val backupJson = JSONObject(jsonString)

            val db = AppDatabase.getDatabase(context)

            // Clear existing tables
            db.clearAllTables()

            // Restore Customers
            val customersArray = backupJson.optJSONArray("customers")
            if (customersArray != null) {
                for (i in 0 until customersArray.length()) {
                    val cJson = customersArray.getJSONObject(i)
                    val customer = Customer(
                        id = cJson.getLong("id"),
                        name = cJson.getString("name"),
                        phone = cJson.getString("phone"),
                        outstandingBalance = cJson.getDouble("outstandingBalance"),
                        createdAt = cJson.getLong("createdAt")
                    )
                    db.customerDao().insertCustomer(customer)
                }
            }

            // Restore Orders
            val ordersArray = backupJson.optJSONArray("orders")
            if (ordersArray != null) {
                for (i in 0 until ordersArray.length()) {
                    val oJson = ordersArray.getJSONObject(i)
                    val order = Order(
                        id = oJson.getLong("id"),
                        customerId = oJson.getLong("customerId"),
                        customerName = oJson.getString("customerName"),
                        grainType = oJson.getString("grainType"),
                        weight = oJson.getDouble("weight"),
                        rate = oJson.getDouble("rate"),
                        totalAmount = oJson.getDouble("totalAmount"),
                        paymentType = oJson.getString("paymentType"),
                        createdAt = oJson.getLong("createdAt")
                    )
                    db.orderDao().insertOrder(order)
                }
            }

            // Restore Credit Records
            val creditArray = backupJson.optJSONArray("credit_records")
            if (creditArray != null) {
                for (i in 0 until creditArray.length()) {
                    val crJson = creditArray.getJSONObject(i)
                    val record = CreditRecord(
                        id = crJson.getLong("id"),
                        customerId = crJson.getLong("customerId"),
                        amount = crJson.getDouble("amount"),
                        type = crJson.getString("type"),
                        description = crJson.getString("description"),
                        createdAt = crJson.getLong("createdAt")
                    )
                    db.creditDao().insertCreditRecord(record)
                }
            }

            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}
