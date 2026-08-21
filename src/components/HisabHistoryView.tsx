'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DailyHisab, Customer } from '../types';
import { TrashIcon, ArrowLeftIcon } from './Icons';
import { CustomerQrModal } from './CustomerQrModal';

export const HisabHistoryView: React.FC = () => {
  const {
    dailyHisabs,
    orders,
    creditRecords,
    deleteDailyHisab,
    updateDailyHisab,
    language,
    hideAmounts,
    setActiveView,
    setSelectedCustomer,
    customers,
    updateCustomerPotaliStatus,
    addOrder,
    recordManualDue,
    recordPayment
  } = useApp();

  const [activeTab, setActiveTab] = useState<'today' | 'pending' | 'udhar' | 'past'>('today');
  const [searchTerm, setSearchTerm] = useState('');

  // Delivery Modal State
  const [selectedHisabForDelivery, setSelectedHisabForDelivery] = useState<DailyHisab | null>(null);

  // Payment Collection Modal State
  const [selectedHisabForPayment, setSelectedHisabForPayment] = useState<DailyHisab | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>('');
  const [newPaymentMode, setNewPaymentMode] = useState<'CASH' | 'PAYTM'>('CASH');

  // QR Modal State
  const [selectedCustomerForQr, setSelectedCustomerForQr] = useState<Customer | null>(null);
  const [selectedHisabForQr, setSelectedHisabForQr] = useState<DailyHisab | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const todayObj = new Date();
  const yyyy = todayObj.getFullYear();
  const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
  const dd = String(todayObj.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // Helper to check if a hisab is pending
  const isHisabPending = (hisab: DailyHisab) => {
    return Boolean(
      hisab.isPending ||
      (hisab.expenseDescription && hisab.expenseDescription.toUpperCase().includes('PENDING'))
    );
  };

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

    if (desc.startsWith('UDHAR')) {
      return { jama: 0, udhar: total, isUdhar: true, mode: 'UDHAR' };
    }

    return { jama: total, udhar: 0, isUdhar: false, mode: desc };
  };

  // 30-day filter limit
  const nowTs = new Date().getTime();
  const thirtyDaysAgoTs = nowTs - 30 * 24 * 60 * 60 * 1000;

  // Filter out entries older than 30 days and deduplicate by ID
  const seenHisabIds = new Set();
  const hisabsWithin30Days = dailyHisabs.filter(h => {
    const logTime = new Date(h.date).getTime();
    if (isNaN(logTime) || logTime < thirtyDaysAgoTs) return false;
    if (h.id) {
      if (seenHisabIds.has(h.id)) return false;
      seenHisabIds.add(h.id);
    }
    return true;
  });

  // Sort daily logs by date descending & creation order
  const sortedHisabs = [...hisabsWithin30Days].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.id - a.id;
  });

  // Filter logs based on search term and tab
  const filteredHisabs = sortedHisabs.filter((hisab) => {
    const udharInfo = getUdharDetails(hisab);
    const isPending = isHisabPending(hisab);

    if (activeTab === 'today' && hisab.date !== todayStr) return false;
    if (activeTab === 'pending' && !isPending) return false;
    if (activeTab === 'udhar' && (!udharInfo.isUdhar || isPending)) return false;
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

  // Count stats
  const pendingCount = sortedHisabs.filter(isHisabPending).length;
  const totalUdharCount = sortedHisabs.filter(h => getUdharDetails(h).isUdhar && !isHisabPending(h)).length;
  const totalUdharAmount = sortedHisabs.reduce((sum, h) => {
    const isPending = isHisabPending(h);
    return isPending ? sum : sum + getUdharDetails(h).udhar;
  }, 0);

  const totalEntries = filteredHisabs.length;
  const totalWeight = filteredHisabs.reduce((sum, h) => sum + (h.wheatWeight || 0), 0);

  // 30-day net profit
  const last30DaysHisabs = dailyHisabs.filter(h => new Date(h.date).getTime() >= thirtyDaysAgoTs);
  const net30DaysTotal = last30DaysHisabs.reduce((sum, h) => sum + (h.isProfit ? h.amount : -h.amount), 0);

  // Today's total cash earnings (from completed daily hisabs, non-credit orders, and khata payments)
  const startOfToday = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate()).getTime();
  const todayOrdersTotal = (orders || []).filter(o => o.createdAt >= startOfToday && o.paymentType !== 'CREDIT').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const todayKhataPaidTotal = (creditRecords || []).filter(r => r.type === 'PAID' && r.createdAt >= startOfToday).reduce((sum, r) => sum + (r.amount || 0), 0);
  const todayHisabsPaidTotal = dailyHisabs.filter(h => h.date === todayStr && !isHisabPending(h)).reduce((sum, h) => sum + (h.isProfit ? h.amount : 0), 0);
  const todayCashEarnings = todayOrdersTotal + todayKhataPaidTotal + todayHisabsPaidTotal;

  const handleDelete = (id: number) => {
    const hisab = dailyHisabs.find(h => h.id === id);
    if (!hisab) return;
    const udharInfo = getUdharDetails(hisab);
    let msg = language === 'hi' ? 'क्या आप इस हिसाब एंट्री को मिटाना चाहते हैं?' : 'Are you sure you want to delete this log?';
    if (udharInfo.isUdhar && !isHisabPending(hisab)) {
      msg = language === 'hi' 
        ? '⚠️ चेतावनी: यह एक उधार एंट्री है! इसे यहाँ से मिटाने पर भी ग्राहक के खाते (Khata) से उधार कम नहीं होगा। क्या आप फिर भी इसे मिटाना चाहते हैं?' 
        : '⚠️ WARNING: This is an Udhar entry! Deleting it here will NOT remove the due amount from the customer\'s Khata. Continue anyway?';
    }
    if (window.confirm(msg)) {
      deleteDailyHisab(id);
    }
  };

  // Navigate to customer page for Jama
  const navigateToCustomerForJama = (hisab: DailyHisab) => {
    const custName = hisab.incomeDescription || hisab.notes || '';
    if (custName.trim()) {
      const cust = customers.find(c => c.name.toLowerCase() === custName.trim().toLowerCase());
      if (cust) {
        setSelectedCustomer(cust);
        setActiveView('customers');
        return;
      }
    }
    alert(language === 'hi' ? 'इस उधार का कोई ग्राहक खाता नहीं मिला! कृपया इसे हटाकर नया हिसाब दर्ज करें।' : 'No customer account found for this Udhar! Please delete this entry and create a new Hisab.');
  };

  // Handle adding more udhar to an existing record
  const handleAddUdhar = (h: DailyHisab) => {
    const amountStr = window.prompt(language === 'hi' ? 'कितना उधार और जोड़ना है?' : 'How much more udhar to add?');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'hi' ? 'कृपया सही राशि दर्ज करें!' : 'Please enter a valid amount!');
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

    // Sync with customer khata if customer exists
    const custName = h.incomeDescription || h.notes || '';
    if (custName.trim()) {
      const cust = customers.find(c => c.name.toLowerCase() === custName.trim().toLowerCase());
      if (cust) {
        recordManualDue(cust.id, amount, `Extra Udhar - ${h.grainType || 'Grinding'}`);
      }
    }

    alert(language === 'hi' ? `₹${amount} का उधार सफलतापूर्वक जोड़ा गया!` : `₹${amount} udhar added successfully!`);
  };

  // Complete / Deliver Pending Hisab
  const handleMarkDelivered = (hisab: DailyHisab, mode: 'CASH' | 'PAYTM' | 'UDHAR' | 'KEEP') => {
    let updatedDesc = hisab.expenseDescription || 'CASH';
    if (mode === 'CASH') updatedDesc = 'CASH';
    else if (mode === 'PAYTM') updatedDesc = 'PAYTM';
    else if (mode === 'UDHAR') updatedDesc = `UDHAR (Jama: ₹0, Udhar: ₹${hisab.amount.toFixed(0)})`;
    else if (mode === 'KEEP' && updatedDesc.includes('PENDING')) updatedDesc = 'CASH';

    const updatedHisab: DailyHisab = {
      ...hisab,
      isPending: false,
      expenseDescription: updatedDesc
    };

    updateDailyHisab(updatedHisab);

    // Update customer potali status and add grinding order if customer exists
    const custName = hisab.incomeDescription || hisab.notes || '';
    if (custName.trim()) {
      const cust = customers.find(c => c.name.toLowerCase() === custName.trim().toLowerCase());
      if (cust) {
        updateCustomerPotaliStatus(cust.id, 'delivered');
        
        // Convert mode to valid payment type for order
        let paymentType: 'CASH' | 'CREDIT' | 'ONLINE' | 'PAYTM' = 'CASH';
        if (mode === 'PAYTM') paymentType = 'PAYTM';
        else if (mode === 'UDHAR') paymentType = 'CREDIT';
        
        addOrder({
          customerId: cust.id,
          customerName: cust.name,
          grainType: hisab.grainType || 'Grinding',
          weight: hisab.wheatWeight || 0,
          rate: hisab.rate || 0,
          totalAmount: hisab.amount || 0,
          paymentType: paymentType,
          potaliStatus: 'delivered'
        });
      }
    }

    setSelectedHisabForDelivery(null);
    alert(
      language === 'hi'
        ? '✅ पिसाई व डिलीवरी सफलता पूर्वक पूर्ण दर्ज की गई!'
        : '✅ Grinding & delivery marked as completed!'
    );
  };

  // Toggle status back to pending if needed
  const handleTogglePending = (hisab: DailyHisab) => {
    const willBePending = !isHisabPending(hisab);
    const updatedHisab: DailyHisab = {
      ...hisab,
      isPending: willBePending,
      expenseDescription: willBePending
        ? `PENDING_POTALI (₹${hisab.amount.toFixed(0)} Pending)`
        : (hisab.expenseDescription.includes('PENDING') ? 'CASH' : hisab.expenseDescription)
    };
    updateDailyHisab(updatedHisab);
  };

  const handleCardClick = (customerName: string, hisab: DailyHisab) => {
    if (!customerName || customerName === '—') return;
    const cust = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
    setSelectedHisabForQr(hisab);
    if (cust) {
      setSelectedCustomerForQr(cust);
      setIsQrModalOpen(true);
    } else {
      setSelectedCustomerForQr({
        id: 0,
        name: customerName,
        phone: 'N/A',
        outstandingBalance: 0,
        potaliStatus: 'none',
        createdAt: Date.now()
      });
      setIsQrModalOpen(true);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-1 sm:px-4 space-y-4 pb-12 animate-fade-in">
      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setActiveView('daily-hisab')}
              className="mt-1 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeftIcon size={20} />
            </button>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg tracking-tight">
                {language === 'hi' ? 'डेली हिसाब इतिहास' : 'Daily Logs History'}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                {language === 'hi' ? 'पिसाई व डिलीवरी एंट्रियों का विवरण' : 'Grinding & delivery logs details'}
              </p>
            </div>
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
          <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl">
            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              {language === 'hi' ? 'आज की कमाई' : 'Today Cash'}
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {hideAmounts ? '₹••' : `+₹${todayCashEarnings.toFixed(0)}`}
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
          <div className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl flex items-center gap-1 text-xs font-extrabold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-center cursor-pointer whitespace-nowrap ${
                activeTab === 'today'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ☀️ {language === 'hi' ? 'आज का' : 'Today'} ({sortedHisabs.filter(h => h.date === todayStr).length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-center cursor-pointer whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ⏳ {language === 'hi' ? 'पेंडिंग' : 'Pending'} ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('udhar')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-center cursor-pointer whitespace-nowrap ${
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
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all text-center cursor-pointer whitespace-nowrap ${
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
              <div className="space-y-2.5 sm:hidden">
                {filteredHisabs.map((hisab) => {
                  const dateObj = new Date(hisab.date);
                  const formattedDate = dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                    day: 'numeric',
                    month: 'short'
                  });
                  const isToday = hisab.date === todayStr;
                  const udharInfo = getUdharDetails(hisab);
                  const isPending = isHisabPending(hisab);
                  const customerName = (hisab.incomeDescription && !hisab.incomeDescription.includes('Log'))
                    ? hisab.incomeDescription
                    : (hisab.notes && !hisab.notes.includes('Log'))
                      ? hisab.notes
                      : (udharInfo.isUdhar ? (language === 'hi' ? 'उधार ग्राहक' : 'Udhar Customer') : (language === 'hi' ? 'ग्राहक' : 'Customer'));

                  const avatarChar = customerName && customerName !== '—' ? customerName.charAt(0).toUpperCase() : '👤';

                  return (
                    <div
                      key={hisab.id}
                      className={`p-3.5 border rounded-2xl space-y-2.5 transition-all shadow-xs ${
                        isPending
                          ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-300 dark:border-rose-800/80 shadow-rose-500/5'
                          : udharInfo.isUdhar
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                          : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      {/* Top Header Row with Profile */}
                      <div className="flex items-center justify-between gap-2">
                        <div 
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleCardClick(customerName, hisab)}
                        >
                          {/* Profile Avatar Badge */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                            isPending
                              ? 'bg-rose-500 text-white ring-2 ring-rose-400 dark:ring-rose-600 animate-pulse'
                              : udharInfo.isUdhar
                              ? 'bg-amber-500 text-white ring-2 ring-amber-300 dark:ring-amber-700'
                              : 'bg-emerald-500 text-white'
                          }`}>
                            {avatarChar}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{customerName}</span>
                              {isPending && (
                                <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.5 rounded-md border border-rose-300 dark:border-rose-800 animate-pulse shrink-0">
                                  ⏳ {language === 'hi' ? 'पेंडिंग' : 'Pending'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 flex flex-wrap items-center gap-1 mt-0.5 min-w-0">
                              <span>{isToday ? (language === 'hi' ? '☀️ आज' : '☀️ Today') : formattedDate}</span>
                              <span>•</span>
                              <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">
                                {hisab.grainType} ({hisab.wheatWeight}kg)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                            {hideAmounts ? '₹••' : `+₹${hisab.amount}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(hisab.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Action / Details Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 min-w-0">
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          {udharInfo.isUdhar && !isPending && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                                {language === 'hi' ? 'जमा: ₹' : 'Jama: ₹'}{udharInfo.jama}
                              </span>
                              <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                                {language === 'hi' ? 'बाकी: ₹' : 'Due: ₹'}{udharInfo.udhar}
                              </span>
                            </div>
                          )}

                          {!udharInfo.isUdhar && !isPending && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-300/60 dark:border-emerald-800/60">
                              {udharInfo.mode === 'PAYTM' ? '📲 Paytm' : '💵 Cash (Paid)'}
                            </span>
                          )}

                          {isPending && (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                              {language === 'hi' ? 'पिसाई/डिलीवरी पेंडिंग है' : 'Grinding / Delivery Pending'}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons: Delivery / Jama / Status */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => setSelectedHisabForDelivery(hisab)}
                              className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md shadow-rose-500/20 cursor-pointer active:scale-95 flex items-center gap-1 transition-all"
                            >
                              <span>🚚</span>
                              <span>{language === 'hi' ? 'डिलीवरी करें' : 'Deliver'}</span>
                            </button>
                          ) : udharInfo.isUdhar ? (
                            <div className="flex gap-1.5 shrink-0">

                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); navigateToCustomerForJama(hisab); }}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] rounded-lg shadow-xs cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                              >
                                <span>💳</span>
                                <span>{language === 'hi' ? 'जमा करें' : 'Jama'}</span>
                              </button>
                            </div>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                              <span>✅</span>
                              <span>{language === 'hi' ? 'Complete (पूर्ण)' : 'Complete'}</span>
                            </span>
                          )}
                        </div>
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
                      <th className="py-2.5 px-3 font-bold">{language === 'hi' ? 'प्रोफ़ाइल (ग्राहक)' : 'Profile'}</th>
                      <th className="py-2.5 px-3 font-bold">{language === 'hi' ? 'अनाज / वजन' : 'Grain / Wt'}</th>
                      <th className="py-2.5 px-3 font-bold">{language === 'hi' ? 'स्थिति' : 'Status'}</th>
                      <th className="py-2.5 px-3 font-bold text-center">{language === 'hi' ? 'कार्रवाई' : 'Action'}</th>
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
                      const isPending = isHisabPending(hisab);
                      const customerName = (hisab.incomeDescription && !hisab.incomeDescription.includes('Log'))
                        ? hisab.incomeDescription
                        : (hisab.notes && !hisab.notes.includes('Log'))
                          ? hisab.notes
                          : (udharInfo.isUdhar ? (language === 'hi' ? 'उधार ग्राहक' : 'Udhar Customer') : (language === 'hi' ? 'ग्राहक' : 'Customer'));

                      const avatarChar = customerName && customerName !== '—' ? customerName.charAt(0).toUpperCase() : '👤';

                      return (
                        <tr
                          key={hisab.id}
                          className={`transition-all align-middle ${
                            isPending
                              ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 border-l-4 border-l-rose-500'
                              : udharInfo.isUdhar
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

                          {/* Profile */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleCardClick(customerName, hisab)}
                            >
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                isPending
                                  ? 'bg-rose-500 text-white ring-2 ring-rose-400 animate-pulse'
                                  : udharInfo.isUdhar
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-emerald-500 text-white'
                              }`}>
                                {avatarChar}
                              </div>
                              <span className="font-extrabold text-slate-800 dark:text-slate-100">
                                {customerName}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/20 font-black">
                              {hisab.grainType} ({hisab.wheatWeight}kg)
                            </span>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {isPending ? (
                              <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-800 animate-pulse">
                                ⏳ {language === 'hi' ? 'पेंडिंग' : 'Pending'}
                              </span>
                            ) : udharInfo.isUdhar ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                                  {language === 'hi' ? 'जमा: ₹' : 'Jama: ₹'}{udharInfo.jama}
                                </span>
                                <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                                  {language === 'hi' ? 'बाकी: ₹' : 'Due: ₹'}{udharInfo.udhar}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                                {udharInfo.mode === 'PAYTM' ? '📲 Paytm' : '💵 Cash (Paid)'}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => setSelectedHisabForDelivery(hisab)}
                                className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-500/20 cursor-pointer active:scale-95 flex items-center justify-center gap-1 mx-auto transition-all"
                              >
                                🚚 {language === 'hi' ? 'डिलीवरी करें' : 'Deliver'}
                              </button>
                            ) : udharInfo.isUdhar ? (
                              <div className="flex items-center justify-center gap-1.5">

                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); navigateToCustomerForJama(hisab); }}
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] rounded-md transition-all shadow-2xs cursor-pointer active:scale-95"
                                >
                                  💳 {language === 'hi' ? 'जमा करें' : 'Jama'}
                                </button>
                              </div>
                            ) : (
                              <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] rounded-md border border-emerald-300 dark:border-emerald-800 inline-flex items-center justify-center gap-1">
                                <span>✅</span>
                                <span>{language === 'hi' ? 'Complete' : 'Complete'}</span>
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

      {/* Delivery Completion Modal */}
      {selectedHisabForDelivery && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedHisabForDelivery(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-[95%] max-w-md rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden my-auto p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                  <span>🚚</span>
                  <span>{language === 'hi' ? 'डिलीवरी व पिसाई पूर्ण दर्ज करें' : 'Mark Delivery Complete'}</span>
                </h4>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                  {selectedHisabForDelivery.incomeDescription || 'ग्राहक'} ({selectedHisabForDelivery.grainType} - {selectedHisabForDelivery.wheatWeight}kg)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHisabForDelivery(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                {language === 'hi' ? 'कुल देय राशि' : 'Total Amount Due'}
              </span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 block">
                ₹{selectedHisabForDelivery.amount}
              </span>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                {language === 'hi' ? 'डिलीवरी के समय भुगतान का प्रकार चुनें:' : 'Select Payment Received on Delivery:'}
              </label>

              <button
                type="button"
                onClick={() => handleMarkDelivered(selectedHisabForDelivery, 'CASH')}
                className="w-full p-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">💵</span>
                  <div>
                    <div className="font-extrabold text-xs text-emerald-800 dark:text-emerald-200">
                      {language === 'hi' ? 'नकद भुगतान (Cash Collected)' : 'Cash Received'}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {language === 'hi' ? `₹${selectedHisabForDelivery.amount} नकद जमा हुआ` : `₹${selectedHisabForDelivery.amount} cash collected`}
                    </div>
                  </div>
                </div>
                <span className="font-black text-emerald-700 dark:text-emerald-300 text-xs">✓ Choose</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarkDelivered(selectedHisabForDelivery, 'PAYTM')}
                className="w-full p-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 border border-blue-300 dark:border-blue-800 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📲</span>
                  <div>
                    <div className="font-extrabold text-xs text-blue-800 dark:text-blue-200">
                      {language === 'hi' ? 'ऑनलाइन/पेटीएम (Paytm/UPI)' : 'Paytm / UPI Received'}
                    </div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400">
                      {language === 'hi' ? `₹${selectedHisabForDelivery.amount} ऑनलाइन जमा हुआ` : `₹${selectedHisabForDelivery.amount} paid online`}
                    </div>
                  </div>
                </div>
                <span className="font-black text-blue-700 dark:text-blue-300 text-xs">✓ Choose</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarkDelivered(selectedHisabForDelivery, 'UDHAR')}
                className="w-full p-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📝</span>
                  <div>
                    <div className="font-extrabold text-xs text-amber-800 dark:text-amber-200">
                      {language === 'hi' ? 'उधार में दर्ज करें (Udhar)' : 'Record as Udhar'}
                    </div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">
                      {language === 'hi' ? `₹${selectedHisabForDelivery.amount} ग्राहक के खाते में उधार दर्ज होगा` : `₹${selectedHisabForDelivery.amount} added to Udhar`}
                    </div>
                  </div>
                </div>
                <span className="font-black text-amber-700 dark:text-amber-300 text-xs">✓ Choose</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarkDelivered(selectedHisabForDelivery, 'KEEP')}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl cursor-pointer transition-all"
              >
                ✅ {language === 'hi' ? 'केवल पिसाई/डिलीवरी पूर्ण दर्ज करें' : 'Just Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Customer QR Modal */}
      <CustomerQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        customer={selectedCustomerForQr}
        dailyHisab={selectedHisabForQr}
      />
    </div>
  );
};
