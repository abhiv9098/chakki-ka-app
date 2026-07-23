'use client';

import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { GlobeIcon, SunIcon, MoonIcon, CheckIcon } from './Icons';

export const SettingsView: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    exportBackup,
    restoreBackup,
    t,
    upiId,
    setUpiId,
    defaultGrindingRate,
    setDefaultGrindingRate,
    grainRates,
    updateGrainRate,
    dailyHisabs,
    deleteDailyHisab
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = () => {
    try {
      const dataStr = exportBackup();
      
      // 1. Download file
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ChakkiMitra_Backup_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 2. Show success banner
      setBackupMessage(t('backupSuccess'));
      setErrorMessage(null);
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (e) {
      console.error(e);
      setErrorMessage('Failed to export backup.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Confirm overwrite
    const confirmRestore = window.confirm(t('confirmRestore'));
    if (!confirmRestore) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonStr = event.target?.result as string;
      const success = restoreBackup(jsonStr);
      if (success) {
        setBackupMessage(t('restoreSuccess'));
        setErrorMessage(null);
        setTimeout(() => setBackupMessage(null), 4000);
      } else {
        setErrorMessage(t('restoreError'));
        setBackupMessage(null);
        setTimeout(() => setErrorMessage(null), 4000);
      }
    };
    reader.readAsText(file);
    
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerImportFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-6">
      {/* Messages */}
      {backupMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/25 rounded-2xl text-emerald-600 dark:text-emerald-400 font-extrabold text-sm flex items-center gap-2 transition-all">
          <CheckIcon size={16} />
          <span>{backupMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/25 rounded-2xl text-rose-600 dark:text-rose-400 font-extrabold text-sm flex items-center gap-2 transition-all">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      {/* Settings Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center text-lg">
            ⚙️
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xl">
              {t('settings')}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Manage shop language preference, appearance theme, daily logs, and data backups.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 space-y-6">
          {/* Language select */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 first:pt-0">
            <div>
              <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm tracking-wide">
                {t('language')} / Language Preference
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5 font-medium">
                Set billing strings and menu actions to Hindi or English.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setLanguage('en')}
                className={`w-32 h-[46px] rounded-xl text-base font-extrabold border transition-all cursor-pointer flex items-center justify-center ${
                  language === 'en'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-450 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`w-32 h-[46px] rounded-xl text-base font-extrabold border transition-all cursor-pointer flex items-center justify-center ${
                  language === 'hi'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-450 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Theme setting */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
            <div>
              <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm tracking-wide">
                {t('darkMode')} / App Appearance
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5 font-medium">
                Toggle between light and dark themes for comfortable reading.
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="h-[46px] min-w-[140px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black text-slate-750 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wider"
            >
              {theme === 'light' ? (
                <>
                  <SunIcon size={15} className="text-amber-500" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <MoonIcon size={15} className="text-indigo-400" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* UPI ID setting */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
            <div>
              <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm tracking-wide">
                {t('upiIdSetting')}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5 font-medium">
                Used to generate payment QR codes on invoices.
              </p>
            </div>
            <div className="w-full sm:max-w-xs">
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder={t('upiIdPlaceholder')}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:border-emerald-500 text-slate-850 dark:text-slate-200 font-semibold"
              />
            </div>
          </div>

          {/* Grain Grinding Rates setting */}
          <div className="pt-6 space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm tracking-wide">
                {language === 'hi' ? 'अनाज पिसाई दरें (₹/KG)' : 'Grain Grinding Rates (₹/KG)'}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5 font-medium">
                {language === 'hi'
                  ? 'प्रत्येक अनाज (गेहूं, मक्का, चना आदि) के लिए पिसाई की दर (₹/किलो) तय करें।'
                  : 'Set custom grinding rate per kg for each grain type.'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'Wheat', label: language === 'hi' ? 'गेहूं (Wheat)' : 'Wheat' },
                { key: 'Maize', label: language === 'hi' ? 'मक्का (Maize)' : 'Maize' },
                { key: 'Gram/Chana', label: language === 'hi' ? 'चना (Gram)' : 'Gram/Chana' },
                { key: 'Rice', label: language === 'hi' ? 'चावल (Rice)' : 'Rice' },
                { key: 'Barley', label: language === 'hi' ? 'जौ (Barley)' : 'Barley' },
                { key: 'Bajra', label: language === 'hi' ? 'बाजरा (Bajra)' : 'Bajra' },
                { key: 'Multigrain', label: language === 'hi' ? 'मल्टीग्रेन' : 'Multigrain' },
                { key: 'Other', label: language === 'hi' ? 'अन्य (Other)' : 'Other' }
              ].map((g) => {
                const currentVal = grainRates[g.key] !== undefined ? grainRates[g.key] : 5;
                return (
                  <div key={g.key} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block truncate">
                      {g.label}
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={currentVal}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            updateGrainRate(g.key, val);
                          }
                        }}
                        className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delete Daily Hisab Records Section */}
          <div className="pt-6 space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm tracking-wide">
                {language === 'hi' ? 'डेली हिसाब डिलीट करें' : 'Delete Daily Hisab Records'}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5 font-medium">
                {language === 'hi' ? 'यहाँ से आप पुराने दर्ज किए गए डेली हिसाब रिकॉर्ड्स को डिलीट कर सकते हैं।' : 'Manage and delete saved daily mill summaries.'}
              </p>
            </div>
            {dailyHisabs.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold italic">
                {language === 'hi' ? 'कोई डेली हिसाब दर्ज नहीं है।' : 'No daily logs recorded yet.'}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {dailyHisabs.map((hisab) => (
                  <div key={hisab.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    <div className="space-x-3">
                      <span className="font-black text-slate-800 dark:text-slate-100">{hisab.date}</span>
                      <span className="text-slate-500">{hisab.wheatWeight} kg</span>
                      <span className="text-emerald-600 font-extrabold">+ ₹{hisab.amount}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(language === 'hi' ? `क्या आप वाकई ${hisab.date} का हिसाब हटाना चाहते हैं?` : `Are you sure you want to delete daily log for ${hisab.date}?`)) {
                          deleteDailyHisab(hisab.id);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-extrabold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🗑️</span>
                      <span>{language === 'hi' ? 'डिलीट करें' : 'Delete'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backup Restore */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
            <div>
              <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm tracking-wide">
                Backup & Data Recovery
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5 font-medium">
                Save local mill ledger files to a single JSON backup.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={handleExport}
                className="px-4.5 h-[46px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-base font-extrabold shadow-md shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center"
              >
                {t('exportBackup')}
              </button>
              <button
                onClick={triggerImportFile}
                className="px-4.5 h-[46px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-850 dark:hover:bg-slate-805 text-slate-800 dark:text-slate-200 rounded-xl text-base font-extrabold transition-all cursor-pointer flex items-center justify-center"
              >
                {t('restoreBackup')}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
