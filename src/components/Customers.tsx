import { useMemo, useState } from 'react';
import { Search, Plus, X, HandCoins } from 'lucide-react';
import type { DB, Customer } from '@/lib/types';
import { money, uid } from '@/lib/utils';

interface Props {
  db: DB;
  onCustomers: (c: Customer[]) => void;
  onToast: (msg: string, kind?: 'success' | 'error' | 'info') => void;
}

interface FormState {
  name: string;
  phone: string;
  limit: string;
}

export default function Customers({ db, onCustomers, onToast }: Props) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [repaying, setRepaying] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [db.customers, query]);

  const totalCredit = db.customers.reduce((a, c) => a + c.balance, 0);

  const save = () => {
    if (!form || !form.name) {
      onToast('Enter a customer name', 'error');
      return;
    }
    const c: Customer = {
      id: uid(),
      name: form.name,
      phone: form.phone,
      limit: Number(form.limit) || 0,
      balance: 0,
      createdAt: new Date().toISOString(),
    };
    onCustomers([...db.customers, c]);
    onToast('Customer account created', 'success');
    setForm(null);
  };

  const repay = (id: string) => {
    const c = db.customers.find((x) => x.id === id);
    if (!c) return;
    const amt = Number(repayAmount) || 0;
    if (amt <= 0) {
      onToast('Enter a valid amount', 'error');
      return;
    }
    onCustomers(
      db.customers.map((x) =>
        x.id === id ? { ...x, balance: Math.max(0, x.balance - amt) } : x,
      ),
    );
    onToast('Repayment recorded', 'success');
    setRepaying(null);
    setRepayAmount('');
  };

  const remove = (id: string) => {
    onCustomers(db.customers.filter((c) => c.id !== id));
    onToast('Customer removed', 'info');
  };

  return (
    <main className="max-w-[1450px] mx-auto p-6 md:p-10 pb-14 anim-fade">
      <div className="flex justify-between items-center gap-4 flex-wrap mb-5">
        <div>
          <p className="eyebrow text-[10px]" style={{ color: 'var(--c-muted)' }}>
            TRUST, WITH LIMITS
          </p>
          <h2 className="text-[19px] tracking-tight font-bold mt-1">Customers & credit</h2>
          <p className="text-[12px] mt-1.5" style={{ color: 'var(--c-muted)' }}>
            Credit is a controlled service, not an informal promise.
          </p>
        </div>
        <div className="flex gap-2.5 items-center">
          <label className="flex items-center gap-2 border border-[var(--c-line)] rounded-[9px] bg-[var(--c-paper)] px-3 py-2 w-[230px]">
            <Search size={14} style={{ color: 'var(--c-muted)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers"
              className="bg-transparent w-full text-[12px] outline-none"
              style={{ color: 'var(--c-ink)' }}
            />
          </label>
          <button
            onClick={() => setForm({ name: '', phone: '', limit: '' })}
            className="text-white font-bold text-[12px] rounded-[9px] px-3.5 py-2 flex items-center gap-1.5"
            style={{ background: 'var(--c-primary)' }}
          >
            <Plus size={15} /> New customer
          </button>
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-4 px-5 py-4 rounded-[14px] mb-5"
        style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
      >
        <div className="flex items-center gap-3">
          <HandCoins size={18} />
          <strong className="text-[13px] font-bold">
            Total outstanding credit across all customers
          </strong>
        </div>
        <b className="text-[20px] font-bold tracking-tight">
          {money(totalCredit, db.store.currency)}
        </b>
      </div>

      {form && (
        <div
          className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] p-5 mb-5 anim-scale"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] font-bold tracking-tight">New customer</h3>
            <button onClick={() => setForm(null)} className="opacity-60 hover:opacity-100">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
            <label className="grid gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>
                Name *
              </span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="py-2.5 px-3 rounded-[8px] border border-[var(--c-line)] bg-[var(--c-paper)] text-[12px]"
                style={{ color: 'var(--c-ink)' }}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>
                Phone
              </span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="py-2.5 px-3 rounded-[8px] border border-[var(--c-line)] bg-[var(--c-paper)] text-[12px]"
                style={{ color: 'var(--c-ink)' }}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>
                Credit limit (DA)
              </span>
              <input
                type="number"
                value={form.limit}
                onChange={(e) => setForm({ ...form, limit: e.target.value })}
                className="py-2.5 px-3 rounded-[8px] border border-[var(--c-line)] bg-[var(--c-paper)] text-[12px]"
                style={{ color: 'var(--c-ink)' }}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="text-white font-bold text-[12px] rounded-[9px] px-4 py-2.5"
              style={{ background: 'var(--c-primary)' }}
            >
              Create account
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

      {repaying && (
        <div
          className="fixed inset-0 z-[110] grid place-items-center p-5 anim-fade"
          style={{ background: 'rgba(23,74,59,0.5)' }}
          onClick={() => setRepaying(null)}
        >
          <div
            className="w-full max-w-[360px] bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] p-5 anim-scale"
            style={{ boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-bold mb-3">Record repayment</h3>
            <p className="text-[12px] mb-3" style={{ color: 'var(--c-muted)' }}>
              Outstanding:{' '}
              {money(
                db.customers.find((c) => c.id === repaying)?.balance || 0,
                db.store.currency,
              )}
            </p>
            <input
              type="number"
              autoFocus
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && repay(repaying)}
              placeholder="Amount DA"
              className="w-full py-2.5 px-3 rounded-[8px] border border-[var(--c-line)] bg-[var(--c-paper)] text-[14px] mb-3"
              style={{ color: 'var(--c-ink)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => repay(repaying)}
                className="text-white font-bold text-[12px] rounded-[9px] px-4 py-2.5 flex-1"
                style={{ background: 'var(--c-primary)' }}
              >
                Record
              </button>
              <button
                onClick={() => setRepaying(null)}
                className="font-bold text-[12px] rounded-[9px] px-4 py-2.5"
                style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] overflow-auto"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr style={{ background: 'var(--c-cream)' }}>
              {['Customer', 'Phone', 'Credit limit', 'Balance owed', 'Action'].map((h) => (
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
                  colSpan={5}
                  className="text-center text-[12px] py-10"
                  style={{ color: 'var(--c-muted)' }}
                >
                  No customer accounts yet.
                </td>
              </tr>
            ) : (
              list.map((c) => (
                <tr key={c.id} className="border-t border-[var(--c-line)] text-[12px] anim-fade">
                  <td className="px-4 py-3">
                    <strong className="font-bold">{c.name}</strong>
                  </td>
                  <td className="px-4 py-3">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {c.limit ? money(c.limit, db.store.currency) : 'No limit'}
                  </td>
                  <td className="px-4 py-3">
                    <b className="font-bold" style={c.balance ? { color: 'var(--c-danger)' } : { color: 'var(--c-success)' }}>
                      {money(c.balance, db.store.currency)}
                    </b>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setRepaying(c.id);
                          setRepayAmount(String(c.balance || ''));
                        }}
                        disabled={!c.balance}
                        className="font-bold text-[11px] rounded-[7px] px-2.5 py-1.5"
                        style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
                      >
                        Repay
                      </button>
                      <button
                        onClick={() => remove(c.id)}
                        className="font-bold text-[11px] rounded-[7px] px-2.5 py-1.5"
                        style={{ background: 'var(--c-danger-soft)', color: 'var(--c-danger)' }}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
