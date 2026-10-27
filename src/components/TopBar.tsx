import type { Tab, StoreInfo } from '@/lib/types';

interface Props {
  tab: Tab;
  store: StoreInfo;
  role: 'admin' | 'cashier' | null;
}

const TITLES: Record<Tab, string> = {
  dashboard: 'Overview',
  pos: 'Point of sale',
  stock: 'Stock room',
  customers: 'Customers & credit',
  reports: 'Reports & controls',
  settings: 'Settings',
};

export default function TopBar({ tab, store, role }: Props) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  return (
    <header
      className="h-[80px] flex items-center justify-between px-6 md:px-10 border-b border-[var(--c-line)] anim-fade"
      style={{ background: 'color-mix(in srgb, var(--c-paper) 75%, transparent)' }}
    >
      <div>
        <p className="eyebrow text-[10px]" style={{ color: 'var(--c-muted)' }}>
          CONTROL DESK / {today}
        </p>
        <h1 className="text-[22px] tracking-tight font-bold mt-1">{TITLES[tab]}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden sm:inline-flex items-center text-[11px] font-bold px-3 py-1.5 rounded-full border border-[var(--c-line)]"
          style={{ background: 'var(--c-paper)', color: 'var(--c-muted)' }}
        >
          OFFLINE · {store.currency}
        </span>
        <div
          className="w-9 h-9 rounded-full grid place-items-center font-extrabold text-[14px]"
          style={{ background: 'var(--c-warn-soft)', color: '#4c3820' }}
        >
          {role === 'admin' ? 'A' : 'C'}
        </div>
      </div>
    </header>
  );
}
