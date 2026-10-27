export type Role = 'admin' | 'cashier' | null;

export type Tab =
  | 'dashboard'
  | 'pos'
  | 'stock'
  | 'customers'
  | 'reports'
  | 'settings';

export interface Product {
  id: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  min: number;
  barcode: string;
  unit: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'credit';

export interface SaleItem {
  id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  unit: string;
}

export interface Sale {
  receiptNo: string;
  createdAt: string;
  items: SaleItem[];
  total: number;
  subtotal: number;
  discount: number;
  payment: PaymentMethod;
  profit: number;
  status: 'completed' | 'cancelled';
  cashier: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  limit: number;
  balance: number;
  createdAt: string;
}

export interface StoreInfo {
  name: string;
  subtitle: string;
  logoText: string;
  address: string;
  phone: string;
  footerNote: string;
  currency: string;
  pin: string;
}

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface DB {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  store: StoreInfo;
  theme: Theme;
}
