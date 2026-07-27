'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CloseIcon, TrashIcon, LossIcon, PlusIcon } from './Icons';

interface ExpenseLossModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseLossModal: React.FC<ExpenseLossModalProps> = ({ isOpen, onClose }) => {
  const { dailyHisabs, addDailyHisab, deleteDailyHisab, language, hideAmounts } = useApp();

  // Today's date string YYYY-MM-DD
  const todayStr = (() => {
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const [date, setDate] = useState<string>(todayStr);
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [filterType, setFilterType] = useState<'today' | 'all'>('today');

  if (!isOpen) return null;

  // Filter all daily hisabs that contain expenses or loss
  const expenseHisabs = dailyHisabs.filter(
    h => (h.expenses > 0 || !h.isProfit || (h.expenseDescription && h.expenseDescription.trim().length > 0))
  );

  // Today's expenses list
  const todayExpenseList = expenseHisabs.filter(h => h.date === todayStr);

  // Today's total expense/loss amount
  const todayTotalLoss = todayExpenseList.reduce((sum, h) => {
    const itemLoss = h.expenses > 0 ? h.expenses : (!h.isProfit ? h.amount : 0);
    return sum + itemLoss;
  }, 0);

  // All time total expense
  const allTotalLoss = expenseHisabs.reduce((sum, h) => {
    const itemLoss = h.expenses > 0 ? h.expenses : (!h.isProfit ? h.amount : 0);
    return sum + itemLoss;
  }, 0);

  const displayedList = filterType === 'today' ? todayExpenseList : expenseHisabs;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      alert(language === 'hi' ? 'कृपया खर्च या नुकसान की सही राशि लिखें!' : 'Please enter a valid expense amount!');
      return;
    }

    const descText = description.trim() || (language === 'hi' ? 'दैनिक खर्च/नुकसान' : 'Daily Expense/Loss');

    addDailyHisab({
      date,
      wheatWeight: 0,
      rate: 0,
      revenue: 0,
      expenses: amt,
      expenseDescription: descText,
      isProfit: false,
      amount: amt,
      notes: descText
    });

    setExpenseAmount('');
    setDescription('');
    alert(language === 'hi' ? 'खर्च / नुकसान सफलतापूर्वक दर्ज किया गया!' : 'Expense / Loss logged successfully!');
  };

  const isHindi = language === 'hi';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 transition-opacity duration-300">
      {/* Modal Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-rose-100 dark:border-rose-950/40 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-500/20">
              <LossIcon size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                {isHindi ? 'खर्च एवं नुकसान खाता (Expense & Loss Log)' : "Today's Expense & Loss"}
              </h2>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                {isHindi ? 'दुकान के रोजाना खर्च और नुकसान का रिकॉर्ड' : 'Track daily expenses & losses'}
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

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Summary Box */}
          <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-2xl p-4 shadow-lg shadow-rose-500/15 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-100">
                {isHindi ? 'आज का कुल खर्च / नुकसान' : "Today's Total Expense/Loss"}
              </span>
              <p className="text-2xl sm:text-3xl font-black mt-0.5 tracking-tight">
                {hideAmounts ? '₹••••' : `₹${todayTotalLoss.toFixed(0)}`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-rose-200 block uppercase">
                {isHindi ? 'कुल रिकॉर्ड्स' : 'Total Entries'}
              </span>
              <p className="text-lg font-extrabold mt-0.5 bg-white/20 px-3 py-0.5 rounded-full inline-block">
                {todayExpenseList.length}
              </p>
            </div>
          </div>

          {/* Form to Log New Expense / Loss */}
          <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>➕</span> {isHindi ? 'नया खर्च या नुकसान दर्ज करें' : 'Add New Expense or Loss'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {isHindi ? 'राशि (₹)' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {isHindi ? 'तारीख' : 'Date'}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                {isHindi ? 'खर्च / नुकसान का विवरण (वजह)' : 'Reason / Expense Description'}
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={isHindi ? 'जैसे: बिजली बिल, मशीन ग्रीसिंग, डीजल आदि' : 'e.g. Electricity bill, machine repair'}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
              <PlusIcon size={16} />
              <span>{isHindi ? 'खर्च दर्ज करें (Save Expense)' : 'Save Expense / Loss'}</span>
            </button>
          </form>

          {/* Filter & List Header */}
          <div className="flex items-center justify-between pt-1">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              {isHindi ? 'दर्ज खर्चों का विवरण' : 'Expense & Loss History'}
            </h4>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setFilterType('today')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${filterType === 'today' ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500'}`}
              >
                {isHindi ? 'आज का' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${filterType === 'all' ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500'}`}
              >
                {isHindi ? 'सभी (All)' : 'All Time'} ({allTotalLoss ? `₹${allTotalLoss}` : '₹0'})
              </button>
            </div>
          </div>

          {/* Expenses List */}
          {displayedList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              🔻 {isHindi ? 'कोई खर्च या नुकसान दर्ज नहीं है।' : 'No expense or loss recorded yet.'}
            </div>
          ) : (
            <div className="space-y-2">
              {displayedList.map(item => {
                const itemAmount = item.expenses > 0 ? item.expenses : (!item.isProfit ? item.amount : 0);
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-extrabold text-xs flex items-center justify-center border border-rose-200/50 dark:border-rose-900/40">
                        🔻
                      </div>
                      <div>
                        <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                          {item.expenseDescription || item.notes || (isHindi ? 'खर्च / नुकसान' : 'Expense / Loss')}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          📅 {item.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                        {hideAmounts ? '₹••••' : `-₹${itemAmount}`}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm(isHindi ? 'क्या आप इस खर्च रिकॉर्ड को हटाना चाहते हैं?' : 'Delete this expense entry?')) {
                            deleteDailyHisab(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title={isHindi ? 'हटाएं' : 'Delete'}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {isHindi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
