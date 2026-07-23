export interface Customer {
  id: number;
  name: string;
  phone: string;
  outstandingBalance: number;
  createdAt: number;
}

export interface Order {
  id: number;
  customerId: number;
  customerName: string;
  grainType: string;
  weight: number;
  rate: number;
  totalAmount: number;
  paymentType: 'CASH' | 'CREDIT';
  createdAt: number;
}

export interface CreditRecord {
  id: number;
  customerId: number;
  amount: number;
  type: 'DUE' | 'PAID';
  description: string;
  createdAt: number;
}

export interface DailySummary {
  earnings: number;
  count: number;
}

export interface DailyHisab {
  id: number;
  date: string;
  grainType?: string;
  wheatWeight: number;
  rate: number;
  revenue: number;
  expenses: number;
  expenseDescription: string;
  extraIncome?: number;
  incomeDescription?: string;
  isProfit: boolean;
  amount: number;
  notes: string;
  createdAt: number;
}
