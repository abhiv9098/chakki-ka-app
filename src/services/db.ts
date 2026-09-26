import { Customer, Order, CreditRecord, DailyHisab } from '../types';

const STORAGE_KEYS = {
  CUSTOMERS: 'chakkimitra_customers',
  ORDERS: 'chakkimitra_orders',
  CREDIT_RECORDS: 'chakkimitra_credit_records',
  SETTINGS: 'chakkimitra_settings',
  DAILY_HISAB: 'chakkimitra_daily_hisab'
};

// Generate realistic mock data for initial load
const getMockData = () => {
  const mockCustomers: Customer[] = [];
  const mockOrders: Order[] = [];
  const mockCreditRecords: CreditRecord[] = [];
  return { mockCustomers, mockOrders, mockCreditRecords };
};

export const syncToServer = async () => {
  if (typeof window === 'undefined') return;
  try {
    const data = {
      customers: JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]'),
      orders: JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]'),
      creditRecords: JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDIT_RECORDS) || '[]'),
      dailyHisabs: JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_HISAB) || '[]')
    };
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error("Sync to server failed", e);
  }
};

export const syncFromServer = async () => {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/sync');
    const json = await res.json();
    if (json.success && json.data) {
      if (json.data.customers) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(json.data.customers));
      if (json.data.orders) localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(json.data.orders));
      if (json.data.creditRecords) localStorage.setItem(STORAGE_KEYS.CREDIT_RECORDS, JSON.stringify(json.data.creditRecords));
      if (json.data.dailyHisabs) localStorage.setItem(STORAGE_KEYS.DAILY_HISAB, JSON.stringify(json.data.dailyHisabs));
      
      // Dispatch an event so React context knows data changed
      window.dispatchEvent(new Event('db-synced'));
      return true;
    }
  } catch (e) {
    console.error("Fetch from server failed", e);
  }
  return false;
};

const saveToStorage = (key: string, value: string) => {
  localStorage.setItem(key, value);
  if ((window as any)._syncTimer) clearTimeout((window as any)._syncTimer);
  (window as any)._syncTimer = setTimeout(() => {
    syncToServer();
  }, 500);
};

let isInitialized = false;

export const dbService = {
  init: () => {
    if (typeof window === 'undefined' || isInitialized) return;
    isInitialized = true;
    
    // Attempt to sync from server in the background
    syncFromServer().then(success => {
      if (!success) {
        // If server empty/failed, sync our local data TO the server just in case
        syncToServer();
      }
    });

    // Check version to handle migration/clearance of old mock data
    const version = localStorage.getItem('chakkimitra_db_version');
    if (version !== '2.3') {
      localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.CREDIT_RECORDS);
      localStorage.removeItem(STORAGE_KEYS.DAILY_HISAB);
      localStorage.setItem('chakkimitra_db_version', '2.3');
    }

    const customers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    const orders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const credits = localStorage.getItem(STORAGE_KEYS.CREDIT_RECORDS);

    if (!customers || !orders || !credits) {
      const { mockCustomers, mockOrders, mockCreditRecords } = getMockData();
      saveToStorage(STORAGE_KEYS.CUSTOMERS, JSON.stringify(mockCustomers));
      saveToStorage(STORAGE_KEYS.ORDERS, JSON.stringify(mockOrders));
      saveToStorage(STORAGE_KEYS.CREDIT_RECORDS, JSON.stringify(mockCreditRecords));
    }

    // Auto-fix: Remove duplicate entries caused by double-tap bug (within 2 seconds)
    try {
      const cleanDuplicates = (key: string, matchFields: string[]) => {
        const dataStr = localStorage.getItem(key);
        if (!dataStr) return;
        const data = JSON.parse(dataStr);
        if (!Array.isArray(data)) return;
        
        let hasDuplicates = false;
        // Sort by createdAt or date to process newest first
        const sorted = [...data].sort((a, b) => {
          const tA = a.createdAt || new Date(a.date).getTime() || 0;
          const tB = b.createdAt || new Date(b.date).getTime() || 0;
          return tB - tA;
        });
        
        const unique: any[] = [];
        for (const curr of sorted) {
          const isDuplicate = unique.some(u => {
            if (!u.createdAt || !curr.createdAt) return false; // Don't guess if missing createdAt
            const timeDiff = Math.abs(u.createdAt - curr.createdAt);
            if (timeDiff > 2000) return false; // Not within 2 seconds
            
            // Check all match fields
            return matchFields.every(field => u[field] === curr[field]);
          });
          
          if (!isDuplicate) {
            unique.push(curr);
          } else {
            hasDuplicates = true;
          }
        }
        
        if (hasDuplicates) {
          localStorage.setItem(key, JSON.stringify(unique));
        }
      };

      cleanDuplicates(STORAGE_KEYS.ORDERS, ['customerId', 'totalAmount', 'grainType', 'paymentType']);
      cleanDuplicates(STORAGE_KEYS.CREDIT_RECORDS, ['customerId', 'amount', 'type']);
      // For DailyHisab, we check amount, expenseDescription, and notes
      cleanDuplicates(STORAGE_KEYS.DAILY_HISAB, ['amount', 'expenseDescription', 'notes', 'date']);
    } catch (e) {
      console.error("Cleanup failed", e);
    }

    dbService.recalculateAllCustomerBalances();
  },

  getCustomers: (): Customer[] => {
    if (typeof window === 'undefined') return [];
    dbService.init();
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  saveCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'outstandingBalance'>): Customer => {
    const customers = dbService.getCustomers();
    
    // Prevent duplicate customers by name
    const existing = customers.find(c => c.name.toLowerCase() === customer.name.toLowerCase());
    if (existing) {
      return existing;
    }

    const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
    const newCustomer: Customer = {
      ...customer,
      id: newId,
      outstandingBalance: 0,
      createdAt: Date.now()
    };
    customers.push(newCustomer);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    return newCustomer;
  },

  updateCustomerBalance: (customerId: number, updatedBalance: number) => {
    const customers = dbService.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      customers[index].outstandingBalance = parseFloat(updatedBalance.toFixed(2));
      saveToStorage(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  },

  updateCustomerDetails: (customerId: number, name: string, phone: string, email?: string, password?: string): Customer | null => {
    const customers = dbService.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      const oldName = customers[index].name;
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();
      customers[index].name = trimmedName;
      customers[index].phone = trimmedPhone;
      if (email !== undefined) customers[index].email = email.trim();
      if (password !== undefined) customers[index].password = password;
      saveToStorage(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      
      // Update name in orders to keep data consistent
      const orders = dbService.getOrders();
      let ordersUpdated = false;
      orders.forEach(o => {
        if (o.customerId === customerId) {
          o.customerName = trimmedName;
          ordersUpdated = true;
        }
      });
      if (ordersUpdated) {
        saveToStorage(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      }

      // Update name in daily hisab to prevent detachment
      const hisabs = dbService.getDailyHisabs();
      let hisabsUpdated = false;
      hisabs.forEach(h => {
        if (h.incomeDescription && h.incomeDescription.trim().toLowerCase() === oldName.trim().toLowerCase()) {
          h.incomeDescription = trimmedName;
          hisabsUpdated = true;
        }
        if (h.notes && h.notes.trim().toLowerCase() === oldName.trim().toLowerCase()) {
          h.notes = trimmedName;
          hisabsUpdated = true;
        }
      });
      if (hisabsUpdated) {
        saveToStorage(STORAGE_KEYS.DAILY_HISAB, JSON.stringify(hisabs));
      }

      return customers[index];
    }
    return null;
  },

  updateCustomerPotaliStatus: (customerId: number, status: 'none' | 'received' | 'delivered'): Customer | null => {
    const customers = dbService.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      customers[index].potaliStatus = status;
      customers[index].potaliUpdatedAt = Date.now();
      saveToStorage(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      return customers[index];
    }
    return null;
  },

  deleteCustomer: (customerId: number): void => {
    const customers = dbService.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const filteredCustomers = customers.filter(c => c.id !== customerId);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filteredCustomers));

    const orders = dbService.getOrders().filter(o => o.customerId !== customerId);
    saveToStorage(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    const creditRecords = dbService.getCreditRecords().filter(r => r.customerId !== customerId);
    saveToStorage(STORAGE_KEYS.CREDIT_RECORDS, JSON.stringify(creditRecords));

    const dailyHisabs = dbService.getDailyHisabs().filter(h => {
      // Only delete PENDING hisabs for this customer.
      // We must keep completed hisabs so the shop's historical cash/earnings charts don't break!
      if (!h.isPending) return true; 

      const name1 = (h.incomeDescription || '').trim().toLowerCase();
      const name2 = (h.notes || '').trim().toLowerCase();
      const cName = customer.name.trim().toLowerCase();
      
      const isMatch = name1 === cName || 
                      name2 === cName || 
                      name1 === `customer: ${cName}` || 
                      name2 === `customer: ${cName}`;
      return !isMatch; // delete if it's a match AND isPending
    });
    saveToStorage(STORAGE_KEYS.DAILY_HISAB, JSON.stringify(dailyHisabs));
  },

  getOrders: (): Order[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  recalculateCustomerBalance: (customerId: number) => {
    const records = dbService.getCreditRecords();
    const custRecords = records.filter(r => r.customerId === customerId);
    const computedBalance = custRecords.reduce((sum, r) => {
      return r.type === 'DUE' ? sum + r.amount : sum - r.amount;
    }, 0);
    const rounded = parseFloat(Math.max(0, computedBalance).toFixed(2));

    const customers = dbService.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      customers[index].outstandingBalance = rounded;
      saveToStorage(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
    return rounded;
  },

  recalculateAllCustomerBalances: () => {
    if (typeof window === 'undefined') return;
    const customers = dbService.getCustomers();
    const records = dbService.getCreditRecords();
    
    if (customers.length === 0) return;

    let updated = false;
    customers.forEach(cust => {
      const custRecords = records.filter(r => r.customerId === cust.id);
      const computedBalance = custRecords.reduce((sum, r) => {
        return r.type === 'DUE' ? sum + r.amount : sum - r.amount;
      }, 0);
      const rounded = parseFloat(Math.max(0, computedBalance).toFixed(2));
      if (cust.outstandingBalance !== rounded) {
        cust.outstandingBalance = rounded;
        updated = true;
      }
    });

    if (updated) {
      saveToStorage(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  },

  saveOrder: (order: Omit<Order, 'id' | 'createdAt'>): Order => {
    const orders = dbService.getOrders();
    const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    const newOrder: Order = {
      ...order,
      id: newId,
      createdAt: Date.now()
    };
    orders.push(newOrder);
    saveToStorage(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    if (order.paymentType === 'CREDIT') {
      dbService.saveCreditRecord({
        customerId: order.customerId,
        amount: order.totalAmount,
        type: 'DUE',
        description: `Order #${newId} ${order.grainType} Grinding`
      });
      dbService.recalculateCustomerBalance(order.customerId);
    }

    return newOrder;
  },

  getCreditRecords: (): CreditRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      dbService.init();
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDIT_RECORDS) || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  saveCreditRecord: (record: Omit<CreditRecord, 'id' | 'createdAt'>): CreditRecord => {
    const records = dbService.getCreditRecords();
    const newId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
    const newRecord: CreditRecord = {
      ...record,
      id: newId,
      createdAt: Date.now()
    };
    records.push(newRecord);
    saveToStorage(STORAGE_KEYS.CREDIT_RECORDS, JSON.stringify(records));
    return newRecord;
  },

  recordKhataTransaction: (customerId: number, amount: number, type: 'DUE' | 'PAID', description: string) => {
    const record = dbService.saveCreditRecord({
      customerId,
      amount,
      type,
      description
    });
    dbService.recalculateCustomerBalance(customerId);
    return record;
  },

  exportData: (): string => {
    const customers = dbService.getCustomers();
    const orders = dbService.getOrders();
    const records = dbService.getCreditRecords();
    const backup = {
      version: '1.0',
      timestamp: Date.now(),
      data: {
        customers,
        orders,
        creditRecords: records
      }
    };
    return JSON.stringify(backup, null, 2);
  },

  importData: (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.version && parsed.data && parsed.data.customers && parsed.data.orders && parsed.data.creditRecords) {
        saveToStorage(STORAGE_KEYS.CUSTOMERS, JSON.stringify(parsed.data.customers));
        saveToStorage(STORAGE_KEYS.ORDERS, JSON.stringify(parsed.data.orders));
        saveToStorage(STORAGE_KEYS.CREDIT_RECORDS, JSON.stringify(parsed.data.creditRecords));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  resetAll: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.CREDIT_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.DAILY_HISAB);
    isInitialized = false;
    dbService.init();
  },

  getDailyHisabs: (): DailyHisab[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_HISAB) || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  saveDailyHisab: (hisab: Omit<DailyHisab, 'id' | 'createdAt'>): DailyHisab => {
    const hisabs = dbService.getDailyHisabs();
    const validIds = hisabs.map(h => Number(h.id)).filter(id => !isNaN(id));
    const newId = validIds.length > 0 ? Math.max(...validIds) + 1 : 1;
    const newHisab: DailyHisab = {
      ...hisab,
      id: newId,
      createdAt: Date.now()
    };
    hisabs.push(newHisab);
    saveToStorage(STORAGE_KEYS.DAILY_HISAB, JSON.stringify(hisabs));
    return newHisab;
  },

  deleteDailyHisab: (id: number): void => {
    const hisabs = dbService.getDailyHisabs().filter(h => h.id !== id);
    saveToStorage(STORAGE_KEYS.DAILY_HISAB, JSON.stringify(hisabs));
  },

  updateDailyHisab: (updatedHisab: DailyHisab): void => {
    const hisabs = dbService.getDailyHisabs();
    const idx = hisabs.findIndex(h => h.id === updatedHisab.id);
    if (idx !== -1) {
      hisabs[idx] = updatedHisab;
      saveToStorage(STORAGE_KEYS.DAILY_HISAB, JSON.stringify(hisabs));
    }
  },

  deleteOrder: (orderId: number): void => {
    const orders = dbService.getOrders();
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const updatedOrders = orders.filter(o => o.id !== orderId);
    saveToStorage(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));

    // If order was a CREDIT order, delete corresponding credit record and update balance
    if (targetOrder.paymentType === 'CREDIT') {
      const records = dbService.getCreditRecords();
      const updatedRecords = records.filter(
        r => !(r.customerId === targetOrder.customerId && r.type === 'DUE' && r.description.includes(`Order #${orderId}`))
      );
      saveToStorage(STORAGE_KEYS.CREDIT_RECORDS, JSON.stringify(updatedRecords));
      dbService.recalculateCustomerBalance(targetOrder.customerId);
    }
  },

  deleteCreditRecord: (recordId: number): void => {
    const records = dbService.getCreditRecords();
    const targetRecord = records.find(r => r.id === recordId);
    if (!targetRecord) return;

    const updatedRecords = records.filter(r => r.id !== recordId);
    saveToStorage(STORAGE_KEYS.CREDIT_RECORDS, JSON.stringify(updatedRecords));
    dbService.recalculateCustomerBalance(targetRecord.customerId);
  }
};
