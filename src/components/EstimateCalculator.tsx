'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { QrCodeIcon, CheckIcon, PrinterIcon, WhatsAppIcon } from './Icons';

export const EstimateCalculator: React.FC = () => {
  const { grainRates, upiId, setUpiId, t, language, hideAmounts } = useApp();

  const [selectedGrain, setSelectedGrain] = useState<string>('Wheat');
  const [weightStr, setWeightStr] = useState<string>('10');
  const [customRate, setCustomRate] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [editUpiMode, setEditUpiMode] = useState<boolean>(false);
  const [tempUpi, setTempUpi] = useState<string>(upiId);

  // Sync default rate when grain selection changes
  useEffect(() => {
    const currentRate = grainRates[selectedGrain] !== undefined ? grainRates[selectedGrain] : 5;
    setCustomRate(String(currentRate));
  }, [selectedGrain, grainRates]);

  const weight = parseFloat(weightStr) || 0;
  const rate = parseFloat(customRate) || 0;
  const totalAmount = Math.round(weight * rate);

  // Generate dynamic payment UPI QR Code whenever amount or UPI ID changes
  useEffect(() => {
    if (totalAmount > 0 && upiId) {
      const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Chakki Mitra')}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Grinding_${selectedGrain}_${weight}kg`)}`;

      QRCode.toDataURL(upiString, {
        width: 280,
        margin: 2,
        color: {
          dark: '#047857',
          light: '#FFFFFF'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => {
          console.error("Error generating UPI QR Code:", err);
          setQrDataUrl('');
        });
    } else {
      setQrDataUrl('');
    }
  }, [totalAmount, upiId, selectedGrain, weight]);

  const handleSaveUpi = (e: React.FormEvent) => {
    e.preventDefault();
    setUpiId(tempUpi.trim());
    setEditUpiMode(false);
  };

  const handleQuickAddWeight = (val: number) => {
    const curr = parseFloat(weightStr) || 0;
    setWeightStr(String(curr + val));
  };

  const copyUpiLink = () => {
    if (!upiId || totalAmount <= 0) return;
    const upiLink = `upi://pay?pa=${upiId}&pn=ChakkiMitra&am=${totalAmount}&cu=INR&tn=Grinding_${selectedGrain}_${weight}kg`;
    navigator.clipboard.writeText(upiLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const grainOptionsList = [
    { key: 'Wheat', label: language === 'hi' ? '🌾 गेहूं (Wheat)' : '🌾 Wheat' },
    { key: 'Maize', label: language === 'hi' ? '🌽 मक्का (Maize)' : '🌽 Maize' },
    { key: 'Gram/Chana', label: language === 'hi' ? '🫘 चना (Gram)' : '🫘 Gram/Chana' },
    { key: 'Rice', label: language === 'hi' ? '🍚 चावल (Rice)' : '🍚 Rice' },
    { key: 'Barley', label: language === 'hi' ? '🌾 जौ (Barley)' : '🌾 Barley' },
    { key: 'Bajra', label: language === 'hi' ? '🌾 बाजरा (Bajra)' : '🌾 Bajra' },
    { key: 'Multigrain', label: language === 'hi' ? '🥣 मल्टीग्रेन' : '🥣 Multigrain' },
    { key: 'Other', label: language === 'hi' ? '📦 अन्य (Other)' : '📦 Other' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧮</span>
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg sm:text-xl tracking-tight">
              {language === 'hi' ? 'अनुमानित लागत कैलकुलेटर & पेमेंट बारकोड' : 'Estimate Calculator & Fixed Payment Barcode'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {language === 'hi'
              ? 'वजन डालें, कुल पिसाई लागत देखें और ग्राहक के लिए फिक्स पेमेंट QR कोड जनरेट करें।'
              : 'Calculate instant grinding estimate and auto-generate a fixed amount UPI payment QR code.'}
          </p>
        </div>

        {/* UPI Status / Edit */}
        <div className="flex items-center gap-2">
          {upiId ? (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span>💳 {upiId}</span>
              <button
                onClick={() => { setTempUpi(upiId); setEditUpiMode(true); }}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline ml-1 font-extrabold cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditUpiMode(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-sm cursor-pointer"
            >
              + Set UPI ID for QR
            </button>
          )}
        </div>
      </div>

      {/* Edit UPI Modal overlay if editing */}
      {editUpiMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-3">
          <h4 className="font-black text-xs text-amber-900 dark:text-amber-300 uppercase tracking-wide">
            Set Payment UPI ID (भुगतान UPI ID सेट करें)
          </h4>
          <form onSubmit={handleSaveUpi} className="flex gap-2">
            <input
              type="text"
              required
              value={tempUpi}
              onChange={(e) => setTempUpi(e.target.value)}
              placeholder="e.g. yourname@upi or 9876543210@paytm"
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditUpiMode(false)}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Main Grid: Calculator Inputs vs Fixed QR Code Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Grain Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              {language === 'hi' ? '1. अनाज चुनें (Select Grain)' : '1. Select Grain Type'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {grainOptionsList.map((g) => {
                const isSelected = selectedGrain === g.key;
                const rateForGrain = grainRates[g.key] !== undefined ? grainRates[g.key] : 5;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setSelectedGrain(g.key)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer flex flex-col justify-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent shadow-md shadow-emerald-500/20 scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{g.label}</span>
                    <span className={`text-[10px] font-black mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      ₹{rateForGrain}/kg
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weight & Rate Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Weight Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                {language === 'hi' ? '2. वजन (Weight in KG) *' : '2. Weight (KG) *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={weightStr}
                  onChange={(e) => setWeightStr(e.target.value)}
                  placeholder="0.0 kg"
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-black text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-4 top-3.5 text-xs font-extrabold text-slate-400">KG</span>
              </div>
              {/* Quick Add Chips */}
              <div className="flex gap-1.5 pt-1">
                {[5, 10, 20, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleQuickAddWeight(num)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                  >
                    +{num} kg
                  </button>
                ))}
              </div>
            </div>

            {/* Rate Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                {language === 'hi' ? '3. दर (Rate ₹/KG)' : '3. Grinding Rate (₹/KG)'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xs font-extrabold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  placeholder="₹/kg"
                  className="w-full pl-8 pr-14 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">/kg</span>
              </div>
            </div>
          </div>

          {/* Calculated Summary Box */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl flex items-center justify-between shadow-xl">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                {language === 'hi' ? 'कुल देय राशि (Calculated Total)' : 'Total Calculated Amount'}
              </span>
              <p className="text-xs text-emerald-400 font-bold mt-0.5">
                {weight} kg × ₹{rate}/kg
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-emerald-400 tracking-tight">
                {hideAmounts ? '₹••••' : `₹${totalAmount}`}
              </p>
            </div>
          </div>
        </div>

        {/* Right Fixed Amount Payment Barcode Display (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 text-center">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wider">
              <QrCodeIcon size={14} /> Fixed Payment QR
            </span>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              {language === 'hi' ? 'फिक्स राशि UPI बारकोड' : 'Exact Amount Payment QR'}
            </h4>
          </div>

          {/* QR Code Container */}
          <div className="relative p-3 bg-white rounded-2xl shadow-xl border-2 border-emerald-500/30 flex flex-col items-center">
            {qrDataUrl ? (
              <>
                <img
                  src={qrDataUrl}
                  alt={`UPI Payment QR for ₹${totalAmount}`}
                  className="w-48 h-48 rounded-xl object-contain"
                />
                <div className="mt-2 py-1 px-4 bg-emerald-600 text-white rounded-full font-black text-sm tracking-wide shadow-md">
                  SCAN & PAY ₹{totalAmount}
                </div>
              </>
            ) : (
              <div className="w-48 h-48 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-4 text-center space-y-2 text-slate-400 text-xs">
                <QrCodeIcon size={40} className="text-slate-300 dark:text-slate-700" />
                <p className="font-semibold">
                  {!upiId
                    ? "Set your UPI ID above to generate payment barcode"
                    : "Enter weight to generate fixed amount barcode"}
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions for Payment QR */}
          {qrDataUrl && (
            <div className="w-full flex gap-2 pt-1">
              <button
                onClick={copyUpiLink}
                className="flex-1 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isCopied ? <CheckIcon size={14} className="text-emerald-500" /> : null}
                <span>{isCopied ? 'Link Copied!' : 'Copy UPI Link'}</span>
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Hello! Your grinding estimate for ${selectedGrain} (${weight} kg @ ₹${rate}/kg) is ₹${totalAmount}.\nScan & pay via UPI: upi://pay?pa=${upiId}&pn=ChakkiMitra&am=${totalAmount}&cu=INR`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="Share on WhatsApp"
              >
                <WhatsAppIcon size={14} />
                <span>Share</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
