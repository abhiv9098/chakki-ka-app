'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CloseIcon, TrashIcon } from './Icons';
import { DailyHisab } from '../types';

interface PaymentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentSummaryModal: React.FC<PaymentSummaryModalProps> = ({ isOpen, onClose }) => {
  const { orders, dailyHisabs, creditRecords, customers, language, hideAmounts, updateDailyHisab, deleteDailyHisab, updateCustomerPotaliStatus, cycleCustomerPotaliStatus } = useApp();

  const [activeTab, setActiveTab] = useState<'CASH' | 'PAYTM' | 'UDHAR'>('CASH');
  const [selectedHisabForPayment, setSelectedHisabForPayment] = useState<DailyHisab | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>('');
  const [newPaymentMode, setNewPaymentMode] = useState<'CASH' | 'PAYTM'>('CASH');

  if (!isOpen) return null;

  const isHindi = language === 'hi';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const todayStr = (() => {
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const startOfToday = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  })();

  // Helper to parse Jama and Udhar details from a DailyHisab entry
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

    return { jama: 0, udhar: total, isUdhar: true, mode: 'UDHAR' };
  };

  // 1. CASH TRANSACTIONS
  const todayCashOrders = orders.filter(
    o => o.createdAt >= startOfToday && (o.paymentType === 'CASH' || !o.paymentType)
  );
  const todayCashHisabs = dailyHisabs.filter(
    h => h.date === todayStr && (h.expenseDescription === 'CASH' || !h.expenseDescription)
  );
  const todayPaidCreditRecords = creditRecords.filter(
    r => r.createdAt >= startOfToday && r.type === 'PAID'
  );

  const totalCashOrders = todayCashOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCashHisabs = todayCashHisabs.reduce((sum, h) => sum + (h.revenue || h.amount || 0), 0);
  const totalPaidCredits = todayPaidCreditRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalCashToday = totalCashOrders + totalCashHisabs + totalPaidCredits;

  // 2. PAYTM TRANSACTIONS
  const todayPaytmOrders = orders.filter(
    o => o.createdAt >= startOfToday && (o.paymentType === 'ONLINE' || o.paymentType === 'PAYTM')
  );
  const todayPaytmHisabs = dailyHisabs.filter(
    h => h.date === todayStr && h.expenseDescription === 'PAYTM'
  );

  const totalPaytmOrders = todayPaytmOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaytmHisabs = todayPaytmHisabs.reduce((sum, h) => sum + (h.revenue || h.amount || 0), 0);
  const totalPaytmToday = totalPaytmOrders + totalPaytmHisabs;

  // 3. UDHAR (CREDIT & JAMA) TRANSACTIONS
  const udharHisabsList = dailyHisabs.filter(h => getUdharDetails(h).isUdhar);

  const todayUdharOrders = orders.filter(
    o => o.createdAt >= startOfToday && o.paymentType === 'CREDIT'
  );
  const todayUdharHisabs = dailyHisabs.filter(
    h => h.date === todayStr && getUdharDetails(h).isUdhar
  );
  const todayCreditAddedRecords = creditRecords.filter(
    r => r.createdAt >= startOfToday && r.type === 'DUE'
  );

  const totalUdharOrders = todayUdharOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalUdharHisabs = todayUdharHisabs.reduce((sum, h) => sum + getUdharDetails(h).udhar, 0);
  const totalUdharAdded = todayCreditAddedRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalUdharToday = totalUdharOrders + totalUdharHisabs + totalUdharAdded;

  // Total Outstanding across all customers + daily hisabs
  const totalCustomerOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const totalHisabsUdharOutstanding = udharHisabsList.reduce((sum, h) => sum + getUdharDetails(h).udhar, 0);
  const grandTotalUdharOutstanding = totalCustomerOutstanding + totalHisabsUdharOutstanding;

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
      alert(isHindi ? 'कृपया सही जमा राशि दर्ज करें!' : 'Please enter a valid payment amount!');
      return;
    }

    if (addAmt > details.udhar) {
      alert(
        isHindi
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
      isHindi
        ? `₹${addAmt} सफलता पूर्वक जमा किया गया! ${remainingUdhar > 0 ? `बाकी उधार: ₹${remainingUdhar}` : 'उधार पूरा चुकता हो गया!'}`
        : `₹${addAmt} successfully recorded! ${remainingUdhar > 0 ? `Remaining Udhar: ₹${remainingUdhar}` : 'Fully paid!'}`
    );
  };

  // Handle adding more udhar to an existing record
  const handleAddUdhar = (h: DailyHisab) => {
    const amountStr = window.prompt(isHindi ? 'कितना उधार और जोड़ना है?' : 'How much more udhar to add?');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert(isHindi ? 'कृपया सही राशि दर्ज करें!' : 'Please enter a valid amount!');
      return;
    }

    const udharInfo = getUdharDetails(h);
    const newUdhar = udharInfo.udhar + amount;
    const newTotalAmount = h.amount + amount;
    
    const updatedHisab: DailyHisab = {
      ...h,
      amount: newTotalAmount,
      expenseDescription: `UDHAR (Jama: ₹${udharInfo.jama.toFixed(0)}, Udhar: ₹${newUdhar.toFixed(0)})`
    };

    updateDailyHisab(updatedHisab);
    alert(isHindi ? `₹${amount} का उधार सफलतापूर्वक जोड़ा गया!` : `₹${amount} udhar added successfully!`);
  };

  // Handle adding more amount to an existing Cash/Paytm record
  const handleAddAmount = (h: DailyHisab, mode: 'CASH' | 'PAYTM') => {
    const amountStr = window.prompt(isHindi ? `कितना ${mode === 'CASH' ? 'कैश' : 'Paytm'} और जोड़ना है?` : `How much more ${mode.toLowerCase()} to add?`);
    if (!amountStr) return;
    const addedAmount = parseFloat(amountStr);
    if (isNaN(addedAmount) || addedAmount <= 0) {
      alert(isHindi ? 'कृपया सही राशि दर्ज करें!' : 'Please enter a valid amount!');
      return;
    }

    const currentAmount = h.revenue || h.amount || 0;
    const newTotalAmount = currentAmount + addedAmount;
    
    const updatedHisab: DailyHisab = {
      ...h,
      amount: newTotalAmount,
      revenue: newTotalAmount
    };

    updateDailyHisab(updatedHisab);
    alert(isHindi ? `₹${addedAmount} सफलतापूर्वक जोड़ा गया!` : `₹${addedAmount} added successfully!`);
  };

  const handleDeleteHisab = (id: number) => {
    if (window.confirm(isHindi ? 'क्या आप इस हिसाब एंट्री को मिटाना चाहते हैं?' : 'Are you sure you want to delete this log?')) {
      deleteDailyHisab(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-slate-900 border-0 sm:border border-slate-100 dark:border-slate-800 rounded-none sm:rounded-3xl w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              💰
            </div>
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-lg tracking-tight">
                {isHindi ? 'भुगतान विवरण (Payment Ledger)' : 'Payment Collection Ledger'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {isHindi ? 'कैश, Paytm और उधार जमा का संपूर्ण विवरण' : "Cash, Paytm, and Udhar payments breakdown"}
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
          {/* 3 Main Tabs: CASH | PAYTM | UDHAR */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100/90 dark:bg-slate-800/60 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('CASH')}
              className={`py-2.5 px-2 rounded-xl transition-all font-extrabold text-xs sm:text-sm cursor-pointer flex flex-col items-center justify-center gap-1 ${
                activeTab === 'CASH'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>💵</span>
                <span>{isHindi ? 'कैश (Cash)' : 'Cash'}</span>
              </div>
              <span className="text-[11px] font-black opacity-90">
                {hideAmounts ? '₹••' : `₹${totalCashToday.toFixed(0)}`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PAYTM')}
              className={`py-2.5 px-2 rounded-xl transition-all font-extrabold text-xs sm:text-sm cursor-pointer flex flex-col items-center justify-center gap-1 ${
                activeTab === 'PAYTM'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>📲</span>
                <span>Paytm</span>
              </div>
              <span className="text-[11px] font-black opacity-90">
                {hideAmounts ? '₹••' : `₹${totalPaytmToday.toFixed(0)}`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('UDHAR')}
              className={`py-2.5 px-2 rounded-xl transition-all font-extrabold text-xs sm:text-sm cursor-pointer flex flex-col items-center justify-center gap-1 ${
                activeTab === 'UDHAR'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>📝</span>
                <span>{isHindi ? 'उधार (Udhar)' : 'Udhar'}</span>
              </div>
              <span className="text-[11px] font-black opacity-90">
                {hideAmounts ? '₹••' : `₹${grandTotalUdharOutstanding.toFixed(0)}`}
              </span>
            </button>
          </div>

          {/* TAB 1: CASH DETAILS */}
          {activeTab === 'CASH' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider block">
                    {isHindi ? 'आज का कुल आया कैश' : 'Today Cash Received'}
                  </span>
                  <p className="text-4xl font-black mt-1 tracking-tight">
                    {hideAmounts ? '₹••••' : `₹${totalCashToday.toFixed(0)}`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black shrink-0">
                  💵
                </div>
              </div>

              {/* Cash Transactions List */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  {isHindi ? 'कैश भुगतान सूची' : 'Cash Payments List'}
                </h4>

                {todayCashOrders.length === 0 && todayCashHisabs.length === 0 && todayPaidCreditRecords.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic py-6 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    {isHindi ? 'आज कोई कैश एंट्री नहीं पाई गई।' : 'No cash transactions today.'}
                  </p>
                ) : (
                  <div className="space-y-2 pb-2">
                    {todayPaidCreditRecords.map(r => {
                      const cust = customers.find(c => c.id === r.customerId);
                      const potaliStatus = cust?.potaliStatus || 'none';

                      return (
                        <div key={`c-${r.id}`} className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900 rounded-2xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                              ✓
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-black text-slate-850 dark:text-slate-100 text-sm">
                                  {cust?.name || r.description || (isHindi ? 'ग्राहक' : 'Customer')}
                                </h5>
                                {potaliStatus === 'received' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-xs">
                                    🔴 {isHindi ? 'पोटली जमा' : 'Potali Received'}
                                  </span>
                                )}
                                {potaliStatus === 'delivered' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                                    🟢 {isHindi ? 'पोटली दे दी' : 'Potali Delivered'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                                {isHindi ? 'उधार जमा कैश' : 'Udhar Paid Cash'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                              +₹{r.amount}
                            </span>
                            {cust && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStatus = potaliStatus === 'received' ? 'delivered' : 'received';
                                  updateCustomerPotaliStatus(cust.id, nextStatus);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1 shrink-0 ${
                                  potaliStatus === 'received'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                                    : potaliStatus === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                }`}
                                title="Potali Delivered Button: Click to mark potali as given to customer"
                              >
                                ✔ {potaliStatus === 'delivered' ? (isHindi ? 'दे दी' : 'Delivered') : (isHindi ? 'पोटली दी' : 'Potali Di')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {todayCashHisabs.map(h => {
                      const realName = (h.incomeDescription && !h.incomeDescription.includes('Log') && h.incomeDescription !== '5')
                        ? h.incomeDescription
                        : (h.notes && !h.notes.includes('Log') && h.notes !== '5')
                          ? h.notes
                          : '';
                      const displayName = realName || (isHindi ? 'नकद ग्राहक' : 'Cash Customer');
                      const cust = customers.find(c => c.name.toLowerCase() === displayName.toLowerCase());
                      const potaliStatus = cust?.potaliStatus || 'none';

                      return (
                        <div key={`h-${h.id}`} className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                              📋
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5
                                  onClick={() => {
                                    const input = window.prompt(
                                      isHindi ? 'ग्राहक का नाम दर्ज करें (Enter Customer Name):' : 'Enter Customer Name:',
                                      realName
                                    );
                                    if (input !== null && input.trim()) {
                                      updateDailyHisab({
                                        ...h,
                                        incomeDescription: input.trim(),
                                        notes: input.trim()
                                      });
                                    }
                                  }}
                                  className="font-black text-slate-850 dark:text-slate-100 text-sm hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer flex items-center gap-1 group"
                                  title={isHindi ? 'ग्राहक का नाम दर्ज करने के लिए क्लिक करें' : 'Click to edit customer name'}
                                >
                                  <span>{displayName}</span>
                                  <span className="text-[10px] text-slate-400 opacity-60 group-hover:opacity-100">✏️</span>
                                </h5>
                                {potaliStatus === 'received' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-xs">
                                    🔴 {isHindi ? 'पोटली जमा' : 'Potali Received'}
                                  </span>
                                )}
                                {potaliStatus === 'delivered' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                                    🟢 {isHindi ? 'पोटली दे दी' : 'Potali Delivered'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                                {h.grainType} ({h.wheatWeight} kg)
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-slate-100 text-base">
                              ₹{(h.revenue || h.amount || 0).toFixed(0)}
                            </span>
                            {cust && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStatus = potaliStatus === 'received' ? 'delivered' : 'received';
                                  updateCustomerPotaliStatus(cust.id, nextStatus);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1 shrink-0 ${
                                  potaliStatus === 'received'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                                    : potaliStatus === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                }`}
                                title="Potali Delivered Button: Click to mark potali as given to customer"
                              >
                                ✔ {potaliStatus === 'delivered' ? (isHindi ? 'दे दी' : 'Delivered') : (isHindi ? 'पोटली दी' : 'Potali Di')}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteHisab(h.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                              title={isHindi ? 'हिसाब मिटाएं' : 'Delete Log'}
                            >
                              <TrashIcon size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {todayCashOrders.map(o => {
                      const cust = customers.find(c => c.id === o.customerId);
                      const potaliStatus = cust?.potaliStatus || o.potaliStatus || 'none';

                      return (
                        <div key={`o-${o.id}`} className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                              🌾
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-black text-slate-850 dark:text-slate-100 text-sm">
                                  {o.customerName || (isHindi ? 'नकद ग्राहक' : 'Cash Customer')}
                                </h5>
                                {potaliStatus === 'received' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-xs">
                                    🔴 {isHindi ? 'पोटली जमा' : 'Potali Received'}
                                  </span>
                                )}
                                {potaliStatus === 'delivered' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                                    🟢 {isHindi ? 'पोटली दे दी' : 'Potali Delivered'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                                {o.grainType} ({o.weight} kg)
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-slate-100 text-base">
                              ₹{o.totalAmount}
                            </span>
                            {cust && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStatus = potaliStatus === 'received' ? 'delivered' : 'received';
                                  updateCustomerPotaliStatus(cust.id, nextStatus);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1 shrink-0 ${
                                  potaliStatus === 'received'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                                    : potaliStatus === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                }`}
                                title="Potali Delivered Button: Click to mark potali as given to customer"
                              >
                                ✔ {potaliStatus === 'delivered' ? (isHindi ? 'दे दी' : 'Delivered') : (isHindi ? 'पोटली दी' : 'Potali Di')}
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
          )}

          {/* TAB 2: PAYTM DETAILS */}
          {activeTab === 'PAYTM' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider block">
                    {isHindi ? 'आज Paytm ऑनलाइन कमाई' : "Today's Paytm Earnings"}
                  </span>
                  <p className="text-4xl font-black mt-1 tracking-tight">
                    {hideAmounts ? '₹••••' : `₹${totalPaytmToday.toFixed(0)}`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black shrink-0">
                  📲
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  {isHindi ? 'Paytm ऑनलाइन भुगतान सूची' : 'Paytm Payments List'}
                </h4>

                {todayPaytmOrders.length === 0 && todayPaytmHisabs.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic py-6 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    {isHindi ? 'आज Paytm से कोई भुगतान नहीं प्राप्त हुआ है।' : 'No Paytm payments received today.'}
                  </p>
                ) : (
                  <div className="space-y-2 pb-2">
                    {todayPaytmHisabs.map(h => {
                      const realName = (h.incomeDescription && !h.incomeDescription.includes('Log') && h.incomeDescription !== '5')
                        ? h.incomeDescription
                        : (h.notes && !h.notes.includes('Log') && h.notes !== '5')
                          ? h.notes
                          : '';
                      const displayName = realName || (isHindi ? 'Paytm ग्राहक' : 'Paytm Customer');
                      const cust = customers.find(c => c.name.toLowerCase() === displayName.toLowerCase());
                      const potaliStatus = cust?.potaliStatus || 'none';

                      return (
                        <div key={`h-${h.id}`} className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900 rounded-2xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              📲
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5
                                  onClick={() => {
                                    const input = window.prompt(
                                      isHindi ? 'ग्राहक का नाम दर्ज करें (Enter Customer Name):' : 'Enter Customer Name:',
                                      realName
                                    );
                                    if (input !== null && input.trim()) {
                                      updateDailyHisab({
                                        ...h,
                                        incomeDescription: input.trim(),
                                        notes: input.trim()
                                      });
                                    }
                                  }}
                                  className="font-black text-slate-850 dark:text-slate-100 text-sm hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer flex items-center gap-1 group"
                                  title={isHindi ? 'ग्राहक का नाम दर्ज करने के लिए क्लिक करें' : 'Click to edit customer name'}
                                >
                                  <span>{displayName}</span>
                                  <span className="text-[10px] text-blue-400 opacity-60 group-hover:opacity-100">✏️</span>
                                </h5>
                                {potaliStatus === 'received' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-xs">
                                    🔴 {isHindi ? 'पोटली जमा' : 'Potali Received'}
                                  </span>
                                )}
                                {potaliStatus === 'delivered' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                                    🟢 {isHindi ? 'पोटली दे दी' : 'Potali Delivered'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                                Paytm ({h.grainType})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-blue-600 dark:text-blue-400 text-base">
                              ₹{(h.revenue || h.amount || 0).toFixed(0)}
                            </span>
                            {cust && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStatus = potaliStatus === 'received' ? 'delivered' : 'received';
                                  updateCustomerPotaliStatus(cust.id, nextStatus);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1 shrink-0 ${
                                  potaliStatus === 'received'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                                    : potaliStatus === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                }`}
                                title="Potali Delivered Button: Click to mark potali as given to customer"
                              >
                                ✔ {potaliStatus === 'delivered' ? (isHindi ? 'दे दी' : 'Delivered') : (isHindi ? 'पोटली दी' : 'Potali Di')}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteHisab(h.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                              title={isHindi ? 'हिसाब मिटाएं' : 'Delete Log'}
                            >
                              <TrashIcon size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {todayPaytmOrders.map(o => {
                      const cust = customers.find(c => c.id === o.customerId);
                      const potaliStatus = cust?.potaliStatus || o.potaliStatus || 'none';

                      return (
                        <div key={`o-${o.id}`} className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900 rounded-2xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              📲
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-black text-slate-850 dark:text-slate-100 text-sm">
                                  {o.customerName || (isHindi ? 'Paytm ग्राहक' : 'Paytm Customer')}
                                </h5>
                                {potaliStatus === 'received' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-xs">
                                    🔴 {isHindi ? 'पोटली जमा' : 'Potali Received'}
                                  </span>
                                )}
                                {potaliStatus === 'delivered' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                                    🟢 {isHindi ? 'पोटली दे दी' : 'Potali Delivered'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                                Paytm ({o.grainType})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-blue-600 dark:text-blue-400 text-base">
                              ₹{o.totalAmount}
                            </span>
                            {cust && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStatus = potaliStatus === 'received' ? 'delivered' : 'received';
                                  updateCustomerPotaliStatus(cust.id, nextStatus);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1 shrink-0 ${
                                  potaliStatus === 'received'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                                    : potaliStatus === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                }`}
                                title="Potali Delivered Button: Click to mark potali as given to customer"
                              >
                                ✔ {potaliStatus === 'delivered' ? (isHindi ? 'दे दी' : 'Delivered') : (isHindi ? 'पोटली दी' : 'Potali Di')}
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
          )}

          {/* TAB 3: UDHAR (CREDIT & JAMA) HISTORY LEDGER */}
          {activeTab === 'UDHAR' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-lg shadow-amber-500/20 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider block">
                    {isHindi ? 'आज का नया उधार' : "Today's New Udhar"}
                  </span>
                  <p className="text-3xl font-black mt-1 tracking-tight">
                    {hideAmounts ? '₹••••' : `₹${totalUdharToday.toFixed(0)}`}
                  </p>
                </div>
                <div className="border-l border-white/20 pl-4">
                  <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider block">
                    {isHindi ? 'कुल बाकी उधार (Total Due)' : 'Total Outstanding'}
                  </span>
                  <p className="text-3xl font-black mt-1 tracking-tight">
                    {hideAmounts ? '₹••••' : formatCurrency(grandTotalUdharOutstanding)}
                  </p>
                </div>
              </div>

              {/* Comprehensive Udhar Transactions & Khata History List */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  {isHindi ? 'उधार व जमा इतिहास विवरण (Udhar & Jama History)' : 'Udhar & Jama History Ledger'}
                </h4>

                {udharHisabsList.length === 0 && customers.filter(c => c.outstandingBalance > 0).length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic py-6 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    {isHindi ? 'कोई उधार रिकॉर्ड मौजूद नहीं है।' : 'No active credit records.'}
                  </p>
                ) : (
                  <div className="space-y-2.5 pb-2">
                    {/* 1. Daily Hisab Udhar Entries */}
                    {udharHisabsList.map(h => {
                      const udharInfo = getUdharDetails(h);
                      const realName = (h.incomeDescription && !h.incomeDescription.includes('Log'))
                        ? h.incomeDescription
                        : (h.notes && !h.notes.includes('Log'))
                          ? h.notes
                          : '';

                      return (
                        <div key={`udhar-h-${h.id}`} className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/60 rounded-2xl space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                📝
                              </span>
                              <div>
                                <h5
                                  onClick={() => {
                                    const input = window.prompt(
                                      isHindi ? 'ग्राहक का नाम दर्ज करें (Enter Customer Name):' : 'Enter Customer Name:',
                                      realName
                                    );
                                    if (input !== null && input.trim()) {
                                      updateDailyHisab({
                                        ...h,
                                        incomeDescription: input.trim(),
                                        notes: input.trim()
                                      });
                                    }
                                  }}
                                  className="font-black text-slate-850 dark:text-slate-100 text-sm hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer flex items-center gap-1 group"
                                  title={isHindi ? 'ग्राहक का नाम बदलने या दर्ज करने के लिए क्लिक करें' : 'Click to edit or set customer name'}
                                >
                                  <span>{realName || (isHindi ? 'उधार ग्राहक' : 'Udhar Customer')}</span>
                                  <span className="text-[10px] text-amber-500 opacity-60 group-hover:opacity-100">✏️</span>
                                </h5>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {h.date} • {h.grainType} ({h.wheatWeight}kg)
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                                {isHindi ? 'कुल: ' : 'Total: '}₹{h.amount}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteHisab(h.id)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                title={isHindi ? 'हिसाब मिटाएं' : 'Delete Log'}
                              >
                                <TrashIcon size={15} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-amber-200/40 dark:border-amber-900/40 text-[11px] font-extrabold flex-wrap gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                                ✓ {isHindi ? 'जमा: ₹' : 'Jama: ₹'}{udharInfo.jama}
                              </span>

                              <span className="text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                                📝 {isHindi ? 'बाकी उधार: ₹' : 'Udhar Due: ₹'}{udharInfo.udhar}
                              </span>
                            </div>

                            <div className="flex gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleAddUdhar(h)}
                                className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white font-extrabold text-[10px] rounded-lg shadow-xs cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                              >
                                <span>➕</span>
                                <span>{isHindi ? 'उधार बढ़ाएं' : '+Udhar'}</span>
                              </button>

                              {udharInfo.udhar > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openPaymentModal(h)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] rounded-lg shadow-xs cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                                >
                                  <span>💳</span>
                                  <span>{isHindi ? 'जमा करें' : 'Jama'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* 2. Customer Khata Accounts */}
                    {customers.filter(c => c.outstandingBalance > 0).map(c => {
                      const customerPaidRecords = creditRecords.filter(r => r.customerId === c.id && r.type === 'PAID');
                      const totalCustomerPaid = customerPaidRecords.reduce((sum, r) => sum + r.amount, 0);
                      const potaliStatus = c.potaliStatus || 'none';

                      return (
                        <div key={`cust-k-${c.id}`} className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                              👤
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-black text-slate-850 dark:text-slate-100 text-sm">
                                  {c.name}
                                </h5>
                                {potaliStatus === 'received' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-xs">
                                    🔴 {isHindi ? 'पोटली जमा' : 'Potali Received'}
                                  </span>
                                )}
                                {potaliStatus === 'delivered' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                                    🟢 {isHindi ? 'पोटली दे दी' : 'Potali Delivered'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                                  ✓ {isHindi ? 'खाता जमा: ₹' : 'Khata Jama: ₹'}{totalCustomerPaid.toFixed(0)}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                {isHindi ? 'खाता बकाया' : 'Khata Balance'}
                              </span>
                              <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                                ₹{c.outstandingBalance.toFixed(0)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = potaliStatus === 'received' ? 'delivered' : 'received';
                                updateCustomerPotaliStatus(c.id, nextStatus);
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1 shrink-0 ${
                                potaliStatus === 'received'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                                  : potaliStatus === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                              }`}
                              title="Potali Delivered Button: Click to mark potali as given to customer"
                            >
                              ✔ {potaliStatus === 'delivered' ? (isHindi ? 'दे दी गई' : 'Delivered') : (isHindi ? 'पोटली दी' : 'Potali Di')}
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
        </div>
      </div>

      {/* Udhar Payment Collection Modal Popup */}
      {selectedHisabForPayment && (() => {
        const details = getUdharDetails(selectedHisabForPayment);
        return (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setSelectedHisabForPayment(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden p-5 space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-base">
                    💳 {isHindi ? 'उधार राशि जमा करें' : 'Collect Udhar Payment'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {selectedHisabForPayment.incomeDescription || (isHindi ? 'उधार ग्राहक' : 'Udhar Customer')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHisabForPayment(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              {/* Outstanding Due Banner */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                    {isHindi ? 'कुल बाकी उधार' : 'Remaining Due'}
                  </span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                    ₹{details.udhar}
                  </span>
                </div>
                <div className="text-right text-[11px] font-semibold text-slate-500">
                  <span>{isHindi ? 'कुल बिल:' : 'Bill:'} ₹{selectedHisabForPayment.amount}</span>
                  <span className="block text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {isHindi ? 'जमा:' : 'Paid:'} ₹{details.jama}
                  </span>
                </div>
              </div>

              <form onSubmit={handleCollectPayment} className="space-y-4">
                {/* Payment Mode Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block">
                    {isHindi ? 'भुगतान का तरीका (Payment Mode)' : 'Payment Method'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setNewPaymentMode('CASH')}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        newPaymentMode === 'CASH'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      💵 Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPaymentMode('PAYTM')}
                      className={`py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        newPaymentMode === 'PAYTM'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      📲 Paytm
                    </button>
                  </div>
                </div>

                {/* Amount to collect input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block">
                    {isHindi ? 'नई जमा राशि (New Cash Collected ₹) *' : 'New Payment Amount (₹) *'}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder={`Max ₹${details.udhar}`}
                    value={newPaymentAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setNewPaymentAmount(val);
                      }
                    }}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPaymentAmount(details.udhar.toString())}
                    className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                  >
                    {isHindi ? `पूरा ₹${details.udhar}` : `Full ₹${details.udhar}`}
                  </button>

                  {details.udhar > 10 && (
                    <button
                      type="button"
                      onClick={() => setNewPaymentAmount(Math.round(details.udhar / 2).toString())}
                      className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                    >
                      {isHindi ? `आधा ₹${Math.round(details.udhar / 2)}` : `Half ₹${Math.round(details.udhar / 2)}`}
                    </button>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedHisabForPayment(null)}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold rounded-xl text-xs cursor-pointer"
                  >
                    {isHindi ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    {isHindi ? '✓ जमा दर्ज करें' : '✓ Save Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
