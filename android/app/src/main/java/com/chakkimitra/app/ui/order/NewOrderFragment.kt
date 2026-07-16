package com.chakkimitra.app.ui.order

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.chakkimitra.app.ChakkiApp
import com.chakkimitra.app.R
import com.chakkimitra.app.data.local.entity.Customer
import com.chakkimitra.app.databinding.FragmentNewOrderBinding
import java.util.Locale

class NewOrderFragment : Fragment() {

    private var _binding: FragmentNewOrderBinding? = null
    private val binding get() = _binding!!

    private val viewModel: NewOrderViewModel by viewModels {
        NewOrderViewModelFactory((requireActivity().application as ChakkiApp).repository)
    }

    private var customerList: List<Customer> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentNewOrderBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupGrainDropdown()
        setupCalculationListeners()
        observeViewModel()

        binding.btnSaveOrder.setOnClickListener {
            saveOrder()
        }
    }

    private fun setupGrainDropdown() {
        val grains = arrayOf(
            getString(R.string.grain_wheat),
            getString(R.string.grain_maize),
            getString(R.string.grain_millet),
            getString(R.string.grain_sorghum),
            getString(R.string.grain_barley),
            getString(R.string.grain_gram),
            getString(R.string.grain_rice),
            getString(R.string.grain_other)
        )
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, grains)
        binding.spinnerGrainType.setAdapter(adapter)
        binding.spinnerGrainType.setText(grains[0], false) // Select Wheat by default
    }

    private fun setupCalculationListeners() {
        val calculator = object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                calculateTotal()
            }
            override fun afterTextChanged(s: Editable?) {}
        }

        binding.etWeight.addTextChangedListener(calculator)
        binding.etRate.addTextChangedListener(calculator)
    }

    private fun calculateTotal() {
        val weightStr = binding.etWeight.text.toString()
        val rateStr = binding.etRate.text.toString()

        val weight = weightStr.toDoubleOrNull() ?: 0.0
        val rate = rateStr.toDoubleOrNull() ?: 0.0

        val total = weight * rate
        binding.tvTotalCalculated.text = String.format(Locale.US, "₹%.2f", total)
    }

    private fun observeViewModel() {
        viewModel.customers.observe(viewLifecycleOwner) { customers ->
            customerList = customers
            val names = customers.map { it.name }
            val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, names)
            binding.actCustomerName.setAdapter(adapter)

            // Auto-fill phone when a customer is selected
            binding.actCustomerName.setOnItemClickListener { _, _, position, _ ->
                val selectedName = binding.actCustomerName.adapter.getItem(position) as String
                val customer = customerList.find { it.name == selectedName }
                if (customer != null) {
                    binding.etCustomerPhone.setText(customer.phone)
                }
            }
        }

        viewModel.orderSaved.observe(viewLifecycleOwner) { saved ->
            if (saved) {
                Toast.makeText(context, getString(R.string.order_success), Toast.LENGTH_SHORT).show()
                findNavController().navigate(R.id.action_new_order_to_dashboard)
            }
        }
    }

    private fun saveOrder() {
        val name = binding.actCustomerName.text.toString().trim()
        val phone = binding.etCustomerPhone.text.toString().trim()
        val grain = binding.spinnerGrainType.text.toString()
        val weightStr = binding.etWeight.text.toString().trim()
        val rateStr = binding.etRate.text.toString().trim()

        val weight = weightStr.toDoubleOrNull()
        val rate = rateStr.toDoubleOrNull()

        if (name.isEmpty() || weight == null || weight <= 0 || rate == null || rate <= 0) {
            Toast.makeText(context, getString(R.string.order_error_fields), Toast.LENGTH_SHORT).show()
            return
        }

        val paymentType = if (binding.rbPaymentCredit.isChecked) "CREDIT" else "CASH"

        viewModel.saveOrder(name, phone, grain, weight, rate, paymentType)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
