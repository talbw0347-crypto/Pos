import { useState } from 'react';
import { Lock, ShieldCheck, UserCog, ScanLine } from 'lucide-react';
import type { Role } from '@/lib/types';

interface Props {
  storeName: string;
  logoText: string;
  pin: string;
  onLogin: (role: Role) => void;
}

export default function Login({ storeName, logoText, pin, onLogin }: Props) {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const submitAdmin = () => {
    if (pinInput === pin) {
      setError('');
      onLogin('admin');
    } else {
      setError('Incorrect PIN. Try again.');
    }
  };

  return (
    <div
      className="min-h-screen grid place-items-center p-5 anim-fade"
      style={{
        background:
          'radial-gradient(circle at 28% 8%, var(--c-primary-soft) 0, transparent 38%), var(--c-cream)',
      }}
    >
      <div
        className="w-full max-w-[420px] bg-[var(--c-paper)] border border-[var(--c-line)] rounded-[20px] p-9 anim-up"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        <div
          className="w-14 h-14 rounded-[14px] grid place-items-center text-white text-3xl font-extrabold anim-pop"
          style={{
            background: 'var(--c-accent)',
            borderRadius: '14px 14px 14px 4px',
          }}
        >
          {logoText}
        </div>
        <p className="eyebrow mt-5" style={{ color: 'var(--c-muted)' }}>
          {storeName.toUpperCase()} · OFFLINE
        </p>
        <h1 className="text-[32px] leading-[1.05] tracking-tight font-bold mt-2 mb-3">
          Keep the shop under control.
        </h1>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--c-muted)' }}>
          This app runs entirely on this device — no internet needed. Your data
          stays in this browser.
        </p>

        {!showPin ? (
          <div className="grid gap-2.5 mt-6">
            <button
              onClick={() => setShowPin(true)}
              className="text-white font-bold text-[13px] rounded-[10px] py-3 px-4 flex items-center justify-center gap-2 anim-up"
              style={{ background: 'var(--c-primary)' }}
            >
              <ShieldCheck size={16} /> Enter as Administrator
            </button>
            <button
              onClick={() => onLogin('cashier')}
              className="font-bold text-[13px] rounded-[10px] py-3 px-4 flex items-center justify-center gap-2 anim-up"
              style={{
                background: 'var(--c-primary-soft)',
                color: 'var(--c-primary)',
              }}
            >
              <UserCog size={16} /> Enter as Cashier
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-2.5 anim-scale">
            <label className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: 'var(--c-muted)' }}>
              <Lock size={12} /> Administrator PIN
            </label>
            <input
              type="password"
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && submitAdmin()}
              placeholder="Enter PIN"
              className="w-full py-3 px-4 rounded-[10px] border bg-[var(--c-paper)] text-[15px] tracking-widest"
              style={{ borderColor: 'var(--c-line)' }}
            />
            {error && (
              <p className="text-[12px] font-semibold" style={{ color: 'var(--c-danger)' }}>
                {error}
              </p>
            )}
            <button
              onClick={submitAdmin}
              className="text-white font-bold text-[13px] rounded-[10px] py-3 px-4"
              style={{ background: 'var(--c-primary)' }}
            >
              Unlock
            </button>
            <button
              onClick={() => {
                setShowPin(false);
                setError('');
              }}
              className="text-[12px] font-semibold"
              style={{ color: 'var(--c-muted)' }}
            >
              ← Back
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-[var(--c-line)]">
          <ScanLine size={14} style={{ color: 'var(--c-muted)' }} />
          <p className="text-[10px] leading-snug" style={{ color: 'var(--c-muted)' }}>
            Offline role protection is operational. Default PIN:{' '}
            <span className="font-bold">{pin}</span> — change it in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
