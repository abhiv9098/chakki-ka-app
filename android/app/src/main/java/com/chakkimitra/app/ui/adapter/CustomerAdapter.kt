package com.chakkimitra.app.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.chakkimitra.app.R
import com.chakkimitra.app.data.local.entity.Customer
import com.chakkimitra.app.databinding.ItemCustomerBinding
import java.util.Locale

class CustomerAdapter(
    private val onItemClick: (Customer) -> Unit
) : ListAdapter<Customer, CustomerAdapter.CustomerViewHolder>(CustomerDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CustomerViewHolder {
        val binding = ItemCustomerBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return CustomerViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CustomerViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class CustomerViewHolder(private val binding: ItemCustomerBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(customer: Customer) {
            binding.tvCustName.text = customer.name
            binding.tvCustPhone.text = customer.phone.ifEmpty { "No Phone" }
            
            // Set Avatar Initials
            val initials = if (customer.name.isNotEmpty()) {
                val words = customer.name.trim().split("\\s+".toRegex())
                if (words.size >= 2) {
                    "${words[0].first().uppercase()}${words[1].first().uppercase()}"
                } else {
                    words[0].first().uppercase()
                }
            } else {
                "CM"
            }
            binding.tvInitials.text = initials

            // Format Balance
            val context = binding.root.context
            val balance = customer.outstandingBalance
            binding.tvCustBalance.text = String.format(Locale.US, "₹%.2f", balance)

            if (balance > 0.0) {
                binding.tvCustBalance.setTextColor(ContextCompat.getColor(context, R.color.credit_red))
            } else if (balance < 0.0) {
                binding.tvCustBalance.setTextColor(ContextCompat.getColor(context, R.color.payment_green))
            } else {
                binding.tvCustBalance.setTextColor(ContextCompat.getColor(context, android.R.color.darker_gray))
            }

            // Click listener
            binding.root.setOnClickListener { onItemClick(customer) }
        }
    }

    class CustomerDiffCallback : DiffUtil.ItemCallback<Customer>() {
        override fun areItemsTheSame(oldItem: Customer, newItem: Customer): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Customer, newItem: Customer): Boolean = oldItem == newItem
    }
}
