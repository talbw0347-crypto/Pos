import {
  TrendingUp,
  Wallet,
  PackageCheck,
  CreditCard,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import type { DB, Tab } from '@/lib/types';
import { money, dateShort, isToday } from '@/lib/utils';

interface Props {
  db: DB;
  role: 'admin' | 'cashier';
  onTab: (t: Tab) => void;
}

function todaySales(db: DB) {
  return db.sales.filter((s) => isToday(s.createdAt) && s.status !== 'cancelled');
}

function summary(db: DB) {
  const sales = todaySales(db);
  const stockValue = db.products.reduce((a, p) => a + p.stock * p.cost, 0);
  const credit = db.customers.reduce((a, c) => a + c.balance, 0);
  const low = db.products.filter((p) => p.stock <= p.min);
  const itemsSold = sales.reduce(
    (a, s) => a + s.items.reduce((x, i) => x + i.quantity, 0),
    0,
  );
  return {
    sales: sales.reduce((a, s) => a + s.total, 0),
    profit: sales.reduce((a, s) => a + s.profit, 0),
    stockValue,
    credit,
    low,
    itemsSold,
    count: sales.length,
  };
}

const STAT_META = [
  { key: 'sales', label: 'Sales today', icon: TrendingUp, tone: 'primary', sub: (s: ReturnType<typeof summary>) => `${s.count} receipts` },
  { key: 'profit', label: 'Gross profit today', icon: Wallet, tone: 'warn', sub: () => 'Before expenses' },
  { key: 'stockValue', label: 'Stock at cost', icon: PackageCheck, tone: 'primary', sub: (s: ReturnType<typeof summary>) => `${s.low.length} at reorder level` },
  { key: 'credit', label: 'Customer credit', icon: CreditCard, tone: 'danger', sub: () => 'Outstanding balance' },
] as const;

export default function Dashboard({ db, role, onTab }: Props) {
  const s = summary(db);
  const recent = db.sales.slice(0, 6);
  const accent = 'var(--c-accent)';

  return (
    <main className="max-w-[1450px] mx-auto p-6 md:p-10 pb-14 anim-fade">
      <section
        className="text-white p-6 md:p-7 rounded-[16px] flex justify-between items-center gap-5 flex-wrap mb-5 anim-up"
        style={{ background: 'var(--c-primary)', boxShadow: 'var(--shadow)' }}
      >
        <div>
          <p className="eyebrow text-[10px]" style={{ color: '#b9d0c0' }}>
            TODAY'S OPERATING PICTURE
          </p>
          <h2 className="text-[24px] tracking-tight font-bold mt-1.5 mb-1">
            Run the shop on evidence.
          </h2>
          <p className="text-[13px] m-0" style={{ color: '#c3d4c7' }}>
            Protect restocking money first. Track every sale, expense, and movement.
          </p>
        </div>
        <button
          onClick={() => onTab('pos')}
          className="font-bold text-[13px] rounded-[9px] py-2.5 px-4 flex items-center gap-1.5"
          style={{ background: 'var(--c-cream)', color: 'var(--c-primary)' }}
        >
          Open the till <ArrowRight size={14} />
        </button>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5 stagger">
        {STAT_META.map((m) => {
          const Icon = m.icon;
          const val = (s as never)[m.key] as number;
          const toneColor =
            m.tone === 'warn' ? 'var(--c-warn)' : m.tone === 'danger' ? accent : 'var(--c-primary)';
          return (
            <div
              key={m.key}
              className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] p-4 min-h-[120px] lift"
              style={{ boxShadow: 'var(--shadow)', borderTop: `3px solid ${toneColor}` }}
            >
              <div className="flex items-center justify-between">
                <p className="eyebrow text-[10px]" style={{ color: 'var(--c-muted)' }}>
                  {m.label}
                </p>
                <Icon size={15} style={{ color: toneColor }} />
              </div>
              <b className="block text-[24px] tracking-tight font-bold mt-4 mb-1">
                {money(val, db.store.currency)}
              </b>
              <small className="text-[11px]" style={{ color: 'var(--c-muted)' }}>
                {m.sub(s)}
              </small>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5 mb-5">
        <section
          className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] p-5 anim-up"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="eyebrow text-[10px]" style={{ color: 'var(--c-muted)' }}>
                WATCH LIST
              </p>
              <h2 className="text-[17px] tracking-tight font-bold mt-1">What needs attention</h2>
            </div>
            <button
              onClick={() => onTab('stock')}
              className="text-[11px] font-bold"
              style={{ color: 'var(--c-secondary)' }}
            >
              Open stock →
            </button>
          </div>

          <div className="mt-4">
            <WatchRow
              icon={<AlertTriangle size={15} />}
              tone="danger"
              title="Low stock"
              desc={s.low.slice(0, 3).map((p) => p.name).join(' · ') || 'Everything above reorder level'}
              badge={`${s.low.length} items`}
            />
            <WatchRow
              icon={<Clock size={15} />}
              tone="warn"
              title="Items sold today"
              desc={`${s.itemsSold} units across ${s.count} receipts`}
              badge={`${s.itemsSold} units`}
            />
            <WatchRow
              icon={<ShieldCheck size={15} />}
              tone="success"
              title="Offline safety"
              desc="Data is saved in this browser only — no internet required."
              badge="Local"
            />
          </div>
        </section>

        <section
          className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] p-5 anim-up"
          style={{ boxShadow: 'var(--shadow)', animationDelay: '0.06s' }}
        >
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="eyebrow text-[10px]" style={{ color: 'var(--c-muted)' }}>
                LATEST ACTIVITY
              </p>
              <h2 className="text-[17px] tracking-tight font-bold mt-1">Recent receipts</h2>
            </div>
            {role === 'admin' && (
              <button
                onClick={() => onTab('reports')}
                className="text-[11px] font-bold"
                style={{ color: 'var(--c-secondary)' }}
              >
                Full reports →
              </button>
            )}
          </div>
          <div className="mt-4">
            {recent.length === 0 ? (
              <div className="min-h-[120px] grid place-items-center text-center text-[12px] py-5" style={{ color: 'var(--c-muted)' }}>
                No receipts yet. Open Point of sale.
              </div>
            ) : (
              recent.map((r) => (
                <div
                  key={r.receiptNo}
                  className="flex justify-between gap-3 py-3 border-t border-[var(--c-line)] first:border-t-0 text-[12px] anim-fade"
                >
                  <div>
                    <strong className="block font-bold">{r.receiptNo}</strong>
                    <small className="block text-[10px] mt-0.5" style={{ color: 'var(--c-muted)' }}>
                      {dateShort(r.createdAt)} · {r.payment}
                    </small>
                  </div>
                  <b className="font-bold">{money(r.total, db.store.currency)}</b>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function WatchRow({
  icon,
  tone,
  title,
  desc,
  badge,
}: {
  icon: React.ReactNode;
  tone: 'danger' | 'warn' | 'success';
  title: string;
  desc: string;
  badge: string;
}) {
  const toneBg =
    tone === 'danger'
      ? 'var(--c-danger-soft)'
      : tone === 'warn'
        ? 'var(--c-warn-soft)'
        : 'var(--c-success-soft)';
  const toneColor =
    tone === 'danger' ? 'var(--c-danger)' : tone === 'warn' ? '#916d2d' : 'var(--c-success)';
  return (
    <div className="flex items-center gap-3 border-t border-[var(--c-line)] py-3.5 first:border-t-0">
      <span
        className="w-[30px] h-[30px] rounded-[8px] grid place-items-center shrink-0"
        style={{ background: toneBg, color: toneColor }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <strong className="block text-[12px] font-bold">{title}</strong>
        <small
          className="block text-[11px] mt-0.5 truncate"
          style={{ color: 'var(--c-muted)' }}
        >
          {desc}
        </small>
      </div>
      <b className="text-[12px] font-bold shrink-0">{badge}</b>
    </div>
  );
}
