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

  // 7 days earnings data for Graph
  const nowTs = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const last7DaysData = Array.from({ length: 7 }).map((_, idx) => {
    const dayTimestamp = nowTs - (6 - idx) * oneDay;
    const dayDate = new Date(dayTimestamp);
    const dayName = dayDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short' });
    
    const dayOrders = orders.filter((o) => {
      const oDate = new Date(o.createdAt);
      return (
        oDate.getDate() === dayDate.getDate() &&
        oDate.getMonth() === dayDate.getMonth() &&
        oDate.getFullYear() === dayDate.getFullYear()
      );
    });

    const earnings = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { name: dayName, amount: earnings };
  });

  const maxEarning = Math.max(...last7DaysData.map(d => d.amount)) || 100;

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
    <div className="space-y-4">
      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 dark:hover:border-slate-750"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-normal">
                  {s.label}
                </span>
                <div className={`p-1.5 rounded-lg shrink-0 ${s.bgClass}`}>
                  <Icon className={s.iconColor} size={16} />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  {s.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Quick Actions & Weekly Graph */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                {t('quickActions')}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-550 font-medium">Common daily operations</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => setActiveView('grinding')}
                className="flex flex-col items-center justify-center gap-1.5 p-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer h-20 border border-emerald-400/20"
              >
                <div className="p-1.5 rounded-lg bg-white/20 text-white">
                  <PlusIcon size={16} />
                </div>
                <span className="text-[10px] leading-tight text-center font-bold">
                  {t('logNewGrinding')}
                </span>
              </button>

              <button
                onClick={() => setActiveView('daily-hisab')}
                className="flex flex-col items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-150 dark:border-slate-800/80 text-slate-750 dark:text-slate-200 font-extrabold transition-all active:scale-95 cursor-pointer h-20"
              >
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
                  <ReportsIcon size={16} />
                </div>
                <span className="text-[10px] leading-tight text-center font-bold">
                  {t('dailyHisab')}
                </span>
              </button>

              <button
                onClick={() => setActiveView('customers')}
                className="flex flex-col items-center justify-center gap-1.5 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-150 dark:border-slate-800/80 text-slate-750 dark:text-slate-200 font-extrabold transition-all active:scale-95 cursor-pointer h-20"
              >
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500">
                  <CustomersIcon size={16} />
                </div>
                <span className="text-[10px] leading-tight text-center font-bold">
                  {t('customers')}
                </span>
              </button>
            </div>
          </div>

          {/* Weekly Earnings Graph Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-50 dark:border-slate-800/40">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                  {language === 'hi' ? 'साप्ताहिक कमाई ग्राफ' : 'Weekly Revenue Graph'}
                </h3>
              </div>
              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
                7 Days
              </span>
            </div>

            {/* SVG Bar Chart */}
            <div className="h-[100px] flex items-end justify-between gap-1.5 px-1 pt-3 relative">
              {/* Gridlines */}
              <div className="absolute inset-x-0 bottom-[25%] border-b border-slate-100 dark:border-slate-800/40 pointer-events-none"></div>
              <div className="absolute inset-x-0 bottom-[50%] border-b border-slate-100 dark:border-slate-800/40 pointer-events-none"></div>
              <div className="absolute inset-x-0 bottom-[75%] border-b border-slate-100 dark:border-slate-800/40 pointer-events-none"></div>

              {last7DaysData.map((d, idx) => {
                const pct = (d.amount / maxEarning) * 100;
                const barHeight = Math.max(pct, 8);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative z-10">
                    <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity mb-0.5 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded shadow-sm border border-emerald-500/10 whitespace-nowrap">
                      {hideAmounts ? '₹••••' : `₹${d.amount.toFixed(0)}`}
                    </span>
                    <div
                      style={{ height: `${barHeight}%` }}
                      className="w-full max-w-[20px] bg-gradient-to-t from-emerald-500 to-teal-400 dark:from-emerald-500 dark:to-teal-350 rounded-t group-hover:scale-y-[1.04] origin-bottom transition-all duration-200 shadow-sm shadow-emerald-500/10 cursor-pointer"
                    ></div>
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                      {d.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Orders Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-50 dark:border-slate-800/40 pb-2.5">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                  {t('recentOrders')}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-550 font-medium">Last 5 processing records</p>
              </div>
              <button
                onClick={() => setActiveView('grinding')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-450 hover:underline cursor-pointer"
              >
                {t('viewAll')}
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                🌾 {t('noOrdersYet')}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/40 overflow-hidden -mx-1">
                {recentOrders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString(
                    language === 'hi' ? 'hi-IN' : 'en-IN',
                    { day: '2-digit', month: 'short' }
                  );
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderForBill(order)}
                      className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/30 rounded-xl transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold text-[11px] flex items-center justify-center border border-slate-100/50 dark:border-slate-750">
                          {order.grainType.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-xs sm:text-sm">
                            {order.customerName}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                            {order.grainType} • {order.weight} kg @ ₹{order.rate}/kg
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-slate-900 dark:text-slate-55 text-xs sm:text-sm">
                          {hideAmounts ? '₹••••' : `₹${order.totalAmount}`}
                        </p>
                        <span className={`inline-block text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase mt-1 ${
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

