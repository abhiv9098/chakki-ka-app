'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DailyHisab } from '../types';
import { TrashIcon } from './Icons';

export const HisabHistoryView: React.FC = () => {
  const { dailyHisabs, deleteDailyHisab, updateDailyHisab, language, hideAmounts, setActiveView } = useApp();

  const [activeTab, setActiveTab] = useState<'today' | 'udhar' | 'past'>('today');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Collection Modal State
  const [selectedHisabForPayment, setSelectedHisabForPayment] = useState<DailyHisab | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>('');
  const [newPaymentMode, setNewPaymentMode] = useState<'CASH' | 'PAYTM'>('CASH');

  const todayObj = new Date();
  const yyyy = todayObj.getFullYear();
  const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
  const dd = String(todayObj.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // Helper to parse total, jama, and remaining udhar from any DailyHisab
  const getUdharDetails = (hisab: DailyHisab) => {
    const total = hisab.amount || 0;
    const desc = hisab.expenseDescription || '';

    if (desc === 'CASH' || desc === 'PAYTM') {
      return { jama: total, udhar: 0, isUdhar: false, mode: desc };
    }

    const jamaMatch = desc.match(/Jama:\s*₹?(\d+(?:\.\d+)?)/i);
    const udharMatch = desc.match(/Udhar:\s*₹?(\d+(?:\.\d+)?)/i);

    if (jamaMatch && udharMatch) {
      const jama = parseFloat(jamaMatch[1]) || 0;
      const udhar = parseFloat(udharMatch[1]) || 0;
      return { jama, udhar, isUdhar: udhar > 0, mode: 'PARTIAL_UDHAR' };
    }

    // Pure UDHAR
    return { jama: 0, udhar: total, isUdhar: true, mode: 'UDHAR' };
  };

  // 30-day filter limit
  const nowTs = new Date().getTime();
  const thirtyDaysAgoTs = nowTs - 30 * 24 * 60 * 60 * 1000;

  // Filter out entries older than 30 days
  const hisabsWithin30Days = dailyHisabs.filter(h => {
    const logTime = new Date(h.date).getTime();
    return !isNaN(logTime) && logTime >= thirtyDaysAgoTs;
  });

  // Sort daily logs by date descending & creation order
  const sortedHisabs = [...hisabsWithin30Days].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.id - a.id;
  });

  // Filter logs based on search term and tab
  const filteredHisabs = sortedHisabs.filter((hisab) => {
    const udharInfo = getUdharDetails(hisab);

    if (activeTab === 'today' && hisab.date !== todayStr) return false;
    if (activeTab === 'udhar' && !udharInfo.isUdhar) return false;
    if (activeTab === 'past' && hisab.date === todayStr) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = (hisab.incomeDescription || '').toLowerCase().includes(q);
      const matchNotes = (hisab.notes || '').toLowerCase().includes(q);
      const matchDate = hisab.date.includes(q);
      const matchGrain = (hisab.grainType || '').toLowerCase().includes(q);
      if (!matchName && !matchNotes && !matchDate && !matchGrain) return false;
    }

    return true;
  });

  // Count Udhar entries
  const totalUdharCount = sortedHisabs.filter(h => getUdharDetails(h).isUdhar).length;
  const totalUdharAmount = sortedHisabs.reduce((sum, h) => sum + getUdharDetails(h).udhar, 0);

  // Calculate stats
  const totalEntries = filteredHisabs.length;
  const totalWeight = filteredHisabs.reduce((sum, h) => sum + (h.wheatWeight || 0), 0);
  const totalRevenue = filteredHisabs.reduce((sum, h) => sum + (h.isProfit ? h.amount : -h.amount), 0);

  // 30-day net profit
  const last30DaysHisabs = dailyHisabs.filter(h => new Date(h.date).getTime() >= thirtyDaysAgoTs);
  const net30DaysTotal = last30DaysHisabs.reduce((sum, h) => sum + (h.isProfit ? h.amount : -h.amount), 0);

  const handleDelete = (id: number) => {
    if (window.confirm(language === 'hi' ? 'क्या आप इस हिसाब एंट्री को मिटाना चाहते हैं?' : 'Are you sure you want to delete this log?')) {
      deleteDailyHisab(id);
    }
  };

  // Open Jama Payment Collection Modal
  const openPaymentModal = (hisab: DailyHisab) => {
    setSelectedHisabForPayment(hisab);
    const details = getUdharDetails(hisab);
    setNewPaymentAmount(details.udhar > 0 ? details.udhar.toString() : '');
    setNewPaymentMode('CASH');
  };

  // Handle Jama Payment Submission
  const handleCollectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHisabForPayment) return;

    const details = getUdharDetails(selectedHisabForPayment);
    const addAmt = parseFloat(newPaymentAmount) || 0;

    if (addAmt <= 0) {
      alert(language === 'hi' ? 'कृपया सही जमा राशि दर्ज करें!' : 'Please enter a valid payment amount!');
      return;
    }

    if (addAmt > details.udhar) {
      alert(
        language === 'hi'
          ? `जमा राशि बाकी उधार (₹${details.udhar}) से अधिक नहीं हो सकती!`
          : `Collected amount cannot exceed remaining Udhar (₹${details.udhar})!`
      );
      return;
    }

    const updatedJama = details.jama + addAmt;
    const remainingUdhar = Math.max(0, details.udhar - addAmt);

    let updatedExpenseDesc = '';
    if (remainingUdhar === 0) {
      updatedExpenseDesc = newPaymentMode === 'PAYTM' ? 'PAYTM' : 'CASH';
    } else {
      updatedExpenseDesc = `UDHAR (Jama: ₹${updatedJama.toFixed(0)}, Udhar: ₹${remainingUdhar.toFixed(0)})`;
    }

    const updatedHisab: DailyHisab = {
      ...selectedHisabForPayment,
      expenseDescription: updatedExpenseDesc
    };

    updateDailyHisab(updatedHisab);
    setSelectedHisabForPayment(null);
    setNewPaymentAmount('');

    alert(
      language === 'hi'
        ? `₹${addAmt} सफलता पूर्वक जमा किया गया! ${remainingUdhar > 0 ? `बाकी उधार: ₹${remainingUdhar}` : 'उधार पूरा चुकता हो गया!'}`
        : `₹${addAmt} successfully recorded! ${remainingUdhar > 0 ? `Remaining Udhar: ₹${remainingUdhar}` : 'Fully paid!'}`
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-1 sm:px-4 space-y-4 pb-12 animate-fade-in">
      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg tracking-tight">
              {language === 'hi' ? 'डेली हिसाब इतिहास' : 'Daily Logs History'}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              {language === 'hi' ? 'पिसाई एंट्रियों का विवरण' : 'Grinding logs history'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('daily-hisab')}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>➕</span>
            <span>{language === 'hi' ? 'नया दर्ज करें' : 'Log New'}</span>
          </button>
        </div>

        {/* Compact Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'एंट्रियां' : 'Logs'}
            </span>
            <span className="text-base font-black text-slate-800 dark:text-slate-100 mt-0.5 block">
              {totalEntries}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'कुल पिसाई' : 'Weight'}
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {totalWeight.toFixed(1)} kg
            </span>
          </div>

          <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl">
            <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
              {language === 'hi' ? 'कुल उधार' : 'Total Udhar'}
            </span>
            <span className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
              {hideAmounts ? '₹••' : `₹${totalUdharAmount.toFixed(0)}`}
            </span>
          </div>

          <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl">
            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              {language === 'hi' ? '30-दिन योग' : '30-Day Net'}
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {hideAmounts ? '₹••' : `+₹${net30DaysTotal.toFixed(0)}`}
            </span>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="space-y-2">
          <div className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl flex items-center gap-1 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`flex-1 py-1.5 rounded-xl transition-all text-center cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ☀️ {language === 'hi' ? 'आज का' : 'Today'} ({sortedHisabs.filter(h => h.date === todayStr).length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('udhar')}
              className={`flex-1 py-1.5 rounded-xl transition-all text-center cursor-pointer ${
                activeTab === 'udhar'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              📝 {language === 'hi' ? 'उधार' : 'Udhar'} ({totalUdharCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-1.5 rounded-xl transition-all text-center cursor-pointer ${
                activeTab === 'past'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              📅 {language === 'hi' ? 'पुराना' : 'Past'} ({sortedHisabs.filter(h => h.date !== todayStr).length})
            </button>
          </div>

          <input
            type="text"
            placeholder={language === 'hi' ? 'ग्राहक का नाम, तारीख या अनाज खोजें...' : 'Search by name, date or grain...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Content Area */}
        <div className="pt-1">
          {filteredHisabs.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold space-y-1">
              <span className="text-2xl">📋</span>
              <p>{language === 'hi' ? 'कोई हिसाब एंट्री नहीं मिली' : 'No logs found'}</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View (sm:hidden) */}
              <div className="space-y-2 sm:hidden">
                {filteredHisabs.map((hisab) => {
                  const dateObj = new Date(hisab.date);
                  const formattedDate = dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                    day: 'numeric',
                    month: 'short'
                  });
                  const isToday = hisab.date === todayStr;
                  const udharInfo = getUdharDetails(hisab);

                  return (
                    <div
                      key={hisab.id}
                      className={`p-3 border rounded-2xl space-y-2 transition-all ${
                        udharInfo.isUdhar
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                          : 'bg-slate-50 dark:bg-slate-800/30 border-slate-150 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                            {isToday ? (language === 'hi' ? '☀️ आज' : '☀️ Today') : formattedDate}
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/20 truncate">
                            {hisab.grainType} ({hisab.wheatWeight}kg)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                            {hideAmounts ? '₹••' : `+₹${hisab.amount}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(hisab.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 cursor-pointer"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Details & Payment Action */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          <div className="font-extrabold text-slate-800 dark:text-slate-100 truncate">
                            {hisab.incomeDescription || '—'}
                          </div>
                          {udharInfo.isUdhar && (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                                {language === 'hi' ? 'जमा: ₹' : 'Jama: ₹'}{udharInfo.jama}
                              </span>
                              <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                                {language === 'hi' ? 'बाकी उधार: ₹' : 'Udhar Due: ₹'}{udharInfo.udhar}
                              </span>
                            </div>
                          )}
                        </div>

                        {udharInfo.isUdhar && (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(hisab)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] rounded-lg shadow-xs cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                          >
                            <span>💳</span>
                            <span>{language === 'hi' ? 'जमा करें' : 'Jama'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (hidden on sm) */}
              <div className="hidden sm:block w-full overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse table-auto text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 uppercase tracking-tight text-[10px]">
                      <th className="py-2.5 px-3 font-bold">{language === 'hi' ? 'तारीख' : 'Date'}</th>
                      <th className="py-2.5 px-3 font-bold">{language === 'hi' ? 'अनाज / वजन' : 'Grain / Wt'}</th>
                      <th className="py-2.5 px-3 font-bold">{language === 'hi' ? 'नाम (Naam)' : 'Customer'}</th>
                      <th className="py-2.5 px-3 font-bold">{language === 'hi' ? 'भुगतान स्थिति' : 'Payment Status'}</th>
                      <th className="py-2.5 px-3 font-bold text-right">{language === 'hi' ? 'राशि' : 'Amount'}</th>
                      <th className="py-2.5 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {filteredHisabs.map((hisab) => {
                      const dateObj = new Date(hisab.date);
                      const formattedDate = dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                        day: 'numeric',
                        month: 'short'
                      });
                      const isToday = hisab.date === todayStr;
                      const udharInfo = getUdharDetails(hisab);

                      return (
                        <tr
                          key={hisab.id}
                          className={`transition-all align-middle ${
                            udharInfo.isUdhar
                              ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60'
                              : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/20'
                          }`}
                        >
                          <td className="py-3 px-3 font-black text-slate-800 dark:text-slate-100 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              {isToday && <span className="text-emerald-500">☀️</span>}
                              <span>{formattedDate}</span>
                            </span>
                          </td>

                          <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/20 font-black">
                              {hisab.grainType} ({hisab.wheatWeight}kg)
                            </span>
                          </td>

                          <td className="py-3 px-3 font-extrabold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                            {hisab.incomeDescription || (hisab.notes && !hisab.notes.includes('Log') ? hisab.notes : '—')}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {udharInfo.isUdhar ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                                  {language === 'hi' ? 'जमा: ₹' : 'Jama: ₹'}{udharInfo.jama}
                                </span>
                                <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                                  {language === 'hi' ? 'बाकी: ₹' : 'Due: ₹'}{udharInfo.udhar}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openPaymentModal(hisab)}
                                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] rounded-md transition-all shadow-2xs cursor-pointer active:scale-95"
                                >
                                  💳 {language === 'hi' ? 'जमा करें' : 'Jama'}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                                {udharInfo.mode === 'PAYTM' ? '📲 Paytm' : '💵 Cash (Paid)'}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                              {hideAmounts ? '₹••' : `+₹${hisab.amount}`}
                            </span>
                          </td>

                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDelete(hisab.id)}
                              className="p-1 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Udhar Payment Settlement Modal */}
      {selectedHisabForPayment && (() => {
        const details = getUdharDetails(selectedHisabForPayment);
        return (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setSelectedHisabForPayment(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 w-[95%] max-w-md rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden my-auto p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg">
                    {language === 'hi' ? 'उधार जमा भुगतान दर्ज करें' : 'Record Udhar Payment'}
                  </h4>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                    {selectedHisabForPayment.incomeDescription || 'ग्राहक'} ({selectedHisabForPayment.grainType} - {selectedHisabForPayment.wheatWeight}kg)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHisabForPayment(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Udhar Summary Card */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">कुल बिल</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5 block">
                    ₹{selectedHisabForPayment.amount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">जमा राशि</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    ₹{details.jama}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">उधार बाकी</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                    ₹{details.udhar}
                  </span>
                </div>
              </div>

              {/* Payment Entry Form */}
              <form onSubmit={handleCollectPayment} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block">
                    {language === 'hi' ? 'नई जमा राशि (New Cash Collected ₹) *' : 'New Payment Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={details.udhar}
                    step="any"
                    placeholder={`Max ₹${details.udhar}`}
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPaymentAmount(details.udhar.toString())}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs rounded-xl cursor-pointer hover:bg-emerald-100"
                  >
                    Full ₹{details.udhar} (पूरा जमा)
                  </button>
                  {details.udhar > 10 && (
                    <button
                      type="button"
                      onClick={() => setNewPaymentAmount((details.udhar / 2).toFixed(0))}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl cursor-pointer hover:bg-slate-200"
                    >
                      Half ₹{(details.udhar / 2).toFixed(0)}
                    </button>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'hi' ? 'भुगतान का प्रकार' : 'Payment Method'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setNewPaymentMode('CASH')}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        newPaymentMode === 'CASH'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span>💵</span>
                      <span>Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewPaymentMode('PAYTM')}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        newPaymentMode === 'PAYTM'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span>📲</span>
                      <span>Paytm</span>
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98"
                >
                  💳 {language === 'hi' ? 'भुगतान जमा करें' : 'Record Payment'}
                </button>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
