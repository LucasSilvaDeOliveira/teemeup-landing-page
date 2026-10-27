/** Public origin, e.g. "https://teemeup.ai". Empty until the domain is decided. Never guess a domain. */
const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
export const siteUrl: string | null = raw || null;

/**
 * Indexing is only allowed once the public origin is set, and can be switched off with NEXT_PUBLIC_NOINDEX=1
 * (staging, previews). While off, every response carries `X-Robots-Tag: noindex` and pages render `noindex`.
 */
export const indexingAllowed: boolean = siteUrl !== null && process.env.NEXT_PUBLIC_NOINDEX !== "1";

export const showGate = process.env.NEXT_PUBLIC_SHOW_GATE === "1";

export const BRAND = { name: "Teemeup", purple: "#4817CE", tagline: "Book your next round with Bob, the AI that finds your tee time." } as const;

export function coursePath(c: { country: string; region: string; slug: string }) {
  return `/courses/${c.country}/${c.region}/${c.slug}`;
}

/** Absolute URL, or null while the site URL is not configured. */
export function absoluteUrl(path: string): string | null {
  return siteUrl ? `${siteUrl}${path}` : null;
}
