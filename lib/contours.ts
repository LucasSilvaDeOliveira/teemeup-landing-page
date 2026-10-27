/**
 * Decorative topography seeded from the slug (same idea as the existing teemeup course landing).
 * Concentric, slightly irregular rings; the same slug always gives the same drawing.
 */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function contourPaths(slug: string, rings = 9, step = 54, start = 70): string[] {
  const rand = rng(hash(slug));
  const harmonics = [2, 3, 5].map((k) => ({ k, amp: 0.05 + rand() * 0.05, phase: rand() * Math.PI * 2 }));
  const squash = 0.78 + rand() * 0.2;
  const paths: string[] = [];
  for (let i = 0; i < rings; i++) {
    const base = start + i * step;
    const pts: string[] = [];
    const n = 60;
    for (let j = 0; j <= n; j++) {
      const a = (j / n) * Math.PI * 2;
      let wobble = 1;
      for (const h of harmonics) wobble += h.amp * (1 + i * 0.08) * Math.sin(h.k * a + h.phase + i * 0.35);
      const r = base * wobble;
      pts.push(`${(Math.cos(a) * r).toFixed(0)} ${(Math.sin(a) * r * squash).toFixed(0)}`);
    }
    paths.push(`M${pts.join(" L")}Z`);
  }
  return paths;
}
