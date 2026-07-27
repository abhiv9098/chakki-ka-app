'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CloseIcon, TrashIcon, LossIcon, ChevronRightIcon } from './Icons';
import { DailyHisab } from '../types';

interface ExpenseLossModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseLossModal: React.FC<ExpenseLossModalProps> = ({ isOpen, onClose }) => {
  const { dailyHisabs, deleteDailyHisab, language, hideAmounts } = useApp();

  // Today's date YYYY-MM-DD
  const todayStr = (() => {
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!isOpen) return null;

  const isHindi = language === 'hi';

  // Filter dailyHisabs where there is loss or expense recorded
  const allLossRecords = dailyHisabs.filter(
    h => (h.expenses > 0 || !h.isProfit || (h.expenseDescription && h.expenseDescription.trim().length > 0))
  );

  // Today's loss records
  const todayLossRecords = allLossRecords.filter(h => h.date === todayStr);

  // Today's total loss amount
  const todayTotalLossAmount = todayLossRecords.reduce((sum, h) => {
    const lossVal = h.expenses > 0 ? h.expenses : (!h.isProfit ? h.amount : 0);
    return sum + lossVal;
  }, 0);

  // All time total loss amount
  const allTotalLossAmount = allLossRecords.reduce((sum, h) => {
    const lossVal = h.expenses > 0 ? h.expenses : (!h.isProfit ? h.amount : 0);
    return sum + lossVal;
  }, 0);

  const displayedRecords = activeTab === 'today' ? todayLossRecords : allLossRecords;

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 transition-opacity duration-300">
      {/* Modal Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100 dark:border-rose-950/40 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-md shadow-rose-500/20">
              <LossIcon size={22} />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-slate-100">
                {isHindi ? 'नुकसान एवं खर्च विवरण' : 'Loss & Expense Details'}
              </h2>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                {isHindi ? 'किस दिन कितना और क्यों नुकसान हुआ' : 'View loss amounts and reasons'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Main Loss Summary Card */}
          <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-rose-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-100 block">
                {activeTab === 'today'
                  ? (isHindi ? 'आज का कुल नुकसान / खर्च' : "Today's Total Loss")
                  : (isHindi ? 'कुल दर्ज नुकसान (All Time Loss)' : 'All Time Total Loss')}
              </span>
              <p className="text-3xl sm:text-4xl font-black mt-1 tracking-tight">
                {hideAmounts ? '₹••••' : `₹${(activeTab === 'today' ? todayTotalLossAmount : allTotalLossAmount).toFixed(0)}`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-rose-200 block uppercase">
                {isHindi ? 'नुकसान रिकॉर्ड्स' : 'Loss Entries'}
              </span>
              <p className="text-xl font-black mt-1 bg-white/20 px-3 py-1 rounded-xl inline-block">
                {displayedRecords.length}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl text-xs font-extrabold border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/50 dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              📅 {isHindi ? 'आज का नुकसान' : "Today's Loss"} ({todayLossRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/50 dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              📜 {isHindi ? 'पिछला सारा नुकसान (History)' : 'Loss History'} ({allLossRecords.length})
            </button>
          </div>

          {/* Loss Details List */}
          {displayedRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-2xl block">✅</span>
              <p className="font-extrabold text-slate-600 dark:text-slate-300">
                {activeTab === 'today'
                  ? (isHindi ? 'आज कोई नुकसान या खर्च दर्ज नहीं हुआ है।' : 'No loss or expense recorded today.')
                  : (isHindi ? 'अभी तक कोई नुकसान रिकॉर्ड नहीं मिला।' : 'No loss history found.')}
              </p>
              <p className="text-[10px] text-slate-400">
                {isHindi ? 'रोजाना हिसाब (Daily Hisab) से खर्च व नुकसान की एंट्री दर्ज होती है।' : 'Losses are logged via Daily Hisab.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {isHindi ? 'तारीख एवं नुकसान का कारण' : 'Date & Reason for Loss'}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {isHindi ? 'विवरण देखने के लिए क्लिक करें' : 'Click card to expand'}
                </span>
              </div>

              {displayedRecords.map(item => {
                const lossVal = item.expenses > 0 ? item.expenses : (!item.isProfit ? item.amount : 0);
                const reasonText = item.expenseDescription || item.notes || (isHindi ? 'खर्च / नुकसान' : 'Expense / Loss Reason Not Specified');
                const isExpanded = expandedId === item.id;

                const formattedDate = new Date(item.date).toLocaleDateString(
                  isHindi ? 'hi-IN' : 'en-IN',
                  { day: 'numeric', month: 'short', year: 'numeric' }
                );

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-rose-300 dark:hover:border-rose-900"
                  >
                    {/* Card Header (Clickable) */}
                    <div
                      onClick={() => toggleExpand(item.id)}
                      className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-black text-xs flex items-center justify-center border border-rose-200/60 dark:border-rose-900/40 shrink-0">
                          🔻
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                              📅 {formattedDate}
                            </span>
                            {item.date === todayStr && (
                              <span className="text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-1.5 py-0.5 rounded-md uppercase">
                                {isHindi ? 'आज' : 'Today'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                            {reasonText}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">
                            {isHindi ? 'नुकसान' : 'Loss'}
                          </span>
                          <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                            {hideAmounts ? '₹••••' : `-₹${lossVal.toFixed(0)}`}
                          </span>
                        </div>
                        <div className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-rose-500' : ''}`}>
                          <ChevronRightIcon size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detailed Breakdown */}
                    {isExpanded && (
                      <div className="px-4 py-3 bg-rose-50/40 dark:bg-rose-950/20 border-t border-rose-100/80 dark:border-slate-800 text-xs space-y-2.5 animate-fade-in">
                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-slate-800">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              {isHindi ? 'नुकसान की वजह / कारण:' : 'Reason for Loss:'}
                            </span>
                            <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 text-xs">
                              {reasonText}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              {isHindi ? 'कुल नुकसान राशि:' : 'Exact Loss Amount:'}
                            </span>
                            <p className="font-black text-rose-600 dark:text-rose-400 text-sm mt-0.5">
                              -₹{lossVal.toFixed(0)}
                            </p>
                          </div>
                        </div>

                        {item.notes && item.notes !== reasonText && (
                          <div className="text-slate-600 dark:text-slate-400 text-[11px] font-medium bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <strong>{isHindi ? 'अतिरिक्त नोट:' : 'Note:'}</strong> {item.notes}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            ID: #{item.id} • {item.date}
                          </span>
                          <button
                            onClick={() => {
                              if (window.confirm(isHindi ? 'क्या आप इस नुकसान रिकॉर्ड को हटाना चाहते हैं?' : 'Delete this loss entry?')) {
                                deleteDailyHisab(item.id);
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <TrashIcon size={12} />
                            <span>{isHindi ? 'हटाएं' : 'Delete Record'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-xs">
          <span className="text-slate-400 text-[11px] font-medium">
            💡 {isHindi ? 'कार्ड पर क्लिक करके विस्तार से विवरण देखें' : 'Click any date card to see full reason'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {isHindi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
