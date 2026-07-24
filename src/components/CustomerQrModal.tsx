'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Customer } from '../types';
import { useApp } from '../context/AppContext';
import { CloseIcon, PrinterIcon, QrCodeIcon } from './Icons';

interface CustomerQrModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerQrModal: React.FC<CustomerQrModalProps> = ({ customer, isOpen, onClose }) => {
  const { t } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (customer && isOpen) {
      const qrPayload = JSON.stringify({
        type: 'customer',
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone
      });

      QRCode.toDataURL(qrPayload, { width: 300, margin: 2, color: { dark: '#047857', light: '#FFFFFF' } })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error("Error generating Customer QR:", err));
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-scale-up">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCodeIcon size={20} />
            <h3 className="font-extrabold text-base tracking-tight">{t('customerQrCard')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-all text-white cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Printable Card */}
        <div className="p-6 text-center space-y-4 print:p-0" id="customer-qr-card">
          <div className="bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-slate-800/80 dark:to-slate-800/40 p-6 rounded-2xl border border-emerald-100 dark:border-slate-700 space-y-4">
            {/* Header info */}
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>🌾 CHAKKI MITRA</span>
              <span>ID: #{customer.id}</span>
            </div>

            <div className="py-1">
              <h4 className="font-black text-xl text-slate-800 dark:text-slate-100 tracking-tight">{customer.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">📞 {customer.phone}</p>
            </div>

            {/* QR Image */}
            <div className="flex justify-center py-2">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`${customer.name} QR Code`}
                  className="w-48 h-48 rounded-xl shadow-lg border-4 border-white dark:border-slate-900 bg-white"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Scan this card for quick lookup & payments
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <PrinterIcon size={16} />
              <span>{t('printBill')}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
