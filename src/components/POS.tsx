import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Search,
  Camera,
  X,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  UserPlus,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import type {
  CartItem,
  Customer,
  DB,
  PaymentMethod,
  Product,
  Sale,
} from '@/lib/types';
import { money, uid, makeReceiptNo } from '@/lib/utils';
import { useScanner } from '@/lib/useScanner';

interface Props {
  db: DB;
  role: 'admin' | 'cashier';
  onSale: (sale: Sale, updates: { products: Product[]; customers: Customer[] }) => void;
  onToast: (msg: string, kind?: 'success' | 'error' | 'info') => void;
  onReceipt: (sale: Sale) => void;
}

export default function POS({ db, role, onSale, onToast, onReceipt }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [customerId, setCustomerId] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(db.products.map((p) => p.category)))],
    [db.products],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.products.filter((p) => {
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.id === q;
      const matchC = category === 'All' || p.category === category;
      return matchQ && matchC;
    });
  }, [db.products, search, category]);

  const subtotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const disc = role === 'admin' ? Math.min(Number(discount) || 0, subtotal) : 0;
  const total = Math.max(0, subtotal - disc);

  const addToCart = (p: Product) => {
    if (p.stock <= 0) {
      onToast('Product is out of stock', 'error');
      return;
    }
    setCart((prev) => {
      const found = prev.find((x) => x.id === p.id);
      if (found) {
        if (found.quantity >= p.stock) {
          onToast('No more stock available', 'error');
          return prev;
        }
        return prev.map((x) =>
          x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x,
        );
      }
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((x) => x.id === id);
      if (!item) return prev;
      const next = item.quantity + delta;
      if (next <= 0) return prev.filter((x) => x.id !== id);
      const prod = db.products.find((p) => p.id === id);
      if (prod && next > prod.stock) {
        onToast('No more stock available', 'error');
        return prev;
      }
      return prev.map((x) => (x.id === id ? { ...x, quantity: next } : x));
    });
  };

  const handleScanEnter = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const term = search.trim().toLowerCase();
    if (!term) return;
    const exact = db.products.find(
      (p) => p.barcode.toLowerCase() === term || p.id === term,
    );
    if (exact) {
      addToCart(exact);
      setSearch('');
      return;
    }
    const matches = db.products.filter((p) =>
      p.name.toLowerCase().includes(term),
    );
    if (matches.length === 1) {
      addToCart(matches[0]);
      setSearch('');
    } else {
      onToast('No exact barcode match', 'info');
    }
  };

  const onBarcodeDetected = (code: string) => {
    const exact = db.products.find(
      (p) => p.barcode === code || p.barcode.toLowerCase() === code.toLowerCase(),
    );
    if (exact) {
      addToCart(exact);
      onToast(`Added: ${exact.name}`, 'success');
    } else {
      onToast(`Barcode ${code} not found`, 'error');
    }
  };

  const checkout = () => {
    if (!cart.length) return;
    if (payment === 'credit' && !customerId) {
      onToast('Select a customer for credit sales', 'error');
      return;
    }
    const customer = db.customers.find((c) => c.id === customerId);
    if (payment === 'credit' && customer?.limit && customer.balance + total > customer.limit) {
      onToast('Customer credit limit exceeded', 'error');
      return;
    }
    const items = cart.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      cost: i.cost,
      quantity: i.quantity,
      unit: i.unit,
    }));
    const profit = items.reduce((a, i) => a + (i.price - i.cost) * i.quantity, 0) - disc;
    const sale: Sale = {
      receiptNo: makeReceiptNo(),
      createdAt: new Date().toISOString(),
      items,
      total,
      subtotal,
      discount: disc,
      payment,
      profit,
      status: 'completed',
      cashier: role,
    };
    const products = db.products.map((p) => {
      const line = items.find((i) => i.id === p.id);
      return line ? { ...p, stock: p.stock - line.quantity } : p;
    });
    const customers = db.customers.map((c) =>
      c.id === customerId && payment === 'credit'
        ? { ...c, balance: c.balance + total }
        : c,
    );
    onSale(sale, { products, customers });
    onReceipt(sale);
    setCart([]);
    setDiscount(0);
    setPayment('cash');
    setCustomerId('');
    setSearch('');
  };

  return (
    <main className="max-w-[1450px] mx-auto p-4 md:p-6 pb-10 anim-fade">
      <div
        className="grid lg:grid-cols-[1.25fr_0.75fr] min-h-[calc(100vh-160px)] border border-[var(--c-line)] rounded-[14px] overflow-hidden bg-[var(--c-paper)]"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        {/* Catalog */}
        <section className="p-5 md:p-6">
          <div className="flex justify-between items-center gap-3 flex-wrap mb-4">
            <div>
              <p className="eyebrow text-[10px]" style={{ color: 'var(--c-muted)' }}>
                COUNTER MODE
              </p>
              <h2 className="text-[19px] tracking-tight font-bold mt-1">Scan or choose products</h2>
            </div>
            <div className="flex gap-2 items-center">
              <label
                className="flex items-center gap-2 border border-[var(--c-line)] rounded-[9px] bg-[var(--c-paper)] px-3 py-2 w-[230px]"
              >
                <Search size={14} style={{ color: 'var(--c-muted)' }} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleScanEnter}
                  placeholder="Scan barcode or search"
                  className="bg-transparent w-full text-[12px] outline-none"
                  style={{ color: 'var(--c-ink)' }}
                />
                <kbd
                  className="text-[9px] border border-[var(--c-line)] rounded px-1 py-0.5"
                  style={{ color: 'var(--c-muted)', background: 'var(--c-cream)' }}
                >
                  Enter
                </kbd>
              </label>
              <button
                onClick={() => setScannerOpen(true)}
                className="text-white rounded-[10px] px-4 py-2.5 flex items-center gap-2 text-[13px] font-extrabold anim-pop"
                style={{ background: 'var(--c-accent)' }}
              >
                <Camera size={17} /> كاميرا فورية
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-auto mb-4 pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="border border-[var(--c-line)] rounded-full px-3 py-2 text-[11px] whitespace-nowrap font-semibold"
                style={
                  category === c
                    ? { background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' }
                    : { background: 'var(--c-paper)', color: 'var(--c-muted)' }
                }
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filtered.length === 0 ? (
              <div
                className="col-span-full min-h-[140px] grid place-items-center text-center text-[12px] p-5"
                style={{ color: 'var(--c-muted)' }}
              >
                No product found.
                <br />
                Check the barcode in Stock room.
              </div>
            ) : (
              filtered.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                  className="border border-[var(--c-line)] rounded-[11px] p-3.5 text-left min-h-[130px] flex flex-col lift anim-up"
                  style={{ animationDelay: `${i * 0.02}s`, background: 'var(--c-paper)' }}
                >
                  <small
                    className="text-[9px] uppercase tracking-wider"
                    style={{ color: 'var(--c-muted)' }}
                  >
                    {p.category}
                  </small>
                  <strong className="text-[13px] font-bold mt-2 mb-1">{p.name}</strong>
                  <em className="text-[10px] not-italic" style={{ color: 'var(--c-muted)' }}>
                    {p.stock} {p.unit} left · {p.barcode}
                  </em>
                  <b className="mt-auto text-[13px] font-bold" style={{ color: 'var(--c-primary)' }}>
                    {money(p.price, db.store.currency)}
                  </b>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Cart */}
        <aside
          className="p-5 md:p-6 flex flex-col border-t lg:border-t-0 lg:border-l border-[var(--c-line)]"
          style={{ background: 'var(--c-cream)' }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="eyebrow text-[10px]" style={{ color: 'var(--c-muted)' }}>
                CURRENT SALE
              </p>
              <h2 className="text-[17px] tracking-tight font-bold mt-1">Basket</h2>
            </div>
            <span
              className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-[var(--c-line)]"
              style={{ background: 'var(--c-paper)', color: 'var(--c-muted)' }}
            >
              {cart.length} lines
            </span>
          </div>

          <div className="flex-1 overflow-auto mt-4">
            {cart.length === 0 ? (
              <div
                className="min-h-[140px] grid place-items-center text-center text-[12px] p-5"
                style={{ color: 'var(--c-muted)' }}
              >
                Basket is empty.
                <br />
                Scan a barcode or tap a product.
              </div>
            ) : (
              cart.map((i) => (
                <div
                  key={i.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center border-t border-[var(--c-line)] py-3 first:border-t-0 anim-fade"
                >
                  <div className="min-w-0">
                    <strong className="block text-[11px] font-bold truncate">{i.name}</strong>
                    <small className="block text-[10px] mt-0.5" style={{ color: 'var(--c-muted)' }}>
                      {money(i.price, db.store.currency)} / {i.unit}
                    </small>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => changeQty(i.id, -1)}
                      className="w-[23px] h-[23px] rounded-[5px] border border-[var(--c-line)] grid place-items-center"
                      style={{ background: 'var(--c-paper)', color: 'var(--c-ink)' }}
                    >
                      <Minus size={11} />
                    </button>
                    <b className="text-[12px] w-4 text-center">{i.quantity}</b>
                    <button
                      onClick={() => changeQty(i.id, 1)}
                      className="w-[23px] h-[23px] rounded-[5px] border border-[var(--c-line)] grid place-items-center"
                      style={{ background: 'var(--c-paper)', color: 'var(--c-ink)' }}
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  <strong className="text-[11px] font-bold">
                    {money(i.price * i.quantity, db.store.currency)}
                  </strong>
                  <button
                    onClick={() => changeQty(i.id, -i.quantity)}
                    className="text-[var(--c-danger)]"
                    style={{ background: 'transparent', border: 0 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-[var(--c-line)] pt-4 mt-3">
              <div className="flex justify-between items-center text-[12px]" style={{ color: 'var(--c-muted)' }}>
                <span>Subtotal</span>
                <b className="font-bold" style={{ color: 'var(--c-ink)' }}>
                  {money(subtotal, db.store.currency)}
                </b>
              </div>
              {role === 'admin' && (
                <div className="flex justify-between items-center text-[12px] mt-2.5" style={{ color: 'var(--c-muted)' }}>
                  <span>Admin discount</span>
                  <input
                    type="number"
                    min={0}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-[100px] text-right py-1.5 px-2 rounded-[8px] border border-[var(--c-line)] bg-[var(--c-paper)] text-[12px]"
                    style={{ color: 'var(--c-ink)' }}
                    placeholder="0"
                  />
                </div>
              )}
              <div className="flex gap-1.5 mt-3">
                {(['cash', 'card', 'credit'] as PaymentMethod[]).map((m) => {
                  const Icon = m === 'cash' ? Banknote : m === 'card' ? CreditCard : UserPlus;
                  return (
                    <button
                      key={m}
                      onClick={() => setPayment(m)}
                      className="flex-1 border rounded-[7px] py-2 text-[11px] font-bold flex items-center justify-center gap-1 capitalize"
                      style={
                        payment === m
                          ? { background: 'var(--c-primary)', color: '#fff', borderColor: 'var(--c-primary)' }
                          : { background: 'var(--c-paper)', color: 'var(--c-muted)', borderColor: 'var(--c-line)' }
                      }
                    >
                      <Icon size={13} /> {m}
                    </button>
                  );
                })}
              </div>
              {payment === 'credit' && (
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full mt-3 py-2 px-3 rounded-[8px] border border-[var(--c-line)] bg-[var(--c-paper)] text-[12px]"
                  style={{ color: 'var(--c-ink)' }}
                >
                  <option value="">Select customer account</option>
                  {db.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {money(c.balance, db.store.currency)} owed
                    </option>
                  ))}
                </select>
              )}
              <div className="flex justify-between items-center border-t border-[var(--c-line)] mt-3 pt-3 pb-2">
                <span className="font-bold">Total</span>
                <strong className="text-[24px] font-bold tracking-tight">
                  {money(total, db.store.currency)}
                </strong>
              </div>
              <button
                onClick={checkout}
                className="w-full text-white font-bold text-[13px] rounded-[9px] py-3 mt-1"
                style={{ background: 'var(--c-primary)' }}
              >
                Complete sale
              </button>
            </div>
          )}
        </aside>
      </div>

      {scannerOpen && (
        <ScannerModal
          onClose={() => setScannerOpen(false)}
          onDetected={onBarcodeDetected}
          onManual={(code) => {
            onBarcodeDetected(code);
          }}
        />
      )}
    </main>
  );
}

function ScannerModal({
  onClose,
  onDetected,
  onManual,
}: {
  onClose: () => void;
  onDetected: (code: string) => void;
  onManual: (code: string) => void;
}) {
  const [manual, setManual] = useState('');
  const [flash, setFlash] = useState(false);
  const lastCodeRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  const handleDetected = useCallback((code: string) => {
    // Debounce: ignore duplicate reads within 1.5s
    const now = Date.now();
    if (code === lastCodeRef.current && now - lastTimeRef.current < 1500) return;
    lastCodeRef.current = code;
    lastTimeRef.current = now;
    setFlash(true);
    onDetected(code);
    setTimeout(() => setFlash(false), 600);
  }, [onDetected]);

  const { videoRef, running, error, errorKind, restart } = useScanner({
    active: true,
    onDetected: handleDetected,
  });

  return (
    <div
      className="fixed inset-0 z-[110] grid place-items-center p-5 anim-fade"
      style={{ background: 'rgba(23,74,59,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[16px] p-5 anim-scale"
        style={{ boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[16px] font-bold tracking-tight flex items-center gap-2">
            <Camera size={18} style={{ color: 'var(--c-accent)' }} /> كاميرا فورية
          </h3>
          <button onClick={onClose} className="opacity-60 hover:opacity-100">
            <X size={18} />
          </button>
        </div>

        <div
          className="relative rounded-[12px] overflow-hidden bg-black aspect-[4/3] mb-3"
          style={{
            border: flash ? '3px solid var(--c-success)' : '2px solid var(--c-line)',
            transition: 'border-color 0.2s ease',
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />
          {!running && !error && (
            <div className="absolute inset-0 grid place-items-center text-white/80 text-[12px]">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                Starting camera…
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 grid place-items-center text-white text-[12px] p-5 text-center">
              <div className="flex flex-col items-center gap-3">
                <AlertTriangle size={28} style={{ color: 'var(--c-accent)' }} />
                <span className="leading-relaxed">{error}</span>
                <button
                  onClick={restart}
                  className="text-white font-bold text-[12px] rounded-[8px] px-4 py-2 flex items-center gap-1.5"
                  style={{ background: 'var(--c-primary)' }}
                >
                  <RotateCcw size={14} /> Try again
                </button>
              </div>
            </div>
          )}
          {running && !error && (
            <>
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[42%] rounded-[8px]"
                style={{ border: '2px solid var(--c-accent)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }}
              />
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[2px]"
                style={{ background: 'var(--c-accent)', animation: 'fadeIn 1.2s ease infinite alternate' }}
              />
              {flash && (
                <div
                  className="absolute inset-0 grid place-items-center"
                  style={{ background: 'rgba(46,125,82,0.25)' }}
                >
                  <CheckCircle2 size={40} style={{ color: '#fff' }} className="anim-pop" />
                </div>
              )}
            </>
          )}
        </div>

        {errorKind === 'denied' && (
          <div
            className="text-[11px] px-3 py-2.5 rounded-[8px] mb-3 leading-relaxed"
            style={{ background: 'var(--c-danger-soft)', color: 'var(--c-danger)' }}
          >
            <b>Camera blocked.</b> Click the camera icon in your browser's address bar, allow access,
            then click "Try again". The browser will remember your choice for next time.
          </div>
        )}

        <p className="text-[11px] text-center mb-3" style={{ color: 'var(--c-muted)' }}>
          {running
            ? 'Point the camera at a barcode — it scans automatically. Keep scanning to add more items.'
            : 'Camera unavailable? Enter the barcode manually below.'}
        </p>

        <div className="flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manual.trim()) {
                onManual(manual.trim());
                setManual('');
              }
            }}
            placeholder="Type barcode & press Enter"
            className="flex-1 py-2.5 px-3 rounded-[8px] border border-[var(--c-line)] bg-[var(--c-paper)] text-[12px]"
            style={{ color: 'var(--c-ink)' }}
            autoFocus={!!error}
          />
          <button
            onClick={() => {
              if (manual.trim()) {
                onManual(manual.trim());
                setManual('');
              }
            }}
            className="text-white font-bold text-[12px] rounded-[8px] px-4"
            style={{ background: 'var(--c-primary)' }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
