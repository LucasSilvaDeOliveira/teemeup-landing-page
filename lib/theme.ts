/**
 * Course accent color, safe for a white label on the button (WCAG AA, 4.5:1).
 * Darkens the color in 4% steps; past 40% it falls back to the Teemeup purple. Same rule as the existing course landing.
 */
const PURPLE = "#4817CE";
type RGB = [number, number, number];

function parseHex(input: string | null | undefined): RGB | null {
  if (!input) return null;
  const m = input.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (c: RGB) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
function luminance([r, g, b]: RGB) {
  const l = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b);
}
function contrast(a: RGB, b: RGB) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const darken = (c: RGB, t: number): RGB => [c[0] * (1 - t), c[1] * (1 - t), c[2] * (1 - t)];

export function resolveAccent(themeColor: string | null): { accent: string; hover: string } {
  const white: RGB = [255, 255, 255];
  const make = (c: RGB) => ({ accent: toHex(c), hover: toHex(darken(c, 0.14)) });
  const brand = parseHex(PURPLE)!;
  const parsed = parseHex(themeColor);
  if (!parsed) return make(brand);
  if (contrast(parsed, white) >= 4.5) return make(parsed);
  for (let t = 0.04; t <= 0.4; t += 0.04) {
    const d = parseHex(toHex(darken(parsed, t)))!;
    if (contrast(d, white) >= 4.5) return make(d);
  }
  return make(brand);
}
