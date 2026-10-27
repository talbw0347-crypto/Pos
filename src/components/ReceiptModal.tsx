import { useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import type { Sale, StoreInfo } from '@/lib/types';
import { money, dateShort } from '@/lib/utils';

interface Props {
  sale: Sale;
  store: StoreInfo;
  onClose: () => void;
}

export default function ReceiptModal({ sale, store, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const print = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-5 anim-fade"
      style={{ background: 'rgba(23,74,59,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[470px] max-h-[92vh] overflow-auto rounded-[15px] p-3.5 anim-scale"
        style={{ background: 'var(--c-cream)', border: '1px solid var(--c-line)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3 px-2 text-[12px] font-bold" style={{ color: 'var(--c-muted)' }}>
          <span>Receipt ready</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="font-bold text-[12px] rounded-[8px] px-3 py-1.5"
              style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
            >
              Close
            </button>
            <button
              onClick={print}
              className="text-white font-bold text-[12px] rounded-[8px] px-3 py-1.5 flex items-center gap-1.5"
              style={{ background: 'var(--c-primary)' }}
            >
              <Printer size={13} /> Print
            </button>
          </div>
        </div>

        <article
          className="print-receipt mx-auto bg-white text-[#17221c] p-6"
          style={{ width: '80mm', maxWidth: '100%', font: '11px/1.5 monospace' }}
        >
          <div className="text-center mb-3.5">
            <strong className="block text-[17px] tracking-wider font-bold">
              {store.name.toUpperCase()}
            </strong>
            <span className="text-[9px]" style={{ color: '#637166' }}>
              {store.subtitle}
            </span>
            <div className="text-[9px] mt-1" style={{ color: '#637166' }}>
              {store.address}
            </div>
            <div className="text-[9px]" style={{ color: '#637166' }}>
              {store.phone}
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #aeb7af', margin: '10px 0' }} />

          <div className="flex justify-between gap-2.5 text-[9px]" style={{ color: '#647168' }}>
            <span>{sale.receiptNo}</span>
            <span>{dateShort(sale.createdAt)}</span>
          </div>
          <div className="text-[9px]" style={{ color: '#647168' }}>
            Cashier: {sale.cashier}
          </div>

          <div style={{ borderTop: '1px dashed #aeb7af', margin: '10px 0' }} />

          {sale.items.map((i) => (
            <div key={i.id} className="flex justify-between gap-2.5 my-2">
              <div>
                <strong className="block font-bold">{i.name}</strong>
                <small style={{ color: '#68756c', fontSize: '9px' }}>
                  {i.quantity} × {money(i.price, store.currency)}
                </small>
              </div>
              <b className="font-bold">{money(i.price * i.quantity, store.currency)}</b>
            </div>
          ))}

          <div style={{ borderTop: '1px dashed #aeb7af', margin: '10px 0' }} />

          <div className="flex justify-between gap-2.5 my-1">
            <span>Subtotal</span>
            <b>{money(sale.subtotal, store.currency)}</b>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between gap-2.5 my-1">
              <span>Discount</span>
              <b>-{money(sale.discount, store.currency)}</b>
            </div>
          )}
          <div
            className="flex justify-between gap-2.5 mt-2.5 text-[13px] font-bold"
            style={{ borderTop: '1px dashed #aeb7af', paddingTop: '8px' }}
          >
            <span>TOTAL</span>
            <b>{money(sale.total, store.currency)}</b>
          </div>

          <div className="text-center text-[9px] mt-3">
            Payment: <strong className="uppercase">{sale.payment}</strong>
          </div>

          <p className="text-center mt-5 text-[9px]" style={{ color: '#637166' }}>
            {store.footerNote} · Merci
          </p>
        </article>
      </div>
    </div>
  );
}
