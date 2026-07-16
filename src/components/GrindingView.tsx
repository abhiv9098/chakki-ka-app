'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PlusIcon, CheckIcon, CloseIcon } from './Icons';
import { InvoiceModal } from './InvoiceModal';
import { Order } from '../types';
import { dbService } from '../services/db';

const grainRates: Record<string, number> = {
  "Wheat (गेहूं)": 5,
  "Maize (मक्का)": 6,
  "Gram/Chana (चना)": 8,
  "Rice (चावल)": 6,
  "Barley (जौ)": 7,
  "Bajra (बाजरा)": 6,
  "Multigrain (मल्टीग्रेन)": 10,
  "Other (अन्य)": 5
};

export const GrindingView: React.FC = () => {
  const { customers, addCustomer, addOrder, t, language, setSelectedCustomer, setActiveView } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [grainType, setGrainType] = useState('Wheat (गेहूं)');
  const [weight, setWeight] = useState('');
  const [rate, setRate] = useState('5');
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT'>('CREDIT');

  const [totalAmount, setTotalAmount] = useState(0);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  // Update rate automatically when grain type changes
  useEffect(() => {
    if (grainRates[grainType]) {
      setRate(grainRates[grainType].toString());
    }
  }, [grainType]);

  // Calculate total amount
  useEffect(() => {
    const w = parseFloat(weight) || 0;
    const r = parseFloat(rate) || 0;
    setTotalAmount(parseFloat((w * r).toFixed(2)));
  }, [weight, rate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert(language === 'hi' ? 'कृपया ग्राहक का नाम लिखें!' : 'Please enter customer name!');
      return;
    }

    const nameVal = customerName.trim();
    const phoneVal = customerPhone.trim() || 'N/A';

    let targetCustomerId: number;
    let targetCustomerName = nameVal;

    // Check if customer already exists by phone (if phone is not N/A)
    const existingCustomer = (phoneVal !== 'N/A')
      ? customers.find(c => c.phone === phoneVal)
      : customers.find(c => c.name.toLowerCase() === nameVal.toLowerCase() && c.phone === 'N/A');

    if (existingCustomer) {
      targetCustomerId = existingCustomer.id;
      targetCustomerName = existingCustomer.name;
    } else {
      const newCust = addCustomer(nameVal, phoneVal);
      targetCustomerId = newCust.id;
      targetCustomerName = newCust.name;
    }

    const orderWeight = parseFloat(weight);
    const orderRate = parseFloat(rate);

    if (isNaN(orderWeight) || orderWeight <= 0 || isNaN(orderRate) || orderRate <= 0) return;

    const newOrder = addOrder({
      customerId: targetCustomerId,
      customerName: targetCustomerName,
      grainType,
      weight: orderWeight,
      rate: orderRate,
      totalAmount,
      paymentType
    });

    // Show invoice modal
    setSubmittedOrder(newOrder);

    // Reset form fields
    setWeight('');
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center text-lg shrink-0">
            🌾
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xl">


              {t('logNewGrinding')}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Enter customer weight details to log a new milling job.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/60 rounded-2xl">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'hi' ? 'ग्राहक का नाम' : 'Customer Name'} *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={language === 'hi' ? 'जैसे: रमेश कुमार' : 'e.g. Ramesh Kumar'}
                className="w-full h-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
                className="w-full h-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>
          </div>

          {/* Grinding Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">{t('grainType')} *</label>
              <select
                value={grainType}
                onChange={(e) => setGrainType(e.target.value)}
                className="w-full h-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold cursor-pointer"
              >
                {Object.keys(grainRates).map((grain) => (
                  <option key={grain} value={grain}>
                    {language === 'hi' ? grain.split(' ')[1]?.replace(/[()]/g, '') || grain : grain.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t('weight')} *</label>
              <input
                type="number"
                required
                min="0.1"
                step="0.05"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t('rate')} *</label>
              <input
                type="number"
                required
                min="0.5"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="Rate per kg"
                className="w-full h-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            {/* Auto Calculated Total */}
            <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-2xl p-4.5 flex items-center justify-between h-12 self-end">
              <span className="text-[10px] text-slate-400 dark:text-slate-550 font-extrabold uppercase tracking-wider">
                {t('totalAmount')}
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{totalAmount}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-lg tracking-wide transition-all shadow-xl shadow-emerald-500/15 cursor-pointer hover:-translate-y-0.5"
          >
            {t('logOrderBtn')}
          </button>
        </form>
      </div>

      {/* Invoice Modal for Submitted Order */}
      <InvoiceModal
        order={submittedOrder}
        isOpen={!!submittedOrder}
        onClose={() => {
          const custId = submittedOrder?.customerId;
          setSubmittedOrder(null);
          if (custId) {
            const cust = customers.find(c => c.id === custId);
            if (cust) {
              setSelectedCustomer(cust);
              setActiveView('customers');
            }
          }
        }}
      />
    </div>
  );
};



