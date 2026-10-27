import { useMemo, useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Receipt,
  Banknote,
  Trash2,
  Search,
} from 'lucide-react';
import type { DB, Expense, Sale } from '@/lib/types';
import { money, dateShort, isToday, uid } from '@/lib/utils';

interface Props {
  db: DB;
  onExpense: (e: Expense) => void;
  onRemoveExpense: (id: string) => void;
  onToast: (msg: string, kind?: 'success' | 'error' | 'info') => void;
}

export default function Reports({ db, onExpense, onRemoveExpense, onToast }: Props) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptQuery, setReceiptQuery] = useState('');

  const today = useMemo(
    () => db.sales.filter((s) => isToday(s.createdAt) && s.status !== 'cancelled'),
    [db.sales],
  );
  const todaySalesTotal = today.reduce((a, s) => a + s.total, 0);
  const todayProfit = today.reduce((a, s) => a + s.profit, 0);
  const totalExpenses = db.expenses.reduce((a, e) => a + e.amount, 0);
  const allSalesTotal = db.sales.reduce((a, s) => a + s.total, 0);

  const filteredReceipts = useMemo(() => {
    const q = receiptQuery.trim().toLowerCase();
    return db.sales.filter(
      (s) => !q || s.receiptNo.toLowerCase().includes(q) || s.payment.toLowerCase().includes(q),
    );
  }, [db.sales, receiptQuery]);

  const submitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description || !amount) {
      onToast('Fill all expense fields', 'error');
      return;
    }
    onExpense({
      id: uid(),
      category,
      description,
      amount: Number(amount) || 0,
      createdAt: new Date().toISOString(),
    });
    onToast('Expense recorded', 'success');
    setCategory('');
    setDescription('');
    setAmount('');
  };

  const stats = [
    { label: 'Sales today', value: todaySalesTotal, icon: TrendingUp, tone: 'primary', sub: `${today.length} receipts` },
    { label: 'Gross profit today', value: todayProfit, icon: Wallet, tone: 'warn', sub: 'Before expenses' },
    { label: 'Expenses total', value: totalExpenses, icon: Receipt, tone: 'danger', sub: 'Offline ledger' },
    { label: 'All-time sales', value: allSalesTotal, icon: Banknote, tone: 'primary', sub: `${db.sales.length} receipts` },
  ] as const;

  return (
    <main className="max-w-[1450px] mx-auto p-6 md:p-10 pb-14 anim-fade">
      <div className="flex justify-between items-center gap-4 flex-wrap mb-5">
        <div>
          <p className="eyebrow text-[10px]" style={{ color: 'var(--c-muted)' }}>
            CLOSE THE DAY WITH EVIDENCE
          </p>
          <h2 className="text-[19px] tracking-tight font-bold mt-1">Reports & controls</h2>
          <p className="text-[12px] mt-1.5" style={{ color: 'var(--c-muted)' }}>
            Keep restocking money ahead of personal withdrawals.
          </p>
        </div>
        <span
          className="text-[11px] font-bold px-3 py-1.5 rounded-full"
          style={{ background: 'var(--c-success-soft)', color: 'var(--c-success)' }}
        >
          Admin only
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5 stagger">
        {stats.map((s) => {
          const Icon = s.icon;
          const toneColor =
            s.tone === 'warn' ? 'var(--c-warn)' : s.tone === 'danger' ? 'var(--c-danger)' : 'var(--c-primary)';
          return (
            <div
              key={s.label}
              className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] p-4 min-h-[120px] lift"
              style={{ boxShadow: 'var(--shadow)', borderTop: `3px solid ${toneColor}` }}
            >
              <div className="flex items-center justify-between">
                <p className="eyebrow text-[10px]" style={{ color: 'var(--c-muted)' }}>
                  {s.label}
                </p>
                <Icon size={15} style={{ color: toneColor }} />
              </div>
              <b className="block text-[24px] tracking-tight font-bold mt-4 mb-1">
                {money(s.value, db.store.currency)}
              </b>
              <small className="text-[11px]" style={{ color: 'var(--c-muted)' }}>
                {s.sub}
              </small>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 mb-5">
        <section
          className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] p-5 anim-up"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <h3 className="text-[16px] font-bold tracking-tight mb-4">Record expense</h3>
          <form onSubmit={submitExpense} className="grid gap-2.5">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category e.g. electricity"
              className="py-2.5 px-3 rounded-[8px] border border-[var(--c-line)] bg-[var(--c-paper)] text-[12px]"
              style={{ color: 'var(--c-ink)' }}
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="py-2.5 px-3 rounded-[8px] border border-[var(--c-line)] bg-[var(--c-paper)] text-[12px]"
              style={{ color: 'var(--c-ink)' }}
            />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount DA"
              className="py-2.5 px-3 rounded-[8px] border border-[var(--c-line)] bg-[var(--c-paper)] text-[12px]"
              style={{ color: 'var(--c-ink)' }}
            />
            <button
              type="submit"
              className="text-white font-bold text-[12px] rounded-[9px] py-2.5"
              style={{ background: 'var(--c-primary)' }}
            >
              Record expense
            </button>
          </form>
        </section>

        <section
          className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] p-5 anim-up"
          style={{ boxShadow: 'var(--shadow)', animationDelay: '0.06s' }}
        >
          <h3 className="text-[16px] font-bold tracking-tight mb-4">Expense ledger</h3>
          {db.expenses.length === 0 ? (
            <div className="min-h-[120px] grid place-items-center text-center text-[12px]" style={{ color: 'var(--c-muted)' }}>
              No expenses recorded.
            </div>
          ) : (
            db.expenses.slice(0, 8).map((e) => (
              <div
                key={e.id}
                className="flex justify-between gap-3 py-3 border-t border-[var(--c-line)] first:border-t-0 text-[12px] anim-fade"
              >
                <div className="min-w-0">
                  <strong className="block font-bold">{e.description}</strong>
                  <small className="block text-[10px] mt-0.5" style={{ color: 'var(--c-muted)' }}>
                    {e.category} · {dateShort(e.createdAt)}
                  </small>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <b className="font-bold">{money(e.amount, db.store.currency)}</b>
                  <button
                    onClick={() => onRemoveExpense(e.id)}
                    className="opacity-50 hover:opacity-100"
                    style={{ color: 'var(--c-danger)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <section
        className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] p-5 anim-up"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <div className="flex justify-between items-center gap-3 flex-wrap mb-4">
          <h3 className="text-[16px] font-bold tracking-tight">Receipt history</h3>
          <label className="flex items-center gap-2 border border-[var(--c-line)] rounded-[9px] bg-[var(--c-paper)] px-3 py-2 w-[230px]">
            <Search size={14} style={{ color: 'var(--c-muted)' }} />
            <input
              value={receiptQuery}
              onChange={(e) => setReceiptQuery(e.target.value)}
              placeholder="Search receipt no / payment"
              className="bg-transparent w-full text-[12px] outline-none"
              style={{ color: 'var(--c-ink)' }}
            />
          </label>
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr style={{ background: 'var(--c-cream)' }}>
                {['Receipt', 'Date', 'Items', 'Payment', 'Total', 'Profit'].map((h) => (
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
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center text-[12px] py-10"
                    style={{ color: 'var(--c-muted)' }}
                  >
                    No receipts found.
                  </td>
                </tr>
              ) : (
                filteredReceipts.slice(0, 30).map((r: Sale) => (
                  <tr key={r.receiptNo} className="border-t border-[var(--c-line)] text-[12px] anim-fade">
                    <td className="px-4 py-3 font-bold">{r.receiptNo}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--c-muted)' }}>
                      {dateShort(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {r.items.reduce((a, i) => a + i.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 capitalize">{r.payment}</td>
                    <td className="px-4 py-3 font-bold">{money(r.total, db.store.currency)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--c-success)' }}>
                      {money(r.profit, db.store.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
