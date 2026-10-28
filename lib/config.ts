/** Public origin, e.g. "https://teemeup.ai". Empty until the domain is decided. Never guess a domain. */
const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
export const siteUrl: string | null = raw || null;

/**
 * Indexing is only allowed once the public origin is set, and can be switched off with NEXT_PUBLIC_NOINDEX=1
 * (staging, previews). While off, every response carries `X-Robots-Tag: noindex` and pages render `noindex`.
 */
export const indexingAllowed: boolean = siteUrl !== null && process.env.NEXT_PUBLIC_NOINDEX !== "1";

/**
 * Brand-level links for pages that are not about one course (the hubs). Store links are the ones on teemeup.ai (28 Oct 2026);
 * the chat URL is a PLACEHOLDER the app team confirms.
 * Course pages use the per-course values in `teemeup` (deep link, chat base).
 */
export const APP = {
  chatBaseUrl: "https://web.teemeup.example",
  appStoreUrl: "https://apps.apple.com/us/app/teemeup-golf-tee-times/id6763700956",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.teemeupai",
  /** App Store id, for the Safari smart app banner (iOS shows "Open"/"Get" at the top of the page). */
  appStoreId: "6763700956",
} as const;

/** A hub (list page) is indexable only with at least this many published courses. Our own rule; tune after the pilot. */
export const HUB_MIN_COURSES = 3;

export const showGate = process.env.NEXT_PUBLIC_SHOW_GATE === "1";

export const BRAND = { name: "Teemeup", purple: "#4817CE", tagline: "Book your next round with Bob, the AI that finds your tee time." } as const;

export function coursePath(c: { country: string; region: string; slug: string }) {
  return `/courses/${c.country}/${c.region}/${c.slug}`;
}

/** Absolute URL, or null while the site URL is not configured. */
export function absoluteUrl(path: string): string | null {
  return siteUrl ? `${siteUrl}${path}` : null;
}
