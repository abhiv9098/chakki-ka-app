'use client';

import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { GlobeIcon, SunIcon, MoonIcon, CheckIcon, FontSizeIcon } from './Icons';

export const SettingsView: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    fontSize,
    setFontSize,
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

  const todayStr = (() => {
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const [deleteFilterMode, setDeleteFilterMode] = useState<'today' | 'calendar' | 'all'>('today');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayStr);

  const todayHisabs = dailyHisabs.filter(h => h.date === todayStr);
  const calendarHisabs = dailyHisabs.filter(h => h.date === selectedCalendarDate);

  const displayedHisabs = deleteFilterMode === 'today'
    ? todayHisabs
    : deleteFilterMode === 'calendar'
      ? calendarHisabs
      : dailyHisabs;

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
          {/* Word / Font Size setting */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 first:pt-0">
            <div>
              <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm tracking-wide flex items-center gap-2">
                <FontSizeIcon size={17} className="text-emerald-500" />
                <span>{language === 'hi' ? 'अक्षर / शब्द का आकार (Text Size)' : 'Word / Font Size'}</span>
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5 font-medium">
                {language === 'hi'
                  ? 'ऐप के सभी शब्दों और टेक्स्ट का साइज़ बड़ा या सामान्य करें।'
                  : 'Adjust font and word size across all screens for better readability.'}
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setFontSize('normal')}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  fontSize === 'normal'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'hi' ? 'सामान्य (Normal)' : 'Normal'}
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  fontSize === 'large'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'hi' ? 'बड़ा (Large)' : 'Large (Bada)'}
              </button>
              <button
                type="button"
                onClick={() => setFontSize('xlarge')}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  fontSize === 'xlarge'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'hi' ? 'बहुत बड़ा (XL)' : 'Extra Large'}
              </button>
            </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm tracking-wide flex items-center gap-2">
                  <span>{language === 'hi' ? 'अनाज पिसाई फिक्स भाव (₹/KG)' : 'Grain Grinding Fixed Rates (₹/KG)'}</span>
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    ✓ {language === 'hi' ? 'ऑटो-सेव्ड' : 'Auto-Saved'}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5 font-medium">
                  {language === 'hi'
                    ? 'जो भाव आप यहाँ फिक्स करेंगे, वह हमेशा सेव रहेगा और नए हिसाब में अपने-आप लागू होगा।'
                    : 'The rates you fix here remain saved permanently and auto-apply to all new grinding logs.'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'Wheat', label: language === 'hi' ? 'गेहूं (Wheat)' : 'Wheat' },
                { key: 'Atta', label: language === 'hi' ? 'आटा (Atta)' : 'Atta' },
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
                        type="text"
                        inputMode="decimal"
                        value={currentVal}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                            const val = parseFloat(raw);
                            updateGrainRate(g.key, isNaN(val) ? 0 : val);
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm tracking-wide flex items-center gap-2">
                  <span>{language === 'hi' ? 'डेली हिसाब डिलीट करें' : 'Delete Daily Hisab Records'}</span>
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5 font-medium">
                  {language === 'hi'
                    ? 'आज का हिसाब देखें या कैलेंडर से तारीख चुनकर हिसाब डिलीट करें।'
                    : 'Manage daily summaries: View today or select a calendar date to delete.'}
                </p>
              </div>
            </div>

            {/* Filter Pill Controls: Today's Logs | Calendar Date | All Logs */}
            <div className="flex items-center gap-2 flex-wrap bg-slate-100/90 dark:bg-slate-800/60 p-1.5 rounded-2xl">
              {/* Today's Logs Tab */}
              <button
                type="button"
                onClick={() => setDeleteFilterMode('today')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs sm:text-sm ${
                  deleteFilterMode === 'today'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span>☀️</span>
                <span>{language === 'hi' ? 'आज का हिसाब' : "Today's Logs"}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black min-w-[20px] text-center ${
                  deleteFilterMode === 'today'
                    ? 'bg-emerald-400/40 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {todayHisabs.length}
                </span>
              </button>

              {/* Calendar Date Picker Tab */}
              <div
                onClick={() => setDeleteFilterMode('calendar')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs sm:text-sm ${
                  deleteFilterMode === 'calendar'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span>📅</span>
                <span>{language === 'hi' ? 'तारीख चुनिए:' : 'Select Date:'}</span>
                <input
                  type="date"
                  value={selectedCalendarDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedCalendarDate(e.target.value);
                      setDeleteFilterMode('calendar');
                    }
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
                    deleteFilterMode === 'calendar'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700'
                  }`}
                />
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black min-w-[20px] text-center ${
                  deleteFilterMode === 'calendar'
                    ? 'bg-emerald-400/40 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {calendarHisabs.length}
                </span>
              </div>

              {/* All Logs Tab */}
              <button
                type="button"
                onClick={() => setDeleteFilterMode('all')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs sm:text-sm ${
                  deleteFilterMode === 'all'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span>📋</span>
                <span>{language === 'hi' ? 'सभी हिसाब' : 'All Logs'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black min-w-[20px] text-center ${
                  deleteFilterMode === 'all'
                    ? 'bg-emerald-400/40 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {dailyHisabs.length}
                </span>
              </button>
            </div>

            {/* Sub-header info showing current filter */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1 pt-1">
              <span>
                {deleteFilterMode === 'today' && (language === 'hi' ? `आज की तारीख (${todayStr}) के हिसाब:` : `Today's (${todayStr}) Logs:`)}
                {deleteFilterMode === 'calendar' && (language === 'hi' ? `चुनी गई तारीख (${selectedCalendarDate}) के हिसाब:` : `Selected Date (${selectedCalendarDate}) Logs:`)}
                {deleteFilterMode === 'all' && (language === 'hi' ? 'सभी दर्ज किए गए हिसाब:' : 'All Recorded Logs:')}
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {displayedHisabs.length} {language === 'hi' ? 'रिकॉर्ड मिले' : 'records found'}
              </span>
            </div>

            {/* Content List */}
            {displayedHisabs.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold italic py-4 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                {language === 'hi'
                  ? deleteFilterMode === 'calendar'
                    ? `तारीख ${selectedCalendarDate} को कोई डेली हिसाब दर्ज नहीं है।`
                    : 'इस श्रेणी में कोई हिसाब दर्ज नहीं है।'
                  : deleteFilterMode === 'calendar'
                    ? `No logs found for date ${selectedCalendarDate}.`
                    : 'No daily logs recorded in this section.'}
              </p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {displayedHisabs.map((hisab) => (
                  <div key={hisab.id} className="flex items-center justify-between p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-sm shadow-2xs">
                    <div className="flex items-center gap-3 sm:gap-6">
                      <span className="font-extrabold text-slate-850 dark:text-slate-100 text-sm sm:text-base">{hisab.date}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs sm:text-sm">{hisab.wheatWeight} kg</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs sm:text-sm">+ ₹{hisab.amount}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(language === 'hi' ? `क्या आप वाकई ${hisab.date} का हिसाब हटाना चाहते हैं?` : `Are you sure you want to delete daily log for ${hisab.date}?`)) {
                          deleteDailyHisab(hisab.id);
                        }
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
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

          {/* Language Preference (At Bottom) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
            <div>
              <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm tracking-wide flex items-center gap-2">
                <GlobeIcon size={18} className="text-emerald-500" />
                <span>{language === 'hi' ? 'भाषा (Language Preference)' : 'Language Preference'}</span>
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5 font-medium">
                {language === 'hi'
                  ? 'ऐप्लिकेशन की भाषा हिन्दी या इंग्लिश में चुनें।'
                  : 'Set application language to English or Hindi.'}
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`w-32 h-[46px] rounded-xl text-sm font-extrabold border transition-all cursor-pointer flex items-center justify-center ${
                  language === 'en'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`w-32 h-[46px] rounded-xl text-sm font-extrabold border transition-all cursor-pointer flex items-center justify-center ${
                  language === 'hi'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Theme setting (Moved to bottom) */}
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
        </div>
      </div>
    </div>
  );
};
