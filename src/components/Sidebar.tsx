'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  DashboardIcon,
  CustomersIcon,
  GrindingIcon,
  KhataIcon,
  ProfileIcon,
  SunIcon,
  MoonIcon,
  GlobeIcon,
  CloseIcon,
  FileTextIcon
} from './Icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeView, setActiveView, theme, toggleTheme, language, setLanguage, t } = useApp();

  const navItems = [
    { view: 'dashboard' as const, label: t('dashboard'), icon: DashboardIcon },
    { view: 'grinding' as const, label: t('grindingOrders'), icon: GrindingIcon },
    { view: 'customers' as const, label: t('customers'), icon: CustomersIcon },
    { view: 'khata' as const, label: t('khataLedger'), icon: KhataIcon },
    { view: 'daily-hisab' as const, label: t('dailyHisab'), icon: FileTextIcon },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Mobile Drawer (Slide-out Sidebar) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-5 flex flex-col z-50 transition-all duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* App Logo/Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-lg shadow-md shadow-emerald-500/10 shrink-0">
              🌾
            </div>
            <div>
              <h1 className="font-black text-sm text-slate-800 dark:text-slate-50 tracking-tight leading-none uppercase">
                {t('appName')}
              </h1>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block mt-0.5">
                {t('tagline')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all active:scale-90 cursor-pointer"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => {
                  setActiveView(item.view);
                  onClose();
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.01]'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'}`} size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
          {/* Language Switch */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-400">
              <GlobeIcon size={15} />
              <span className="text-xs font-semibold">{t('language')}</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  language === 'hi'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all duration-200"
          >
            <span className="flex items-center gap-2">
              {theme === 'light' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
              {t('darkMode')}
            </span>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              {theme === 'light' ? 'Off' : 'On'}
            </span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-4 transition-all duration-300 z-30">
        {/* App Logo/Header */}
        <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800 px-2 mt-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-lg shadow-md shadow-emerald-500/10 shrink-0">
            🌾
          </div>
          <div>
            <h1 className="font-black text-sm text-slate-800 dark:text-slate-50 tracking-tight leading-none uppercase">
              {t('appName')}
            </h1>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block mt-0.5">
              {t('tagline')}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setActiveView(item.view)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'}`} size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 px-1 space-y-3">
          {/* Language Switch */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-400">
              <GlobeIcon size={16} />
              <span className="text-xs font-semibold">{t('language')}</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                  language === 'hi'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all duration-200"
          >
            <span className="flex items-center gap-2">
              {theme === 'light' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              {t('darkMode')}
            </span>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              {theme === 'light' ? 'Off' : 'On'}
            </span>
          </button>
        </div>
      </aside>

    </>
  );
};
