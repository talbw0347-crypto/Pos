import { useEffect } from 'react';
import type { Theme } from './types';

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const n = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const int = parseInt(n, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => v.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(
    Math.round(r1 + (r2 - r1) * t),
    Math.round(g1 + (g2 - g1) * t),
    Math.round(b1 + (b2 - b1) * t),
  );
}

function lighten(hex: string, t: number): string {
  return mix(hex, '#ffffff', t);
}

function darken(hex: string, t: number): string {
  return mix(hex, '#000000', t);
}

function readable(hex: string, light: string, dark: string): string {
  const [r, g, b] = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? dark : light;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const primary = theme.primary;
  const secondary = theme.secondary;
  const accent = theme.accent;
  const onPrimary = readable(primary, '#ffffff', '#1a2a22');
  const onAccent = readable(accent, '#ffffff', '#3a1810');

  root.style.setProperty('--c-primary', primary);
  root.style.setProperty('--c-primary-light', lighten(primary, 0.12));
  root.style.setProperty('--c-primary-dark', darken(primary, 0.18));
  root.style.setProperty('--c-primary-soft', lighten(primary, 0.88));
  root.style.setProperty('--c-secondary', secondary);
  root.style.setProperty('--c-accent', accent);
  root.style.setProperty('--c-accent-light', lighten(accent, 0.18));
  root.style.setProperty('--c-accent-soft', lighten(accent, 0.88));
  root.style.setProperty('--c-on-primary', onPrimary);
  root.style.setProperty('--c-on-accent', onAccent);

  // Derived accent variants for badges
  root.style.setProperty('--c-success', '#2e7d52');
  root.style.setProperty('--c-success-soft', '#e3f1e7');
  root.style.setProperty('--c-warn', '#b58b48');
  root.style.setProperty('--c-warn-soft', '#f7ebce');
  root.style.setProperty('--c-danger', '#c74a3d');
  root.style.setProperty('--c-danger-soft', '#fae1dc');
}

export function useTheme(theme: Theme) {
  useEffect(() => {
    applyTheme(theme);
  }, [theme.primary, theme.secondary, theme.accent]);
}
