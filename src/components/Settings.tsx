import { useState } from 'react';
import {
  Store,
  Palette,
  Save,
  RotateCcw,
  Check,
  KeyRound,
} from 'lucide-react';
import type { DB, StoreInfo, Theme } from '@/lib/types';
import { defaultThemes } from '@/lib/storage';

interface Props {
  db: DB;
  onStore: (s: StoreInfo) => void;
  onTheme: (t: Theme) => void;
  onReset: () => void;
  onToast: (msg: string, kind?: 'success' | 'error' | 'info') => void;
}

export default function Settings({ db, onStore, onTheme, onReset, onToast }: Props) {
  const [store, setStore] = useState<StoreInfo>(db.store);
  const [pin, setPin] = useState(db.store.pin);
  const [confirmReset, setConfirmReset] = useState(false);

  const saveStore = () => {
    onStore({ ...store, pin });
    onToast('Store settings saved', 'success');
  };

  const swatches: { name: string; theme: Theme }[] = [
    { name: 'Forest', theme: defaultThemes.Forest },
    { name: 'Pistachio', theme: defaultThemes.Pistachio },
    { name: 'Beige', theme: defaultThemes.Beige },
    { name: 'Ocean', theme: defaultThemes.Ocean },
    { name: 'Plum', theme: defaultThemes.Plum },
    { name: 'Slate', theme: defaultThemes.Slate },
  ];

  return (
    <main className="max-w-[1100px] mx-auto p-6 md:p-10 pb-14 anim-fade">
      <div className="mb-5">
        <p className="eyebrow text-[10px]" style={{ color: 'var(--c-muted)' }}>
          CUSTOMIZE YOUR SHOP
        </p>
        <h2 className="text-[19px] tracking-tight font-bold mt-1">Settings</h2>
        <p className="text-[12px] mt-1.5" style={{ color: 'var(--c-muted)' }}>
          Change colors, store identity, and security. Everything saves to this browser instantly.
        </p>
      </div>

      {/* Theme customizer */}
      <section
        className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] p-5 mb-5 anim-up"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Palette size={16} style={{ color: 'var(--c-primary)' }} />
          <h3 className="text-[16px] font-bold tracking-tight">Theme & colors</h3>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--c-muted)' }}>
          Preset themes
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
          {swatches.map((s) => {
            const active =
              db.theme.primary === s.theme.primary &&
              db.theme.secondary === s.theme.secondary &&
              db.theme.accent === s.theme.accent;
            return (
              <button
                key={s.name}
                onClick={() => onTheme(s.theme)}
                className="border rounded-[10px] p-3 text-left flex flex-col gap-2 lift"
                style={{
                  borderColor: active ? 'var(--c-primary)' : 'var(--c-line)',
                  background: active ? 'var(--c-primary-soft)' : 'var(--c-paper)',
                }}
              >
                <div className="flex gap-1.5">
                  <span className="w-5 h-5 rounded-full" style={{ background: s.theme.primary }} />
                  <span className="w-5 h-5 rounded-full" style={{ background: s.theme.secondary }} />
                  <span className="w-5 h-5 rounded-full" style={{ background: s.theme.accent }} />
                </div>
                <span className="text-[12px] font-bold flex items-center gap-1.5" style={{ color: 'var(--c-ink)' }}>
                  {active && <Check size={12} style={{ color: 'var(--c-primary)' }} />}
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--c-muted)' }}>
          Custom colors
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ColorPicker
            label="Primary"
            value={db.theme.primary}
            onChange={(v) => onTheme({ ...db.theme, primary: v })}
          />
          <ColorPicker
            label="Secondary"
            value={db.theme.secondary}
            onChange={(v) => onTheme({ ...db.theme, secondary: v })}
          />
          <ColorPicker
            label="Accent"
            value={db.theme.accent}
            onChange={(v) => onTheme({ ...db.theme, accent: v })}
          />
        </div>
      </section>

      {/* Store identity */}
      <section
        className="bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[14px] p-5 mb-5 anim-up"
        style={{ boxShadow: 'var(--shadow)', animationDelay: '0.06s' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Store size={16} style={{ color: 'var(--c-primary)' }} />
          <h3 className="text-[16px] font-bold tracking-tight">Store identity</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <LabeledInput label="Store name" value={store.name} onChange={(v) => setStore({ ...store, name: v })} />
          <LabeledInput label="Logo letter" value={store.logoText} onChange={(v) => setStore({ ...store, logoText: v.slice(0, 2) })} />
          <LabeledInput label="Subtitle" value={store.subtitle} onChange={(v) => setStore({ ...store, subtitle: v })} />
          <LabeledInput label="Currency suffix" value={store.currency} onChange={(v) => setStore({ ...store, currency: v })} />
          <LabeledInput label="Address" value={store.address} onChange={(v) => setStore({ ...store, address: v })} />
          <LabeledInput label="Phone" value={store.phone} onChange={(v) => setStore({ ...store, phone: v })} />
          <LabeledInput label="Receipt footer" value={store.footerNote} onChange={(v) => setStore({ ...store, footerNote: v })} />
        </div>

        <div className="flex items-center gap-2 mb-4 pt-3 border-t border-[var(--c-line)]">
          <KeyRound size={16} style={{ color: 'var(--c-primary)' }} />
          <h3 className="text-[14px] font-bold tracking-tight">Security</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <LabeledInput
            label="Administrator PIN"
            value={pin}
            onChange={setPin}
            type="text"
          />
        </div>

        <button
          onClick={saveStore}
          className="text-white font-bold text-[12px] rounded-[9px] px-4 py-2.5 flex items-center gap-1.5"
          style={{ background: 'var(--c-primary)' }}
        >
          <Save size={14} /> Save settings
        </button>
      </section>

      {/* Danger zone */}
      <section
        className="border rounded-[14px] p-5 anim-up"
        style={{ borderColor: 'var(--c-danger-soft)', background: 'var(--c-paper)', boxShadow: 'var(--shadow)', animationDelay: '0.12s' }}
      >
        <h3 className="text-[15px] font-bold tracking-tight mb-2" style={{ color: 'var(--c-danger)' }}>
          Reset all data
        </h3>
        <p className="text-[12px] mb-3" style={{ color: 'var(--c-muted)' }}>
          This clears every product, sale, expense, and customer saved in this browser and restores
          the demo stock. This cannot be undone.
        </p>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="font-bold text-[12px] rounded-[9px] px-4 py-2.5 flex items-center gap-1.5"
            style={{ background: 'var(--c-danger-soft)', color: 'var(--c-danger)' }}
          >
            <RotateCcw size={14} /> Reset everything
          </button>
        ) : (
          <div className="flex gap-2 anim-scale">
            <button
              onClick={() => {
                onReset();
                setConfirmReset(false);
                onToast('All data reset to defaults', 'info');
              }}
              className="text-white font-bold text-[12px] rounded-[9px] px-4 py-2.5"
              style={{ background: 'var(--c-danger)' }}
            >
              Yes, delete everything
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="font-bold text-[12px] rounded-[9px] px-4 py-2.5"
              style={{ background: 'var(--c-cream)', color: 'var(--c-muted)' }}
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>
        {label}
      </span>
      <div className="flex items-center gap-2 border border-[var(--c-line)] rounded-[8px] p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-[12px] outline-none uppercase"
          style={{ color: 'var(--c-ink)' }}
        />
      </div>
    </label>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>
        {label}
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
