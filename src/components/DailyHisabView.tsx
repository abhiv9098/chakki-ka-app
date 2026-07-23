'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DailyHisab } from '../types';
import { CloseIcon } from './Icons';

const grainRates: Record<string, number> = {
  "Wheat": 5,
  "Maize": 6,
  "Gram/Chana": 8,
  "Rice": 6,
  "Barley": 7,
  "Bajra": 6,
  "Multigrain": 10,
  "Other": 5
};

const grainOptions = [
  "Wheat",
  "Maize",
  "Gram/Chana",
  "Rice",
  "Barley",
  "Bajra",
  "Multigrain",
  "Other"
];

export const DailyHisabView: React.FC = () => {
  const { dailyHisabs, addDailyHisab, deleteDailyHisab, t, language, defaultGrindingRate } = useApp();

  // Calculate today and 7 days ago date strings for date picker range restriction
  const { todayStr, minDateStr } = (() => {
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const minObj = new Date(todayObj.getTime() - 7 * 24 * 60 * 60 * 1000);
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
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [isProfit, setIsProfit] = useState<boolean>(true);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-calculate revenue
  useEffect(() => {
    const w = parseFloat(wheatWeight) || 0;
    const r = grainRates[grainType] || parseFloat(defaultGrindingRate) || 5;
    const calculatedRevenue = w * r;
    setRevenue(calculatedRevenue);

    // Auto-calculate Net Profit if weight is entered
    const exp = parseFloat(expenses) || 0;
    const net = calculatedRevenue - exp;
    setIsProfit(true);
    setAmount(net >= 0 ? net.toFixed(1) : Math.abs(net).toFixed(1));
  }, [wheatWeight, grainType, defaultGrindingRate, expenses]);

  // Check if summary is already logged for the selected date
  const isDateAlreadyLogged = dailyHisabs.some(h => h.date === date);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (date < minDateStr || date > todayStr) {
      alert(
        language === 'hi'
          ? 'केवल पिछले 7 दिनों के भीतर का हिसाब ही दर्ज किया जा सकता है!'
          : 'You can only log summaries for the last 7 days!'
      );
      return;
    }

    if (isDateAlreadyLogged) {
      alert(
        language === 'hi'
          ? `इस तारीख (${date}) का हिसाब पहले से ही दर्ज है! एक तारीख का हिसाब केवल एक बार ही जोड़ा जा सकता है।`
          : `Daily summary for date (${date}) has already been logged! Only one summary per date is allowed.`
      );
      return;
    }

    const weightVal = parseFloat(wheatWeight);
    const rateVal = grainRates[grainType] || parseFloat(defaultGrindingRate) || 5;
    const expenseVal = parseFloat(expenses) || 0;
    const netAmount = parseFloat(amount) || 0;

    if (isNaN(weightVal) || weightVal <= 0) {
      alert(language === 'hi' ? 'कृपया पिसाई का वजन लिखें!' : 'Please enter grain weight!');
      return;
    }

    addDailyHisab({
      date,
      grainType,
      wheatWeight: weightVal,
      rate: rateVal,
      revenue,
      expenses: expenseVal,
      expenseDescription: expenseDesc.trim(),
      isProfit: true,
      amount: netAmount,
      notes: notes.trim() || `${grainType} Profit`
    });

    // Reset fields
    setWheatWeight('');
    setExpenses('');
    setExpenseDesc('');
    setNotes('');
    
    alert(t('hisabSaved'));
  };

  // Sort daily logs by date descending
  const sortedHisabs = [...dailyHisabs].sort((a, b) => b.date.localeCompare(a.date));

  // Calculate 7-day total
  const nowTs = new Date().getTime();
  const sevenDaysAgoTs = nowTs - 7 * 24 * 60 * 60 * 1000;
  const last7DaysHisabs = dailyHisabs.filter(h => new Date(h.date).getTime() >= sevenDaysAgoTs);
  const net7DaysTotal = last7DaysHisabs.reduce((sum, h) => sum + (h.isProfit ? h.amount : -h.amount), 0);
  const display7DaysTotal = net7DaysTotal < 0 ? 0 : net7DaysTotal;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-fit">

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'hi' ? 'दिनांक' : 'Date'}
              </label>
              <input
                type="date"
                required
                min={minDateStr}
                max={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold"
              />
              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                {language === 'hi' ? 'केवल पिछले 7 दिनों का हिसाब दर्ज कर सकते हैं' : 'Only last 7 days allowed'}
              </span>
              {isDateAlreadyLogged && (
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200 dark:border-amber-900/40 mt-1">
                  ⚠️ {language === 'hi' ? 'इस तारीख का हिसाब पहले ही दर्ज है!' : 'Summary already logged for this date!'}
                </p>
              )}
            </div>

            {/* Grain Type Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'hi' ? 'अनाज का प्रकार' : 'Grain Type'}
              </label>
              <button
                type="button"
                onClick={() => setShowGrainModal(true)}
                disabled={isDateAlreadyLogged}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base text-left font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{grainType}</span>
                <span className="text-xs text-slate-400">▼</span>
              </button>
            </div>

            {/* Grain weight in kg */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {grainType.toUpperCase()} {language === 'hi' ? 'पिसाई (KG)' : 'GROUND (KG)'} *
              </label>
              <input
                type="number"
                required
                min="0.1"
                step="0.1"
                placeholder="0.0 kg"
                value={wheatWeight}
                onChange={(e) => setWheatWeight(e.target.value)}
                disabled={isDateAlreadyLogged}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Expenses */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {t('expenses')}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="₹0"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                disabled={isDateAlreadyLogged}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Expense Description */}
            {parseFloat(expenses) > 0 && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  {t('expenseDescription')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electricity bill, rent, labour"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  disabled={isDateAlreadyLogged}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Financial Result (Profit only) */}
            <div className="space-y-2.5 pt-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {t('profitOrLossOption')}
              </label>
              <div>
                <button
                  type="button"
                  onClick={() => setIsProfit(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-emerald-500 bg-emerald-500 text-white text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/15"
                >
                  <span className="text-sm">📈</span>
                  <span>{t('profit')}</span>
                </button>
              </div>
            </div>

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
              disabled={isDateAlreadyLogged}
              className={`w-full h-12 text-white font-black rounded-xl text-base transition-all shadow-lg cursor-pointer ${
                isDateAlreadyLogged
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 active:scale-98'
              }`}
            >
              {isDateAlreadyLogged
                ? (language === 'hi' ? 'इस तारीख का हिसाब दर्ज हो चुका है' : 'Already Logged for Date')
                : t('saveHisab')
              }
            </button>
          </form>
        </div>

        {/* List Panel */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col min-h-[450px]">
          <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-lg">
                {language === 'hi' ? 'डेली हिसाब इतिहास' : 'Daily Logs History'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Record of day-by-day mill stats</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block whitespace-nowrap">7-Day Net</span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap inline-block mt-0.5">
                + ₹{display7DaysTotal.toFixed(1)} Profit
              </span>
            </div>
          </div>

          <div className="flex-1 w-full overflow-hidden">
            {sortedHisabs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 text-sm font-semibold space-y-2">
                <span className="text-4xl">📊</span>
                <p>No daily summary logs recorded yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-800/40">
                    <th className="py-2.5 px-2 font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide text-[9px] sm:text-[10px] w-[25%]">{language === 'hi' ? 'दिनांक' : 'Date'}</th>
                    <th className="py-2.5 px-1.5 font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide text-[9px] sm:text-[10px] w-[20%]">{language === 'hi' ? 'अनाज / वजन' : 'Grain / Wt'}</th>
                    <th className="py-2.5 px-1.5 font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide text-[9px] sm:text-[10px] w-[20%]">{language === 'hi' ? 'कमाई' : 'Revenue'}</th>
                    <th className="py-2.5 px-1.5 font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide text-[9px] sm:text-[10px] w-[15%]">{language === 'hi' ? 'खर्च' : 'Expense'}</th>
                    <th className="py-2.5 px-2 font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide text-[9px] sm:text-[10px] text-right w-[20%]">{t('netResult')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs sm:text-sm">
                  {sortedHisabs.map((hisab) => {
                    const dateObj = new Date(hisab.date);
                    const formattedDate = dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                      day: '2-digit',
                      month: 'short'
                    });

                    return (
                      <tr key={hisab.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all align-middle">
                        <td className="py-3 px-2 font-extrabold text-slate-800 dark:text-slate-100 whitespace-nowrap text-xs">{formattedDate}</td>
                        <td className="py-3 px-1.5 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                          {hisab.grainType ? `${hisab.grainType.split(' ')[0]} ${hisab.wheatWeight}kg` : `${hisab.wheatWeight}kg`}
                        </td>
                        <td className="py-3 px-1.5 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">₹{hisab.revenue.toFixed(0)}</td>
                        <td className="py-3 px-1.5 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                          {hisab.expenses > 0 ? (
                            <span className="text-rose-600 font-bold" title={hisab.expenseDescription}>
                              ₹{hisab.expenses.toFixed(0)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap text-xs">
                          <span className={`inline-flex items-center font-black text-[11px] sm:text-xs px-2 py-0.5 rounded-full ${
                            hisab.isProfit
                              ? 'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-650 dark:bg-rose-950/30 dark:text-rose-450'
                          }`}>
                            {hisab.isProfit ? '+' : '-'}₹{hisab.amount}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Grain Selection Modal matching Image 2 */}
      {showGrainModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowGrainModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden"
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
                      {g}
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
