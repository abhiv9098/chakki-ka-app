'use client';

import React from 'react';
import QRCode from 'qrcode';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import { CloseIcon, PrinterIcon, WhatsAppIcon, TrashIcon } from './Icons';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  const { language, t, customers, deleteOrder, upiId } = useApp();

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

  const handleDeleteOrder = () => {
    if (window.confirm(t('confirmDeleteBill'))) {
      deleteOrder(order.id);
      onClose();
    }
  };

  const handleShareWhatsApp = async () => {
    const greeting = language === 'hi' ? `नमस्ते ${order.customerName},` : `Hello ${order.customerName},`;
    
    let upiString = '';
    if (upiId) {
      upiString = `\n\n💳 *Scan & Pay via UPI:* upi://pay?pa=${upiId}&pn=ChakkiMitra&am=${order.totalAmount}&cu=INR&tn=Bill_${order.id}`;
    }

    const message = language === 'hi'
      ? `${greeting}\nआपका पिसाई बिल तैयार है:\n\nरसीद: #${order.id}\nअनाज: ${order.grainType}\nवजन: ${order.weight} kg\nदर: ₹${order.rate}/kg\n*कुल राशि: ₹${order.totalAmount}*\nभुगतान: ${order.paymentType === 'CASH' ? 'नकद (भुगतान हो गया)' : 'बकाया (उधारी)'}${upiString}\n\nधन्यवाद! 🙏`
      : `${greeting}\nYour grinding bill is ready:\n\nInvoice: #${order.id}\nItem: ${order.grainType}\nWeight: ${order.weight} kg\nRate: ₹${order.rate}/kg\n*Total Amount: ₹${order.totalAmount}*\nPayment: ${order.paymentType === 'CASH' ? 'Cash (Paid)' : 'Credit (Pending)'}${upiString}\n\nThank you! 🙏`;

    const customer = customers.find(c => c.id === order.customerId);
    const rawPhone = customer?.phone || '';
    const cleanedPhone = rawPhone.replace(/\D/g, '');
    const finalPhone = cleanedPhone && cleanedPhone.length >= 10 ? (cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone) : '';

    // Generate QR Image for sharing
    let qrDataUrl = '';
    try {
      const qrPayload = upiId
        ? `upi://pay?pa=${upiId}&pn=ChakkiMitra&am=${order.totalAmount}&cu=INR&tn=Bill_${order.id}`
        : JSON.stringify({ orderId: order.id, customer: order.customerName, amount: order.totalAmount });
      qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 300, margin: 2, color: { dark: '#047857', light: '#FFFFFF' } });
    } catch (e) {
      console.error("QR generation failed for WhatsApp share:", e);
    }

    // Web Share API with PNG Image File attachment
    if (navigator.share && qrDataUrl) {
      try {
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `Bill_${order.id}_Payment_QR.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Bill #${order.id} - ${order.customerName}`,
            text: message,
            files: [file]
          });
          return;
        }
      } catch (err) {
        console.log("Web share with image fallback to URL:", err);
      }
    }

    // Direct WhatsApp Web Link fallback
    const waUrl = finalPhone
      ? `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      {/* Modal Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌾</span>
            <h2 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{t('invoice')}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDeleteOrder}
              className="p-1 rounded-lg text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title={t('deleteBill')}
            >
              <TrashIcon size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Body (printable section) */}
        <div id="printable-bill" className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 text-slate-800 dark:text-slate-200">
          {/* Shop Header */}
          <div className="text-center space-y-0.5">
            <h3 className="font-black text-xl tracking-tight text-emerald-600 dark:text-emerald-400">
              {t('appName')}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('tagline')}</p>
          </div>

          <div className="border-t border-dashed border-slate-200 dark:border-slate-700 my-2"></div>

          {/* Bill Info & Date */}
          <div className="flex justify-between items-start text-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{t('billTo')}</p>
              <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{order.customerName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('date')}</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{dateStr}</p>
              <p className="text-[10px] text-slate-400 font-medium">{timeStr}</p>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-1.5 px-3 font-bold text-slate-500 uppercase tracking-wide text-[10px]">{t('items')}</th>
                  <th className="py-1.5 px-3 font-bold text-slate-500 uppercase tracking-wide text-[10px] text-right">{t('weight')}</th>
                  <th className="py-1.5 px-3 font-bold text-slate-500 uppercase tracking-wide text-[10px] text-right">{t('rate')}</th>
                  <th className="py-1.5 px-3 font-bold text-slate-500 uppercase tracking-wide text-[10px] text-right">{t('amount')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 dark:border-slate-800/40">
                  <td className="py-2 px-3 font-extrabold text-slate-800 dark:text-slate-200">{order.grainType}</td>
                  <td className="py-2 px-3 text-right font-medium">{order.weight} kg</td>
                  <td className="py-2 px-3 text-right font-medium">₹{order.rate}</td>
                  <td className="py-2 px-3 text-right font-bold">₹{order.totalAmount}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary / Total & Live Remaining Balance */}
          {(() => {
            const customer = customers.find(c => c.id === order.customerId);
            const isCredit = order.paymentType === 'CREDIT';
            const currentCustomerBalance = customer ? customer.outstandingBalance : 0;
            // Calculate effective due & paid amounts
            const remainingDue = isCredit ? Math.min(order.totalAmount, currentCustomerBalance) : 0;
            const paidAmount = isCredit ? Math.max(0, order.totalAmount - remainingDue) : order.totalAmount;
            const isFullyPaid = isCredit && remainingDue === 0;

            return (
              <>
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-500/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('paymentType')}</span>
                      <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200 mt-0.5">
                        {!isCredit ? (
                          <span className="text-emerald-600 dark:text-emerald-400">{t('cash')} (Paid)</span>
                        ) : isFullyPaid ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">✅ {language === 'hi' ? 'भुगतान चुकता (Paid)' : 'Paid (Cleared)'}</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">{t('credit')}</span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        {isCredit && paidAmount > 0 ? (language === 'hi' ? 'कुल देय बाकी (Due)' : 'TOTAL DUE (₹)') : t('totalAmount')}
                      </span>
                      <p className={`font-black text-xl ${isCredit && remainingDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        ₹{isCredit ? remainingDue : order.totalAmount}
                      </p>
                    </div>
                  </div>

                  {/* Partial Payment / Original Bill Breakdown */}
                  {isCredit && paidAmount > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                        <span>{language === 'hi' ? 'मूल पिसाई बिल (Original Bill):' : 'Original Bill:'}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">₹{order.totalAmount}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                        <span>{language === 'hi' ? 'कुल जमा राशि (Received):' : 'Paid So Far:'}</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">-₹{paidAmount}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-2">
          <button
            onClick={handleDeleteOrder}
            className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60"
          >
            <TrashIcon size={16} />
            <span>{t('deleteBill')}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <PrinterIcon size={16} />
            <span>{t('printBill')}</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all hover:shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
          >
            <WhatsAppIcon size={16} />
            <span>{t('shareWhatsApp')}</span>
          </button>
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
