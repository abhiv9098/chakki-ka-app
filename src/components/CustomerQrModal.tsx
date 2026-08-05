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
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <QrCodeIcon size={20} />
            <h3 className="font-extrabold text-base tracking-tight">{t('customerQrCard')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500 cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Printable Card */}
        <div className="p-6 text-center space-y-5 print:p-0" id="customer-qr-card">
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>🌾 VISHWAKARMA CHAKKI</span>
              {customer.id > 0 && <span>ID: #{customer.id}</span>}
            </div>

            <div className="py-2">
              <h4 className="font-black text-3xl text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-2">{customer.name}</h4>
              {customer.phone !== 'N/A' && (
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">📞 {customer.phone.length === 10 ? `+91 ${customer.phone}` : customer.phone}</p>
              )}
            </div>

            {/* Outstanding Balance */}
            <div className="bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/50">
              <p className="text-[11px] font-black uppercase text-rose-500 tracking-wider mb-1">Total Due / कुल बाकी</p>
              <p className="text-4xl font-black text-rose-600 tracking-tighter">₹{customer.outstandingBalance || 0}</p>
            </div>

            {/* QR Image */}
            <div className="flex justify-center py-2">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`${customer.name} QR Code`}
                  className="w-40 h-40 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white"
                />
              ) : (
                <div className="w-40 h-40 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-4">
            {customer.phone !== 'N/A' && customer.phone.length >= 10 && (
              <a
                href={`https://wa.me/91${customer.phone.replace(/\D/g, '')}?text=Hello ${customer.name},`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-[#25D366] hover:bg-[#1ebd5a] text-white text-xs font-black rounded-xl transition-all shadow-md shadow-green-500/20 cursor-pointer"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>
            )}
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
            >
              <PrinterIcon size={14} />
              <span>{t('printBill')}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
