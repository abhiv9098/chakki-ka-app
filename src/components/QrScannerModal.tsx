'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useApp } from '../context/AppContext';
import { CloseIcon, CameraIcon, QrCodeIcon, CheckIcon, CustomersIcon, FileTextIcon, CreditCardIcon } from './Icons';
import { Customer, Order } from '../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer?: (customer: Customer) => void;
  onSelectOrder?: (order: Order) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  onSelectOrder
}) => {
  const { t, customers, orders, setActiveView, setSelectedCustomer } = useApp();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [matchedUpi, setMatchedUpi] = useState<{ upiId: string; name?: string; amount?: string } | null>(null);
  const [manualInput, setManualInput] = useState<string>('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = 'qr-reader-container';

  useEffect(() => {
    if (isOpen && !scanResult) {
      startCameraScanner();
    } else {
      stopCameraScanner();
    }

    return () => {
      stopCameraScanner();
    };
  }, [isOpen, scanResult]);

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Failed to stop QR scanner:", err);
      }
    }
    setIsCameraActive(false);
  };

  const startCameraScanner = async () => {
    setScannerError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerRegionId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecodedCode(decodedText);
        },
        (errorMessage) => {
          // ignore frame errors
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera start failed, falling back to file mode:", err);
      setIsCameraActive(false);
      setScannerError("Camera permission denied or camera not available. You can upload a QR image or enter text below.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerRegionId);
      }
      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      handleDecodedCode(decodedText);
    } catch (err) {
      setScannerError(t('invalidQrCode') + " - Could not decode image.");
    }
  };

  const handleDecodedCode = (decodedText: string) => {
    setScanResult(decodedText);
    stopCameraScanner();

    // Parse decoded text
    let parsedCust: Customer | null = null;
    let parsedOrd: Order | null = null;
    let upiInfo: { upiId: string; name?: string; amount?: string } | null = null;

    // Check JSON format
    try {
      const obj = JSON.parse(decodedText);
      if (obj.customerId || obj.id) {
        const id = Number(obj.customerId || obj.id);
        parsedCust = customers.find(c => c.id === id) || null;
      }
      if (obj.orderId) {
        const ordId = Number(obj.orderId);
        parsedOrd = orders.find(o => o.id === ordId) || null;
      }
    } catch (e) {
      // String format parsing
    }

    // Check prefixed strings
    if (!parsedCust && !parsedOrd) {
      const text = decodedText.trim();
      
      if (text.startsWith("CUSTOMER:")) {
        const id = Number(text.replace("CUSTOMER:", ""));
        parsedCust = customers.find(c => c.id === id) || null;
      } else if (text.startsWith("ORDER:") || text.startsWith("INVOICE:")) {
        const id = Number(text.replace(/^(ORDER:|INVOICE:)/, ""));
        parsedOrd = orders.find(o => o.id === id) || null;
      } else if (text.startsWith("upi://pay")) {
        try {
          const url = new URL(text);
          const pa = url.searchParams.get("pa") || "";
          const pn = url.searchParams.get("pn") || "";
          const am = url.searchParams.get("am") || "";
          if (pa) {
            upiInfo = { upiId: pa, name: pn, amount: am };
          }
        } catch (err) {}
      } else {
        // Direct phone number or ID match
        parsedCust = customers.find(c => c.phone.includes(text) || c.id.toString() === text || c.name.toLowerCase() === text.toLowerCase()) || null;
      }
    }

    setMatchedCustomer(parsedCust);
    setMatchedOrder(parsedOrd);
    setMatchedUpi(upiInfo);
  };

  const resetScan = () => {
    setScanResult(null);
    setMatchedCustomer(null);
    setMatchedOrder(null);
    setMatchedUpi(null);
    setScannerError(null);
    startCameraScanner();
  };

  const handleActionCustomer = (cust: Customer) => {
    if (onSelectCustomer) {
      onSelectCustomer(cust);
    } else {
      setSelectedCustomer(cust);
      setActiveView('customers');
    }
    onClose();
  };

  const handleActionOrder = (ord: Order) => {
    if (onSelectOrder) {
      onSelectOrder(ord);
    } else {
      setActiveView('grinding');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <QrCodeIcon size={24} />
            <h3 className="font-extrabold text-lg tracking-tight">{t('scanQrCode')}</h3>
          </div>
          <button
            onClick={() => { stopCameraScanner(); onClose(); }}
            className="p-1.5 rounded-full hover:bg-white/20 transition-all text-white cursor-pointer"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!scanResult ? (
            <>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">
                {t('scanQrInstruction')}
              </p>

              {/* Camera Scanner Container */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-emerald-500/50 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[260px]">
                <div id={scannerRegionId} className="w-full max-w-[280px] h-[260px] overflow-hidden rounded-xl" />

                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white p-4 text-center space-y-3 z-10">
                    <CameraIcon size={44} className="text-emerald-400 animate-bounce" />
                    <p className="text-xs font-semibold text-slate-300 max-w-xs">
                      {scannerError || "Initializing camera..."}
                    </p>
                    <button
                      onClick={startCameraScanner}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Retry Camera Access
                    </button>
                  </div>
                )}
              </div>

              {/* Upload QR File Fallback */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center">
                  <label className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700">
                    <CameraIcon size={16} />
                    <span>{t('uploadQrImage')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Manual QR / Code input */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Manual Code / Phone Lookup
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 9876543210 or CUSTOMER:1"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleDecodedCode(manualInput)}
                      disabled={!manualInput.trim()}
                      className="px-4 py-2 bg-emerald-500 disabled:opacity-50 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Scan Result Card */
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-800 dark:text-emerald-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckIcon size={22} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">{t('qrScannedSuccess')}</h4>
                  <p className="text-xs opacity-90 break-all font-mono mt-0.5">{scanResult}</p>
                </div>
              </div>

              {/* Matched Customer Card */}
              {matchedCustomer && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <CustomersIcon size={14} /> {t('customerFound')}
                    </span>
                    <span className="text-xs font-bold text-slate-400">ID: #{matchedCustomer.id}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-slate-800 dark:text-slate-100">{matchedCustomer.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">📞 {matchedCustomer.phone}</p>
                    <p className="text-xs font-extrabold mt-1 text-amber-600 dark:text-amber-400">
                      Balance Due: ₹{matchedCustomer.outstandingBalance}
                    </p>
                  </div>
                  <button
                    onClick={() => handleActionCustomer(matchedCustomer)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {t('viewCustomerProfile')}
                  </button>
                </div>
              )}

              {/* Matched Order Card */}
              {matchedOrder && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1">
                      <FileTextIcon size={14} /> {t('orderFound')}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Bill #{matchedOrder.id}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-slate-800 dark:text-slate-100">{matchedOrder.customerName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {matchedOrder.grainType} • {matchedOrder.weight} kg • ₹{matchedOrder.totalAmount}
                    </p>
                    <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md mt-1 uppercase ${
                      matchedOrder.paymentType === 'CASH' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {matchedOrder.paymentType}
                    </span>
                  </div>
                  <button
                    onClick={() => handleActionOrder(matchedOrder)}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {t('viewOrderBill')}
                  </button>
                </div>
              )}

              {/* Matched UPI Card */}
              {matchedUpi && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <CreditCardIcon size={14} /> {t('upiDetected')}
                  </span>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200">UPI ID: <span className="font-mono text-emerald-600 dark:text-emerald-400">{matchedUpi.upiId}</span></p>
                    {matchedUpi.name && <p className="text-slate-500">Name: {matchedUpi.name}</p>}
                    {matchedUpi.amount && <p className="text-slate-500 font-bold">Amount: ₹{matchedUpi.amount}</p>}
                  </div>
                </div>
              )}

              {!matchedCustomer && !matchedOrder && !matchedUpi && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-300 text-center font-medium">
                  {t('invalidQrCode')} - Scanned data does not match existing customers or orders in database.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={resetScan}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {t('scanAnother')}
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
