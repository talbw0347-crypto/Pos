export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function money(v: number, currency = 'DA'): string {
  return `${Math.round(Number(v) || 0).toLocaleString('fr-DZ')} ${currency}`;
}

export function dateShort(v: string): string {
  return new Date(v).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function dateOnly(v: string): string {
  return new Date(v).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function isToday(v: string): boolean {
  return new Date(v).toDateString() === new Date().toDateString();
}

export function makeReceiptNo(): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const s = Date.now().toString().slice(-5);
  return `ZM-${d}-${s}`;
}
