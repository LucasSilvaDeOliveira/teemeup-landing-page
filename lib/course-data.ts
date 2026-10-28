/**
 * CourseData: contract between the data layer (Nivas/VJ) and the SEO landing page template.
 * Draft v0, 23 Oct 2026. Three blocks, by how hard each is to obtain and how often it changes:
 *   1. CourseFacts  - public and stable (name, address, designer...). Mostly obtainable without asking the club.
 *   2. CourseOps    - operational and changing (tee times, prices, policies, FAQ). Comes from the booking data.
 *   3. TeemeupLayer - product-side (app links, chat deep links, related courses). Owned by Teemeup.
 * Every field that is not guaranteed is nullable or optional. The page must render without them.
 * Rule: write `description` in your own words from the facts. Never paste text from the club site or an aggregator.
 */

// ---------- 1. Facts ----------
export type CourseFacts = {
  /** Opaque lookup key. The URL path (e.g. /courses/us/nc/highland-creek-golf-club) is derived from the fields below. */
  slug: string;
  name: string;
  /** ISO 3166-1 alpha-2 country and lower-case region code, used for the URL and breadcrumbs. */
  country: string;
  region: string;
  city: string;
  address: { street: string; postalCode: string };
  /** E.164, e.g. "+17048759000". The page formats it for display. */
  phone: string | null;
  /** The club's own site. Goes in JSON-LD `sameAs`; not necessarily a visible link. */
  website: string | null;
  geo: { lat: number; lng: number } | null;
  holes: number;
  par: number | null;
  designer: string | null;
  yearOpened: number | null;
  /** 2-3 factual sentences in our own words. Null means the page is not indexable (see isIndexable). */
  description: string | null;
  amenities: string[];
  photos: { url: string; alt: string; width: number; height: number }[];
  logoUrl: string | null;
  /** Hex. The template darkens it or falls back to the Teemeup purple if contrast is too low. */
  themeColor: string | null;
  /** Optional, nice to have; not needed to publish. */
  optional?: {
    yardsMin?: number;
    yardsMax?: number;
    grass?: string;
  };
};

// ---------- 2. Operations ----------
export type TeeTimeSlot = {
  /** Local time at the course, "HH:mm" 24h. */
  time: string;
  priceUsd: number | null;
  /** Open spots (1-4). 0 or missing = full. */
  spots: number;
  holes: 9 | 18;
  cart: boolean | null;
};

export type TeeTimeDay = {
  /** YYYY-MM-DD at the course. */
  date: string;
  /** ISO timestamp of the data. The page shows it ("as of ..."). */
  asOf: string;
  slots: TeeTimeSlot[];
};

export type CourseOps = {
  /** Next N days, finite window. Rendered in the server HTML. No indexable URL per day. */
  teeTimes: TeeTimeDay[];
  policies: {
    cancellation?: string;
    dressCode?: string;
    carts?: string;
    walking?: string;
    groupingNote?: string;
    maxPlayers?: number;
    bookingWindowDays?: number;
  };
  /** Only for fixed price lists. Always with the date it was published. Tee-time prices win when both exist. */
  rates?: { label: string; priceUsd: number; note?: string; publishedOn: string }[];
  seasonOrHours?: string;
  faq: { q: string; a: string }[];
};

// ---------- 3. Teemeup layer ----------
export type TeemeupLayer = {
  /** Opens the app themed to this course (deep link), or null if not provisioned. */
  deepLinkUrl: string | null;
  qrImageUrl: string | null;
  appStoreUrl: string;
  playStoreUrl: string;
  /** Base of the web chat. The page builds links like `${chatBaseUrl}?course=${slug}&q=${encodeURIComponent(prompt)}`. */
  chatBaseUrl: string;
  /** Slugs of nearby courses that are also published. Used for internal links. */
  nearby: string[];
};

// ---------- Provenance ----------
export type Provenance = Partial<Record<keyof CourseFacts | "teeTimes" | "policies" | "rates", { source: string; retrievedOn: string }>>;

export type CourseData = {
  facts: CourseFacts;
  ops: CourseOps;
  teemeup: TeemeupLayer;
  provenance: Provenance;
};

/**
 * Publication gate. Our own rule, to be tuned after the pilot; it is not a Google threshold.
 * If it returns reasons, the page renders with `noindex` and is left out of the sitemap.
 */
export function indexabilityProblems(c: CourseData): string[] {
  const p: string[] = [];
  const { facts: f, ops } = c;
  if (!f.description) p.push("missing description");
  if (!f.geo) p.push("missing coordinates");
  if (!f.phone && !f.website) p.push("missing phone and website");
  const today = ops.teeTimes.filter((d) => d.slots.length > 0);
  if (today.length === 0) p.push("no tee times in the window");
  if (Object.keys(ops.policies).length === 0) p.push("no policies");
  if (c.provenance.description === undefined) p.push("description has no recorded source");
  return p;
}

export const isIndexable = (c: CourseData) => indexabilityProblems(c).length === 0;
