import { useCallback, useState } from 'react';
import type {
  Customer,
  DB,
  Expense,
  Product,
  Role,
  Sale,
  StoreInfo,
  Tab,
  Theme,
} from '@/lib/types';
import { resetDB } from '@/lib/storage';
import { useDB } from '@/lib/useDB';
import { useTheme } from '@/lib/theme';
import Login from '@/components/Login';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Dashboard from '@/components/Dashboard';
import POS from '@/components/POS';
import Inventory from '@/components/Inventory';
import Customers from '@/components/Customers';
import Reports from '@/components/Reports';
import Settings from '@/components/Settings';
import ReceiptModal from '@/components/ReceiptModal';
import Toast, { type ToastKind } from '@/components/Toast';

export default function App() {
  const { db, update } = useDB();
  const [role, setRole] = useState<Role>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [toast, setToast] = useState<{ msg: string; kind: ToastKind } | null>(null);
  const [lastReceipt, setLastReceipt] = useState<Sale | null>(null);

  useTheme(db.theme);

  const onToast = useCallback((msg: string, kind: ToastKind = 'success') => {
    setToast({ msg, kind });
  }, []);

  const handleLogin = (r: Role) => {
    setRole(r);
    setTab(r === 'admin' ? 'dashboard' : 'pos');
  };

  const handleLock = () => {
    setRole(null);
    setLastReceipt(null);
  };

  const handleSale = (
    sale: Sale,
    updates: { products: Product[]; customers: Customer[] },
  ) => {
    update((d) => ({
      ...d,
      products: updates.products,
      customers: updates.customers,
      sales: [sale, ...d.sales],
    }));
  };

  const handleProducts = (products: Product[]) =>
    update((d) => ({ ...d, products }));

  const handleCustomers = (customers: Customer[]) =>
    update((d) => ({ ...d, customers }));

  const handleExpense = (e: Expense) =>
    update((d) => ({ ...d, expenses: [e, ...d.expenses] }));

  const handleRemoveExpense = (id: string) =>
    update((d) => ({ ...d, expenses: d.expenses.filter((x) => x.id !== id) }));

  const handleStore = (s: StoreInfo) =>
    update((d) => ({ ...d, store: s }));

  const handleTheme = (t: Theme) =>
    update((d) => ({ ...d, theme: t }));

  const handleReset = () => {
    const fresh = resetDB();
    update(() => fresh);
    setTab('dashboard');
  };

  if (!role) {
    return (
      <Login
        storeName={db.store.name}
        logoText={db.store.logoText}
        pin={db.store.pin}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--c-cream)' }}>
      <Sidebar
        tab={tab}
        role={role}
        storeName={db.store.name}
        logoText={db.store.logoText}
        onTab={setTab}
        onLock={handleLock}
      />
      <div className="flex-1 min-w-0">
        <TopBar tab={tab} store={db.store} role={role} />
        {tab === 'dashboard' && (
          <Dashboard db={db} role={role} onTab={setTab} />
        )}
        {tab === 'pos' && (
          <POS
            db={db}
            role={role}
            onSale={handleSale}
            onToast={onToast}
            onReceipt={(s) => setLastReceipt(s)}
          />
        )}
        {tab === 'stock' && (
          <Inventory
            db={db}
            role={role}
            onProducts={handleProducts}
            onToast={onToast}
          />
        )}
        {tab === 'customers' && (
          <Customers db={db} onCustomers={handleCustomers} onToast={onToast} />
        )}
        {tab === 'reports' && role === 'admin' && (
          <Reports
            db={db}
            onExpense={handleExpense}
            onRemoveExpense={handleRemoveExpense}
            onToast={onToast}
          />
        )}
        {tab === 'settings' && role === 'admin' && (
          <Settings
            db={db}
            onStore={handleStore}
            onTheme={handleTheme}
            onReset={handleReset}
            onToast={onToast}
          />
        )}
      </div>

      {lastReceipt && (
        <ReceiptModal
          sale={lastReceipt}
          store={db.store}
          onClose={() => setLastReceipt(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.msg}
          kind={toast.kind}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
