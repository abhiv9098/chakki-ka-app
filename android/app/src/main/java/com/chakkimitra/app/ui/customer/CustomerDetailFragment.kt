package com.chakkimitra.app.ui.customer

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.chakkimitra.app.ChakkiApp
import com.chakkimitra.app.R
import com.chakkimitra.app.data.local.entity.Order
import com.chakkimitra.app.databinding.FragmentCustomerDetailBinding
import com.chakkimitra.app.ui.adapter.CreditRecordAdapter
import com.chakkimitra.app.ui.adapter.OrderAdapter
import com.chakkimitra.app.utils.PdfGenerator
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.tabs.TabLayout
import java.util.Locale

class CustomerDetailFragment : Fragment() {

    private var _binding: FragmentCustomerDetailBinding? = null
    private val binding get() = _binding!!

    private val viewModel: CustomerViewModel by viewModels {
        CustomerViewModelFactory((requireActivity().application as ChakkiApp).repository)
    }

    private var customerId: Long = -1
    private lateinit var orderAdapter: OrderAdapter
    private lateinit var creditAdapter: CreditRecordAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            customerId = it.getLong("customerId")
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCustomerDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        if (customerId == -1L) {
            Toast.makeText(context, "Error: Invalid Customer", Toast.LENGTH_SHORT).show()
            return
        }

        viewModel.setSelectedCustomer(customerId)

        setupAdapters()
        observeViewModel()
        setupTabSelection()
        setupClickListeners()
    }

    private fun setupAdapters() {
        orderAdapter = OrderAdapter(
            onShareClick = { order -> shareBill(order) },
            onPdfClick = { order -> generatePdf(order) }
        )

        creditAdapter = CreditRecordAdapter()

        binding.rvHistory.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = orderAdapter // Orders displayed by default
        }
    }

    private fun observeViewModel() {
        viewModel.selectedCustomer.observe(viewLifecycleOwner) { customer ->
            if (customer != null) {
                binding.tvDetailName.text = customer.name
                binding.tvDetailPhone.text = if (customer.phone.isNotEmpty()) {
                    "${getString(R.string.order_cust_phone)}: ${customer.phone}"
                } else {
                    "No phone"
                }

                // Balance styling
                val balance = customer.outstandingBalance
                binding.tvDetailBalance.text = String.format(Locale.US, "₹%.2f", balance)

                val context = requireContext()
                if (balance > 0.0) {
                    binding.tvDetailBalance.setTextColor(ContextCompat.getColor(context, R.color.credit_red))
                    binding.cardBalance.setCardBackgroundColor(ContextCompat.getColor(context, R.color.card_pending))
                } else if (balance < 0.0) {
                    binding.tvDetailBalance.setTextColor(ContextCompat.getColor(context, R.color.payment_green))
                    binding.cardBalance.setCardBackgroundColor(ContextCompat.getColor(context, R.color.card_orders))
                } else {
                    binding.tvDetailBalance.setTextColor(ContextCompat.getColor(context, android.R.color.darker_gray))
                    binding.cardBalance.setCardBackgroundColor(ContextCompat.getColor(context, R.color.secondaryContainer_light))
                }
            }
        }

        viewModel.selectedCustomerOrders.observe(viewLifecycleOwner) { orders ->
            if (binding.tabLayout.selectedTabPosition == 0) {
                updateOrderList(orders)
            }
        }

        viewModel.selectedCustomerCredits.observe(viewLifecycleOwner) { credits ->
            if (binding.tabLayout.selectedTabPosition == 1) {
                updateCreditList(credits)
            }
        }
    }

    private fun updateOrderList(orders: List<Order>) {
        if (orders.isEmpty()) {
            binding.tvNoHistory.visibility = View.VISIBLE
            binding.rvHistory.visibility = View.GONE
        } else {
            binding.tvNoHistory.visibility = View.GONE
            binding.rvHistory.visibility = View.VISIBLE
            binding.rvHistory.adapter = orderAdapter
            orderAdapter.submitList(orders)
        }
    }

    private fun updateCreditList(credits: List<com.chakkimitra.app.data.local.entity.CreditRecord>) {
        if (credits.isEmpty()) {
            binding.tvNoHistory.visibility = View.VISIBLE
            binding.rvHistory.visibility = View.GONE
        } else {
            binding.tvNoHistory.visibility = View.GONE
            binding.rvHistory.visibility = View.VISIBLE
            binding.rvHistory.adapter = creditAdapter
            creditAdapter.submitList(credits)
        }
    }

    private fun setupTabSelection() {
        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                when (tab?.position) {
                    0 -> {
                        viewModel.selectedCustomerOrders.value?.let { updateOrderList(it) }
                    }
                    1 -> {
                        viewModel.selectedCustomerCredits.value?.let { updateCreditList(it) }
                    }
                }
            }
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })
    }

    private fun setupClickListeners() {
        binding.btnRecordPayment.setOnClickListener {
            showKhataDialog("PAID")
        }

        binding.btnAddCredit.setOnClickListener {
            showKhataDialog("DUE")
        }
    }

    private fun showKhataDialog(type: String) {
        val title = if (type == "PAID") getString(R.string.credit_record_payment) else getString(R.string.credit_add_label)
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_khata_transaction, null)
        val etAmount = dialogView.findViewById<EditText>(R.id.et_dialog_amount)
        val etDesc = dialogView.findViewById<EditText>(R.id.et_dialog_desc)

        if (type == "PAID") {
            etDesc.setText("Payment settled")
        } else {
            etDesc.setText("Add manual credit")
        }

        MaterialAlertDialogBuilder(requireContext())
            .setTitle(title)
            .setView(dialogView)
            .setPositiveButton(getString(R.string.btn_save)) { _, _ ->
                val amount = etAmount.text.toString().toDoubleOrNull()
                val desc = etDesc.text.toString().trim()
                if (amount != null && amount > 0) {
                    viewModel.recordKhataLedger(amount, type, desc.ifEmpty { if (type == "PAID") "Paid" else "Due" })
                    Toast.makeText(context, getString(R.string.credit_success), Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(context, "Please enter a valid amount", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton(getString(R.string.btn_cancel), null)
            .show()
    }

    private fun shareBill(order: Order) {
        val shareMsg = getString(
            R.string.bill_share_message,
            order.id.toString(),
            order.customerName,
            order.grainType,
            String.format(Locale.US, "%.2f", order.weight),
            String.format(Locale.US, "%.2f", order.rate),
            String.format(Locale.US, "%.2f", order.totalAmount)
        )
        val chooser = Intent.createChooser(Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, shareMsg)
            type = "text/plain"
        }, getString(R.string.btn_share))
        startActivity(chooser)
    }

    private fun generatePdf(order: Order) {
        val pdfFile = PdfGenerator.generateInvoicePdf(requireContext(), order)
        if (pdfFile != null) {
            Toast.makeText(context, "Saved: ${pdfFile.absolutePath}", Toast.LENGTH_SHORT).show()
            val authority = "${requireContext().packageName}.fileprovider"
            val uri: Uri = FileProvider.getUriForFile(requireContext(), authority, pdfFile)
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/pdf")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            try {
                startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(context, "No PDF Viewer installed", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
