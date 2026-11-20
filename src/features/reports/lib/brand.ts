import type { CSSProperties } from 'react';

/**
 * The agency's brand colour on reports. Any colour an agency picks must stay
 * readable: text on the colour is white or near-black (whichever contrasts
 * more), and where the colour itself draws on white (headings rule, chart
 * line) a pale one is darkened until it reaches 3:1 against white.
 */

/** Used when the workspace hasn't chosen one (the API's Workspace::DEFAULT_BRAND_COLOR, navy). */
export const DEFAULT_BRAND_COLOR = '#1f4e79';

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const INK_DARK = '#16201c';
export const INK_LIGHT = '#ffffff';

type Rgb = [number, number, number];

function toRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (rgb: Rgb) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

/** WCAG relative luminance. */
function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two #rrggbb colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(toRgb(a)), luminance(toRgb(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** A valid colour, or the default. */
export const normaliseBrandColor = (color: string | null | undefined) => (color && HEX_COLOR.test(color) ? color.toLowerCase() : DEFAULT_BRAND_COLOR);

/** White or near-black, whichever reads better on the colour. */
export function inkOn(color: string): string {
  const c = normaliseBrandColor(color);
  return contrastRatio(c, INK_LIGHT) >= contrastRatio(c, INK_DARK) ? INK_LIGHT : INK_DARK;
}

/** The colour, darkened just enough to reach `min`:1 against white (for lines and rules on the page). */
export function accentOnWhite(color: string, min = 3): string {
  let rgb = toRgb(normaliseBrandColor(color));
  for (let i = 0; i < 20 && contrastRatio(toHex(rgb), INK_LIGHT) < min; i++) {
    rgb = rgb.map((c) => c * 0.88) as Rgb;
  }
  return toHex(rgb);
}

export interface BrandTheme {
  /** The brand colour itself (header band). */
  brand: string;
  /** Text and icons on the brand colour. */
  ink: string;
  /** The brand colour where it draws on white. */
  accent: string;
}

export function brandTheme(color: string | null | undefined): BrandTheme {
  const brand = normaliseBrandColor(color);
  return { brand, ink: inkOn(brand), accent: accentOnWhite(brand) };
}

/** The agency's colour, the text on it and its on-white accent, as CSS variables for the whole report. */
export const brandStyle = (color: string | null | undefined): CSSProperties => {
  const t = brandTheme(color);
  return { '--brand': t.brand, '--brand-ink': t.ink, '--brand-accent': t.accent } as CSSProperties;
};
