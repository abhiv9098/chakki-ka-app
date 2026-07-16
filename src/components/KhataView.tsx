'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SearchIcon, PlusIcon, CheckIcon, CloseIcon, WhatsAppIcon } from './Icons';
import { Customer } from '../types';

export const KhataView: React.FC = () => {
  const {
    customers,
    creditRecords,
    recordPayment,
    recordManualDue,
    t,
    language,
    hideAmounts
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBalanceOnly, setFilterBalanceOnly] = useState(true);

  // Active transaction modals
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [txType, setTxType] = useState<'DUE' | 'PAID'>('PAID');
  const [showTxModal, setShowTxModal] = useState(false);
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');

  // Filtering logic
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    const matchesBalance = filterBalanceOnly ? c.outstandingBalance > 0 : true;
    return matchesSearch && matchesBalance;
  });

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    if (txType === 'PAID') {
      recordPayment(activeCustomer.id, amount, notes.trim() || 'Khata Payment');
    } else {
      recordManualDue(activeCustomer.id, amount, notes.trim() || 'Manual Due Charge');
    }

    setAmountStr('');
    setNotes('');
    setShowTxModal(false);
    setActiveCustomer(null);
  };

  const openTxModal = (customer: Customer, type: 'DUE' | 'PAID') => {
    setActiveCustomer(customer);
    setTxType(type);
    setNotes(type === 'PAID' ? 'Cash payment received' : 'Manual product charge');
    setShowTxModal(true);
  };

  // Calculate sum of total outstanding credit
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Khata Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-amber-500/10 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-100">
              {t('totalOutstanding')}
            </h3>
            <p className="text-3xl md:text-4xl font-black tracking-tight">
              {hideAmounts ? '₹••••' : `₹${totalOutstanding.toFixed(2)}`}
            </p>
          </div>
          <p className="text-xs text-amber-50 font-medium opacity-90 mt-4 max-w-md relative z-10 leading-relaxed">
            This represents the total unpaid credit (Udhari) currently active in the market across all customer accounts.
          </p>
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-wide">
              Khata Filters
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Refine ledger records</p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setFilterBalanceOnly(!filterBalanceOnly)}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold border transition-all text-left flex justify-between items-center cursor-pointer ${
                filterBalanceOnly
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border-amber-500/20'
                  : 'bg-slate-50 dark:bg-slate-805/40 text-slate-550 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{t('filterOutstanding')}</span>
              <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 ${filterBalanceOnly ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-350 bg-white dark:bg-slate-800'}`}>
                {filterBalanceOnly && <CheckIcon size={12} />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
              {t('khataLedger')}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Customer-wise pending credits and logs</p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t('searchCustomer')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-10 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-colors text-slate-850 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Customer Balances List */}
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm font-semibold">
            📒 {t('noTransactionsYet')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl">
                  <th className="py-3 px-2 sm:px-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-xs">{t('name')}</th>
                  <th className="py-3 px-2 sm:px-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-xs hidden sm:table-cell">{t('phone')}</th>
                  <th className="py-3 px-2 sm:px-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-xs text-right">{t('outstanding')}</th>
                  <th className="py-3 px-2 sm:px-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-xs text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all align-middle">
                    <td className="py-3.5 px-2 sm:px-4 font-extrabold text-slate-800 dark:text-slate-105">{cust.name}</td>
                    <td className="py-3.5 px-2 sm:px-4 font-semibold text-slate-500 dark:text-slate-450 hidden sm:table-cell">{cust.phone}</td>
                    <td className="py-3.5 px-2 sm:px-4 text-right">
                      <span className={`inline-block font-black text-sm px-2 sm:px-2.5 py-1 rounded-xl ${
                        cust.outstandingBalance > 0
                          ? 'bg-amber-50 text-amber-655 dark:bg-amber-950/30 dark:text-amber-400'
                          : 'bg-emerald-50 text-emerald-655 dark:bg-emerald-950/30 dark:text-emerald-400'
                      }`}>
                        {hideAmounts ? '₹••••' : `₹${cust.outstandingBalance.toFixed(0)}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 sm:px-4">
                      <div className="flex flex-wrap sm:flex-nowrap gap-1.5 justify-center">
                        <button
                          onClick={() => openTxModal(cust, 'PAID')}
                          className="h-8 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                          {language === 'hi' ? 'जमा' : 'Receive'}
                        </button>
                        <button
                          onClick={() => openTxModal(cust, 'DUE')}
                          className="h-8 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/10 active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                          {language === 'hi' ? 'उधार' : 'Credit'}
                        </button>
                        {cust.outstandingBalance > 0 && cust.phone !== 'N/A' && (
                          <a
                            href={`https://api.whatsapp.com/send?phone=${cust.phone.replace(/\D/g, '').length === 10 ? `91${cust.phone.replace(/\D/g, '')}` : cust.phone.replace(/\D/g, '')}&text=${encodeURIComponent(
                              language === 'hi'
                                ? `नमस्ते ${cust.name},\nआटा चक्की पर आपका बकाया (Outstanding Credit) ₹${cust.outstandingBalance.toFixed(1)} है। कृपया इसे जल्द ही क्लियर करें। धन्यवाद! 🙏`
                                : `Hello ${cust.name},\nYour outstanding balance at Flour Mill is ₹${cust.outstandingBalance.toFixed(1)}. Please clear it at your earliest convenience. Thank you! 🙏`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl border border-emerald-500/10 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all"
                            title={t('sendReminder')}
                          >
                            <WhatsAppIcon size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showTxModal && activeCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100">
                  {txType === 'PAID' ? t('recordPaymentTitle') : t('recordDueTitle')}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">
                  Customer: {activeCustomer.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTxModal(false);
                  setActiveCustomer(null);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleTxSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('amount')} *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="₹ Amount"
                  className="w-full px-4.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('description')}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cash received"
                  className="w-full px-4.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className={`w-full py-3 text-white font-bold rounded-xl text-sm transition-all shadow-lg cursor-pointer ${
                  txType === 'PAID'
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10'
                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10'
                }`}
              >
                {t('save')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
