package com.chakkimitra.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.chakkimitra.app.data.local.dao.CustomerDao
import com.chakkimitra.app.data.local.dao.OrderDao
import com.chakkimitra.app.data.local.dao.CreditDao
import com.chakkimitra.app.data.local.entity.Customer
import com.chakkimitra.app.data.local.entity.Order
import com.chakkimitra.app.data.local.entity.CreditRecord

@Database(
    entities = [Customer::class, Order::class, CreditRecord::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun customerDao(): CustomerDao
    abstract fun orderDao(): OrderDao
    abstract fun creditDao(): CreditDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "chakki_mitra_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
