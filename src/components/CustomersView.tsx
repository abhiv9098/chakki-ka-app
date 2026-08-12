import React, { useState } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { SearchIcon, PlusIcon, CheckIcon, CloseIcon, KhataIcon, WhatsAppIcon, QrCodeIcon, PotaliIcon } from './Icons';
import { Customer, Order, CreditRecord } from '../types';
import { UpiPaymentCard } from './UpiPaymentCard';
import { CustomerQrModal } from './CustomerQrModal';

export const CustomersView: React.FC = () => {
  const grainOptions = [
    "Wheat", "Atta", "Maize", "Gram/Chana", "Rice",
    "Barley", "Bajra", "Multigrain", "Other"
  ];
  const grainLabels: Record<string, { hi: string; en: string }> = {
    Wheat: { hi: "Wheat (गेहूं)", en: "Wheat" },
    Atta: { hi: "Atta (आटा)", en: "Atta" },
    Maize: { hi: "Maize (मक्का)", en: "Maize" },
    "Gram/Chana": { hi: "Gram/Chana (चना)", en: "Gram/Chana" },
    Rice: { hi: "Rice (चावल)", en: "Rice" },
    Barley: { hi: "Barley (जौ)", en: "Barley" },
    Bajra: { hi: "Bajra (बाजरा)", en: "Bajra" },
    Multigrain: { hi: "Multigrain (मल्टीग्रेन)", en: "Multigrain" },
    Other: { hi: "Other (अन्य)", en: "Other" }
  };

  const {
    customers,
    orders,
    creditRecords,
    addCustomer,
    updateCustomer,
    updateCustomerPotaliStatus,
    cycleCustomerPotaliStatus,
    recordPayment,
    recordManualDue,
    selectedCustomer,
    setSelectedCustomer,
    deleteCustomer,
    setActiveView,
    t,
    language,
    hideAmounts,
    upiId,
    dailyHisabs,
    addDailyHisab,
    updateDailyHisab,
    addOrder,
    defaultGrindingRate,
    grainRates
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Payment/Charge action modals inside customer details
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDueModal, setShowDueModal] = useState(false);
  const [selectedHisabForDelivery, setSelectedHisabForDelivery] = useState<any>(null);
  const [actionCustomer, setActionCustomer] = useState<Customer | null>(null);

  // Edit profile states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');

  // QR Pass Card state
  const [showQrModal, setShowQrModal] = useState(false);
  const [customerForQr, setCustomerForQr] = useState<Customer | null>(null);

  // New Hisab Modal states
  const [showNewHisabModal, setShowNewHisabModal] = useState(false);
  const [entryGrainType, setEntryGrainType] = useState('Wheat');
  const [entryWeight, setEntryWeight] = useState('');
  const [entryRate, setEntryRate] = useState<string>('5');
  const [entryPaymentMode, setEntryPaymentMode] = useState<'CASH' | 'PAYTM' | 'UDHAR' | 'PENDING'>('PENDING');
  const [entryJamaAmount, setEntryJamaAmount] = useState('');

  const isSubmittingRef = React.useRef(false);

  React.useEffect(() => {
    const handleGlobalNewHisab = () => {
      if (!selectedCustomer) {
        alert(language === 'hi' ? 'कृपया पहले एक ग्राहक चुनें!' : 'Please select a customer first!');
      } else {
        setShowNewHisabModal(true);
      }
    };
    window.addEventListener('open-new-hisab-global', handleGlobalNewHisab);
    return () => {
      window.removeEventListener('open-new-hisab-global', handleGlobalNewHisab);
    };
  }, [selectedCustomer, language]);

  React.useEffect(() => {
    const fixedRate = grainRates[entryGrainType] !== undefined ? grainRates[entryGrainType] : (parseFloat(defaultGrindingRate) || 5);
    setEntryRate(String(fixedRate));
  }, [entryGrainType, grainRates, defaultGrindingRate]);

  const handleNewHisabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    const targetCust = actionCustomer || selectedCustomer;
    if (!targetCust) return;
    
    isSubmittingRef.current = true;
    try {
      const weightVal = parseFloat(entryWeight);
      const rateVal = parseFloat(entryRate);
      if (isNaN(weightVal) || weightVal <= 0) {
        alert(language === 'hi' ? 'कृपया पिसाई का वजन लिखें!' : 'Please enter grain weight!');
        isSubmittingRef.current = false;
        return;
      }
      if (isNaN(rateVal) || rateVal < 0) {
        alert(language === 'hi' ? 'कृपया सही रेट लिखें!' : 'Please enter valid rate!');
        isSubmittingRef.current = false;
        return;
      }

      const netAmount = Math.round(weightVal * rateVal * 10) / 10;
      const jamaVal = entryPaymentMode === 'UDHAR' ? (parseFloat(entryJamaAmount) || 0) : netAmount;
      const remainingUdhar = Math.max(0, netAmount - jamaVal);

      const todayObj = new Date();
      const yyyy = todayObj.getFullYear();
      const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
      const dd = String(todayObj.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

    const finalExpenseDesc = entryPaymentMode === 'PENDING'
      ? `PENDING_POTALI (₹${netAmount.toFixed(0)} Pending)`
      : (entryPaymentMode === 'UDHAR' && jamaVal > 0)
      ? `UDHAR (Jama: ₹${jamaVal.toFixed(0)}, Udhar: ₹${remainingUdhar.toFixed(0)})`
      : entryPaymentMode;

    addDailyHisab({
      date: todayStr,
      grainType: entryGrainType,
      wheatWeight: weightVal,
      rate: rateVal,
      revenue: netAmount,
      expenses: 0,
      expenseDescription: finalExpenseDesc,
      extraIncome: 0,
      incomeDescription: targetCust.name,
      isProfit: true,
      amount: netAmount,
      notes: targetCust.name,
      isPending: entryPaymentMode === 'PENDING'
    });

    updateCustomerPotaliStatus(targetCust.id, 'received');

    if (entryPaymentMode === 'UDHAR' && jamaVal > 0) {
      // addOrder with CREDIT will add the FULL amount to the balance.
      // So we record a PAID transaction for the Jama amount, leaving the correct remaining balance.
      recordPayment(targetCust.id, jamaVal, `Jama for ${entryGrainType} Grinding`);
    }



    if (entryPaymentMode !== 'PENDING') {
      let paymentType: 'CASH' | 'CREDIT' | 'ONLINE' | 'PAYTM' = 'CASH';
      if (entryPaymentMode === 'PAYTM') paymentType = 'PAYTM';
      else if (entryPaymentMode === 'UDHAR') paymentType = 'CREDIT';
      
      addOrder({
        customerId: targetCust.id,
        customerName: targetCust.name,
        grainType: entryGrainType,
        weight: weightVal,
        rate: rateVal,
        totalAmount: netAmount,
        paymentType: paymentType,
        potaliStatus: 'delivered'
      });
    }

      setShowNewHisabModal(false);
      setActionCustomer(null);
      setEntryWeight('');
      setEntryPaymentMode('PENDING');
      setEntryJamaAmount('');
      alert(t('hisabSaved'));
      
      // We do NOT reset isSubmitting to false here because the modal is closing.
      // Keeping it true prevents any queued double-clicks from firing again before unmount.
      setTimeout(() => { isSubmittingRef.current = false; }, 500); // reset after a delay just in case
    } catch (e) {
      console.error(e);
      isSubmittingRef.current = false;
    }
  };

  const handleMarkDelivered = (hisab: any, mode: 'CASH' | 'PAYTM' | 'UDHAR' | 'KEEP') => {
    let updatedDesc = hisab.expenseDescription || 'CASH';
    if (mode === 'CASH') updatedDesc = 'CASH';
    else if (mode === 'PAYTM') updatedDesc = 'PAYTM';
    else if (mode === 'UDHAR') updatedDesc = `UDHAR (Jama: ₹0, Udhar: ₹${hisab.amount.toFixed(0)})`;
    else if (mode === 'KEEP' && updatedDesc.includes('PENDING')) updatedDesc = 'CASH';

    const updatedHisab = {
      ...hisab,
      isPending: false,
      expenseDescription: updatedDesc
    };

    updateDailyHisab(updatedHisab);

    if (selectedCustomer) {
      updateCustomerPotaliStatus(selectedCustomer.id, 'delivered');
      
      let paymentType: 'CASH' | 'CREDIT' | 'ONLINE' | 'PAYTM' = 'CASH';
      if (mode === 'PAYTM') paymentType = 'PAYTM';
      else if (mode === 'UDHAR') paymentType = 'CREDIT';
      
      addOrder({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        grainType: hisab.grainType || 'Grinding',
        weight: hisab.wheatWeight || 0,
        rate: hisab.rate || 0,
        totalAmount: hisab.amount || 0,
        paymentType: paymentType,
        potaliStatus: 'delivered'
      });
    }

    setSelectedHisabForDelivery(null);
    alert(
      language === 'hi'
        ? '✅ पिसाई व डिलीवरी सफलता पूर्वक पूर्ण दर्ज की गई!'
        : '✅ Grinding & delivery marked as completed!'
    );
  };

  const handleSendWhatsAppReminder = async (customer: Customer) => {
    const rawPhone = customer.phone.replace(/\D/g, '');
    const finalPhone = rawPhone.length >= 10 ? (rawPhone.length === 10 ? `91${rawPhone}` : rawPhone) : '';
    const dueVal = customer.outstandingBalance;
    const formattedDue = dueVal % 1 === 0 ? dueVal.toFixed(0) : dueVal.toFixed(2);

    let upiString = '';
    if (upiId && dueVal > 0) {
      upiString = `\n\n💳 *UPI ID:* *${upiId}*`;
    }

    const message = language === 'hi'
      ? `🌾 *विश्वकर्मा आटा चक्की*\n\nनमस्ते ${customer.name},\nआपका कुल बकाया उधारी: *₹${formattedDue}* है।${upiString}\n\nकृपया इसे जल्द ही क्लियर करें। धन्यवाद! 🙏`
      : `🌾 *Vishwakarma Atta Chakki*\n\nHello ${customer.name},\nYour total outstanding balance is: *₹${formattedDue}*.${upiString}\n\nPlease clear it at your earliest convenience. Thank you! 🙏`;

    // Generate Payment QR Image if UPI ID exists
    let qrDataUrl = '';
    if (upiId && dueVal > 0) {
      try {
        const qrPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=VishwakarmaChakki&am=${formattedDue}&cu=INR&tn=Udhar_${customer.name}`;
        qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 300,
          margin: 2,
          color: { dark: '#047857', light: '#FFFFFF' }
        });
      } catch (err) {
        console.error("QR generation failed for WhatsApp reminder:", err);
      }
    }

    // Try Web Share API with QR image file (sends QR image file directly)
    if (qrDataUrl && navigator.share) {
      try {
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `Payment_QR_${customer.name}_Rs${formattedDue}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Udhar Payment QR - ₹${formattedDue}`,
            text: message,
            files: [file]
          });
          return;
        }
      } catch (err) {
        console.log("Web share with image fallback to URL:", err);
      }
    }

    // Direct WhatsApp Link fallback
    const waUrl = finalPhone
      ? `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
  };

  const filteredCustomers: Customer[] = customers
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    )
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const phoneVal = newCustPhone.trim() || 'N/A';
    const newCust = addCustomer(newCustName.trim(), phoneVal);
    setNewCustName('');
    setNewCustPhone('');
    setShowAddModal(false);
    setSelectedCustomer(newCust); // auto-select new customer
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

  const submitPayment = (mode: 'CASH' | 'UPI') => {
    if (isSubmittingRef.current) return;
    const targetCust = actionCustomer || selectedCustomer;
    if (!targetCust) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'hi' ? 'कृपया सही रकम डालें!' : 'Please enter a valid amount!');
      return;
    }
    
    isSubmittingRef.current = true;
    try {
      recordPayment(targetCust.id, amount, mode === 'UPI' ? 'UPI / Paytm' : 'Cash');
      
      const todayObj = new Date();
      const yyyy = todayObj.getFullYear();
      const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
      const dd = String(todayObj.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      addDailyHisab({
        date: todayStr,
        wheatWeight: 0,
        rate: 0,
        amount: amount,
        revenue: amount,
        expenses: 0,
        expenseDescription: mode === 'UPI' ? 'PAYTM' : 'CASH',
        incomeDescription: targetCust.name,
        isProfit: true,
        notes: `Jama: ${notes.trim() || 'Payment Received'}`,
        isPending: false,
      });

      setAmountStr('');
      setNotes('');
      setShowPaymentModal(false);
      setActionCustomer(null);
      setTimeout(() => { isSubmittingRef.current = false; }, 500);
    } catch (e) {
      isSubmittingRef.current = false;
    }
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPayment('CASH'); // fallback
  };

  const handleRecordDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    const targetCust = actionCustomer || selectedCustomer;
    if (!targetCust) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    
    isSubmittingRef.current = true;
    try {
      recordManualDue(targetCust.id, amount, notes.trim() || 'Manual Due Charge');
      
      const todayObj = new Date();
      const yyyy = todayObj.getFullYear();
      const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
      const dd = String(todayObj.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      addDailyHisab({
        date: todayStr,
        wheatWeight: 0,
        rate: 0,
        amount: amount,
        revenue: amount,
        expenses: 0,
        expenseDescription: `UDHAR (Jama: ₹0, Udhar: ₹${amount.toFixed(0)})`,
        incomeDescription: targetCust.name,
        isProfit: true,
        notes: notes.trim() || 'Manual Due Charge',
        isPending: false,
      });

      setAmountStr('');
      setNotes('');
      setShowDueModal(false);
      setActionCustomer(null);
      setTimeout(() => { isSubmittingRef.current = false; }, 500);
    } catch (e) {
      isSubmittingRef.current = false;
    }
  };

  // Get customer specific orders & credit transactions
  const customerOrders = orders
    .filter((o) => o.customerId === selectedCustomer?.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  const customerCredits = creditRecords
    .filter((r) => r.customerId === selectedCustomer?.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  const custTotalWeight = customerOrders.reduce((sum, o) => sum + (o.weight || 0), 0);
  const custTotalAmount = customerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const custTotalDue = selectedCustomer?.outstandingBalance || 0;

  const pendingHisabsForCustomer = dailyHisabs
    .filter(h => h.isPending && (h.incomeDescription === selectedCustomer?.name || h.notes === selectedCustomer?.name))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const custPendingAmount = pendingHisabsForCustomer.reduce((sum, h) => sum + (h.amount || h.revenue || 0), 0);

  return (
    <div className="h-auto md:h-[calc(100vh-140px)] w-full">
      {/* Customer List Pane */}
      {!selectedCustomer && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex flex-col h-auto md:h-full shadow-sm overflow-hidden min-h-[350px] max-w-4xl mx-auto w-full animate-fade-in">
        {/* Header Actions */}
        <div className="mb-4">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
            {t('customerList')}
          </h3>
        </div>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t('searchCustomer')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* List scroll */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 pt-1 pb-2">
          {filteredCustomers.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-sm font-semibold">
              🔍 {t('noCustomersYet')}
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const custPending = dailyHisabs
                .filter(h => h.isPending && (h.incomeDescription === cust.name || h.notes === cust.name))
                .reduce((sum, h) => sum + (h.amount || h.revenue || 0), 0);
              
              const custPendingWeight = dailyHisabs
                .filter(h => h.isPending && (h.incomeDescription === cust.name || h.notes === cust.name))
                .reduce((sum, h) => sum + (h.wheatWeight || 0), 0);
              
              const custTotalAmount = orders
                .filter(o => o.customerId === cust.id)
                .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                
              const custTotalWeight = orders
                .filter(o => o.customerId === cust.id)
                .reduce((sum, o) => sum + (o.wheatWeight || 0), 0);
                
              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    cycleCustomerPotaliStatus(cust.id);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl flex justify-between items-center transition-all duration-200 cursor-pointer border shadow-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                        {cust.name}
                      </h4>
                      {cust.potaliStatus === 'received' && (
                        <span className="text-xs" title="Potali Apne Paas (Shop)">🔴</span>
                      )}
                      {cust.potaliStatus === 'delivered' && (
                        <span className="text-xs" title="Potali De Di (Customer)">🟢</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                      📞 {cust.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 shrink-0">
                    <div className="text-right flex flex-col items-end gap-1.5 mt-0.5">
                      {cust.outstandingBalance > 0 && (
                        <span className="inline-block text-xs font-black px-2.5 py-1 rounded-xl transition-all bg-amber-50 text-amber-650 dark:bg-amber-950/30 dark:text-amber-400">
                          {hideAmounts ? '₹••••' : `₹${cust.outstandingBalance.toFixed(0)}`}
                        </span>
                      )}
                      {(custPending > 0 || custPendingWeight > 0) && (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 break-words max-w-[120px] text-right leading-tight">
                          Pending: {custPendingWeight > 0 ? `${custPendingWeight}kg ` : ''}{custPending > 0 ? (hideAmounts ? '₹••••' : `(₹${custPending.toFixed(0)})`) : ''}
                        </span>
                      )}
                      {(custTotalAmount > 0 || custTotalWeight > 0) && (
                        <span className="inline-block text-[10px] font-bold text-slate-500 dark:text-slate-400 break-words max-w-[120px] text-right leading-tight">
                          Total: {custTotalWeight > 0 ? `${custTotalWeight}kg ` : ''}{custTotalAmount > 0 ? (hideAmounts ? '₹••••' : `(₹${custTotalAmount.toFixed(0)})`) : ''}
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
        </div>
      )}

      {/* Customer Detail Pane */}
      {selectedCustomer && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 md:p-6 shadow-sm flex flex-col h-auto md:h-full overflow-hidden min-h-[450px] max-w-5xl mx-auto w-full animate-fade-in">
          <div className="flex flex-col h-auto md:h-full overflow-hidden">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 md:pb-5 gap-3.5 md:gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-2 -ml-2 mr-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                    title="Back to Customers"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <h3 className="font-black text-xl md:text-2xl text-slate-850 dark:text-slate-50 flex items-center gap-2">
                    {selectedCustomer.name}
                    {selectedCustomer.potaliStatus === 'received' && (
                      <span className="text-lg" title="Potali Apne Paas (Shop)">🔴</span>
                    )}
                    {selectedCustomer.potaliStatus === 'delivered' && (
                      <span className="text-lg" title="Potali De Di (Customer)">🟢</span>
                    )}
                  </h3>
                  <button
                    onClick={() => {
                      setEditCustName(selectedCustomer.name);
                      setEditCustPhone(selectedCustomer.phone === 'N/A' ? '' : selectedCustomer.phone);
                      setShowEditModal(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={t('editNamePhone')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 transition-colors cursor-pointer"
                    title={t('deleteCustomerTooltip')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </div>
                
                {/* KPI Summary Cards */}
                <div className="mt-4 mb-2">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-4 text-center">
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mb-1 uppercase tracking-wide">Total Weight</p>
                      <p className="text-slate-800 dark:text-slate-100 font-bold text-base">{hideAmounts ? '••• KG' : `${custTotalWeight.toFixed(1)} KG`}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-4 text-center">
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mb-1 uppercase tracking-wide">Total Amount</p>
                      <p className="text-emerald-500 font-bold text-base">{hideAmounts ? '₹••••' : `₹${custTotalAmount.toFixed(2)}`}</p>
                    </div>
                  </div>
                  <div className={`grid gap-3 ${custPendingAmount > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-4 text-center w-full">
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mb-1 uppercase tracking-wide">Total Due</p>
                      <p className="text-rose-500 font-bold text-base">{hideAmounts ? '₹••••' : `₹${custTotalDue.toFixed(2)}`}</p>
                    </div>
                    {custPendingAmount > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl shadow-sm p-4 text-center w-full animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-400/50"></div>
                        <p className="text-amber-500 font-black text-lg leading-tight mt-0.5">{hideAmounts ? '₹••••' : `₹${custPendingAmount.toFixed(0)}`}</p>
                        <p className="text-[10px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-widest mt-1">Pending</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-550">
                    {t('registeredDate')} {new Date(selectedCustomer.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')}
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
                      ➕ {t('addPhone')}
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
                        <button
                          onClick={() => handleSendWhatsAppReminder(selectedCustomer)}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 border border-emerald-500/10 cursor-pointer whitespace-nowrap shrink-0"
                          title={t('sendReminder')}
                        >
                          <WhatsAppIcon size={11} /> {t('sendReminder')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Outstanding Card */}
              <div className="bg-white dark:bg-slate-800 p-3.5 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between w-full sm:w-auto sm:min-w-[260px] transition-all hover:shadow-md">
                <div>
                  <span className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-550 font-extrabold uppercase tracking-wider">{t('outstanding')}</span>
                  <p className={`font-black text-lg md:text-xl mt-0.5 ${
                    selectedCustomer.outstandingBalance > 0 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-450'
                  }`}>
                    {hideAmounts ? '₹••••' : `₹${selectedCustomer.outstandingBalance % 1 === 0 ? selectedCustomer.outstandingBalance.toFixed(0) : selectedCustomer.outstandingBalance.toFixed(2)}`}
                  </p>
                </div>
                <div className="flex gap-1.5 ml-4">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="h-9 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-extrabold transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
                  >
                    Receive
                  </button>
                </div>
              </div>
            </div>



            {/* Bottom Section Layout: Grinding Orders */}
            <div className="flex-1 flex flex-col gap-6 mt-6 min-h-0">
              {/* Grinding History */}
              <div className="flex flex-col h-auto overflow-hidden">
                <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm mb-3">
                  🌾 {t('grindingOrders')}
                </h4>
                <div className="max-h-[320px] overflow-y-auto border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/10 space-y-2.5">
                  {customerOrders.length === 0 && pendingHisabsForCustomer.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold py-12">
                      {t('noOrdersYet')}
                    </div>
                  ) : (
                    <>
                      {/* Render Pending Hisabs First */}
                      {pendingHisabsForCustomer.map((hisab) => (
                        <div 
                          key={hisab.id} 
                          onClick={() => setSelectedHisabForDelivery(hisab)}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center rounded-2xl transition-all hover:shadow-md opacity-80 border-dashed cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{hisab.grainType}</p>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                              {hisab.wheatWeight} kg • ₹{hisab.rate}/kg • {new Date(hisab.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-850 dark:text-slate-100">₹{hisab.amount}</p>
                            <span className="inline-block text-[9px] px-2 py-0.5 rounded-full font-black uppercase mt-1 bg-rose-50 text-rose-600 dark:bg-rose-950/30">
                              ⏳ {language === 'hi' ? 'पेंडिंग' : 'PENDING'}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Render Completed Orders */}
                      {customerOrders.map((order) => (
                        <div key={order.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center rounded-2xl transition-all hover:shadow-md">
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
                                    {language === 'hi' ? 'नकद (CASH)' : 'CASH'}
                                  </span>
                                );
                              }
                              if (order.paymentType === 'PAYTM' || order.paymentType === 'ONLINE') {
                                return (
                                  <span className="inline-block text-[9px] px-2 py-0.5 rounded-full font-black uppercase mt-1 bg-blue-50 text-blue-600 dark:bg-blue-950/20">
                                    UPI (Online)
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
                      ))}
                    </>
                  )}
                </div>
              </div>


            </div>
          </div>
        </div>
      )}

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
      {showPaymentModal && (actionCustomer || selectedCustomer) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100">{t('recordPaymentTitle')}</h3>
              <button onClick={() => { setShowPaymentModal(false); setActionCustomer(null); }} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <CloseIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('amount')} *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="₹ Amount to pay"
                  className="w-full px-4.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => submitPayment('CASH')}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-base transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  💵 {language === 'hi' ? 'CASH' : 'CASH'}
                </button>
                <button
                  type="button"
                  onClick={() => submitPayment('UPI')}
                  className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-extrabold rounded-xl text-base transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  📱 {language === 'hi' ? 'UPI' : 'UPI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Manual Due Modal */}
      {showDueModal && (actionCustomer || selectedCustomer) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100">{t('recordDueTitle')}</h3>
              <button onClick={() => { setShowDueModal(false); setActionCustomer(null); }} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <CloseIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleRecordDueSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('amount')} *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
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
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100">{t('editProfile')}</h3>
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
                {t('save')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Hisab Modal */}
      {showNewHisabModal && (actionCustomer || selectedCustomer) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100">➕ {language === 'hi' ? 'नया हिसाब' : 'New Hisab'}</h3>
              <button
                type="button"
                onClick={() => { setShowNewHisabModal(false); setActionCustomer(null); }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-805 transition-colors cursor-pointer"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleNewHisabSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('grain')}</label>
                  <select
                    value={entryGrainType}
                    onChange={(e) => setEntryGrainType(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  >
                    {grainOptions.map(opt => (
                      <option key={opt} value={opt}>
                        {grainLabels[opt]?.[language as 'hi' | 'en'] || opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('weight')}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={entryWeight}
                    onChange={(e) => setEntryWeight(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('ratePerKg')}</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={entryRate}
                  onChange={(e) => setEntryRate(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('payment')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryPaymentMode('PENDING')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      entryPaymentMode === 'PENDING'
                        ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    ⏳ {t('pendingUdhar')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryPaymentMode('CASH')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      entryPaymentMode === 'CASH'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    💵 {t('cashPayment')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryPaymentMode('PAYTM')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      entryPaymentMode === 'PAYTM'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    📱 {t('onlinePayment')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryPaymentMode('UDHAR')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      entryPaymentMode === 'UDHAR'
                        ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    📒 {t('udharPayment')}
                  </button>
                </div>
              </div>

              {entryPaymentMode === 'UDHAR' && (
                <div className="space-y-1 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/50 mt-3 animate-fade-in">
                  <label className="text-xs font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wide">
                    {t('jamaAmountOptional')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={entryJamaAmount}
                    onChange={(e) => setEntryJamaAmount(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full h-11 px-4 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 rounded-xl text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold mt-1">
                    {t('totalBill').replace('{amount}', String(Math.round((parseFloat(entryWeight) || 0) * (parseFloat(entryRate) || 0) * 10) / 10))}, 
                    {t('remainingUdhar').replace('{amount}', String(Math.max(0, (Math.round((parseFloat(entryWeight) || 0) * (parseFloat(entryRate) || 0) * 10) / 10) - (parseFloat(entryJamaAmount) || 0)).toFixed(0)))}
                  </p>
                </div>
              )}



              <button
                type="submit"
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-xl text-base transition-all shadow-lg shadow-blue-500/20 cursor-pointer active:scale-[0.98] mt-4"
              >
                {t('save')}
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

      {/* Mark Delivered Modal */}
      {selectedHisabForDelivery && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedHisabForDelivery(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-[95%] max-w-sm rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden my-auto p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg">
                  {language === 'hi' ? 'डिलीवरी भुगतान' : 'Delivery Payment'}
                </h4>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                  {selectedHisabForDelivery.grainType} - {selectedHisabForDelivery.wheatWeight}kg
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

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
                {language === 'hi' ? 'ग्राहक ने कैसे भुगतान किया?' : 'How did customer pay?'}
              </label>

              <button
                type="button"
                onClick={() => handleMarkDelivered(selectedHisabForDelivery, 'CASH')}
                className="w-full p-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.98]"
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
                className="w-full p-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 border border-blue-300 dark:border-blue-800 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.98]"
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
                className="w-full p-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.98]"
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
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
