package com.chakkimitra.app.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.chakkimitra.app.R
import com.chakkimitra.app.data.local.entity.Order
import com.chakkimitra.app.databinding.ItemOrderBinding
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class OrderAdapter(
    private val onShareClick: (Order) -> Unit,
    private val onPdfClick: (Order) -> Unit
) : ListAdapter<Order, OrderAdapter.OrderViewHolder>(OrderDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OrderViewHolder {
        val binding = ItemOrderBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return OrderViewHolder(binding)
    }

    override fun onBindViewHolder(holder: OrderViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class OrderViewHolder(private val binding: ItemOrderBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(order: Order) {
            binding.tvOrderCustName.text = order.customerName
            
            // Format details
            val context = binding.root.context
            val desc = "${order.grainType} - ${order.weight} Kg @ ₹${order.rate}/Kg"
            binding.tvOrderGrainDesc.text = desc
            binding.tvOrderTotal.text = String.format(Locale.US, "₹%.2f", order.totalAmount)
            
            // Format date
            val format = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault())
            binding.tvOrderDate.text = format.format(Date(order.createdAt))

            // Payment type indicator
            binding.tvOrderPaymentStatus.text = order.paymentType
            if (order.paymentType == "CASH") {
                binding.tvOrderPaymentStatus.setTextColor(ContextCompat.getColor(context, R.color.payment_green))
            } else {
                binding.tvOrderPaymentStatus.setTextColor(ContextCompat.getColor(context, R.color.credit_red))
            }

            // Click listeners
            binding.btnShareBill.setOnClickListener { onShareClick(order) }
            binding.btnPdfBill.setOnClickListener { onPdfClick(order) }
        }
    }

    class OrderDiffCallback : DiffUtil.ItemCallback<Order>() {
        override fun areItemsTheSame(oldItem: Order, newItem: Order): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Order, newItem: Order): Boolean = oldItem == newItem
    }
}
