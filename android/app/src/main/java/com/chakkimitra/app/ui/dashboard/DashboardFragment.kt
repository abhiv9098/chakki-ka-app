package com.chakkimitra.app.ui.dashboard

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.FileProvider
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.chakkimitra.app.ChakkiApp
import com.chakkimitra.app.R
import com.chakkimitra.app.data.local.entity.Order
import com.chakkimitra.app.databinding.FragmentDashboardBinding
import com.chakkimitra.app.ui.adapter.OrderAdapter
import com.chakkimitra.app.utils.PdfGenerator
import java.util.Locale

class DashboardFragment : Fragment() {

    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!

    private val viewModel: DashboardViewModel by viewModels {
        DashboardViewModelFactory((requireActivity().application as ChakkiApp).repository)
    }

    private lateinit var orderAdapter: OrderAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        observeViewModel()
        setupClickListeners()
    }

    private fun setupRecyclerView() {
        orderAdapter = OrderAdapter(
            onShareClick = { order -> shareBill(order) },
            onPdfClick = { order -> generatePdf(order) }
        )
        binding.rvRecentOrders.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = orderAdapter
        }
    }

    private fun observeViewModel() {
        viewModel.todayOrdersCount.observe(viewLifecycleOwner) { count ->
            binding.tvTodayOrdersCount.text = count.toString()
        }

        viewModel.todayEarnings.observe(viewLifecycleOwner) { earnings ->
            val total = earnings ?: 0.0
            binding.tvTodayEarningsVal.text = String.format(Locale.US, "₹%.2f", total)
        }

        viewModel.totalCustomersCount.observe(viewLifecycleOwner) { customers ->
            binding.tvTotalCustomersCount.text = customers.size.toString()
        }

        viewModel.totalPendingCredit.observe(viewLifecycleOwner) { credit ->
            val total = credit ?: 0.0
            binding.tvPendingCreditVal.text = String.format(Locale.US, "₹%.2f", total)
        }

        viewModel.recentOrders.observe(viewLifecycleOwner) { orders ->
            if (orders.isEmpty()) {
                binding.tvNoOrders.visibility = View.VISIBLE
                binding.rvRecentOrders.visibility = View.GONE
            } else {
                binding.tvNoOrders.visibility = View.GONE
                binding.rvRecentOrders.visibility = View.VISIBLE
                orderAdapter.submitList(orders)
            }
        }
    }

    private fun setupClickListeners() {
        binding.btnActionNewOrder.setOnClickListener {
            findNavController().navigate(R.id.action_dashboard_to_new_order)
        }

        binding.btnActionKhata.setOnClickListener {
            findNavController().navigate(R.id.action_dashboard_to_credit)
        }
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
        
        val sendIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, shareMsg)
            type = "text/plain"
        }
        
        // Try sharing specifically to WhatsApp, otherwise general share
        sendIntent.setPackage("com.whatsapp")
        try {
            startActivity(sendIntent)
        } catch (e: Exception) {
            // General share chooser
            val chooser = Intent.createChooser(Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, shareMsg)
                type = "text/plain"
            }, getString(R.string.btn_share))
            startActivity(chooser)
        }
    }

    private fun generatePdf(order: Order) {
        val pdfFile = PdfGenerator.generateInvoicePdf(requireContext(), order)
        if (pdfFile != null) {
            Toast.makeText(
                context,
                "Bill Saved in: ${pdfFile.absolutePath}",
                Toast.LENGTH_LONG
            ).show()

            // Open the PDF using Intent
            val authority = "${requireContext().packageName}.fileprovider"
            val uri: Uri = FileProvider.getUriForFile(requireContext(), authority, pdfFile)
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/pdf")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            try {
                startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(context, "No PDF Viewer installed to open the file", Toast.LENGTH_SHORT).show()
            }
        } else {
            Toast.makeText(context, "Failed to generate PDF Bill", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
