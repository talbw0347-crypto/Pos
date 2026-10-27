import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

interface Props {
  message: string;
  kind: ToastKind;
  onClose: () => void;
}

export default function Toast({ message, kind, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);

  const cfg = {
    success: { icon: CheckCircle2, bg: 'var(--c-primary)', color: '#fff' },
    error: { icon: AlertTriangle, bg: 'var(--c-danger)', color: '#fff' },
    info: { icon: Info, bg: 'var(--c-ink)', color: '#fff' },
  }[kind];

  const Icon = cfg.icon;
  return (
    <div
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-2.5 px-4 py-3 rounded-[10px] text-[12px] font-bold toast-enter"
      style={{ background: cfg.bg, color: cfg.color, boxShadow: 'var(--shadow-lg)' }}
    >
      <Icon size={15} />
      <span>{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100">
        <X size={13} />
      </button>
    </div>
  );
}
