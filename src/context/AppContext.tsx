'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Order, CreditRecord, DailyHisab } from '../types';
import { dbService } from '../services/db';
import { translations } from '../data/translations';

type ViewType = 'dashboard' | 'customers' | 'grinding' | 'settings' | 'daily-hisab';

interface AppContextType {
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
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
  deleteCustomer: (customerId: number) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Order;
  recordPayment: (customerId: number, amount: number, description: string) => void;
  recordManualDue: (customerId: number, amount: number, description: string) => void;
  addDailyHisab: (hisab: Omit<DailyHisab, 'id' | 'createdAt'>) => DailyHisab;
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
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [creditRecords, setCreditRecords] = useState<CreditRecord[]>([]);
  const [dailyHisabs, setDailyHisabs] = useState<DailyHisab[]>([]);
  const [upiId, setUpiIdState] = useState<string>('');
  const [defaultGrindingRate, setDefaultGrindingRateState] = useState<string>('5');
  const [hideAmounts, setHideAmounts] = useState<boolean>(false);

  const defaultGrainRatesMap: Record<string, number> = {
    "Wheat": 5,
    "Maize": 10,
    "Gram/Chana": 8,
    "Rice": 6,
    "Barley": 7,
    "Bajra": 6,
    "Multigrain": 10,
    "Other": 5
  };

  const [grainRates, setGrainRatesState] = useState<Record<string, number>>(defaultGrainRatesMap);

  // Load language and theme preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('chakkimitra_lang') as 'en' | 'hi';
      if (storedLang) setLanguageState(storedLang);

      const storedTheme = localStorage.getItem('chakkimitra_theme') as 'light' | 'dark';
      const storedUpi = localStorage.getItem('chakkimitra_upi_id') || '';
      setUpiIdState(storedUpi);
      const storedRate = localStorage.getItem('chakkimitra_default_rate') || '5';
      setDefaultGrindingRateState(storedRate);

      const storedGrainRates = localStorage.getItem('chakkimitra_grain_rates');
      if (storedGrainRates) {
        try {
          const parsed = JSON.parse(storedGrainRates);
          setGrainRatesState({ ...defaultGrainRatesMap, ...parsed });
        } catch (e) {
          console.error(e);
        }
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

      // Initialize DB & load initial data
      dbService.init();
      refreshData();
    }
  }, []);

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

  const refreshData = () => {
    setCustomers(dbService.getCustomers());
    setOrders(dbService.getOrders());
    setCreditRecords(dbService.getCreditRecords());
    setDailyHisabs(dbService.getDailyHisabs());
  };

  const addDailyHisab = (hisab: Omit<DailyHisab, 'id' | 'createdAt'>) => {
    const newHisab = dbService.saveDailyHisab(hisab);
    refreshData();
    return newHisab;
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

  const recordPayment = (customerId: number, amount: number, description: string) => {
    dbService.recordKhataTransaction(customerId, amount, 'PAID', description);
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
        deleteCustomer,
        addOrder,
        recordPayment,
        recordManualDue,
        addDailyHisab,
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
