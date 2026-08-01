'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CloseIcon, GrindingIcon, TrashIcon } from './Icons';

interface GrindingKgModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GrindingKgModal: React.FC<GrindingKgModalProps> = ({ isOpen, onClose }) => {
  const { orders, dailyHisabs, language, deleteDailyHisab } = useApp();

  const grainLabels: Record<string, { hi: string; en: string }> = {
    'Wheat': { hi: 'गेहूं', en: 'Wheat' },
    'Atta': { hi: 'आटा', en: 'Atta' },
    'Maize': { hi: 'मक्का', en: 'Maize' },
    'Gram/Chana': { hi: 'चना', en: 'Gram' },
    'Rice': { hi: 'चावल', en: 'Rice' },
    'Barley': { hi: 'जौ', en: 'Barley' },
    'Bajra': { hi: 'बाजरा', en: 'Bajra' },
    'Multigrain': { hi: 'मल्टीग्रेन', en: 'Multigrain' },
    'Other': { hi: 'अन्य', en: 'Other' },
  };

  const todayStr = (() => {
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const thirtyDaysAgoStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const [filterMode, setFilterMode] = useState<'calendar' | 'last30'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  if (!isOpen) return null;

  const isHindi = language === 'hi';
  const thirtyDaysAgoTs = Date.now() - 30 * 24 * 60 * 60 * 1000;

  // Filter orders based on filterMode (constrained within last 30 days)
  const filteredOrders = orders.filter(o => {
    const oDate = new Date(o.createdAt);
    const yyyy = oDate.getFullYear();
    const mm = String(oDate.getMonth() + 1).padStart(2, '0');
    const dd = String(oDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (filterMode === 'calendar') return dateStr === selectedDate;
    return o.createdAt >= thirtyDaysAgoTs;
  });

  // Filter dailyHisabs based on filterMode
  const filteredHisabs = dailyHisabs.filter(h => {
    if (filterMode === 'calendar') return h.date === selectedDate;
    const hTs = new Date(h.date).getTime();
    return hTs >= thirtyDaysAgoTs;
  });

  const ordersKg = filteredOrders.reduce((sum, o) => sum + (o.weight || 0), 0);
  const hisabsKg = filteredHisabs.reduce((sum, h) => sum + (h.wheatWeight || 0), 0);
  const totalKg = ordersKg + hisabsKg;

  const ordersAmount = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const hisabsAmount = filteredHisabs.reduce((sum, h) => sum + (h.revenue || h.amount || 0), 0);
  const totalAmount = ordersAmount + hisabsAmount;

  // Combine entries for detailed customer & potli breakdown
  const combinedEntries = [
    ...filteredHisabs.map(h => ({
      id: `h-${h.id}`,
      rawId: h.id,
      type: 'hisab' as const,
      customerName: h.incomeDescription || h.notes || (isHindi ? 'ग्राहक (Daily Log)' : 'Customer (Daily Log)'),
      grainType: h.grainType || 'Wheat',
      weight: h.wheatWeight || 0,
      amount: h.revenue || h.amount || 0,
      date: h.date,
      paymentType: h.expenseDescription || 'CASH'
    })),
    ...filteredOrders.map(o => {
      const oDateStr = new Date(o.createdAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' });
      return {
        id: `o-${o.id}`,
        rawId: o.id,
        type: 'order' as const,
        customerName: o.customerName || (isHindi ? 'ग्राहक (Order)' : 'Customer (Order)'),
        grainType: o.grainType || 'Wheat',
        weight: o.weight || 0,
        amount: o.totalAmount || 0,
        date: oDateStr,
        paymentType: o.paymentType || 'CASH'
      };
    })
  ];

  // Grain-wise breakdown
  const grainMap: Record<string, number> = {};
  filteredOrders.forEach(o => {
    const g = o.grainType || 'Wheat';
    grainMap[g] = (grainMap[g] || 0) + (o.weight || 0);
  });
  filteredHisabs.forEach(h => {
    const g = h.grainType || 'Wheat';
    grainMap[g] = (grainMap[g] || 0) + (h.wheatWeight || 0);
  });
  const grainEntries = Object.entries(grainMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-slate-900 border-0 sm:border border-slate-100 dark:border-slate-800 rounded-none sm:rounded-3xl w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <GrindingIcon size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-lg tracking-tight">
                {isHindi ? 'पिसाई व पोटली हिसाब रिपोर्ट' : 'Grinding & Potli Volume Breakdown'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {isHindi ? '30 दिनों के भीतर तारीख चुनें और ग्राहक अनुसार पोटली व कुल पैसा देखें' : 'Select date within last 30 days to see customer & potli details'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Day / Date Selector Pills (Constrained to 30 days) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {isHindi ? 'तारीख चुनें (पिछले 30 दिनों के अंदर):' : 'Select Date (Within 30 Days):'}
              </label>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {isHindi ? '30 दिन की सीमा' : '30-day window'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-100/90 dark:bg-slate-800/60 p-1.5 rounded-2xl">
              {/* Calendar Date Option */}
              <div
                onClick={() => setFilterMode('calendar')}
                className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold text-xs ${
                  filterMode === 'calendar'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span>🗓️</span>
                <input
                  type="date"
                  min={thirtyDaysAgoStr}
                  max={todayStr}
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setFilterMode('calendar');
                    }
                  }}
                  className={`px-1 py-0.5 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
                    filterMode === 'calendar'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              {/* 30 Days Option */}
              <button
                type="button"
                onClick={() => setFilterMode('last30')}
                className={`px-3 py-1.5 rounded-xl transition-all font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                  filterMode === 'last30'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                📊 {isHindi ? 'पिछले 30 दिन (30 Days)' : 'Last 30 Days'}
              </button>
            </div>
          </div>

          {/* Total Weight Banner (Normal Layout) */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider block">
                {filterMode === 'calendar' ? (isHindi ? `तारीख (${selectedDate}) की कुल पिसाई` : `Date (${selectedDate}) Grinding`) : (isHindi ? '30 दिनों की कुल पिसाई' : '30 Days Total Grinding')}
              </span>
              <p className="text-4xl font-black mt-1 tracking-tight">
                {totalKg.toFixed(1)} <span className="text-xl font-bold">KG</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black shrink-0">
              🌾
            </div>
          </div>

          {/* Grain/Potli Breakdown Badges */}
          {grainEntries.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                {isHindi ? 'अनाज / पोटली वार वितरण' : 'Grain / Potli Breakdown'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {grainEntries.map(([gName, gKg]) => (
                  <div key={gName} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block truncate">
                        🌾 {grainLabels[gName]?.[isHindi ? 'hi' : 'en'] || gName}
                      </span>
                      <span className="text-sm font-black text-slate-850 dark:text-slate-100">
                        {gKg.toFixed(1)} kg
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      {((gKg / (totalKg || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer & Potli Detailed List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                {isHindi ? 'ग्राहक अनुसार पोटली व बना पैसा' : 'Customer, Potli & Earnings'}
              </h4>
              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                {combinedEntries.length} {isHindi ? 'ग्राहक एंट्री' : 'entries'}
              </span>
            </div>

            {combinedEntries.length === 0 ? (
              <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400">
                  {isHindi ? 'चुनी गई तारीख (पिछले 30 दिनों) में कोई पिसाई रिकॉर्ड नहीं है।' : 'No grinding entries found for this date.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 pb-2">
                {combinedEntries.map((item) => {
                  const displayName = (item.customerName && !item.customerName.includes('Log') && item.customerName !== '5')
                    ? item.customerName
                    : (isHindi ? 'पिसाई ग्राहक' : 'Grinding Customer');

                  return (
                    <div key={item.id} className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
                          👤
                        </div>
                        <div>
                          <h5 className="font-black text-slate-850 dark:text-slate-100 text-sm">
                            {displayName}
                          </h5>
                          <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">🌾 {isHindi ? 'पोटली:' : 'Potli:'} {grainLabels[item.grainType]?.[isHindi ? 'hi' : 'en'] || item.grainType}</span>
                            <span>•</span>
                            <span>{item.date}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                            {item.weight} KG
                          </span>
                          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block">
                            ₹{item.amount.toFixed(0)}
                          </span>
                        </div>

                        {item.type === 'hisab' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(isHindi ? 'क्या आप इस पिसाई हिसाब एंट्री को मिटाना चाहते हैं?' : 'Are you sure you want to delete this grinding log?')) {
                                deleteDailyHisab(item.rawId);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                            title={isHindi ? 'हिसाब मिटाएं' : 'Delete Log'}
                          >
                            <TrashIcon size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
