'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GrindingIcon, CustomersIcon, KhataIcon, ReportsIcon, PlusIcon, ChevronRightIcon } from './Icons';
import { InvoiceModal } from './InvoiceModal';
import { Order } from '../types';

export const DashboardView: React.FC = () => {
  const { orders, customers, dailyHisabs, setActiveView, t, language, hideAmounts } = useApp();
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<Order | null>(null);

  // Today's Date String for Daily Hisab lookup
  const todayDateStr = (() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const todayHisab = dailyHisabs.find(h => h.date === todayDateStr);

  // Stats calculation
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const todayOrders = orders.filter(o => o.createdAt >= startOfToday);
  const todayEarningsCount = todayOrders.length;
  const todayEarningsAmount = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const activeCustomersCount = customers.filter(c => c.outstandingBalance > 0).length;
  const totalOutstandingAmount = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // Get recent 5 orders
  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const stats = [
    {
      label: t('todayOrders'),
      value: hideAmounts ? '••' : todayEarningsCount.toString(),
      icon: GrindingIcon,
      colorClass: 'from-emerald-500 to-teal-600',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/20',
      iconColor: 'text-emerald-500'
    },
    {
      label: t('todayEarnings'),
      value: hideAmounts ? '₹••••' : formatCurrency(todayEarningsAmount),
      icon: ReportsIcon,
      colorClass: 'from-teal-500 to-cyan-600',
      bgClass: 'bg-teal-50 dark:bg-teal-950/20',
      iconColor: 'text-teal-500'
    },
    {
      label: t('activeCustomers'),
      value: hideAmounts ? '••' : activeCustomersCount.toString(),
      icon: CustomersIcon,
      colorClass: 'from-blue-500 to-indigo-600',
      bgClass: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-500'
    },
    {
      label: t('totalOutstanding'),
      value: hideAmounts ? '₹••••' : formatCurrency(totalOutstandingAmount),
      icon: KhataIcon,
      colorClass: 'from-amber-500 to-orange-600',
      bgClass: 'bg-amber-50 dark:bg-amber-950/20',
      iconColor: 'text-amber-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 dark:hover:border-slate-750"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-normal">
                  {s.label}
                </span>
                <div className={`p-2 rounded-xl shrink-0 ${s.bgClass}`}>
                  <Icon className={s.iconColor} size={18} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  {s.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & Today's Hisab */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                {t('quickActions')}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5 font-medium">Common daily operations</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setActiveView('grinding')}
                className="flex flex-col items-center justify-center gap-2 p-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer h-26 border border-emerald-400/20"
              >
                <div className="p-2 rounded-xl bg-white/20 text-white">
                  <PlusIcon size={18} />
                </div>
                <span className="text-[10px] sm:text-xs leading-tight text-center font-bold">
                  {t('logNewGrinding')}
                </span>
              </button>

              <button
                onClick={() => setActiveView('daily-hisab')}
                className="flex flex-col items-center justify-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-150 dark:border-slate-800/80 text-slate-750 dark:text-slate-200 font-extrabold transition-all active:scale-95 cursor-pointer h-26"
              >
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
                  <ReportsIcon size={18} />
                </div>
                <span className="text-[10px] sm:text-xs leading-tight text-center font-bold">
                  {t('dailyHisab')}
                </span>
              </button>

              <button
                onClick={() => setActiveView('khata')}
                className="flex flex-col items-center justify-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-150 dark:border-slate-800/80 text-slate-750 dark:text-slate-200 font-extrabold transition-all active:scale-95 cursor-pointer h-26"
              >
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                  <KhataIcon size={18} />
                </div>
                <span className="text-[10px] sm:text-xs leading-tight text-center font-bold">
                  {t('receivePayment')}
                </span>
              </button>
            </div>
          </div>

          {/* Today's Daily Hisab Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-50 dark:border-slate-800/40">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-105 text-base">
                  {language === 'hi' ? 'आज का डेली हिसाब' : "Today's Daily Summary"}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">End-of-day P&L stats</p>
              </div>
              <button
                onClick={() => setActiveView('daily-hisab')}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 hover:underline cursor-pointer"
              >
                {language === 'hi' ? 'सभी देखें' : 'View All'}
              </button>
            </div>

            {todayHisab ? (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider block">
                      {t('netResult')}
                    </span>
                    <p className={`text-xl font-black mt-1 ${
                      todayHisab.isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {todayHisab.isProfit ? '+' : '-'} ₹{hideAmounts ? '••••' : todayHisab.amount}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase ${
                    todayHisab.isProfit
                      ? 'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-650 dark:bg-rose-950/30 dark:text-rose-450'
                  }`}>
                    {todayHisab.isProfit ? t('profit') : t('loss')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 bg-slate-50/30 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block">{t('wheatWeight')}</span>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mt-1 block">{todayHisab.wheatWeight} kg</span>
                  </div>
                  <div className="p-2.5 bg-slate-50/30 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block">{t('expenses')}</span>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mt-1 block">₹{todayHisab.expenses}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                  {language === 'hi' ? 'आज का हिसाब अभी दर्ज नहीं किया गया है।' : "Today's summary not logged yet."}
                </p>
                <button
                  onClick={() => setActiveView('daily-hisab')}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  {language === 'hi' ? 'हिसाब दर्ज करें' : 'Log Hisab Now'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 border-b border-slate-50 dark:border-slate-800/40 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                  {t('recentOrders')}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5 font-medium">Last 5 processing records</p>
              </div>
              <button
                onClick={() => setActiveView('grinding')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-450 hover:underline cursor-pointer"
              >
                {t('viewAll')}
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-14 text-center text-slate-400 text-sm font-semibold">
                🌾 {t('noOrdersYet')}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/40 overflow-hidden -mx-2">
                {recentOrders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString(
                    language === 'hi' ? 'hi-IN' : 'en-IN',
                    { day: '2-digit', month: 'short' }
                  );
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderForBill(order)}
                      className="py-3 px-3 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/30 rounded-xl transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold text-xs flex items-center justify-center border border-slate-100/50 dark:border-slate-750">
                          {order.grainType.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-sm">
                            {order.customerName}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                            {order.grainType} • {order.weight} kg @ ₹{order.rate}/kg
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-slate-900 dark:text-slate-55 text-sm">
                          {hideAmounts ? '₹••••' : `₹${order.totalAmount}`}
                        </p>
                        <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-black uppercase mt-1.5 ${
                          order.paymentType === 'CASH'
                            ? 'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-650 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          {order.paymentType === 'CASH' ? t('cash') : t('credit')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bill Viewer Invoice Modal */}
      <InvoiceModal
        order={selectedOrderForBill}
        isOpen={!!selectedOrderForBill}
        onClose={() => setSelectedOrderForBill(null)}
      />
    </div>
  );
};

