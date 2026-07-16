'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DailyHisab } from '../types';
import { CloseIcon } from './Icons';

export const DailyHisabView: React.FC = () => {
  const { dailyHisabs, addDailyHisab, deleteDailyHisab, t, language } = useApp();

  // Form states
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [wheatWeight, setWheatWeight] = useState('');
  const [rate, setRate] = useState('5');
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [isProfit, setIsProfit] = useState<boolean>(true);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-calculate revenue
  useEffect(() => {
    const w = parseFloat(wheatWeight) || 0;
    const r = parseFloat(rate) || 0;
    const calculatedRevenue = w * r;
    setRevenue(calculatedRevenue);

    // Auto-calculate Net Profit/Loss if weight is entered
    const exp = parseFloat(expenses) || 0;
    const net = calculatedRevenue - exp;
    if (net >= 0) {
      setIsProfit(true);
      setAmount(net.toFixed(1));
    } else {
      setIsProfit(false);
      setAmount(Math.abs(net).toFixed(1));
    }
  }, [wheatWeight, rate, expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const weightVal = parseFloat(wheatWeight);
    const rateVal = parseFloat(rate);
    const expenseVal = parseFloat(expenses) || 0;
    const netAmount = parseFloat(amount) || 0;

    if (isNaN(weightVal) || weightVal <= 0) {
      alert(language === 'hi' ? 'कृपया गेहूं पिसाई का वजन लिखें!' : 'Please enter wheat weight!');
      return;
    }

    addDailyHisab({
      date,
      wheatWeight: weightVal,
      rate: rateVal,
      revenue,
      expenses: expenseVal,
      expenseDescription: expenseDesc.trim(),
      isProfit,
      amount: netAmount,
      notes: notes.trim() || (isProfit ? 'Profit' : 'Loss')
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-5 border-b border-slate-50 dark:border-slate-800 pb-3">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-105 text-base">
                {language === 'hi' ? 'नया डेली हिसाब जोड़ें' : 'Log Daily Summary'}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">Enter end-of-day mill summaries</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'hi' ? 'दिनांक' : 'Date'}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            {/* Wheat weight in kg */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {t('wheatWeight')} *
              </label>
              <input
                type="number"
                required
                min="0.1"
                step="0.1"
                placeholder="0.0 kg"
                value={wheatWeight}
                onChange={(e) => setWheatWeight(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            {/* Grinding rate */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {t('grindingRate')}
              </label>
              <input
                type="number"
                required
                min="0.1"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold"
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
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold"
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
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            )}

            {/* Profit or Loss Option Toggle */}
            <div className="space-y-2.5 pt-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {t('profitOrLossOption')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfit(true)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isProfit
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/15'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <span className="text-sm">📈</span>
                  <span>{t('profit')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfit(false)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    !isProfit
                      ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/15'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <span className="text-sm">📉</span>
                  <span>{t('loss')}</span>
                </button>
              </div>
            </div>

            {/* Net Amount */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'hi' ? 'मुनाफा/नुकसान राशि (₹)' : 'Profit/Loss Amount (₹)'}
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                placeholder="₹ Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold transition-all ${
                  isProfit
                    ? 'text-emerald-600 border-emerald-350 focus:border-emerald-500'
                    : 'text-rose-600 border-rose-350 focus:border-rose-500'
                }`}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-base transition-all shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-98"
            >
              {t('saveHisab')}
            </button>
          </form>
        </div>

        {/* List Panel */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col min-h-[450px]">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-lg">
              {language === 'hi' ? 'डेली हिसाब इतिहास' : 'Daily Logs History'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Record of day-by-day mill stats</p>
          </div>

          <div className="flex-1 overflow-x-auto">
            {sortedHisabs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 text-sm font-semibold space-y-2">
                <span className="text-4xl">📊</span>
                <p>No daily summary logs recorded yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-800/40">
                    <th className="py-3 px-3 font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide text-[10px]">{language === 'hi' ? 'दिनांक' : 'Date'}</th>
                    <th className="py-3 px-3 font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide text-[10px]">{language === 'hi' ? 'पिसाई वजन' : 'Weight (kg)'}</th>
                    <th className="py-3 px-3 font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide text-[10px]">{language === 'hi' ? 'कुल कमाई' : 'Revenue'}</th>
                    <th className="py-3 px-3 font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide text-[10px]">{language === 'hi' ? 'कुल खर्च' : 'Expenses'}</th>
                    <th className="py-3 px-3 font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide text-[10px] text-right">{t('netResult')}</th>
                    <th className="py-3 px-3 font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide text-[10px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {sortedHisabs.map((hisab) => {
                    const dateObj = new Date(hisab.date);
                    const formattedDate = dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit'
                    });

                    return (
                      <tr key={hisab.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all align-middle">
                        <td className="py-3 px-3 font-extrabold text-slate-800 dark:text-slate-100">{formattedDate}</td>
                        <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">{hisab.wheatWeight} kg</td>
                        <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">₹{hisab.revenue.toFixed(0)}</td>
                        <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">
                          {hisab.expenses > 0 ? (
                            <span className="text-rose-600 font-bold" title={hisab.expenseDescription}>
                              ₹{hisab.expenses.toFixed(0)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`inline-block font-black text-xs px-2 py-0.5 rounded-full ${
                            hisab.isProfit
                              ? 'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/20'
                              : 'bg-rose-50 text-rose-650 dark:bg-rose-950/20'
                          }`}>
                            {hisab.isProfit ? '+' : '-'} ₹{hisab.amount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(language === 'hi' ? 'क्या आप वाकई इस हिसाब रिकॉर्ड को हटाना चाहते हैं?' : 'Are you sure you want to delete this log?')) {
                                deleteDailyHisab(hisab.id);
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <CloseIcon size={16} />
                          </button>
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
    </div>
  );
};
