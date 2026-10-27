import type { DB, Product, StoreInfo, Theme } from './types';

const KEY = 'zaki_market_offline_v3';

const seedProducts: Product[] = [
  { id: '1', name: 'Cevital huile 1L', category: 'Essentials', cost: 135, price: 155, stock: 18, min: 6, barcode: '613000000001', unit: 'bottle' },
  { id: '2', name: 'Lait Soummam 1L', category: 'Dairy', cost: 110, price: 125, stock: 24, min: 8, barcode: '613000000002', unit: 'unit' },
  { id: '3', name: 'Coca-Cola 1.5L', category: 'Drinks', cost: 120, price: 150, stock: 16, min: 6, barcode: '613000000003', unit: 'bottle' },
  { id: '4', name: 'Hamoud Boualem 1L', category: 'Drinks', cost: 95, price: 120, stock: 22, min: 6, barcode: '613000000004', unit: 'bottle' },
  { id: '5', name: 'Bimo gaufrette', category: 'Snacks', cost: 35, price: 50, stock: 36, min: 10, barcode: '613000000005', unit: 'unit' },
  { id: '6', name: 'Pâtes 500g', category: 'Essentials', cost: 48, price: 60, stock: 28, min: 8, barcode: '613000000006', unit: 'pack' },
  { id: '7', name: 'Sucre 1kg', category: 'Essentials', cost: 105, price: 120, stock: 14, min: 5, barcode: '613000000007', unit: 'bag' },
  { id: '8', name: 'Lessive poudre 1kg', category: 'Home care', cost: 240, price: 285, stock: 9, min: 3, barcode: '613000000008', unit: 'pack' },
];

const defaultStore: StoreInfo = {
  name: "Zaki's Market",
  subtitle: 'ALIMENTATION · DZD / DA',
  logoText: 'Z',
  address: 'Cité El Hidhab, Sétif · Algérie',
  phone: '0561 00 00 00',
  footerNote: 'Merci de votre visite',
  currency: 'DA',
  pin: '1234',
};

const defaultTheme: Theme = {
  primary: '#174a3b',
  secondary: '#276b53',
  accent: '#e5563f',
};

function buildSeed(): DB {
  return {
    products: seedProducts,
    sales: [],
    expenses: [],
    customers: [],
    store: defaultStore,
    theme: defaultTheme,
  };
}

function migrate(old: Partial<DB> | null): DB {
  const base = buildSeed();
  if (!old) return base;
  return {
    products: old.products ?? base.products,
    sales: old.sales ?? [],
    expenses: old.expenses ?? [],
    customers: old.customers ?? [],
    store: { ...base.store, ...old.store },
    theme: { ...base.theme, ...old.theme },
  };
}

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    return migrate(raw ? JSON.parse(raw) : null);
  } catch {
    return buildSeed();
  }
}

export function saveDB(db: DB): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // storage full or unavailable — silent fail in offline mode
  }
}

export function resetDB(): DB {
  const fresh = buildSeed();
  saveDB(fresh);
  return fresh;
}

export const defaultThemes: Record<string, Theme> = {
  Forest: defaultTheme,
  Pistachio: { primary: '#3b6b4a', secondary: '#4f8a5e', accent: '#d98a3a' },
  Beige: { primary: '#6b5d3f', secondary: '#8a7a55', accent: '#b8503f' },
  Ocean: { primary: '#1c4b6b', secondary: '#2c6b8a', accent: '#e0a83a' },
  Plum: { primary: '#4a2c4b', secondary: '#6b3f5e', accent: '#d98a3a' },
  Slate: { primary: '#2d3748', secondary: '#4a5568', accent: '#e5563f' },
};
