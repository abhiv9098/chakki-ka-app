'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export const ReportsView: React.FC = () => {
  const { orders, t, hideAmounts } = useApp();

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // 1. Calculations for Daily, Weekly, Monthly Totals
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const startOfToday = todayStart.getTime();
  const startOfLast7Days = now - 7 * oneDay;
  const startOfLast30Days = now - 30 * oneDay;

  const todayOrders = orders.filter(o => o.createdAt >= startOfToday);
  const todayEarnings = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const weeklyOrders = orders.filter(o => o.createdAt >= startOfLast7Days);
  const weeklyEarnings = weeklyOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const monthlyOrders = orders.filter(o => o.createdAt >= startOfLast30Days);
  const monthlyEarnings = monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // 2. Grinding distribution by grain type
  const grainStats: Record<string, { weight: number; count: number; amount: number }> = {};
  orders.forEach((o) => {
    if (!grainStats[o.grainType]) {
      grainStats[o.grainType] = { weight: 0, count: 0, amount: 0 };
    }
    grainStats[o.grainType].weight += o.weight;
    grainStats[o.grainType].count += 1;
    grainStats[o.grainType].amount += o.totalAmount;
  });

  const totalProcessedWeight = Object.values(grainStats).reduce((sum, g) => sum + g.weight, 0) || 1;

  // 3. Last 7 Days earnings data for SVG chart
  const last7DaysData = Array.from({ length: 7 }).map((_, idx) => {
    const dayTimestamp = now - (6 - idx) * oneDay;
    const dayDate = new Date(dayTimestamp);
    const dayName = dayDate.toLocaleDateString(undefined, { weekday: 'short' });
    
    // filter orders on that calendar date
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

  // Colors mapping for grains
  const grainColor: Record<string, string> = {
    "Wheat (गेहूं)": "bg-amber-500 text-amber-500",
    "Maize (मक्का)": "bg-yellow-600 text-yellow-600",
    "Gram/Chana (चना)": "bg-orange-500 text-orange-500",
    "Rice (चावल)": "bg-blue-400 text-blue-400",
    "Barley (जौ)": "bg-emerald-600 text-emerald-600",
    "Bajra (बाजरा)": "bg-stone-500 text-stone-550",
    "Multigrain (मल्टीग्रेन)": "bg-purple-500 text-purple-500",
    "Other (अन्य)": "bg-slate-400 text-slate-400"
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Today</span>
          <div className="mt-4">
            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-50">{hideAmounts ? '₹••••' : `₹${todayEarnings.toFixed(0)}`}</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-wide">
              {hideAmounts ? '••' : todayOrders.length} Grinding Jobs
            </p>
          </div>
        </div>

        {/* Weekly Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Weekly (7d)</span>
          <div className="mt-4">
            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-55">{hideAmounts ? '₹••••' : `₹${weeklyEarnings.toFixed(0)}`}</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-wide">
              {hideAmounts ? '••' : weeklyOrders.length} Grinding Jobs
            </p>
          </div>
        </div>

        {/* Monthly Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Monthly (30d)</span>
          <div className="mt-4">
            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-55">{hideAmounts ? '₹••••' : `₹${monthlyEarnings.toFixed(0)}`}</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-wide">
              {hideAmounts ? '••' : monthlyOrders.length} Grinding Jobs
            </p>
          </div>
        </div>

        {/* Total Jobs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">All-Time Orders</span>
          <div className="mt-4">
            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-50">{hideAmounts ? '••' : orders.length}</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-wide">
              Total Managed Orders
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-base">
              {t('weeklyEarnings')}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Daily processing volume tracker</p>
          </div>

          {/* SVG Bar Chart with subtle gridlines */}
          <div className="flex-1 min-h-[220px] flex items-end justify-between gap-3 px-2.5 pt-8 relative">
            {/* Gridlines */}
            <div className="absolute inset-x-0 bottom-[20%] border-b border-slate-100 dark:border-slate-800/40 pointer-events-none"></div>
            <div className="absolute inset-x-0 bottom-[50%] border-b border-slate-100 dark:border-slate-800/40 pointer-events-none"></div>
            <div className="absolute inset-x-0 bottom-[80%] border-b border-slate-100 dark:border-slate-800/40 pointer-events-none"></div>

            {last7DaysData.map((d, idx) => {
              const pct = (d.amount / maxEarning) * 100;
              const barHeight = Math.max(pct, 5); // min height 5% for visibility
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative z-10">
                  {/* Tooltip value */}
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded shadow-sm border border-emerald-500/10">
                    {hideAmounts ? '₹••••' : `₹${d.amount.toFixed(0)}`}
                  </span>
                  
                  {/* Bar */}
                  <div
                    style={{ height: `${barHeight}%` }}
                    className="w-full max-w-[36px] bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-500 dark:to-emerald-350 rounded-t-xl group-hover:scale-y-[1.03] origin-bottom transition-all duration-200 shadow-md shadow-emerald-500/10 cursor-pointer"
                  ></div>

                  {/* Day label */}
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-3">
                    {d.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grain share chart */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-base">
              {t('grainShare')}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Grain-wise processing weight ratio</p>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4.5 mt-6">
            {Object.keys(grainStats).length === 0 ? (
              <div className="text-center text-slate-400 text-xs font-semibold py-12">
                No grain stats recorded yet.
              </div>
            ) : (
              Object.entries(grainStats)
                .sort((a, b) => b[1].weight - a[1].weight)
                .map(([grain, stats]) => {
                  const sharePct = (stats.weight / totalProcessedWeight) * 100;
                  const grainName = grain.split(' ')[0];
                  const color = grainColor[grain] || 'bg-slate-400 text-slate-400';
                  
                  return (
                    <div key={grain} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="font-extrabold">{grainName}</span>
                        <span className="font-extrabold text-slate-500">{sharePct.toFixed(0)}% ({stats.weight} kg)</span>
                      </div>
                      
                      {/* Bar Wrapper */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${sharePct}%` }}
                          className={`h-full rounded-full ${color.split(' ')[0]}`}
                        ></div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
