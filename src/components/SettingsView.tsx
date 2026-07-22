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
    dailyHisabs,
    deleteDailyHisab,
    orders,
    customers
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'hisab' | 'backup'>('general');

  const handleExport = () => {
    try {
      const dataStr = exportBackup();
      
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ChakkiMitra_Backup_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

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
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerImportFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-emerald-500/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 text-9xl pointer-events-none select-none">⚙️</div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-3xl shadow-lg shrink-0">
              🌾
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                {language === 'hi' ? 'चक्की मित्र प्रोफ़ाइल एवं सेटिंग्स' : 'Chakki Mitra Settings & Profile'}
              </h2>
              <p className="text-emerald-100 text-xs md:text-sm font-medium mt-1">
                {language === 'hi' ? 'अपनी आटा चक्की की प्राथमिकताएँ, पिसाई रेट और बैकअप प्रबंधित करें' : 'Manage your flour mill preferences, default rates, and data backups.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur p-2.5 rounded-2xl border border-white/15">
            <div className="px-3 py-1.5 text-center">
              <span className="text-[10px] uppercase font-extrabold text-emerald-100 block">Orders</span>
              <span className="text-base font-black">{orders.length}</span>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="px-3 py-1.5 text-center">
              <span className="text-[10px] uppercase font-extrabold text-emerald-100 block">Customers</span>
              <span className="text-base font-black">{customers.length}</span>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="px-3 py-1.5 text-center">
              <span className="text-[10px] uppercase font-extrabold text-emerald-100 block">Logs</span>
              <span className="text-base font-black">{dailyHisabs.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {backupMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 font-extrabold text-sm flex items-center gap-2 transition-all">
          <CheckIcon size={18} />
          <span>{backupMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 font-extrabold text-sm flex items-center gap-2 transition-all">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'general'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>⚙️</span>
          <span>{language === 'hi' ? 'सामान्य सेटिंग्स' : 'General Settings'}</span>
        </button>
        <button
          onClick={() => setActiveTab('hisab')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'hisab'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>📊</span>
          <span>{language === 'hi' ? 'डेली हिसाब रिकॉर्ड्स' : 'Daily Logs Data'}</span>
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>💾</span>
          <span>{language === 'hi' ? 'बैकअप और डेटा' : 'Backup & Reset'}</span>
        </button>
      </div>

      {/* Main Settings Panel */}
      {activeTab === 'general' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-sm">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 space-y-6">
            {/* Language Preference */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 first:pt-0">
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>🌐</span>
                  <span>{t('language')} / Language Preference</span>
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                  Select your preferred interface language (Hindi or English).
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setLanguage('en')}
                  className={`w-32 h-[46px] rounded-xl text-sm font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    language === 'en'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/15'
                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`w-32 h-[46px] rounded-xl text-sm font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    language === 'hi'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/15'
                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>🇮🇳</span>
                  <span>हिन्दी</span>
                </button>
              </div>
            </div>

            {/* Dark Mode / Appearance */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>🎨</span>
                  <span>{t('darkMode')} / App Appearance</span>
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                  Switch between light and dark visual themes.
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="h-[46px] min-w-[150px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black text-slate-750 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wider"
              >
                {theme === 'light' ? (
                  <>
                    <SunIcon size={16} className="text-amber-500" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <MoonIcon size={16} className="text-indigo-400" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* Default Grinding Rate */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>🌾</span>
                  <span>{language === 'hi' ? 'डिफॉल्ट पिसाई रेट (₹/KG)' : 'Default Grinding Rate (₹/KG)'}</span>
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                  {language === 'hi' ? 'डेली हिसाब की ऑटो-गणना के लिए उपयोग होने वाला रेट।' : 'Default rate used for auto-calculating daily summary revenue.'}
                </p>
              </div>
              <div className="w-full sm:max-w-xs flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={defaultGrindingRate}
                  onChange={(e) => setDefaultGrindingRate(e.target.value)}
                  placeholder="5"
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:border-emerald-500 text-slate-850 dark:text-slate-200 font-bold"
                />
                <span className="text-xs font-black text-slate-400 shrink-0">₹ / kg</span>
              </div>
            </div>

            {/* UPI ID Setting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <span>📱</span>
                  <span>{t('upiIdSetting')}</span>
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                  Used to generate UPI payment QR codes on customer invoices.
                </p>
              </div>
              <div className="w-full sm:max-w-xs">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder={t('upiIdPlaceholder')}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:border-emerald-500 text-slate-850 dark:text-slate-200 font-semibold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Hisab Records Tab */}
      {activeTab === 'hisab' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-lg flex items-center gap-2">
              <span>📊</span>
              <span>{language === 'hi' ? 'डेली हिसाब रिकॉर्ड्स (प्रबंधन)' : 'Daily Hisab Records Management'}</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
              {language === 'hi' ? 'यहाँ से आप पुराने दर्ज किए गए डेली हिसाब रिकॉर्ड्स को देख और हटा सकते हैं।' : 'View and delete saved daily summary records.'}
            </p>
          </div>

          {dailyHisabs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm font-semibold space-y-2">
              <span className="text-4xl block">📊</span>
              <p>{language === 'hi' ? 'कोई डेली हिसाब दर्ज नहीं है।' : 'No daily logs recorded yet.'}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {dailyHisabs.map((hisab) => (
                <div
                  key={hisab.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl">📅</span>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{hisab.date}</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        Weight: {hisab.wheatWeight} kg • Expenses: ₹{hisab.expenses}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800 pt-2.5 sm:pt-0">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20">
                      + ₹{hisab.amount} Profit
                    </span>

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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Backup & Data Tab */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-lg flex items-center gap-2">
              <span>💾</span>
              <span>Backup & Data Recovery</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
              Export your customer records, grinding logs, and settings to a JSON backup file or restore previously saved backups.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export Card */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="text-2xl">📥</div>
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Export Backup</h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Save all mill ledger files to a single JSON backup.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-extrabold shadow-md shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>{t('exportBackup')}</span>
              </button>
            </div>

            {/* Restore Card */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="text-2xl">📤</div>
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Restore Backup</h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Restore data from a JSON backup file.
                </p>
              </div>
              <button
                onClick={triggerImportFile}
                className="w-full h-11 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span>{t('restoreBackup')}</span>
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
      )}
    </div>
  );
};
