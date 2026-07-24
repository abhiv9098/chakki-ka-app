'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SearchIcon, PlusIcon, CheckIcon, CloseIcon, KhataIcon, WhatsAppIcon, QrCodeIcon } from './Icons';
import { Customer, Order, CreditRecord } from '../types';
import { UpiPaymentCard } from './UpiPaymentCard';
import { CustomerQrModal } from './CustomerQrModal';

export const CustomersView: React.FC = () => {
  const {
    customers,
    orders,
    creditRecords,
    addCustomer,
    updateCustomer,
    recordPayment,
    recordManualDue,
    selectedCustomer,
    setSelectedCustomer,
    deleteCustomer,
    setActiveView,
    t,
    language,
    hideAmounts
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Payment/Charge action modals inside customer details
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDueModal, setShowDueModal] = useState(false);

  // Edit profile states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');

  // QR Pass Card state
  const [showQrModal, setShowQrModal] = useState(false);
  const [customerForQr, setCustomerForQr] = useState<Customer | null>(null);

  // Search filter
  const filteredCustomers = customers
    .filter(c => c.outstandingBalance > 0)
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const phoneVal = newCustPhone.trim() || 'N/A';
    const newCust = addCustomer(newCustName.trim(), phoneVal);
    setNewCustName('');
    setNewCustPhone('');
    setShowAddModal(false);
    setSelectedCustomer(newCust); // auto-select new customer
    setActiveView('grinding'); // send them forward
  };

  const handleEditCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!editCustName.trim()) return;
    updateCustomer(selectedCustomer.id, editCustName.trim(), editCustPhone.trim() || 'N/A');
    setShowEditModal(false);
  };

  const handleDeleteCustomer = (customerId: number) => {
    const isHindi = language === 'hi';
    const confirmMsg = isHindi
      ? 'क्या आप वाकई इस ग्राहक को हटाना चाहते हैं? इससे उनका सारा लेन-देन का इतिहास भी डिलीट हो जाएगा।'
      : 'Are you sure you want to delete this customer? This will also delete all their grinding orders and ledger transaction history.';
    if (window.confirm(confirmMsg)) {
      deleteCustomer(customerId);
    }
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    recordPayment(selectedCustomer.id, amount, notes.trim() || 'Khata Payment');
    setAmountStr('');
    setNotes('');
    setShowPaymentModal(false);
  };

  const handleRecordDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    recordManualDue(selectedCustomer.id, amount, notes.trim() || 'Manual Due Charge');
    setAmountStr('');
    setNotes('');
    setShowDueModal(false);
  };

  // Get customer specific orders & credit transactions
  const customerOrders = orders
    .filter((o) => o.customerId === selectedCustomer?.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  const customerCredits = creditRecords
    .filter((r) => r.customerId === selectedCustomer?.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[calc(100vh-140px)]">
      {/* Customer List Pane */}
      <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex flex-col h-auto md:h-full shadow-sm overflow-hidden min-h-[350px]">
        {/* Header Actions */}
        <div className="mb-4">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
            {t('customerList')}
          </h3>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={t('searchCustomer')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-12 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* List scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 pr-1 space-y-1">
          {filteredCustomers.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-sm font-semibold">
              🔍 {t('noCustomersYet')}
            </div>
          ) : (
            filteredCustomers.map((cust) => (
              <button
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                className="w-full text-left p-3.5 rounded-2xl flex justify-between items-center transition-all duration-200 cursor-pointer border border-transparent hover:bg-slate-50/80 dark:hover:bg-slate-800/20"
              >
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                    {cust.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                    📞 {cust.phone}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-xl transition-all ${
                    cust.outstandingBalance > 0
                      ? 'bg-amber-50 text-amber-650 dark:bg-amber-950/30 dark:text-amber-400'
                      : 'bg-emerald-50 text-emerald-655 dark:bg-emerald-950/30 dark:text-emerald-400'
                  }`}>
                    {hideAmounts ? '₹••••' : `₹${cust.outstandingBalance.toFixed(0)}`}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Customer Detail Pane */}
      <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 md:p-6 shadow-sm flex flex-col h-auto md:h-full overflow-hidden min-h-[450px]">
        {selectedCustomer ? (
          <div className="flex flex-col h-auto md:h-full overflow-hidden">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 md:pb-5 gap-3.5 md:gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-xl md:text-2xl text-slate-850 dark:text-slate-50">
                    {selectedCustomer.name}
                  </h3>
                  <button
                    onClick={() => {
                      setEditCustName(selectedCustomer.name);
                      setEditCustPhone(selectedCustomer.phone === 'N/A' ? '' : selectedCustomer.phone);
                      setShowEditModal(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Edit Name/Phone / विवरण बदलें"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 transition-colors cursor-pointer"
                    title="Delete Customer / ग्राहक हटाएं"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-550">
                    Registered: {new Date(selectedCustomer.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                  </p>
                  {selectedCustomer.phone === 'N/A' ? (
                    <button
                      onClick={() => {
                        setEditCustName(selectedCustomer.name);
                        setEditCustPhone('');
                        setShowEditModal(true);
                      }}
                      className="px-2 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 border border-amber-500/10 cursor-pointer"
                    >
                      ➕ Add Phone / फ़ोन जोड़ें
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 border border-blue-500/10 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        📞 Call {selectedCustomer.phone}
                      </a>
                      <a
                        href={`sms:${selectedCustomer.phone}?body=${encodeURIComponent(
                          language === 'hi'
                            ? `नमस्ते ${selectedCustomer.name}, चक्की मित्र से आपका संपर्क करने के लिए धन्यवाद।`
                            : `Hello ${selectedCustomer.name}, thank you for contacting Chakki Mitra.`
                        )}`}
                        className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 border border-indigo-500/10 cursor-pointer whitespace-nowrap shrink-0"
                        title={t('sms')}
                      >
                        💬 SMS
                      </a>
                      {selectedCustomer.outstandingBalance > 0 && (
                        <a
                          href={`https://api.whatsapp.com/send?phone=${selectedCustomer.phone.replace(/\D/g, '').length === 10 ? `91${selectedCustomer.phone.replace(/\D/g, '')}` : selectedCustomer.phone.replace(/\D/g, '')}&text=${encodeURIComponent(
                            language === 'hi'
                              ? `नमस्ते ${selectedCustomer.name},\nआटा चक्की पर आपका बकाया (Outstanding Credit) ₹${selectedCustomer.outstandingBalance.toFixed(1)} है। कृपया इसे जल्द ही क्लियर करें। धन्यवाद! 🙏`
                              : `Hello ${selectedCustomer.name},\nYour outstanding balance at Flour Mill is ₹${selectedCustomer.outstandingBalance.toFixed(1)}. Please clear it at your earliest convenience. Thank you! 🙏`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 border border-emerald-500/10 cursor-pointer whitespace-nowrap shrink-0"
                          title={t('sendReminder')}
                        >
                          <WhatsAppIcon size={11} /> {t('sendReminder')}
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setCustomerForQr(selectedCustomer);
                          setShowQrModal(true);
                        }}
                        className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 border border-teal-500/10 cursor-pointer whitespace-nowrap shrink-0"
                        title={t('customerQrCard')}
                      >
                        <QrCodeIcon size={12} /> {t('customerQrCard')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Outstanding Card */}
              <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 md:p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between w-full sm:w-auto sm:min-w-[240px]">
                <div>
                  <span className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-550 font-extrabold uppercase tracking-wider">{t('outstanding')}</span>
                  <p className={`font-black text-lg md:text-xl mt-0.5 ${
                    selectedCustomer.outstandingBalance > 0 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-450'
                  }`}>
                    {hideAmounts ? '₹••••' : `₹${selectedCustomer.outstandingBalance.toFixed(1)}`}
                  </p>
                </div>
                <div className="flex gap-1.5 ml-4">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="h-9 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-extrabold transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
                  >
                    Receive
                  </button>
                  <button
                    onClick={() => setShowDueModal(true)}
                    className="h-9 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-extrabold transition-all shadow-md shadow-amber-500/10 active:scale-95 cursor-pointer"
                  >
                    Add Due
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section Layout: Two tables (History vs Grinding) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 min-h-0">
              {/* Grinding History */}
              <div className="flex flex-col h-auto overflow-hidden">
                <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm mb-3">
                  🌾 {t('grindingOrders')}
                </h4>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/10 dark:bg-slate-800/10 space-y-1">
                  {customerOrders.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold py-12">
                      {t('noOrdersYet')}
                    </div>
                  ) : (
                    customerOrders.map((order) => (
                      <div key={order.id} className="py-3.5 flex justify-between items-center first:pt-0 last:pb-0 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 px-2 rounded-xl transition-all">
                        <div>
                          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{order.grainType}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                            {order.weight} kg • ₹{order.rate}/kg • {new Date(order.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-850 dark:text-slate-100">₹{order.totalAmount}</p>
                          {(() => {
                            if (order.paymentType === 'CASH') {
                              return (
                                <span className="inline-block text-[9px] px-2 py-0.5 rounded-full font-black uppercase mt-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20">
                                  {t('cash')}
                                </span>
                              );
                            }
                            const curBalance = selectedCustomer?.outstandingBalance ?? 0;
                            if (curBalance === 0) {
                              return (
                                <span className="inline-block text-[9px] px-2 py-0.5 rounded-full font-black uppercase mt-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20">
                                  ✅ {language === 'hi' ? 'चुकता (Paid)' : 'Paid'}
                                </span>
                              );
                            } else if (curBalance < order.totalAmount) {
                              return (
                                <span className="inline-block text-[9px] px-2 py-0.5 rounded-full font-black uppercase mt-1 bg-amber-50 text-amber-600 dark:bg-amber-950/20">
                                  {language === 'hi' ? `बाकी: ₹${curBalance.toFixed(0)}` : `Due: ₹${curBalance.toFixed(0)}`}
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-block text-[9px] px-2 py-0.5 rounded-full font-black uppercase mt-1 bg-amber-50 text-amber-600 dark:bg-amber-950/20">
                                  {t('credit')}
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Credit ledger ledger history */}
              <div className="flex flex-col h-auto overflow-hidden">
                <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm mb-3">
                  📒 {t('history')}
                </h4>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/10 dark:bg-slate-800/10 space-y-1">
                  {customerCredits.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold py-12">
                      {t('noTransactionsYet')}
                    </div>
                  ) : (
                    customerCredits.map((record) => (
                      <div key={record.id} className="py-3.5 flex justify-between items-center first:pt-0 last:pb-0 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 px-2 rounded-xl transition-all">
                        <div>
                          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{record.description}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-505 font-bold mt-0.5">
                            {new Date(record.createdAt).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${
                            record.type === 'DUE' ? 'text-amber-500' : 'text-emerald-500'
                          }`}>
                            {record.type === 'DUE' ? '+' : '-'} ₹{record.amount}
                          </p>
                          <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-black uppercase mt-1.5 ${
                            record.type === 'DUE'
                              ? 'bg-amber-50 text-amber-650 dark:bg-amber-950/20'
                              : 'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/20'
                          }`}>
                            {record.type === 'DUE' ? t('due') : t('paid')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm font-semibold space-y-2 py-20">
            <span className="text-4xl">👤</span>
            <p>Select a customer to view details, billing history, and record payments.</p>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100">{t('addNewCustomer')}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <CloseIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('name')} *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full px-4.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-base focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('phone')}</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder={t('phonePlaceholder')}
                  className="w-full px-4.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-base focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-base transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                {t('addCustomerBtn')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100">{t('recordPaymentTitle')}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <CloseIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('amount')} *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="₹ Amount to pay"
                  className="w-full px-4.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* UPI Payment / QR Section */}
              <UpiPaymentCard
                amount={parseFloat(amountStr) || selectedCustomer.outstandingBalance}
                note={`Khata_Payment_${selectedCustomer.name}`}
              />

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('description')}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cash or UPI paid"
                  className="w-full px-4.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-base focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-base transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                {t('save')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Manual Due Modal */}
      {showDueModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100">{t('recordDueTitle')}</h3>
              <button onClick={() => setShowDueModal(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <CloseIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleRecordDueSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('amount')} *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="₹ Amount to add as due"
                  className="w-full px-4.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-base focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('description')}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Flour purchased on credit"
                  className="w-full px-4.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-base focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-base transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                {t('save')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100">Edit Profile / विवरण बदलें</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-805 transition-colors cursor-pointer"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleEditCustomerSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('name')} *</label>
                <input
                  type="text"
                  required
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-855 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-555 uppercase tracking-wide">{t('phone')}</label>
                <input
                  type="text"
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  placeholder={t('phonePlaceholder')}
                  className="w-full h-11 px-4 bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-855 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 dark:text-slate-100 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-base transition-all shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-98"
              >
                Save / सुरक्षित करें
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customer QR Card Pass Modal */}
      <CustomerQrModal
        customer={customerForQr}
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </div>
  );
};
