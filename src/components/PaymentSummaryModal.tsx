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
  const { orders, dailyHisabs, creditRecords, customers, language, hideAmounts, updateDailyHisab, deleteDailyHisab, deleteOrder, deleteCreditRecord, updateCustomerPotaliStatus, cycleCustomerPotaliStatus, recordPayment, recordManualDue, deleteCustomer } = useApp();

  const [activeTab, setActiveTab] = useState<'CASH' | 'PAYTM' | 'UDHAR'>('CASH');
  const [selectedHisabForPayment, setSelectedHisabForPayment] = useState<DailyHisab | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>('');
  const [newPaymentMode, setNewPaymentMode] = useState<'CASH' | 'PAYTM'>('CASH');
  
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  if (!isOpen) return null;

  const isHindi = language === 'hi';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const todayStr = selectedDateStr;

  const startOfToday = (() => {
    if (!selectedDateStr) return 0;
    const [yyyy, mm, dd] = selectedDateStr.split('-').map(Number);
    return new Date(yyyy, mm - 1, dd).getTime();
  })();

  const endOfToday = startOfToday + 24 * 60 * 60 * 1000;

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
    o => o.createdAt >= startOfToday && o.createdAt < endOfToday && (o.paymentType === 'CASH' || !o.paymentType)
  );
  const todayCashHisabs = dailyHisabs.filter(
    h => h.date === todayStr && (h.expenseDescription === 'CASH' || !h.expenseDescription)
  );
  const todayPaidCreditRecords = creditRecords.filter(
    r => r.createdAt >= startOfToday && r.createdAt < endOfToday && r.type === 'PAID'
  );

  const totalCashOrders = todayCashOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCashHisabs = todayCashHisabs.reduce((sum, h) => sum + (h.revenue || h.amount || 0), 0);
  const totalPaidCredits = todayPaidCreditRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalCashToday = totalCashOrders + totalCashHisabs + totalPaidCredits;

  // 2. PAYTM TRANSACTIONS
  const todayPaytmOrders = orders.filter(
    o => o.createdAt >= startOfToday && o.createdAt < endOfToday && (o.paymentType === 'ONLINE' || o.paymentType === 'PAYTM')
  );
  const todayPaytmHisabs = dailyHisabs.filter(
    h => h.date === todayStr && h.expenseDescription === 'PAYTM'
  );

  const totalPaytmOrders = todayPaytmOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaytmHisabs = todayPaytmHisabs.reduce((sum, h) => sum + (h.revenue || h.amount || 0), 0);
  const totalPaytmToday = totalPaytmOrders + totalPaytmHisabs;

  // 3. UDHAR (CREDIT & JAMA) TRANSACTIONS
  const udharHisabsList = dailyHisabs.filter(h => {
    const desc = h.expenseDescription || '';
    if (h.isPending || desc.includes('PENDING')) return false;
    return getUdharDetails(h).isUdhar;
  });

  const todayUdharOrders = orders.filter(
    o => o.createdAt >= startOfToday && o.createdAt < endOfToday && o.paymentType === 'CREDIT'
  );
  const todayUdharHisabs = dailyHisabs.filter(
    h => h.date === todayStr && getUdharDetails(h).isUdhar
  );
  const todayCreditAddedRecords = creditRecords.filter(
    r => r.createdAt >= startOfToday && r.createdAt < endOfToday && r.type === 'DUE'
  );

  const totalUdharOrders = todayUdharOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalUdharHisabs = todayUdharHisabs.reduce((sum, h) => sum + getUdharDetails(h).udhar, 0);
  const totalUdharAdded = todayCreditAddedRecords.reduce((sum, r) => sum + r.amount, 0);
  
  // To avoid double counting, if an Udhar creates both a DailyHisab and a CreditRecord, we must deduplicate.
  // We use totalUdharAdded as the single source of truth for all manual & hisab-generated Khata Udhar,
  // plus totalUdharOrders for order Udhar.
  const totalUdharToday = totalUdharOrders + totalUdharAdded;

  // Total Outstanding across all customers
  const totalCustomerOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const dailyHisabUdharTotal = dailyHisabs.reduce((sum, h) => {
    const desc = h.expenseDescription || '';
    if (h.isPending || desc.includes('PENDING')) return sum;
    const jamaMatch = desc.match(/Jama:\s*₹?(\d+(?:\.\d+)?)/i);
    const udharMatch = desc.match(/Udhar:\s*₹?(\d+(?:\.\d+)?)/i);
    if (jamaMatch && udharMatch) {
      return sum + (parseFloat(udharMatch[1]) || 0);
    }
    if (desc.startsWith('UDHAR')) {
      return sum + (h.amount || 0);
    }
    return sum;
  }, 0);
  
  const grandTotalUdharOutstanding = totalCustomerOutstanding + dailyHisabUdharTotal;

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

  const handleAddKhataUdhar = (customerId: number) => {
    const amountStr = window.prompt(isHindi ? 'कितना उधार और जोड़ना है?' : 'How much more udhar to add?');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert(isHindi ? 'कृपया सही राशि दर्ज करें!' : 'Please enter a valid amount!');
      return;
    }
    const description = window.prompt(isHindi ? 'विवरण दर्ज करें (optional):' : 'Enter description (optional):') || (isHindi ? 'नया उधार' : 'New Udhar');
    recordManualDue(customerId, amount, description);
    alert(isHindi ? 'उधार सफलतापूर्वक जोड़ा गया!' : 'Udhar added successfully!');
  };

  const handleKhataJama = (customerId: number) => {
    const amountStr = window.prompt(isHindi ? 'कितनी राशि जमा करनी है?' : 'How much amount to Jama?');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert(isHindi ? 'कृपया सही राशि दर्ज करें!' : 'Please enter a valid amount!');
      return;
    }
    const description = window.prompt(isHindi ? 'विवरण दर्ज करें (optional):' : 'Enter description (optional):') || (isHindi ? 'नकद जमा' : 'Cash Jama');
    recordPayment(customerId, amount, description);
    alert(isHindi ? 'राशि सफलतापूर्वक जमा हो गई!' : 'Payment received successfully!');
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
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 max-w-[130px]"
            />
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* 3 Main Tabs: CASH | PAYTM | UDHAR */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100/90 dark:bg-slate-800/60 p-1.5 rounded-2xl">
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
                    {(() => {
                      const groups = new Map();
                      const getGroup = (name: string, cust: any) => {
                        const key = (name || '').trim().toLowerCase() || 'cash customer';
                        if (!groups.has(key)) {
                          groups.set(key, {
                            displayName: name || (isHindi ? 'नकद ग्राहक' : 'Cash Customer'),
                            cust,
                            amount: 0,
                            descList: [],
                            deleteHisabIds: [],
                            deleteOrderIds: [],
                            deleteCreditRecordIds: []
                          });
                        }
                        return groups.get(key);
                      };

                      todayPaidCreditRecords.forEach(r => {
                        const cust = customers.find(c => c.id === r.customerId);
                        const g = getGroup(cust?.name || r.description || '', cust);
                        g.amount += r.amount;
                        g.descList.push(isHindi ? 'उधार जमा कैश' : 'Udhar Paid Cash');
                        g.deleteCreditRecordIds.push(r.id);
                      });

                      todayCashHisabs.forEach(h => {
                        const name = (h.incomeDescription && !h.incomeDescription.includes('Log') && h.incomeDescription !== '5') ? h.incomeDescription : (h.notes && !h.notes.includes('Log') && h.notes !== '5') ? h.notes : '';
                        const cust = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
                        const g = getGroup(name, cust);
                        g.amount += (h.revenue || h.amount || 0);
                        g.descList.push(`${h.grainType} (${h.wheatWeight}kg)`);
                        g.deleteHisabIds.push(h.id);
                      });

                      todayCashOrders.forEach(o => {
                        const cust = customers.find(c => c.id === o.customerId);
                        const g = getGroup(o.customerName || '', cust);
                        g.amount += o.totalAmount;
                        g.descList.push(`${o.grainType} (${o.weight}kg)`);
                        g.deleteOrderIds.push(o.id);
                      });

                      return Array.from(groups.values()).map((g, i) => {
                        const potaliStatus = g.cust?.potaliStatus || 'none';
                        return (
                          <div key={`cash-g-${i}`} className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900 rounded-2xl flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                                ✓
                              </span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-black text-slate-850 dark:text-slate-100 text-sm">
                                    {g.displayName}
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
                                <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                                  {g.descList.join(' + ')}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                                +₹{g.amount.toFixed(0)}
                              </span>
                              {g.cust && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStatus = potaliStatus === 'received' ? 'delivered' : 'received';
                                    updateCustomerPotaliStatus(g.cust.id, nextStatus);
                                  }}
                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1 shrink-0 ${
                                    potaliStatus === 'received'
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                                      : potaliStatus === 'delivered'
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                  }`}
                                  title="Potali Delivered Button"
                                >
                                  ✔ {potaliStatus === 'delivered' ? (isHindi ? 'दे दी' : 'Delivered') : (isHindi ? 'पोटली दी' : 'Potali Di')}
                                </button>
                              )}
                              {(g.deleteHisabIds.length > 0 || g.deleteOrderIds.length > 0 || g.deleteCreditRecordIds.length > 0) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(isHindi ? 'क्या आप इस ग्राहक के आज के सभी कैश हिसाब मिटाना चाहते हैं?' : 'Delete all cash logs for this customer today?')) {
                                      g.deleteHisabIds.forEach((id: number) => deleteDailyHisab(id));
                                      g.deleteOrderIds.forEach((id: number) => deleteOrder(id));
                                      g.deleteCreditRecordIds.forEach((id: number) => deleteCreditRecord(id));
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                                  title={isHindi ? 'हिसाब मिटाएं' : 'Delete Logs'}
                                >
                                  <TrashIcon size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
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
                    {(() => {
                      const groups = new Map();
                      const getGroup = (name: string, cust: any) => {
                        const key = (name || '').trim().toLowerCase() || 'paytm customer';
                        if (!groups.has(key)) {
                          groups.set(key, {
                            displayName: name || (isHindi ? 'Paytm ग्राहक' : 'Paytm Customer'),
                            cust,
                            amount: 0,
                            descList: [],
                            deleteHisabIds: [],
                            deleteOrderIds: []
                          });
                        }
                        return groups.get(key);
                      };

                      todayPaytmHisabs.forEach(h => {
                        const name = (h.incomeDescription && !h.incomeDescription.includes('Log') && h.incomeDescription !== '5') ? h.incomeDescription : (h.notes && !h.notes.includes('Log') && h.notes !== '5') ? h.notes : '';
                        const cust = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
                        const g = getGroup(name, cust);
                        g.amount += (h.revenue || h.amount || 0);
                        g.descList.push(`${h.grainType} (${h.wheatWeight}kg)`);
                        g.deleteHisabIds.push(h.id);
                      });

                      todayPaytmOrders.forEach(o => {
                        const cust = customers.find(c => c.id === o.customerId);
                        const g = getGroup(o.customerName || '', cust);
                        g.amount += o.totalAmount;
                        g.descList.push(`${o.grainType} (${o.weight}kg)`);
                        g.deleteOrderIds.push(o.id);
                      });

                      return Array.from(groups.values()).map((g, i) => {
                        const potaliStatus = g.cust?.potaliStatus || 'none';
                        return (
                          <div key={`paytm-g-${i}`} className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900 rounded-2xl flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                📲
                              </span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-black text-slate-850 dark:text-slate-100 text-sm">
                                    {g.displayName}
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
                                <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                                  Paytm ({g.descList.join(' + ')})
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-blue-600 dark:text-blue-400 text-base">
                                +₹{g.amount.toFixed(0)}
                              </span>
                              {g.cust && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStatus = potaliStatus === 'received' ? 'delivered' : 'received';
                                    updateCustomerPotaliStatus(g.cust.id, nextStatus);
                                  }}
                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1 shrink-0 ${
                                    potaliStatus === 'received'
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                                      : potaliStatus === 'delivered'
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                  }`}
                                  title="Potali Delivered Button"
                                >
                                  ✔ {potaliStatus === 'delivered' ? (isHindi ? 'दे दी' : 'Delivered') : (isHindi ? 'पोटली दी' : 'Potali Di')}
                                </button>
                              )}
                              {(g.deleteHisabIds.length > 0 || g.deleteOrderIds.length > 0) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(isHindi ? 'क्या आप इस ग्राहक के आज के सभी Paytm हिसाब मिटाना चाहते हैं?' : 'Delete all Paytm logs for this customer today?')) {
                                      g.deleteHisabIds.forEach((id: number) => deleteDailyHisab(id));
                                      g.deleteOrderIds.forEach((id: number) => deleteOrder(id));
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                                  title={isHindi ? 'हिसाब मिटाएं' : 'Delete Logs'}
                                >
                                  <TrashIcon size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
