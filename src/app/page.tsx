'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/Sidebar';
import { MenuIcon, ProfileIcon, EyeIcon, EyeOffIcon, QrCodeIcon } from '@/components/Icons';
import { DashboardView } from '@/components/DashboardView';
import { GrindingView } from '@/components/GrindingView';
import { CustomersView } from '@/components/CustomersView';
import { SettingsView } from '@/components/SettingsView';
import { DailyHisabView } from '@/components/DailyHisabView';
import { EstimateCalculator } from '@/components/EstimateCalculator';
import { QrScannerModal } from '@/components/QrScannerModal';

export default function Home() {
  const { activeView, setActiveView, language, setLanguage, t, hideAmounts, toggleHideAmounts } = useApp();
  const [showLanguageOnboarding, setShowLanguageOnboarding] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  useEffect(() => {
    // Check if lang preference has been set previously
    const hasLang = localStorage.getItem('chakkimitra_lang');
    if (!hasLang) {
      setShowLanguageOnboarding(true);
    }

    // Handle Service Worker for PWA
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        // Unregister service worker in development to avoid caching/HMR issues
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log('Unregistered service worker in development mode');
                window.location.reload();
              }
            });
          }
        });
      } else {
        const registerSW = () => {
          navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered successfully:', reg.scope))
            .catch(err => console.error('Service worker registration failed:', err));
        };

        if (document.readyState === 'complete') {
          registerSW();
        } else {
          window.addEventListener('load', registerSW);
        }
      }
    }
  }, []);

  const selectLanguageAndContinue = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    setShowLanguageOnboarding(false);
  };

  // Render active view component
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'grinding':
        return <GrindingView />;
      case 'customers':
        return <CustomersView />;
      case 'calculator':
        return <EstimateCalculator />;
      case 'settings':
        return <SettingsView />;
      case 'daily-hisab':
        return <DailyHisabView />;
      default:
        return <DashboardView />;
    }
  };

  // First-launch Language Selector Overlay
  if (showLanguageOnboarding) {
    return (
      <main className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-950 rounded-3xl w-full max-w-md p-8 text-center border border-slate-100 dark:border-slate-800 shadow-2xl space-y-8 flex flex-col items-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-3xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
            🌾
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-400">
              Select your language preference to continue / जारी रखने के लिए अपनी भाषा चुनें
            </p>
          </div>

          <div className="w-full grid grid-cols-1 gap-3.5 pt-4">
            <button
              onClick={() => selectLanguageAndContinue('en')}
              className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-lg rounded-2xl transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              English
            </button>
            <button
              onClick={() => selectLanguageAndContinue('hi')}
              className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-lg rounded-2xl transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              हिन्दी (Hindi)
            </button>
          </div>

          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            You can change this setting anytime in settings / आप इसे कभी भी सेटिंग्स में बदल सकते हैं।
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Navigation Menu Sidebar */}
      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 max-w-7xl min-h-screen md:h-screen md:overflow-y-auto flex flex-col">
        {/* Top bar header */}
        <header className="sticky top-0 z-20 flex justify-between items-center px-4 md:px-8 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 mb-6 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer"
              aria-label="Open menu"
            >
              <MenuIcon size={20} />
            </button>
            <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase">
              {t(activeView as any)}
            </h2>
          </div>
          
          {/* Top Bar Actions Group */}
          <div className="flex items-center gap-2.5" id="top-bar-actions">
            {/* Visibility Toggle Button */}
            <button
              onClick={toggleHideAmounts}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer focus:outline-none"
              title={hideAmounts ? "Show Amounts" : "Hide Amounts"}
              aria-label="Toggle Amount Visibility"
            >
              {hideAmounts ? <EyeOffIcon size={19} /> : <EyeIcon size={19} />}
            </button>

            {/* Profile / Account button */}
            <button
              onClick={() => setActiveView('settings')}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95 cursor-pointer focus:outline-none ${
                activeView === 'settings'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm'
              }`}
              title={t('settings')}
              aria-label="Profile Settings"
            >
              <ProfileIcon size={19} />
            </button>
          </div>
        </header>

        {/* View Component Wrapper */}
        <section className="animate-fade-in px-4 md:px-8 pb-6 md:pb-8">
          {renderView()}
        </section>

        {/* Global QR Code Scanner Modal */}
        <QrScannerModal
          isOpen={isQrScannerOpen}
          onClose={() => setIsQrScannerOpen(false)}
        />
      </main>
    </div>
  );
}
