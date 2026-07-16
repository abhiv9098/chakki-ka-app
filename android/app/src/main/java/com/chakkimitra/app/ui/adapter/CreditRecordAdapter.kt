package com.chakkimitra.app.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.chakkimitra.app.R
import com.chakkimitra.app.data.local.entity.CreditRecord
import com.chakkimitra.app.databinding.ItemCreditRecordBinding
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class CreditRecordAdapter :
    ListAdapter<CreditRecord, CreditRecordAdapter.CreditViewHolder>(CreditDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CreditViewHolder {
        val binding = ItemCreditRecordBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return CreditViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CreditViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class CreditViewHolder(private val binding: ItemCreditRecordBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(record: CreditRecord) {
            val context = binding.root.context
            
            binding.tvCreditDesc.text = record.description
            binding.tvCreditAmount.text = String.format(Locale.US, "₹%.2f", record.amount)
            
            // Format date
            val format = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault())
            binding.tvCreditDate.text = format.format(Date(record.createdAt))

            if (record.type == "DUE") {
                binding.tvCreditAmount.setTextColor(ContextCompat.getColor(context, R.color.credit_red))
                binding.cardIndicator.setCardBackgroundColor(ContextCompat.getColor(context, R.color.card_pending))
                binding.imgIndicator.setImageResource(android.R.drawable.ic_menu_recent_history)
                binding.imgIndicator.setColorFilter(ContextCompat.getColor(context, R.color.credit_red))
            } else {
                binding.tvCreditAmount.setTextColor(ContextCompat.getColor(context, R.color.payment_green))
                binding.cardIndicator.setCardBackgroundColor(ContextCompat.getColor(context, R.color.card_orders))
                binding.imgIndicator.setImageResource(android.R.drawable.ic_input_add)
                binding.imgIndicator.setColorFilter(ContextCompat.getColor(context, R.color.payment_green))
            }
        }
    }

    class CreditDiffCallback : DiffUtil.ItemCallback<CreditRecord>() {
        override fun areItemsTheSame(oldItem: CreditRecord, newItem: CreditRecord): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: CreditRecord, newItem: CreditRecord): Boolean = oldItem == newItem
    }
}
