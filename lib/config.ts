/** Public origin, e.g. "https://teemeup.ai". Empty until the domain is decided. Never guess a domain. */
const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
export const siteUrl: string | null = raw || null;

export const showGate = process.env.NEXT_PUBLIC_SHOW_GATE === "1";

export const BRAND = { name: "Teemeup", purple: "#4817CE", tagline: "Book your next round with Bob, the AI that finds your tee time." } as const;

export function coursePath(c: { country: string; region: string; slug: string }) {
  return `/courses/${c.country}/${c.region}/${c.slug}`;
}

/** Absolute URL, or null while the site URL is not configured. */
export function absoluteUrl(path: string): string | null {
  return siteUrl ? `${siteUrl}${path}` : null;
}
