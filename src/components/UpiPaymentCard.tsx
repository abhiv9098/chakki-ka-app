'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';

interface UpiPaymentCardProps {
  amount: number;
  note?: string;
  orderId?: string | number;
  className?: string;
}

export const UpiPaymentCard: React.FC<UpiPaymentCardProps> = ({
  amount,
  note = 'Chakki Mitra Payment',
  orderId,
  className = '',
}) => {
  const { upiId, setUpiId, language, t } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [inputUpi, setInputUpi] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const isHindi = language === 'hi';

  const tnText = orderId ? `Order_${orderId}` : note.replace(/\s+/g, '_');
  const upiString = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Chakki Mitra')}&am=${amount}&cu=INR&tn=${encodeURIComponent(tnText)}`
    : '';

  useEffect(() => {
    if (!upiId || amount <= 0) {
      setQrDataUrl('');
      return;
    }

    let isMounted = true;
    QRCode.toDataURL(upiString, {
      width: 250,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating UPI QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [upiId, upiString, amount]);

  const handleSaveUpi = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputUpi.trim();
    if (cleaned) {
      setUpiId(cleaned);
      setIsEditing(false);
      setInputUpi('');
    }
  };

  const handleCopyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!upiId || isEditing) {
    return (
      <div className={`p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-center space-y-3 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 font-extrabold text-sm">
          <span>📲</span>
          <span>{isHindi ? 'UPI ID सेट करें (QR कोड के लिए)' : 'Set UPI ID for Payment QR'}</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {isHindi
            ? 'अपनी GPay / PhonePe / Paytm / BHIM UPI ID दर्ज करें ताकि ग्राहक स्कैन करके भुगतान कर सकें:'
            : 'Enter your GPay / PhonePe / Paytm / BHIM UPI ID so customers can scan and pay:'}
        </p>

        <form onSubmit={handleSaveUpi} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            value={inputUpi}
            onChange={(e) => setInputUpi(e.target.value)}
            placeholder={isHindi ? 'जैसे: 9876543210@paytm या shop@ybl' : 'e.g. 9876543210@paytm or shop@ybl'}
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow transition-colors cursor-pointer whitespace-nowrap"
            >
              {isHindi ? 'सेव करें' : 'Save'}
            </button>
            {upiId && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 transition-colors cursor-pointer"
              >
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-center space-y-3 ${className}`}>
      <div className="flex items-center justify-between w-full px-1">
        <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <span>📱</span> {t('upiQR')} (₹{amount})
        </span>
        <button
          type="button"
          onClick={() => {
            setInputUpi(upiId);
            setIsEditing(true);
          }}
          className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline cursor-pointer"
        >
          ✏️ {isHindi ? 'ID बदलें' : 'Change ID'}
        </button>
      </div>

      {qrDataUrl ? (
        <div className="relative group">
          <img
            src={qrDataUrl}
            alt="UPI QR Code"
            className="w-36 h-36 border-4 border-white dark:border-slate-800 rounded-2xl shadow-md bg-white p-1"
          />
        </div>
      ) : (
        <div className="w-36 h-36 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-2xl flex items-center justify-center text-xs text-slate-500">
          Generating QR...
        </div>
      )}

      {/* Deep link button for mobile */}
      <a
        href={upiString}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>
        {isHindi ? 'UPI ऐप से पे करें (PhonePe / GPay / Paytm)' : 'Pay via UPI App (GPay / PhonePe)'}
      </a>

      {/* Copy UPI ID */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">
        <span>UPI ID: <strong className="text-slate-800 dark:text-slate-200">{upiId}</strong></span>
        <button
          type="button"
          onClick={handleCopyUpi}
          className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          {copied ? (isHindi ? 'कॉपी हो गया ✓' : 'Copied ✓') : (isHindi ? 'कॉपी करें' : 'Copy')}
        </button>
      </div>
    </div>
  );
};
