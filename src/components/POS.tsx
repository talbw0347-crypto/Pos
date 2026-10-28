import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  X,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  UserPlus,
  ScanLine,
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
import { money, makeReceiptNo } from '@/lib/utils';

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
  const [flash, setFlash] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const lastBeepRef = useRef<number>(0);

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

  const beep = (ok: boolean) => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = ok ? 880 : 220;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
      ctx.close();
    } catch {
      // audio unavailable — silent
    }
  };

  const flashGreen = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 350);
  };

  const addToCart = (p: Product) => {
    if (p.stock <= 0) {
      onToast('Product is out of stock', 'error');
      beep(false);
      return;
    }
    setCart((prev) => {
      const found = prev.find((x) => x.id === p.id);
      if (found) {
        if (found.quantity >= p.stock) {
          onToast('No more stock available', 'error');
          beep(false);
          return prev;
        }
        return prev.map((x) =>
          x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x,
        );
      }
      return [...prev, { ...p, quantity: 1 }];
    });
    beep(true);
    flashGreen();
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

  // Hardware scanner support: a USB/Bluetooth scanner acts as a keyboard,
  // typing the barcode fast and ending with Enter. We keep the search input
  // auto-focused so the scanner's keystrokes land in it, then on Enter we
  // look up the product. A short inter-keystroke window distinguishes a
  // scanner burst from a human typing the same code manually.
  const handleScanEnter = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const term = search.trim();
    if (!term) return;
    const lc = term.toLowerCase();
    const exact = db.products.find(
      (p) => p.barcode.toLowerCase() === lc || p.id === lc,
    );
    if (exact) {
      addToCart(exact);
      setSearch('');
      refocusSoon();
      return;
    }
    const matches = db.products.filter((p) =>
      p.name.toLowerCase().includes(lc),
    );
    if (matches.length === 1) {
      addToCart(matches[0]);
      setSearch('');
      refocusSoon();
    } else {
      onToast(`Barcode ${term} not found`, 'error');
      beep(false);
      setSearch('');
      refocusSoon();
    }
  };

  const refocusSoon = () => {
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  // Keep the scan field focused whenever the POS tab is open and no other
  // input/select is active. Reclaims focus after clicks elsewhere.
  useEffect(() => {
    searchRef.current?.focus();
    const reclaim = () => {
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      searchRef.current?.focus();
    };
    document.addEventListener('click', reclaim);
    window.addEventListener('focus', reclaim);
    return () => {
      document.removeEventListener('click', reclaim);
      window.removeEventListener('focus', reclaim);
    };
  }, []);

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
    refocusSoon();
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
            <label
              className="flex items-center gap-2 border rounded-[9px] bg-[var(--c-paper)] px-3 py-2 w-[260px] transition-colors"
              style={{
                borderColor: flash ? 'var(--c-success)' : 'var(--c-line)',
                boxShadow: flash ? '0 0 0 3px var(--c-success-soft)' : 'none',
              }}
            >
              <ScanLine size={16} style={{ color: flash ? 'var(--c-success)' : 'var(--c-muted)' }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleScanEnter}
                placeholder="Scan barcode — ready"
                className="bg-transparent w-full text-[13px] outline-none"
                style={{ color: 'var(--c-ink)' }}
                autoComplete="off"
                inputMode="numeric"
              />
              <kbd
                className="text-[9px] border border-[var(--c-line)] rounded px-1 py-0.5"
                style={{ color: 'var(--c-muted)', background: 'var(--c-cream)' }}
              >
                Enter
              </kbd>
            </label>
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
                    onFocus={(e) => e.target.select()}
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

      {/* Scan success indicator — a small toast-like badge */}
      {flash && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-bold text-white anim-pop"
          style={{ background: 'var(--c-success)' }}
        >
          <CheckCircle2 size={15} /> Added to basket
        </div>
      )}
    </main>
  );
}
