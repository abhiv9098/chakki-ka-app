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
  const { addDailyHisab, t, language, defaultGrindingRate, grainRates, setActiveView } = useApp();

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
  const [wheatWeight, setWheatWeight] = useState('');
  const [customRate, setCustomRate] = useState<string>('5');
  const [revenue, setRevenue] = useState(0);
  const [customerNaam, setCustomerNaam] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'PAYTM' | 'UDHAR'>('CASH');
  const [jamaAmount, setJamaAmount] = useState<string>('');
  const [amount, setAmount] = useState('');

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

    if (date < minDateStr || date > todayStr) {
      alert(
        language === 'hi'
          ? 'केवल पिछले 30 दिनों के भीतर का हिसाब ही दर्ज किया जा सकता है!'
          : 'You can only log summaries for the last 30 days!'
      );
      return;
    }

    const weightVal = parseFloat(wheatWeight);
    const rateVal = grainRates[grainType] || parseFloat(defaultGrindingRate) || 5;
    const netAmount = parseFloat(amount) || 0;

    if (isNaN(weightVal) || weightVal <= 0) {
      alert(language === 'hi' ? 'कृपया पिसाई का वजन लिखें!' : 'Please enter grain weight!');
      return;
    }

    const jamaVal = paymentMode === 'UDHAR' ? (parseFloat(jamaAmount) || 0) : netAmount;
    const remainingUdhar = Math.max(0, netAmount - jamaVal);

    const finalExpenseDesc = (paymentMode === 'UDHAR' && jamaVal > 0)
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
      notes: customerNaam.trim() || `${grainType} Log`
    });

    // Reset fields
    setWheatWeight('');
    setCustomerNaam('');
    setPaymentMode('CASH');
    setJamaAmount('');
    
    alert(t('hisabSaved'));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-12 animate-fade-in">
      {/* Form Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-xl tracking-tight">
              {language === 'hi' ? 'डेली हिसाब एंट्री' : 'Daily Summary Log'}
            </h3>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              {language === 'hi' ? 'आज की कुल पिसाई व बिक्री तुरंत दर्ज करें' : 'Record daily grinding log'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('hisab-history')}
            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>📜</span>
            <span>{language === 'hi' ? 'इतिहास देखें' : 'View History'}</span>
          </button>
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
                type="text"
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
                  type="text"
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
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'hi' ? 'नाम (Naam)' : 'NAAM (नाम)'}
            </label>
            <input
              type="text"
              placeholder={language === 'hi' ? 'ग्राहक का नाम लिखें...' : 'Customer Name...'}
              value={customerNaam}
              onChange={(e) => setCustomerNaam(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-semibold"
            />
          </div>

          {/* Payment Method Selector (Cash / Paytm / Udhar) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'hi' ? 'भुगतान का प्रकार (Payment Method)' : 'Payment Method'}
            </label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setPaymentMode('CASH'); setJamaAmount(''); }}
                className={`py-2 px-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  paymentMode === 'CASH'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>💵</span>
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => { setPaymentMode('PAYTM'); setJamaAmount(''); }}
                className={`py-2 px-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  paymentMode === 'PAYTM'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>📲</span>
                <span>Paytm</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('UDHAR')}
                className={`py-2 px-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  paymentMode === 'UDHAR'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>📝</span>
                <span>{language === 'hi' ? 'उधार' : 'Udhar'}</span>
              </button>
            </div>
          </div>

          {/* Optional Jama Amount input when Udhar is selected */}
          {paymentMode === 'UDHAR' && (
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-2 animate-fade-in">
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
                type="text"
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
          )}

          {/* Net Amount (Read-only / Auto-calculated) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'hi' ? 'मुनाफा राशि (₹)' : 'Profit Amount (₹)'}
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
    </div>
  );
};
