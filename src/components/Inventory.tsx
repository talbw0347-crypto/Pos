import { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Package,
  X,
} from 'lucide-react';
import type { DB, Product } from '@/lib/types';
import { money, uid } from '@/lib/utils';

interface Props {
  db: DB;
  role: 'admin' | 'cashier';
  onProducts: (products: Product[]) => void;
  onToast: (msg: string, kind?: 'success' | 'error' | 'info') => void;
}

interface FormState {
  id?: string;
  name: string;
  category: string;
  barcode: string;
  unit: string;
  cost: string;
  price: string;
  stock: string;
  min: string;
}

const EMPTY: FormState = {
  name: '',
  category: 'Essentials',
  barcode: '',
  unit: 'unit',
  cost: '',
  price: '',
  stock: '',
  min: '5',
};

export default function Inventory({ db, role, onProducts, onToast }: Props) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.products.filter((p) =>
      `${p.name} ${p.barcode} ${p.category}`.toLowerCase().includes(q),
    );
  }, [db.products, query]);

  const lowCount = db.products.filter((p) => p.stock <= p.min).length;

  const save = () => {
    if (!form) return;
    if (!form.name || !form.barcode || !form.cost || !form.price) {
      onToast('Fill all required fields', 'error');
      return;
    }
    if (form.id) {
      onProducts(
        db.products.map((p) =>
          p.id === form.id
            ? {
                ...p,
                name: form.name,
                category: form.category,
                barcode: form.barcode,
                unit: form.unit || 'unit',
                cost: Number(form.cost) || 0,
                price: Number(form.price) || 0,
                stock: Number(form.stock) || 0,
                min: Number(form.min) || 0,
              }
            : p,
        ),
      );
      onToast('Product updated', 'success');
    } else {
      const newP: Product = {
        id: uid(),
        name: form.name,
        category: form.category,
        barcode: form.barcode,
        unit: form.unit || 'unit',
        cost: Number(form.cost) || 0,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        min: Number(form.min) || 0,
      };
      onProducts([...db.products, newP]);
      onToast('Product added', 'success');
    }
    setForm(null);
  };

  const remove = (id: string) => {
    onProducts(db.products.filter((p) => p.id !== id));
    onToast('Product deleted', 'info');
  };

  const edit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      category: p.category,
      barcode: p.barcode,
      unit: p.unit,
      cost: String(p.cost),
      price: String(p.price),
      stock: String(p.stock),
      min: String(p.min),
    });
  };

  return (
    <main className="max-w-[1450px] mx-auto p-6 md:p-10 pb-14 anim-fade">
      <div className="flex justify-between items-center gap-4 flex-wrap mb-5">
        <div>
          <p className="eyebrow text-[10px]" style={{ color: 'var(--c-muted)' }}>
            INVENTORY CONTROL
          </p>
          <h2 className="text-[19px] tracking-tight font-bold mt-1">Stock room</h2>
          <p className="text-[12px] mt-1.5" style={{ color: 'var(--c-muted)' }}>
            Protect availability, margin and reorder levels.
          </p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          {lowCount > 0 && (
            <span
              className="text-[11px] font-bold px-3 py-2 rounded-full flex items-center gap-1.5"
              style={{ background: 'var(--c-danger-soft)', color: 'var(--c-danger)' }}
            >
              <AlertTriangle size={13} /> {lowCount} need reorder
            </span>
          )}
          <label className="flex items-center gap-2 border border-[var(--c-line)] rounded-[9px] bg-[var(--c-paper)] px-3 py-2 w-[230px]">
            <Search size={14} style={{ color: 'var(--c-muted)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter products"
              className="bg-transparent w-full text-[12px] outline-none"
              style={{ color: 'var(--c-ink)' }}
            />
          </label>
          {role === 'admin' && (
            <button
              onClick={() => setForm({ ...EMPTY })}
              className="text-white font-bold text-[12px] rounded-[9px] px-3.5 py-2 flex items-center gap-1.5"
              style={{ background: 'var(--c-primary)' }}
            >
              <Plus size={15} /> Add product
            </button>
          )}
        </div>
      </div>

      {form && (
        <div
          className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] p-5 mb-5 anim-scale"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] font-bold tracking-tight">
              {form.id ? 'Edit product' : 'New product'}
            </h3>
            <button onClick={() => setForm(null)} className="opacity-60 hover:opacity-100">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Field label="Product name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <Field label="Barcode / SKU" value={form.barcode} onChange={(v) => setForm({ ...form, barcode: v })} required />
            <Field label="Unit" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} />
            <Field label="Cost (DA)" type="number" value={form.cost} onChange={(v) => setForm({ ...form, cost: v })} required />
            <Field label="Sale (DA)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
            <Field label="Opening stock" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
            <Field label="Reorder level" type="number" value={form.min} onChange={(v) => setForm({ ...form, min: v })} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="text-white font-bold text-[12px] rounded-[9px] px-4 py-2.5"
              style={{ background: 'var(--c-primary)' }}
            >
              {form.id ? 'Save changes' : 'Save product'}
            </button>
            <button
              onClick={() => setForm(null)}
              className="font-bold text-[12px] rounded-[9px] px-4 py-2.5"
              style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] overflow-auto"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <table className="w-full border-collapse min-w-[760px]">
          <thead>
            <tr style={{ background: 'var(--c-cream)' }}>
              {['Product', 'Barcode', 'Cost', 'Sale', 'Margin', 'Stock', 'Signal', role === 'admin' ? 'Action' : ''].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-[9px] uppercase tracking-wider font-bold"
                  style={{ color: 'var(--c-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center text-[12px] py-10"
                  style={{ color: 'var(--c-muted)' }}
                >
                  No products. Add your opening stock.
                </td>
              </tr>
            ) : (
              list.map((p) => {
                const low = p.stock <= p.min;
                return (
                  <tr
                    key={p.id}
                    className="border-t border-[var(--c-line)] text-[12px] anim-fade"
                  >
                    <td className="px-4 py-3">
                      <strong className="block font-bold">{p.name}</strong>
                      <small className="block text-[10px] mt-0.5" style={{ color: 'var(--c-muted)' }}>
                        {p.category} · {p.unit}
                      </small>
                    </td>
                    <td className="px-4 py-3">{p.barcode}</td>
                    <td className="px-4 py-3">{money(p.cost, db.store.currency)}</td>
                    <td className="px-4 py-3">{money(p.price, db.store.currency)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--c-success)' }}>
                      {money(p.price - p.cost, db.store.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <b className="font-bold" style={low ? { color: 'var(--c-danger)' } : {}}>
                        {p.stock}
                      </b>
                      <small className="block text-[10px] mt-0.5" style={{ color: 'var(--c-muted)' }}>
                        min {p.min}
                      </small>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={
                          low
                            ? { background: 'var(--c-danger-soft)', color: 'var(--c-danger)' }
                            : { background: 'var(--c-success-soft)', color: 'var(--c-success)' }
                        }
                      >
                        {low ? 'Reorder' : 'Healthy'}
                      </span>
                    </td>
                    {role === 'admin' && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => edit(p)}
                            className="font-bold text-[11px] rounded-[7px] px-2.5 py-1.5 flex items-center gap-1"
                            style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            onClick={() => remove(p.id)}
                            className="font-bold text-[11px] rounded-[7px] px-2.5 py-1.5 flex items-center gap-1"
                            style={{ background: 'var(--c-danger-soft)', color: 'var(--c-danger)' }}
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {list.length > 0 && (
        <div
          className="mt-4 flex items-center gap-2 text-[12px] px-4 py-3 rounded-[12px]"
          style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
        >
          <Package size={14} />
          {db.products.length} products · stock value{' '}
          {money(
            db.products.reduce((a, p) => a + p.stock * p.cost, 0),
            db.store.currency,
          )}{' '}
          at cost
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>
        {label} {required && <span style={{ color: 'var(--c-danger)' }}>*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="py-2.5 px-3 rounded-[8px] border border-[var(--c-line)] bg-[var(--c-paper)] text-[12px]"
        style={{ color: 'var(--c-ink)' }}
      />
    </label>
  );
}
