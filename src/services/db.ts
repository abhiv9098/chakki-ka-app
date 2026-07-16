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
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const mockCustomers: Customer[] = [
    { id: 1, name: "Ramesh Kumar", phone: "9876543210", outstandingBalance: 0, createdAt: now - 15 * oneDay },
    { id: 2, name: "Sita Sharma", phone: "9812345678", outstandingBalance: 0, createdAt: now - 12 * oneDay },
    { id: 3, name: "Amit Singh", phone: "9988776655", outstandingBalance: 0, createdAt: now - 10 * oneDay },
    { id: 4, name: "Sunita Devi", phone: "9555444333", outstandingBalance: 0, createdAt: now - 8 * oneDay },
    { id: 5, name: "Rajesh Patel", phone: "9444333222", outstandingBalance: 0, createdAt: now - 5 * oneDay }
  ];

  // Grinding orders logged over the last 10 days
  const mockOrders: Order[] = [];

  // Credit ledger (Khata)
  const mockCreditRecords: CreditRecord[] = [];

  return { mockCustomers, mockOrders, mockCreditRecords };
};

export const dbService = {
  init: () => {
    if (typeof window === 'undefined') return;

    // Check version to handle migration/clearance of old mock data
    const version = localStorage.getItem('chakkimitra_db_version');
    if (version !== '2.0') {
      localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.CREDIT_RECORDS);
      localStorage.setItem('chakkimitra_db_version', '2.0');
    }

    const customers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    const orders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const credits = localStorage.getItem(STORAGE_KEYS.CREDIT_RECORDS);

    if (!customers || !orders || !credits) {
      const { mockCustomers, mockOrders, mockCreditRecords } = getMockData();
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(mockCustomers));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(mockOrders));
      localStorage.setItem(STORAGE_KEYS.CREDIT_RECORDS, JSON.stringify(mockCreditRecords));
    }
  },

  getCustomers: (): Customer[] => {
    if (typeof window === 'undefined') return [];
    dbService.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
  },

  saveCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'outstandingBalance'>): Customer => {
    const customers = dbService.getCustomers();
    const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
    const newCustomer: Customer = {
      ...customer,
      id: newId,
      outstandingBalance: 0,
      createdAt: Date.now()
    };
    customers.push(newCustomer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    return newCustomer;
  },

  updateCustomerBalance: (customerId: number, updatedBalance: number) => {
    const customers = dbService.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      customers[index].outstandingBalance = parseFloat(updatedBalance.toFixed(2));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  },

  updateCustomerDetails: (customerId: number, name: string, phone: string): Customer | null => {
    const customers = dbService.getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();
      customers[index].name = trimmedName;
      customers[index].phone = trimmedPhone;
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      
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
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      }
      return customers[index];
    }
    return null;
  },

  deleteCustomer: (customerId: number): void => {
    const customers = dbService.getCustomers().filter(c => c.id !== customerId);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

    const orders = dbService.getOrders().filter(o => o.customerId !== customerId);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    const creditRecords = dbService.getCreditRecords().filter(r => r.customerId !== customerId);
    localStorage.setItem(STORAGE_KEYS.CREDIT_RECORDS, JSON.stringify(creditRecords));
  },

  getOrders: (): Order[] => {
    if (typeof window === 'undefined') return [];
    dbService.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
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
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    if (order.paymentType === 'CREDIT') {
      // Update outstanding balance and record credit transaction
      const customers = dbService.getCustomers();
      const customer = customers.find(c => c.id === order.customerId);
      if (customer) {
        const newBalance = customer.outstandingBalance + order.totalAmount;
        dbService.updateCustomerBalance(customer.id, newBalance);

        dbService.saveCreditRecord({
          customerId: customer.id,
          amount: order.totalAmount,
          type: 'DUE',
          description: `Order #${newId} ${order.grainType} Grinding`
        });
      }
    }

    return newOrder;
  },

  getCreditRecords: (): CreditRecord[] => {
    if (typeof window === 'undefined') return [];
    dbService.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDIT_RECORDS) || '[]');
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
    localStorage.setItem(STORAGE_KEYS.CREDIT_RECORDS, JSON.stringify(records));
    return newRecord;
  },

  recordKhataTransaction: (customerId: number, amount: number, type: 'DUE' | 'PAID', description: string) => {
    const record = dbService.saveCreditRecord({
      customerId,
      amount,
      type,
      description
    });

    const customers = dbService.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const delta = type === 'DUE' ? amount : -amount;
      const newBalance = customer.outstandingBalance + delta;
      dbService.updateCustomerBalance(customerId, newBalance);
    }
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
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(parsed.data.customers));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(parsed.data.orders));
        localStorage.setItem(STORAGE_KEYS.CREDIT_RECORDS, JSON.stringify(parsed.data.creditRecords));
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
    dbService.init();
  },

  getDailyHisabs: (): DailyHisab[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_HISAB) || '[]');
  },

  saveDailyHisab: (hisab: Omit<DailyHisab, 'id' | 'createdAt'>): DailyHisab => {
    const hisabs = dbService.getDailyHisabs();
    const newId = hisabs.length > 0 ? Math.max(...hisabs.map(h => h.id)) + 1 : 1;
    const newHisab: DailyHisab = {
      ...hisab,
      id: newId,
      createdAt: Date.now()
    };
    hisabs.push(newHisab);
    localStorage.setItem(STORAGE_KEYS.DAILY_HISAB, JSON.stringify(hisabs));
    return newHisab;
  },

  deleteDailyHisab: (id: number): void => {
    const hisabs = dbService.getDailyHisabs().filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.DAILY_HISAB, JSON.stringify(hisabs));
  }
};
