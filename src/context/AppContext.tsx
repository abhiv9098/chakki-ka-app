'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Order, CreditRecord, DailyHisab } from '../types';
import { dbService } from '../services/db';
import { translations } from '../data/translations';

type ViewType = 'dashboard' | 'customers' | 'settings' | 'daily-hisab' | 'hisab-history';

interface AppContextType {
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  customers: Customer[];
  orders: Order[];
  creditRecords: CreditRecord[];
  dailyHisabs: DailyHisab[];
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  refreshData: () => void;
  addCustomer: (name: string, phone: string) => Customer;
  updateCustomer: (customerId: number, name: string, phone: string) => Customer | null;
  updateCustomerPotaliStatus: (customerId: number, status: 'none' | 'received' | 'delivered') => void;
  cycleCustomerPotaliStatus: (customerId: number) => void;
  deleteCustomer: (customerId: number) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Order;
  deleteOrder: (orderId: number) => void;
  recordPayment: (customerId: number, amount: number, description: string) => void;
  recordManualDue: (customerId: number, amount: number, description: string) => void;
  deleteCreditRecord: (recordId: number) => void;
  addDailyHisab: (hisab: Omit<DailyHisab, 'id' | 'createdAt'>) => DailyHisab;
  updateDailyHisab: (hisab: DailyHisab) => void;
  deleteDailyHisab: (id: number) => void;
  exportBackup: () => string;
  restoreBackup: (json: string) => boolean;
  t: (key: keyof typeof translations.en) => string;
  upiId: string;
  setUpiId: (id: string) => void;
  defaultGrindingRate: string;
  setDefaultGrindingRate: (rate: string) => void;
  grainRates: Record<string, number>;
  updateGrainRate: (grain: string, rate: number) => void;
  hideAmounts: boolean;
  toggleHideAmounts: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'en' | 'hi'>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [creditRecords, setCreditRecords] = useState<CreditRecord[]>([]);
  const [dailyHisabs, setDailyHisabs] = useState<DailyHisab[]>([]);
  const [upiId, setUpiIdState] = useState<string>('');
  const [defaultGrindingRate, setDefaultGrindingRateState] = useState<string>('3');
  const [hideAmounts, setHideAmounts] = useState<boolean>(false);

  const defaultGrainRatesMap: Record<string, number> = {
    "Wheat": 3,
    "Atta": 3,
    "Maize": 10,
    "Gram/Chana": 8,
    "Rice": 6,
    "Barley": 7,
    "Bajra": 6,
    "Multigrain": 10,
    "Other": 3
  };

  const [grainRates, setGrainRatesState] = useState<Record<string, number>>(defaultGrainRatesMap);

  const refreshData = () => {
    const custs = dbService.getCustomers();
    setCustomers(custs);
    setOrders(dbService.getOrders());
    setCreditRecords(dbService.getCreditRecords());
    setDailyHisabs(dbService.getDailyHisabs());

    setSelectedCustomer(prev => {
      if (!prev) return null;
      return custs.find(c => c.id === prev.id) || null;
    });
  };

  // Load language and theme preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('chakkimitra_lang') as 'en' | 'hi';
      if (storedLang) setLanguageState(storedLang);

      const storedTheme = localStorage.getItem('chakkimitra_theme') as 'light' | 'dark';
      const storedUpi = localStorage.getItem('chakkimitra_upi_id') || '';
      setUpiIdState(storedUpi);
      const storedRate = localStorage.getItem('chakkimitra_default_rate') || '3';
      setDefaultGrindingRateState(storedRate);

      const storedGrainRates = localStorage.getItem('chakkimitra_grain_rates');
      if (storedGrainRates) {
        try {
          const parsed = JSON.parse(storedGrainRates);
          const updatedRates = { ...defaultGrainRatesMap, ...parsed, "Wheat": 3 };
          setGrainRatesState(updatedRates);
          localStorage.setItem('chakkimitra_grain_rates', JSON.stringify(updatedRates));
        } catch (e) {
          console.error(e);
        }
      } else {
        localStorage.setItem('chakkimitra_grain_rates', JSON.stringify(defaultGrainRatesMap));
      }

      const storedHide = localStorage.getItem('chakkimitra_hide_amounts') === 'true';
      setHideAmounts(storedHide);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
      
      setTheme(initialTheme);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      const storedFontSize = (localStorage.getItem('chakkimitra_font_size') as 'normal' | 'large' | 'xlarge') || 'large';
      setFontSizeState(storedFontSize);
      document.documentElement.classList.remove('font-normal', 'font-large', 'font-xlarge');
      document.documentElement.classList.add(`font-${storedFontSize}`);

      // Initialize DB & load initial data
      dbService.init();
      refreshData();
    }
  }, []);

  const setFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSizeState(size);
    localStorage.setItem('chakkimitra_font_size', size);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('font-normal', 'font-large', 'font-xlarge');
      document.documentElement.classList.add(`font-${size}`);
    }
  };

  const updateGrainRate = (grain: string, rate: number) => {
    const updated = { ...grainRates, [grain]: rate };
    setGrainRatesState(updated);
    localStorage.setItem('chakkimitra_grain_rates', JSON.stringify(updated));
  };

  const setLanguage = (lang: 'en' | 'hi') => {
    setLanguageState(lang);
    localStorage.setItem('chakkimitra_lang', lang);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('chakkimitra_theme', nextTheme);
    
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };


  const addDailyHisab = (hisab: Omit<DailyHisab, 'id' | 'createdAt'>) => {
    const newHisab = dbService.saveDailyHisab(hisab);
    refreshData();
    return newHisab;
  };

  const updateDailyHisab = (hisab: DailyHisab) => {
    dbService.updateDailyHisab(hisab);
    refreshData();
  };

  const deleteDailyHisab = (id: number) => {
    dbService.deleteDailyHisab(id);
    refreshData();
  };

  const addCustomer = (name: string, phone: string) => {
    const newCust = dbService.saveCustomer({ name, phone });
    refreshData();
    return newCust;
  };

  const updateCustomer = (customerId: number, name: string, phone: string) => {
    const updated = dbService.updateCustomerDetails(customerId, name, phone);
    refreshData();
    if (selectedCustomer && selectedCustomer.id === customerId) {
      setSelectedCustomer(updated);
    }
    return updated;
  };

  const updateCustomerPotaliStatus = (customerId: number, status: 'none' | 'received' | 'delivered') => {
    const updated = dbService.updateCustomerPotaliStatus(customerId, status);
    refreshData();
    if (selectedCustomer && selectedCustomer.id === customerId) {
      setSelectedCustomer(updated);
    }
  };

  const cycleCustomerPotaliStatus = (customerId: number) => {
    const targetCust = dbService.getCustomers().find(c => c.id === customerId);
    if (!targetCust) return;
    const current = targetCust.potaliStatus || 'none';
    let nextStatus: 'none' | 'received' | 'delivered' = 'received';
    if (current === 'none') nextStatus = 'received';
    else if (current === 'received') nextStatus = 'delivered';
    else if (current === 'delivered') nextStatus = 'none';

    updateCustomerPotaliStatus(customerId, nextStatus);
  };

  const deleteCustomer = (customerId: number) => {
    dbService.deleteCustomer(customerId);
    refreshData();
    if (selectedCustomer && selectedCustomer.id === customerId) {
      setSelectedCustomer(null);
    }
  };

  const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrd = dbService.saveOrder(order);
    refreshData();
    return newOrd;
  };

  const deleteOrder = (orderId: number) => {
    dbService.deleteOrder(orderId);
    refreshData();
  };

  const recordPayment = (customerId: number, amount: number, description: string) => {
    dbService.recordKhataTransaction(customerId, amount, 'PAID', description);
    
    // Auto-settle Udhar DailyHisabs for this customer
    let remainingPayment = amount;
    const allHisabs = dbService.getDailyHisabs();
    const customer = dbService.getCustomers().find(c => c.id === customerId);
    
    if (customer) {
      const customerName = customer.name.toLowerCase();
      const udharHisabs = allHisabs.filter(h => {
        if (h.isPending) return false;
        const hName = (h.incomeDescription || h.notes || '').toLowerCase();
        if (hName.trim() !== customerName.trim()) return false;
        
        const desc = h.expenseDescription || '';
        return desc.startsWith('UDHAR');
      }).sort((a, b) => a.id - b.id); // oldest first
      
      for (const h of udharHisabs) {
        if (remainingPayment <= 0) break;
        
        const total = h.amount || 0;
        const desc = h.expenseDescription || '';
        
        let jama = 0;
        let udhar = total;
        const jamaMatch = desc.match(/Jama:\s*₹?(\d+(?:\.\d+)?)/i);
        const udharMatch = desc.match(/Udhar:\s*₹?(\d+(?:\.\d+)?)/i);
        if (jamaMatch && udharMatch) {
          jama = parseFloat(jamaMatch[1]) || 0;
          udhar = parseFloat(udharMatch[1]) || 0;
        }

        if (udhar > 0) {
          const deduct = Math.min(udhar, remainingPayment);
          remainingPayment -= deduct;
          
          const newJama = jama + deduct;
          const newUdhar = udhar - deduct;
          
          let newDesc = '';
          if (newUdhar <= 0) {
            newDesc = description.toLowerCase().includes('upi') || description.toLowerCase().includes('paytm') ? 'PAYTM' : 'CASH';
          } else {
            newDesc = `UDHAR (Jama: ₹${newJama.toFixed(0)}, Udhar: ₹${newUdhar.toFixed(0)})`;
          }
          
          dbService.updateDailyHisab({ ...h, expenseDescription: newDesc });
        }
      }
    }
    
    refreshData();
    // Update selected customer if applicable
    if (selectedCustomer && selectedCustomer.id === customerId) {
      const updated = dbService.getCustomers().find(c => c.id === customerId);
      if (updated) setSelectedCustomer(updated);
    }
  };

  const recordManualDue = (customerId: number, amount: number, description: string) => {
    dbService.recordKhataTransaction(customerId, amount, 'DUE', description);
    refreshData();
    // Update selected customer if applicable
    if (selectedCustomer && selectedCustomer.id === customerId) {
      const updated = dbService.getCustomers().find(c => c.id === customerId);
      if (updated) setSelectedCustomer(updated);
    }
  };

  const deleteCreditRecord = (recordId: number) => {
    dbService.deleteCreditRecord(recordId);
    refreshData();
  };

  const exportBackup = () => {
    return dbService.exportData();
  };

  const restoreBackup = (json: string) => {
    const result = dbService.importData(json);
    if (result) {
      refreshData();
    }
    return result;
  };

  const setUpiId = (id: string) => {
    setUpiIdState(id);
    localStorage.setItem('chakkimitra_upi_id', id);
  };

  const setDefaultGrindingRate = (rate: string) => {
    setDefaultGrindingRateState(rate);
    localStorage.setItem('chakkimitra_default_rate', rate);
  };

  const toggleHideAmounts = () => {
    const nextVal = !hideAmounts;
    setHideAmounts(nextVal);
    localStorage.setItem('chakkimitra_hide_amounts', String(nextVal));
  };

  // Translation helper
  const t = (key: keyof typeof translations.en): string => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || String(key);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        toggleTheme,
        fontSize,
        setFontSize,
        customers,
        orders,
        creditRecords,
        dailyHisabs,
        activeView,
        setActiveView,
        selectedCustomer,
        setSelectedCustomer,
        refreshData,
        addCustomer,
        updateCustomer,
        updateCustomerPotaliStatus,
        cycleCustomerPotaliStatus,
        deleteCustomer,
        addOrder,
        deleteOrder,
        recordPayment,
        recordManualDue,
        deleteCreditRecord,
        addDailyHisab,
        updateDailyHisab,
        deleteDailyHisab,
        exportBackup,
        restoreBackup,
        t,
        upiId,
        setUpiId,
        defaultGrindingRate,
        setDefaultGrindingRate,
        grainRates,
        updateGrainRate,
        hideAmounts,
        toggleHideAmounts
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
