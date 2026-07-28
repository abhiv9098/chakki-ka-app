'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DailyHisab } from '../types';
import { CloseIcon } from './Icons';

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
  const { dailyHisabs, addDailyHisab, deleteDailyHisab, t, language, defaultGrindingRate, grainRates, hideAmounts } = useApp();

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
  const [extraIncome, setExtraIncome] = useState('');
  const [reasonForLoss, setReasonForLoss] = useState('');
  const [isProfit, setIsProfit] = useState<boolean>(true);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'past'>('today');

  // Auto-calculate revenue
  useEffect(() => {
    const w = parseFloat(wheatWeight) || 0;
    const r = grainRates[grainType] || parseFloat(defaultGrindingRate) || 5;
    const calculatedRevenue = w * r;
    setRevenue(calculatedRevenue);

    // Auto-calculate Net Profit (Revenue + Extra Income)
    const inc = parseFloat(extraIncome) || 0;
    const net = calculatedRevenue + inc;
    setIsProfit(true);
    setAmount(net.toFixed(1));
  }, [wheatWeight, grainType, defaultGrindingRate, extraIncome, grainRates]);

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

    const weightVal = parseFloat(wheatWeight);
    const rateVal = grainRates[grainType] || parseFloat(defaultGrindingRate) || 5;
    const incomeVal = parseFloat(extraIncome) || 0;
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
      expenses: 0,
      expenseDescription: reasonForLoss.trim(),
      extraIncome: incomeVal,
      incomeDescription: '',
      isProfit: true,
      amount: netAmount,
      notes: notes.trim() || `${grainType} Income`
    });

    // Reset fields
    setWheatWeight('');
    setExtraIncome('');
    setReasonForLoss('');
    setNotes('');
    
    alert(t('hisabSaved'));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Sort daily logs by date descending & creation order
  const sortedHisabs = [...dailyHisabs].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.id - a.id;
  });

  // Separate Today's logs and Past logs
  const todayHisabs = sortedHisabs.filter(h => h.date === todayStr);
  const pastHisabs = sortedHisabs.filter(h => h.date !== todayStr);

  // Today totals
  const todayTotalWeight = todayHisabs.reduce((sum, h) => sum + h.wheatWeight, 0);
  const todayTotalRevenue = todayHisabs.reduce((sum, h) => sum + (h.isProfit ? h.amount : -h.amount), 0);

  // Calculate 7-day totals
  const nowTs = new Date().getTime();
  const sevenDaysAgoTs = nowTs - 7 * 24 * 60 * 60 * 1000;
  const last7DaysHisabs = dailyHisabs.filter(h => new Date(h.date).getTime() >= sevenDaysAgoTs);
  const net7DaysTotal = last7DaysHisabs.reduce((sum, h) => sum + (h.isProfit ? h.amount : -h.amount), 0);
  const display7DaysTotal = net7DaysTotal < 0 ? 0 : net7DaysTotal;

  const renderTable = (logs: DailyHisab[], isTodaySection: boolean = false) => {
    if (logs.length === 0) {
      return (
        <div className="py-10 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold space-y-1">
          <span className="text-3xl">📋</span>
          <p>{language === 'hi' ? 'कोई हिसाब दर्ज नहीं है' : 'No logs recorded'}</p>
        </div>
      );
    }

    return (
      <div className="w-full overflow-hidden">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-800/40">
              <th className="py-2 px-2 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight text-[9px] sm:text-[10px]">
                {isTodaySection ? (language === 'hi' ? 'एंट्री #' : 'Entry #') : (language === 'hi' ? 'दिनांक' : 'Date')}
              </th>
              <th className="py-2 px-2 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight text-[9px] sm:text-[10px]">{language === 'hi' ? 'अनाज/वजन' : 'Grain/Wt'}</th>
              <th className="py-2 px-2 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight text-[9px] sm:text-[10px]">{language === 'hi' ? 'कमाई' : 'Revenue'}</th>
              <th className="py-2 px-1 sm:px-2 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight text-[9px] sm:text-[10px]">{language === 'hi' ? 'आय' : 'Income'}</th>
              <th className="py-2 px-2 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight text-[9px] sm:text-[10px] text-right">{t('netResult')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-[11px] sm:text-sm">
            {logs.map((hisab, index) => {
              const dateObj = new Date(hisab.date);
              const formattedDate = dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                day: 'numeric',
                month: 'short'
              });
              const incVal = hisab.extraIncome || 0;
              const grainShort = hisab.grainType
                ? `${hisab.grainType.split(' ')[0]} ${hisab.wheatWeight}kg`
                : `${hisab.wheatWeight}kg`;

              return (
                <tr key={hisab.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all align-middle">
                  <td className="py-2.5 px-2 font-extrabold text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs whitespace-nowrap">
                    {isTodaySection ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black">
                        <span>#{logs.length - index}</span>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">({formattedDate})</span>
                      </span>
                    ) : (
                      formattedDate
                    )}
                  </td>
                  <td className="py-2.5 px-2 font-semibold text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs whitespace-nowrap">
                    {grainShort}
                  </td>
                  <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs whitespace-nowrap">
                    {hideAmounts ? '₹••' : `₹${hisab.revenue.toFixed(0)}`}
                  </td>
                  <td className="py-2.5 px-1 sm:px-2 font-semibold text-slate-600 dark:text-slate-400 text-[11px] sm:text-xs whitespace-nowrap">
                    {incVal > 0 ? (
                      <span className="text-emerald-600 font-bold" title={hisab.incomeDescription}>
                        {hideAmounts ? '+₹••' : `+₹${incVal.toFixed(0)}`}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right whitespace-nowrap">
                    <span className={`inline-flex items-center font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${
                      hisab.isProfit
                        ? 'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-650 dark:bg-rose-950/30 dark:text-rose-450'
                    }`}>
                      {hideAmounts ? '₹••' : `${hisab.isProfit ? '+' : '-'}₹${hisab.amount}`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-fit">

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
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
                onKeyDown={handleKeyDown}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold"
              />
              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                {language === 'hi' ? 'केवल पिछले 7 दिनों का हिसाब दर्ज कर सकते हैं' : 'Only last 7 days allowed'}
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
                onKeyDown={handleKeyDown}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            {/* Extra Income */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'hi' ? 'अतिरिक्त आय / INCOME (₹)' : 'EXTRA INCOME (₹)'}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="₹0"
                value={extraIncome}
                onChange={(e) => setExtraIncome(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            {/* Reason for Loss */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'hi' ? 'नुकसान का कारण (Reason for Loss)' : 'Reason for Loss'}
              </label>
              <input
                type="text"
                placeholder={language === 'hi' ? 'जैसे - बिजली बिल, खराबी, नुकसान...' : 'e.g. Electricity bill, repair, loss reason...'}
                value={reasonForLoss}
                onChange={(e) => setReasonForLoss(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100"
              />
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
              className="w-full h-12 text-white font-black rounded-xl text-base transition-all shadow-lg cursor-pointer bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 active:scale-98"
            >
              {t('saveHisab')}
            </button>
          </form>
        </div>

        {/* List Panel with Today vs Past Sectioning */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col min-h-[450px]">
          {/* Header & Filter Tabs */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-lg">
                  {language === 'hi' ? 'डेली हिसाब इतिहास' : 'Daily Logs History'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                  {language === 'hi' ? 'आज का हिसाब और पुराना इतिहास' : 'Today and past entries view'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block whitespace-nowrap">7-Day Net</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap inline-block mt-0.5">
                  {hideAmounts ? '₹••••' : `+ ₹${display7DaysTotal.toFixed(0)} Profit`}
                </span>
              </div>
            </div>

            {/* Tab Controls (Matching Screenshot 2 design) */}
            <div className="bg-slate-100/90 dark:bg-slate-800/60 p-1 rounded-full inline-flex items-center gap-1 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setActiveTab('today')}
                className={`px-4.5 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer font-extrabold text-xs sm:text-sm ${
                  activeTab === 'today'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 font-bold'
                }`}
              >
                <span>☀️</span>
                <span>{language === 'hi' ? 'आज का हिसाब' : "Today's Logs"}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black min-w-[20px] text-center ${
                  activeTab === 'today'
                    ? 'bg-emerald-400/40 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {todayHisabs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('past')}
                className={`px-4.5 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer font-extrabold text-xs sm:text-sm ${
                  activeTab === 'past'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 font-bold'
                }`}
              >
                <span>📅</span>
                <span>{language === 'hi' ? 'पुराना हिसाब' : 'Past Logs'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black min-w-[20px] text-center ${
                  activeTab === 'past'
                    ? 'bg-emerald-400/40 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {pastHisabs.length}
                </span>
              </button>
            </div>
          </div>

          <div className="flex-1 w-full space-y-6 overflow-hidden">
            {sortedHisabs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 text-sm font-semibold space-y-2">
                <span className="text-4xl">📊</span>
                <p>No daily summary logs recorded yet.</p>
              </div>
            ) : (
              <>
                {/* Today's Section when activeTab is 'today' */}
                {activeTab === 'today' && (
                  <div className="border border-emerald-200/60 dark:border-emerald-950/50 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-2xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-emerald-100 dark:border-emerald-950/40 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">☀️</span>
                        <h4 className="font-extrabold text-slate-850 dark:text-slate-100 text-base whitespace-nowrap">
                          {language === 'hi' ? 'आज का हिसाब' : "Today's Logs"}
                        </h4>
                        <span className="text-[11px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center shrink-0">
                          {todayHisabs.length} {language === 'hi' ? 'एंट्री' : 'entries'}
                        </span>
                      </div>
                      {todayHisabs.length > 0 && (
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-xl border border-emerald-100 dark:border-emerald-900/30 whitespace-nowrap">
                          {language === 'hi' ? 'आज का योग:' : 'Today:'}{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm ml-1">
                            {todayTotalWeight}kg ({hideAmounts ? '₹••' : `₹${todayTotalRevenue.toFixed(0)}`})
                          </span>
                        </div>
                      )}
                    </div>

                    {renderTable(todayHisabs, true)}
                  </div>
                )}

                {/* Past Section when activeTab is 'past' */}
                {activeTab === 'past' && (
                  <div className="border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 dark:border-slate-800/60 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">🗓️</span>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base whitespace-nowrap">
                          {language === 'hi' ? 'पुराना हिसाब (कल व पिछले दिन)' : 'Past Logs (Yesterday & Older)'}
                        </h4>
                        <span className="text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center shrink-0">
                          {pastHisabs.length} {language === 'hi' ? 'एंट्री' : 'entries'}
                        </span>
                      </div>
                    </div>

                    {renderTable(pastHisabs, false)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
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
