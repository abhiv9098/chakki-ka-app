package com.chakkimitra.app.ui.credit

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.chakkimitra.app.ChakkiApp
import com.chakkimitra.app.R
import com.chakkimitra.app.databinding.FragmentCreditManagementBinding
import com.chakkimitra.app.ui.adapter.CustomerAdapter
import java.util.Locale

class CreditManagementFragment : Fragment() {

    private var _binding: FragmentCreditManagementBinding? = null
    private val binding get() = _binding!!

    private val viewModel: CreditViewModel by viewModels {
        CreditViewModelFactory((requireActivity().application as ChakkiApp).repository)
    }

    private lateinit var debtorAdapter: CustomerAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCreditManagementBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupSearch()
        observeViewModel()
    }

    private fun setupRecyclerView() {
        debtorAdapter = CustomerAdapter { customer ->
            val bundle = Bundle().apply {
                putLong("customerId", customer.id)
            }
            // Navigate directly to Customer Details
            findNavController().navigate(R.id.navigation_customer_detail, bundle)
        }

        binding.rvKhataList.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = debtorAdapter
        }
    }

    private fun setupSearch() {
        binding.etSearchKhata.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                viewModel.search(s.toString())
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    private fun observeViewModel() {
        viewModel.totalOutstanding.observe(viewLifecycleOwner) { balance ->
            val total = balance ?: 0.0
            binding.tvTotalOutstanding.text = String.format(Locale.US, "₹%.2f", total)
        }

        viewModel.debtorsList.observe(viewLifecycleOwner) { list ->
            if (list.isEmpty()) {
                binding.tvEmptyKhata.visibility = View.VISIBLE
                binding.rvKhataList.visibility = View.GONE
            } else {
                binding.tvEmptyKhata.visibility = View.GONE
                binding.rvKhataList.visibility = View.VISIBLE
                debtorAdapter.submitList(list)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
