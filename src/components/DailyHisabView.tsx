'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const grainOptions = [
  "Wheat",
  "Atta",
  "Maize",
  "Gram/Chana",
  "Rice",
  "Barley",
  "Bajra",
  "Multigrain",
  "Other"
];

const grainLabels: Record<string, { hi: string; en: string }> = {
  Wheat: { hi: "Wheat (गेहूं)", en: "Wheat" },
  Atta: { hi: "Atta (आटा)", en: "Atta" },
  Maize: { hi: "Maize (मक्का)", en: "Maize" },
  "Gram/Chana": { hi: "Gram/Chana (चना)", en: "Gram/Chana" },
  Rice: { hi: "Rice (चावल)", en: "Rice" },
  Barley: { hi: "Barley (जौ)", en: "Barley" },
  Bajra: { hi: "Bajra (बाजरा)", en: "Bajra" },
  Multigrain: { hi: "Multigrain (मल्टीग्रेन)", en: "Multigrain" },
  Other: { hi: "Other (अन्य)", en: "Other" }
};

export const DailyHisabView: React.FC = () => {
  const { addDailyHisab, dailyHisabs, updateDailyHisab, deleteDailyHisab, customers, updateCustomerPotaliStatus, t, language, defaultGrindingRate, grainRates, setActiveView, addCustomer, recordManualDue, recordPayment, addOrder, selectedCustomer } = useApp();

  // Calculate today and 30 days ago date strings for date picker range restriction
  const { todayStr, minDateStr } = (() => {
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const minObj = new Date(todayObj.getTime() - 30 * 24 * 60 * 60 * 1000);
    const minYyyy = minObj.getFullYear();
    const minMm = String(minObj.getMonth() + 1).padStart(2, '0');
    const minDd = String(minObj.getDate()).padStart(2, '0');
    const minDateStr = `${minYyyy}-${minMm}-${minDd}`;

    return { todayStr, minDateStr };
  })();

  // Form states
  const [date, setDate] = useState(todayStr);
  const [grainType, setGrainType] = useState('Wheat');
  const [showGrainModal, setShowGrainModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [wheatWeight, setWheatWeight] = useState('');
  const [customRate, setCustomRate] = useState<string>('5');
  const [revenue, setRevenue] = useState(0);
  const [customerNaam, setCustomerNaam] = useState(selectedCustomer ? selectedCustomer.name : '');
  const [customerPhone, setCustomerPhone] = useState(selectedCustomer && selectedCustomer.phone !== 'N/A' ? selectedCustomer.phone : '');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'PAYTM' | 'UDHAR' | 'PENDING'>('PENDING');
  const isSubmittingRef = React.useRef(false);
  const [jamaAmount, setJamaAmount] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Customer Profile Sidebar states
  const [matchedCustomer, setMatchedCustomer] = useState<any>(null);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [autoOpenTriggered, setAutoOpenTriggered] = useState<number | null>(null);

  useEffect(() => {
    let match = null;
    const nameQuery = customerNaam.trim().toLowerCase();
    const phoneQuery = customerPhone.trim();

    if (nameQuery.length >= 3) {
      match = customers.find(c => c.name.toLowerCase() === nameQuery);
    }
    if (!match && phoneQuery.length >= 10) {
      match = customers.find(c => c.phone && c.phone === phoneQuery && c.phone !== 'N/A');
    }
    
    if (match) {
      setMatchedCustomer(match);
      if (autoOpenTriggered !== match.id) {
        setShowProfileSidebar(true);
        setAutoOpenTriggered(match.id);
      }
    } else {
      setMatchedCustomer(null);
    }
  }, [customerNaam, customerPhone, customers, autoOpenTriggered]);

  const suggestedCustomers = customerNaam.trim().length > 0 
    ? customers.filter(c => c.name.toLowerCase().includes(customerNaam.trim().toLowerCase()) && c.name.toLowerCase() !== customerNaam.trim().toLowerCase())
    : [];

  // Update custom rate when grain type or saved rates change
  useEffect(() => {
    const fixedRate = grainRates[grainType] !== undefined ? grainRates[grainType] : (parseFloat(defaultGrindingRate) || 5);
    setCustomRate(String(fixedRate));
  }, [grainType, grainRates, defaultGrindingRate]);

  // Auto-calculate revenue
  useEffect(() => {
    const w = parseFloat(wheatWeight) || 0;
    const r = parseFloat(customRate) || (grainRates[grainType] !== undefined ? grainRates[grainType] : 5);
    const calculatedRevenue = Math.round(w * r * 10) / 10;
    setRevenue(calculatedRevenue);
    setAmount(calculatedRevenue.toFixed(1));
  }, [wheatWeight, customRate, grainType, grainRates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (date < minDateStr || date > todayStr) {
      alert(
        language === 'hi'
          ? 'केवल पिछले 30 दिनों के भीतर का हिसाब ही दर्ज किया जा सकता है!'
          : 'You can only log summaries for the last 30 days!'
      );
      isSubmittingRef.current = false;
      return;
    }

    const weightVal = parseFloat(wheatWeight);
    const rateVal = grainRates[grainType] || parseFloat(defaultGrindingRate) || 5;
    const netAmount = parseFloat(amount) || 0;

    if (isNaN(weightVal) || weightVal <= 0) {
      alert(language === 'hi' ? 'कृपया पिसाई का वजन लिखें!' : 'Please enter grain weight!');
      isSubmittingRef.current = false;
      return;
    }

    if ((paymentMode === 'UDHAR' || paymentMode === 'PENDING') && !customerNaam.trim()) {
      alert(
        language === 'hi'
          ? 'उधार/पेंडिंग एंट्री दर्ज करने के लिए ग्राहक का नाम (Naam) लिखना अनिवार्य है!'
          : 'Please enter customer name for Udhar or Pending entry!'
      );
      isSubmittingRef.current = false;
      return;
    }

    const jamaVal = paymentMode === 'UDHAR' ? (parseFloat(jamaAmount) || 0) : netAmount;
    const remainingUdhar = Math.max(0, netAmount - jamaVal);

    const finalExpenseDesc = paymentMode === 'PENDING'
      ? `PENDING_POTALI (₹${netAmount.toFixed(0)} Pending)`
      : (paymentMode === 'UDHAR' && jamaVal > 0)
      ? `UDHAR (Jama: ₹${jamaVal.toFixed(0)}, Udhar: ₹${remainingUdhar.toFixed(0)})`
      : paymentMode;

    addDailyHisab({
      date,
      grainType,
      wheatWeight: weightVal,
      rate: rateVal,
      revenue,
      expenses: 0,
      expenseDescription: finalExpenseDesc,
      extraIncome: 0,
      incomeDescription: customerNaam.trim(),
      isProfit: true,
      amount: netAmount,
      notes: customerNaam.trim() || `${grainType} Log`,
      isPending: paymentMode === 'PENDING'
    });

    // Auto mark customer's potaliStatus as received if customer profile exists
    if (customerNaam.trim()) {
      let cust = customers.find(c => c.name.toLowerCase() === customerNaam.trim().toLowerCase());
      
      // Always auto-create customer if they don't exist
      if (!cust) {
        cust = addCustomer(customerNaam.trim(), customerPhone.trim());
      }

      if (cust) {
        updateCustomerPotaliStatus(cust.id, 'received');
        
        // Auto-record Khata transaction for Jama if Udhar
        if (paymentMode === 'UDHAR' && jamaVal > 0) {
          // addOrder with CREDIT will add the FULL amount to the balance.
          // So we record a PAID transaction for the Jama amount, leaving the correct remaining balance.
          recordPayment(cust.id, jamaVal, `Jama for ${grainType} Grinding`);
        }
        
        // Add grinding order if not pending (completed immediately)
        if (paymentMode !== 'PENDING') {
          let paymentType: 'CASH' | 'CREDIT' | 'ONLINE' | 'PAYTM' = 'CASH';
          if (paymentMode === 'PAYTM') paymentType = 'PAYTM';
          else if (paymentMode === 'UDHAR') paymentType = 'CREDIT';
          
          addOrder({
            customerId: cust.id,
            customerName: cust.name,
            grainType: grainType,
            weight: weightVal,
            rate: rateVal,
            totalAmount: netAmount,
            paymentType: paymentType,
            potaliStatus: 'delivered'
          });
        }
      }
    }

    // Reset fields
    setWheatWeight('');
    setCustomerNaam('');
    setCustomerPhone('');
    setPaymentMode('PENDING');
    setJamaAmount('');
    
    alert(t('hisabSaved'));
    setTimeout(() => { isSubmittingRef.current = false; }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(e);
    }
  };

  // Deduplicate pending Hisabs by ID to prevent accidental duplicate renders
  const seenIds = new Set();
  const pendingHisabsList = dailyHisabs.filter(h => {
    const isPending = h.isPending || h.expenseDescription?.includes('PENDING');
    if (!isPending) return false;

    if (seenIds.has(h.id)) return false;

    seenIds.add(h.id);
    return true;
  });
  const pendingCount = pendingHisabsList.length;

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-12 animate-fade-in px-1 sm:px-0">
      {/* Form Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg sm:text-xl tracking-tight">
              {language === 'hi' ? 'डेली पिसाई दर्ज करें' : 'Daily Entry'}
            </h3>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              {language === 'hi' ? 'आज की कुल पिसाई व बिक्री दर्ज करें' : 'Record daily grinding entry'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setShowPendingModal(true)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                pendingCount > 0
                  ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400 shadow-xs animate-pulse'
                  : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700'
              }`}
              title="Pending Potalis List / पेंडिंग पिसाई सूची"
            >
              <span>⏳</span>
              <span>{language === 'hi' ? `पेंडिंग (${pendingCount})` : `Pending (${pendingCount})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('hisab-history')}
              className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>📜</span>
              <span>{language === 'hi' ? 'इतिहास देखें' : 'View History'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
          {/* Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'hi' ? 'दिनांक (Date)' : 'Date'}
            </label>
            <input
              type="date"
              required
              min={minDateStr}
              max={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold"
            />
            <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
              {language === 'hi' ? 'केवल पिछले 30 दिनों का हिसाब दर्ज कर सकते हैं' : 'Only last 30 days allowed'}
            </span>
          </div>

          {/* Grain Type Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'hi' ? 'अनाज का प्रकार' : 'Grain Type'}
            </label>
            <button
              type="button"
              onClick={() => setShowGrainModal(true)}
              className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base text-left font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between cursor-pointer"
            >
              <span>{grainLabels[grainType]?.[language === 'hi' ? 'hi' : 'en'] || grainType}</span>
              <span className="text-xs text-slate-400">▼</span>
            </button>
          </div>

          {/* Weight & Fixed Rate Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Grain weight in kg */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block truncate">
                {language === 'hi' ? 'वजन (KG)' : 'WEIGHT (KG)'} *
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                required
                placeholder="0.0 kg"
                value={wheatWeight}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setWheatWeight(val);
                  }
                }}
                onKeyDown={handleKeyDown}
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            {/* Fixed Rate / Bhav (₹/KG) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block truncate">
                  {language === 'hi' ? 'फिक्स भाव (₹/KG)' : 'RATE (₹/KG)'}
                </label>
                <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1 py-0.2 rounded border border-emerald-500/20">
                  {language === 'hi' ? 'फिक्स' : 'Fixed'}
                </span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm font-extrabold text-slate-400">₹</span>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={customRate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setCustomRate(val);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full h-11 pl-7 pr-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Naam / Customer Name */}
          <div className="space-y-1 relative">
            <label className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
              <span className={paymentMode === 'UDHAR' ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'}>
                {language === 'hi' ? 'नाम (Naam)' : 'NAAM (नाम)'} {paymentMode === 'UDHAR' && (language === 'hi' ? '* (उधार के लिए अनिवार्य)' : '* Required for Udhar')}
              </span>
            </label>
            <input
              type="text"
              placeholder={language === 'hi' ? 'ग्राहक का नाम (जैसे: रमेश, सुरेश)...' : 'Customer Name...'}
              value={customerNaam}
              onChange={(e) => {
                setCustomerNaam(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              className={`w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border rounded-xl text-base focus:outline-none text-slate-800 dark:text-slate-100 font-semibold ${
                paymentMode === 'UDHAR'
                  ? 'border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500'
                  : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500'
              }`}
            />
            {/* Auto-complete suggestions */}
            {showSuggestions && suggestedCustomers.length > 0 && (
              <div className="absolute z-50 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg top-[70px] max-h-48 overflow-y-auto">
                {suggestedCustomers.map(cust => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setCustomerNaam(cust.name);
                      setCustomerPhone(cust.phone !== 'N/A' ? cust.phone : '');
                      setPaymentMode('PENDING');
                      setShowSuggestions(false);
                    }}
                    className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-100">{cust.name}</div>
                    {cust.phone && cust.phone !== 'N/A' && <div className="text-xs text-slate-500">{cust.phone}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Number */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'hi' ? 'मोबाइल नंबर (Mobile Number) - Optional' : 'Mobile Number - Optional'}
            </label>
            <input
              type="tel"
              maxLength={10}
              pattern="[0-9]*"
              placeholder={language === 'hi' ? 'मोबाइल नंबर...' : 'Mobile number...'}
              value={customerPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 10) setCustomerPhone(val);
              }}
              onKeyDown={handleKeyDown}
              className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-semibold"
            />
          </div>

          {/* Payment Method / Udhar Toggle */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'hi' ? 'भुगतान का प्रकार (Payment Method)' : 'Payment Method'}
            </label>
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  if (paymentMode === 'UDHAR') {
                    setPaymentMode('PENDING');
                    setJamaAmount('');
                  } else {
                    setPaymentMode('UDHAR');
                  }
                }}
                className={`py-2 px-3.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  paymentMode === 'UDHAR'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>📝</span>
                <span>{language === 'hi' ? 'उधार (Udhar)' : 'Udhar'}</span>
              </button>
            </div>
          </div>

          {/* Optional Jama Amount when Udhar is selected */}
          {paymentMode === 'UDHAR' && (
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-3 animate-fade-in">

              {/* Jama Amount */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    {language === 'hi' ? 'जमा किए पैसे (Jama Amount ₹) - Optional' : 'Cash Paid / Jama (₹) - Optional'}
                  </label>
                  <span className="text-[11px] font-black text-amber-700 dark:text-amber-300">
                    {language === 'hi'
                      ? `उधार बाकी: ₹${Math.max(0, revenue - (parseFloat(jamaAmount) || 0)).toFixed(1)}`
                      : `Udhar Left: ₹${Math.max(0, revenue - (parseFloat(jamaAmount) || 0)).toFixed(1)}`}
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder={language === 'hi' ? '0.0 (अगर कुछ पैसे जमा किए हैं)' : '0.0 (If partial cash paid)'}
                  value={jamaAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setJamaAmount(val);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Net Amount (Read-only / Auto-calculated) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'hi' ? 'कुल राशि (₹)' : 'TOTAL AMOUNT (₹)'}
            </label>
            <input
              type="text"
              readOnly
              placeholder="0.0"
              value={amount}
              className="w-full h-11 px-4 bg-slate-100/70 dark:bg-slate-800/60 border border-emerald-350 text-emerald-600 rounded-xl text-base focus:outline-none font-bold transition-all cursor-not-allowed select-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-12 text-white font-black rounded-xl text-base transition-all shadow-lg cursor-pointer bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 active:scale-98"
          >
            {t('saveHisab')}
          </button>
        </form>
      </div>

      {/* Grain Selection Modal */}
      {showGrainModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowGrainModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-[90%] max-w-sm rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                {language === 'hi' ? 'अनाज चुनें' : 'Select Grain'}
              </h4>
              <button
                type="button"
                onClick={() => setShowGrainModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[60vh] overflow-y-auto">
              {grainOptions.map((g) => {
                const isSelected = grainType === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGrainType(g);
                      setShowGrainModal(false);
                    }}
                    className="w-full py-3.5 px-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <span className={`text-base font-semibold ${isSelected ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-800 dark:text-slate-100'}`}>
                      {grainLabels[g]?.[language === 'hi' ? 'hi' : 'en'] || g}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-400 dark:border-slate-600'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pending Potalis Modal */}
      {showPendingModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPendingModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden my-auto space-y-3 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-extrabold text-sm">
                  ⏳
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-850 dark:text-slate-100 text-base">
                    {language === 'hi' ? 'पेंडिंग पिसाई पोटली सूची' : 'Pending Grinding Potalis'}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    {language === 'hi' ? `कुल ${pendingCount} पोटली पिसाई पेंडिंग है` : `${pendingCount} potalis pending grinding`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPendingModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {pendingHisabsList.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-2xl block">✨</span>
                <span>{language === 'hi' ? 'वर्तमान में कोई पेंडिंग पोटली नहीं है!' : 'No pending potalis right now!'}</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto pr-1 space-y-2">
                {pendingHisabsList.map((h) => {
                  const custName = h.incomeDescription || h.notes || (language === 'hi' ? 'ग्राहक' : 'Customer');
                  const cust = customers.find(c => c.name.toLowerCase() === custName.toLowerCase());

                  return (
                    <div key={`pend-${h.id}`} className="pt-2 first:pt-0 p-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-black text-slate-850 dark:text-slate-100 text-sm">
                            {custName}
                          </h5>
                          {cust?.phone && (
                            <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mt-0.5 mb-0.5 flex items-center gap-1">
                              <span>📞</span> {cust.phone}
                            </p>
                          )}
                          <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                            {h.grainType} ({h.wheatWeight} kg) • {h.date}
                          </p>
                        </div>
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-800 shadow-2xs">
                          ⏳ ₹{h.amount} Pending
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-rose-100 dark:border-rose-900/30">
                        <span className="text-[10px] font-extrabold text-slate-400 mr-auto">
                          {language === 'hi' ? 'पिसाई पूर्ण होने पर:' : 'Mark Complete:'}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            updateDailyHisab({
                              ...h,
                              isPending: false,
                              expenseDescription: 'CASH'
                            });
                            if (cust) {
                              updateCustomerPotaliStatus(cust.id, 'delivered');
                              addOrder({
                                customerId: cust.id,
                                customerName: cust.name,
                                grainType: h.grainType || 'Grinding',
                                weight: h.wheatWeight || 0,
                                rate: h.rate || 0,
                                totalAmount: h.amount || 0,
                                paymentType: 'CASH',
                                potaliStatus: 'delivered'
                              });
                            }
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-all shadow-xs cursor-pointer"
                          title="Mark Grinding Done & Cash Collected"
                        >
                          💵 {language === 'hi' ? 'कैश (Done)' : 'Cash'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            updateDailyHisab({
                              ...h,
                              isPending: false,
                              expenseDescription: 'PAYTM'
                            });
                            if (cust) {
                              updateCustomerPotaliStatus(cust.id, 'delivered');
                              addOrder({
                                customerId: cust.id,
                                customerName: cust.name,
                                grainType: h.grainType || 'Grinding',
                                weight: h.wheatWeight || 0,
                                rate: h.rate || 0,
                                totalAmount: h.amount || 0,
                                paymentType: 'PAYTM',
                                potaliStatus: 'delivered'
                              });
                            }
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black transition-all shadow-xs cursor-pointer"
                          title="Mark Grinding Done & Paytm Collected"
                        >
                          📲 Paytm
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            updateDailyHisab({
                              ...h,
                              isPending: false,
                              expenseDescription: `UDHAR (Jama: ₹0, Udhar: ₹${h.amount.toFixed(0)})`
                            });
                            if (cust) {
                              updateCustomerPotaliStatus(cust.id, 'delivered');
                              recordManualDue(cust.id, h.amount, `Grinding - ${h.grainType} ${h.wheatWeight}kg`);
                              addOrder({
                                customerId: cust.id,
                                customerName: cust.name,
                                grainType: h.grainType || 'Grinding',
                                weight: h.wheatWeight || 0,
                                rate: h.rate || 0,
                                totalAmount: h.amount || 0,
                                paymentType: 'CREDIT',
                                potaliStatus: 'delivered'
                              });
                            }
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black transition-all shadow-xs cursor-pointer"
                          title="Mark Grinding Done & Udhar Logged"
                        >
                          📝 Udhar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Profile Sidebar */}
      {showProfileSidebar && matchedCustomer && (
        <div className="fixed inset-y-0 right-0 z-[60] w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 transform transition-transform animate-slide-in-right overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xl text-slate-800 dark:text-slate-100">
                {language === 'hi' ? 'ग्राहक प्रोफाइल' : 'Customer Profile'}
              </h3>
              <button
                onClick={() => setShowProfileSidebar(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-2xl font-black shadow-inner">
                {matchedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="font-black text-2xl text-slate-800 dark:text-slate-100">{matchedCustomer.name}</h4>
              {matchedCustomer.phone && matchedCustomer.phone !== 'N/A' && (
                <p className="text-slate-500 font-bold">📞 {matchedCustomer.phone}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                <p className="text-[10px] font-black uppercase tracking-wider text-rose-500 mb-1">
                  {language === 'hi' ? 'कुल बाकी' : 'Total Due'}
                </p>
                <p className="font-black text-xl text-rose-600">₹{matchedCustomer.outstandingBalance || 0}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-1">
                  {language === 'hi' ? 'पोटली स्थिति' : 'Potali Status'}
                </p>
                <p className="font-black text-sm text-emerald-700 uppercase">
                  {matchedCustomer.potaliStatus === 'received' ? 'Received' : matchedCustomer.potaliStatus === 'delivered' ? 'Delivered' : 'None'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setCustomerNaam(matchedCustomer.name);
                  setCustomerPhone(matchedCustomer.phone !== 'N/A' ? matchedCustomer.phone : '');
                  setWheatWeight('');
                  setPaymentMode('PENDING');
                  setJamaAmount('');
                  setShowProfileSidebar(false);
                  alert(language === 'hi' ? 'नई पोटली के लिए फॉर्म तैयार है!' : 'Ready to add new potli!');
                }}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                <span>{language === 'hi' ? 'नई पोटली जोड़ें (Add New Potli)' : 'Add New Potli'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
