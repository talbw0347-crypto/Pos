// preload.js runs in an isolated context with access to Node, but exposes
// nothing to the app's HTML. The POS app is fully self-contained and needs
// no Node APIs — this file exists so contextIsolation stays on (safer).
window.addEventListener('DOMContentLoaded', () => {
  // Focus the scan input on launch so a hardware barcode scanner starts
  // working immediately without a click.
  const focusScan = () => {
    const el = document.querySelector('input[placeholder^="Scan barcode"]');
    if (el) el.focus();
  };
  focusScan();
  setTimeout(focusScan, 400);
});
