package com.chakkimitra.app.ui.reports

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.chakkimitra.app.ChakkiApp
import com.chakkimitra.app.databinding.FragmentReportsBinding
import java.util.Locale

class ReportsFragment : Fragment() {

    private var _binding: FragmentReportsBinding? = null
    private val binding get() = _binding!!

    private val viewModel: ReportsViewModel by viewModels {
        ReportsViewModelFactory((requireActivity().application as ChakkiApp).repository)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentReportsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        observeViewModel()
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadReports()
    }

    private fun observeViewModel() {
        // Daily
        viewModel.dailyEarnings.observe(viewLifecycleOwner) { earnings ->
            binding.tvRepDailyEarning.text = String.format(Locale.US, "₹%.2f", earnings)
        }
        viewModel.dailyOrders.observe(viewLifecycleOwner) { count ->
            binding.tvRepDailyOrders.text = "$count orders"
        }

        // Weekly
        viewModel.weeklyEarnings.observe(viewLifecycleOwner) { earnings ->
            binding.tvRepWeeklyEarning.text = String.format(Locale.US, "₹%.2f", earnings)
        }
        viewModel.weeklyOrders.observe(viewLifecycleOwner) { count ->
            binding.tvRepWeeklyOrders.text = "$count orders"
        }

        // Monthly
        viewModel.monthlyEarnings.observe(viewLifecycleOwner) { earnings ->
            binding.tvRepMonthlyEarning.text = String.format(Locale.US, "₹%.2f", earnings)
        }
        viewModel.monthlyOrders.observe(viewLifecycleOwner) { count ->
            binding.tvRepMonthlyOrders.text = "$count orders"
        }

        // Grain Percentages
        viewModel.grainPercentages.observe(viewLifecycleOwner) { percentages ->
            val wheatVal = percentages["Wheat"] ?: 0
            val maizeVal = percentages["Maize"] ?: 0
            val milletVal = percentages["Millet"] ?: 0
            val otherVal = percentages["Other"] ?: 0

            binding.progressWheat.progress = wheatVal
            binding.tvWheatPct.text = "$wheatVal%"

            binding.progressMaize.progress = maizeVal
            binding.tvMaizePct.text = "$maizeVal%"

            binding.progressMillet.progress = milletVal
            binding.tvMilletPct.text = "$milletVal%"

            binding.progressOther.progress = otherVal
            binding.tvOtherPct.text = "$otherVal%"
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
