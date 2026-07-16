package com.chakkimitra.app.ui.customer

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.chakkimitra.app.ChakkiApp
import com.chakkimitra.app.R
import com.chakkimitra.app.databinding.FragmentCustomerListBinding
import com.chakkimitra.app.ui.adapter.CustomerAdapter
import com.google.android.material.dialog.MaterialAlertDialogBuilder

class CustomerListFragment : Fragment() {

    private var _binding: FragmentCustomerListBinding? = null
    private val binding get() = _binding!!

    private val viewModel: CustomerViewModel by viewModels {
        CustomerViewModelFactory((requireActivity().application as ChakkiApp).repository)
    }

    private lateinit var customerAdapter: CustomerAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCustomerListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupSearch()
        observeViewModel()
        setupFAB()
    }

    private fun setupRecyclerView() {
        customerAdapter = CustomerAdapter { customer ->
            val bundle = Bundle().apply {
                putLong("customerId", customer.id)
            }
            findNavController().navigate(R.id.action_customer_list_to_detail, bundle)
        }

        binding.rvCustomers.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = customerAdapter
        }
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                viewModel.search(s.toString())
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    private fun observeViewModel() {
        viewModel.customersList.observe(viewLifecycleOwner) { list ->
            if (list.isEmpty()) {
                binding.tvEmptyCustomers.visibility = View.VISIBLE
                binding.rvCustomers.visibility = View.GONE
            } else {
                binding.tvEmptyCustomers.visibility = View.GONE
                binding.rvCustomers.visibility = View.VISIBLE
                customerAdapter.submitList(list)
            }
        }
    }

    private fun setupFAB() {
        binding.fabAddCustomer.setOnClickListener {
            showAddCustomerDialog()
        }
    }

    private fun showAddCustomerDialog() {
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_add_customer, null)
        val etName = dialogView.findViewById<EditText>(R.id.et_dialog_cust_name)
        val etPhone = dialogView.findViewById<EditText>(R.id.et_dialog_cust_phone)

        MaterialAlertDialogBuilder(requireContext())
            .setTitle(getString(R.string.cust_add_title))
            .setView(dialogView)
            .setPositiveButton(getString(R.string.btn_save)) { _, _ ->
                val name = etName.text.toString().trim()
                val phone = etPhone.text.toString().trim()
                if (name.isNotEmpty()) {
                    viewModel.addCustomer(name, phone)
                } else {
                    Toast.makeText(context, getString(R.string.cust_name_req), Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton(getString(R.string.btn_cancel), null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
