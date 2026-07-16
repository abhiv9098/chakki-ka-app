'use client';

import React from 'react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import { CloseIcon, PrinterIcon, WhatsAppIcon } from './Icons';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  const { language, t, customers, upiId } = useApp();

  if (!isOpen || !order) return null;

  const dateStr = new Date(order.createdAt).toLocaleDateString(
    language === 'hi' ? 'hi-IN' : 'en-IN',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );
  const timeStr = new Date(order.createdAt).toLocaleTimeString(
    language === 'hi' ? 'hi-IN' : 'en-IN',
    { hour: '2-digit', minute: '2-digit' }
  );

  const handlePrint = () => {
    // Basic print setup
    window.print();
  };

  const getWhatsAppLink = () => {
    const greeting = language === 'hi' ? `नमस्ते ${order.customerName},` : `Hello ${order.customerName},`;
    const message = language === 'hi'
      ? `${greeting}\nआपका पिसाई बिल तैयार है:\n\nरसीद संख्या: #${order.id}\nदिनांक: ${dateStr}\nअनाज: ${order.grainType}\nवजन: ${order.weight} kg\nदर: ₹${order.rate}/kg\n*कुल राशि: ₹${order.totalAmount}*\nभुगतान: ${order.paymentType === 'CASH' ? 'नकद (भुगतान हो गया)' : 'बकाया (उधारी)'}\n\nधन्यवाद! 🙏`
      : `${greeting}\nYour grinding bill is ready:\n\nInvoice No: #${order.id}\nDate: ${dateStr}\nItem: ${order.grainType}\nWeight: ${order.weight} kg\nRate: ₹${order.rate}/kg\n*Total Amount: ₹${order.totalAmount}*\nPayment: ${order.paymentType === 'CASH' ? 'Cash (Paid)' : 'Credit (Pending)'}\n\nThank you! 🙏`;

    const customer = customers.find(c => c.id === order.customerId);
    const rawPhone = customer?.phone || '';
    const cleanedPhone = rawPhone.replace(/\D/g, '');

    if (cleanedPhone && cleanedPhone.length >= 10) {
      const finalPhone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;
      return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
    } else {
      return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      {/* Modal Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <h2 className="font-extrabold text-slate-800 dark:text-slate-100">{t('invoice')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Invoice Body (printable section) */}
        <div id="printable-bill" className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200">
          {/* Shop Header */}
          <div className="text-center space-y-1">
            <h3 className="font-black text-2xl tracking-tight text-emerald-600 dark:text-emerald-400">
              {t('appName')}
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('tagline')}</p>
          </div>

          <div className="border-t border-dashed border-slate-200 dark:border-slate-700 my-4"></div>

          {/* Bill Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('invoiceNo')}</p>
              <p className="font-extrabold text-slate-800 dark:text-slate-100">#{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('date')}</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{dateStr}</p>
              <p className="text-xs text-slate-400 font-medium">{timeStr}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t('billTo')}</p>
            <p className="font-extrabold text-base text-slate-800 dark:text-slate-100">{order.customerName}</p>
          </div>

          {/* Table */}
          <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wide text-xs">{t('items')}</th>
                  <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wide text-xs text-right">{t('weight')}</th>
                  <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wide text-xs text-right">{t('rate')}</th>
                  <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wide text-xs text-right">{t('amount')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 dark:border-slate-800/40">
                  <td className="py-3 px-4 font-extrabold text-slate-800 dark:text-slate-200">{order.grainType}</td>
                  <td className="py-3 px-4 text-right font-medium">{order.weight} kg</td>
                  <td className="py-3 px-4 text-right font-medium">₹{order.rate}</td>
                  <td className="py-3 px-4 text-right font-bold">₹{order.totalAmount}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary / Total */}
          <div className="bg-emerald-50/30 dark:bg-emerald-950/10 rounded-2xl p-4 border border-emerald-500/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('paymentType')}</span>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                {order.paymentType === 'CASH' ? (
                  <span className="text-emerald-600 dark:text-emerald-400">{t('cash')}</span>
                ) : (
                  <span className="text-amber-500">{t('credit')}</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('totalAmount')}</span>
              <p className="font-black text-2xl text-emerald-600 dark:text-emerald-400">₹{order.totalAmount}</p>
            </div>
          </div>

          {upiId && (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-150 dark:border-slate-800/80 text-center space-y-2 mt-4">
              <span className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">{t('upiQR')}</span>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `upi://pay?pa=${upiId}&pn=Chakki%20Mitra&am=${order.totalAmount}&cu=INR&tn=Order_${order.id}`
                )}`}
                alt="UPI QR Code"
                className="w-28 h-28 border-4 border-white rounded-xl shadow-sm bg-white"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">UPI ID: {upiId}</p>
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-xs text-slate-400 font-semibold italic">Generated securely. Thank you!</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <PrinterIcon size={18} />
            {t('printBill')}
          </button>
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
          >
            <WhatsAppIcon size={18} />
            {t('shareWhatsApp')}
          </a>
        </div>
      </div>

      {/* Basic print stylesheet injected dynamically */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-bill, #printable-bill * {
            visibility: visible;
          }
          #printable-bill {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            color: #000 !important;
            background: #fff !important;
          }
          /* Hide dark mode colors for print compatibility */
          #printable-bill h3, #printable-bill p, #printable-bill th, #printable-bill td {
            color: #000 !important;
          }
          #printable-bill .border, #printable-bill table, #printable-bill tr, #printable-bill th, #printable-bill td {
            border-color: #ddd !important;
          }
          #printable-bill .bg-emerald-50\/30 {
            background-color: #f0fdf4 !important;
            border-color: #bbf7d0 !important;
          }
        }
      `}</style>
    </div>
  );
};
