import {
  LayoutDashboard,
  ScanLine,
  Boxes,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import type { Role, Tab } from '@/lib/types';

interface Props {
  tab: Tab;
  role: Role;
  storeName: string;
  logoText: string;
  onTab: (t: Tab) => void;
  onLock: () => void;
}

const NAV: { id: Tab; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'pos', label: 'Point of sale', icon: ScanLine },
  { id: 'stock', label: 'Stock room', icon: Boxes },
  { id: 'customers', label: 'Customers & credit', icon: Users },
  { id: 'reports', label: 'Reports', icon: BarChart3, adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
];

export default function Sidebar({ tab, role, storeName, logoText, onTab, onLock }: Props) {
  const items = NAV.filter((n) => !n.adminOnly || role === 'admin');
  return (
    <aside
      className="w-[230px] shrink-0 text-white flex flex-col min-h-screen sticky top-0 h-screen p-5 anim-left"
      style={{ background: 'var(--c-primary)' }}
    >
      <div className="flex gap-3 items-center pb-6 border-b border-white/10">
        <div
          className="w-9 h-9 grid place-items-center text-xl font-extrabold"
          style={{ background: 'var(--c-accent)', borderRadius: '10px 10px 10px 3px' }}
        >
          {logoText}
        </div>
        <div>
          <b className="block tracking-[0.12em] text-[14px] font-bold">{storeName.toUpperCase()}</b>
          <small className="block text-[9px] tracking-[0.25em] opacity-70 mt-0.5">CONTROL DESK</small>
        </div>
      </div>

      <div
        className="rounded-[10px] p-3 my-4 text-[12px] opacity-90"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <span className="flex items-center gap-2">
          <span
            className="w-[7px] h-[7px] rounded-full"
            style={{ background: '#a8d76b', animation: 'pulseDot 2s infinite' }}
          />
          {role === 'admin' ? 'Administrator' : 'Cashier'}
        </span>
        <strong className="block pl-[14px] mt-1 text-white font-bold">
          {role === 'admin' ? 'Owner' : 'Sales operator'}
        </strong>
      </div>

      <nav className="grid gap-1">
        {items.map((n, i) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => onTab(n.id)}
              className="text-left flex gap-2.5 items-center text-[13px] rounded-[9px] py-2.5 px-3 anim-left"
              style={{
                animationDelay: `${0.1 + i * 0.04}s`,
                background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.72)',
                boxShadow: active ? 'inset 3px 0 var(--c-accent)' : 'none',
              }}
            >
              <Icon size={16} />
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-3 border-t border-white/10">
        <button
          onClick={onLock}
          className="w-full text-left flex gap-2.5 items-center text-[13px] rounded-[9px] py-2.5 px-3 hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.72)' }}
        >
          <LogOut size={16} /> Lock / switch role
        </button>
      </div>
    </aside>
  );
}
