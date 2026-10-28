import type { CourseData } from "./course-data";
import { BRAND, absoluteUrl, coursePath } from "./config";
import { chatLink, formatTime, longDate, openSlots, summarizeDay } from "./derive";
import { regionName, regionPath } from "./regions";

/** Structured data for a course page. Fields without data are left out, never filled with guesses. */
export function courseJsonLd(c: CourseData) {
  const f = c.facts;
  const url = absoluteUrl(coursePath({ country: f.country, region: f.region, slug: f.slug })) ?? undefined;
  const sameAs = [f.website].filter(Boolean) as string[];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "GolfCourse",
        "@id": url ? `${url}#course` : undefined,
        name: f.name,
        url,
        description: f.description ?? undefined,
        telephone: f.phone ?? undefined,
        address: {
          "@type": "PostalAddress",
          streetAddress: f.address.street,
          addressLocality: f.city,
          addressRegion: f.region.toUpperCase(),
          postalCode: f.address.postalCode,
          addressCountry: f.country.toUpperCase(),
        },
        geo: f.geo ? { "@type": "GeoCoordinates", latitude: f.geo.lat, longitude: f.geo.lng } : undefined,
        image: f.photos.length ? f.photos.map((p) => p.url) : undefined,
        logo: f.logoUrl ?? undefined,
        sameAs: sameAs.length ? sameAs : undefined,
        amenityFeature: f.amenities.length ? f.amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: a, value: true })) : undefined,
        potentialAction: {
          "@type": "ReserveAction",
          name: `Book a tee time at ${f.name}`,
          target: { "@type": "EntryPoint", urlTemplate: `${c.teemeup.chatBaseUrl}/?course=${f.slug}&q={q}`, actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"] },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: BRAND.name, item: absoluteUrl("/") ?? undefined },
          { "@type": "ListItem", position: 2, name: "Courses", item: absoluteUrl("/courses") ?? undefined },
          { "@type": "ListItem", position: 3, name: regionName(f.country, f.region), item: absoluteUrl(regionPath(f.country, f.region)) ?? undefined },
          { "@type": "ListItem", position: 4, name: f.name, item: url },
        ],
      },
      {
        "@type": "MobileApplication",
        name: BRAND.name,
        description: BRAND.tagline,
        applicationCategory: "SportsApplication",
        operatingSystem: "iOS, Android",
        downloadUrl: [c.teemeup.appStoreUrl, c.teemeup.playStoreUrl],
      },
    ],
  };
}

/** JSON for a <script type="application/ld+json">. Escapes "<" so data can't close the tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Markdown twin of the page, generated from the same data so the two never disagree. */
export function courseMarkdown(c: CourseData): string {
  const f = c.facts;
  const lines: string[] = [];
  lines.push(`# ${f.name} tee times`, "");
  lines.push(`${f.name} is an ${f.holes}-hole golf course in ${f.city}, ${f.region.toUpperCase()}. Book it with Bob, the AI that finds your tee time, on Teemeup.`, "");
  if (f.description) lines.push(f.description, "");
  lines.push("## Course facts", "");
  lines.push(`- Address: ${f.address.street}, ${f.city}, ${f.region.toUpperCase()} ${f.address.postalCode}`);
  if (f.phone) lines.push(`- Phone: ${f.phone}`);
  lines.push(`- Holes: ${f.holes}`);
  if (f.par) lines.push(`- Par: ${f.par}`);
  if (f.designer) lines.push(`- Architect: ${f.designer}`);
  if (f.yearOpened) lines.push(`- Opened: ${f.yearOpened}`);
  if (f.website) lines.push(`- Club website: ${f.website}`);
  if (f.amenities.length) lines.push(`- Amenities: ${f.amenities.join(", ")}`);
  lines.push("");
  for (const day of c.ops.teeTimes) {
    const s = summarizeDay(day);
    if (s.count === 0) continue;
    lines.push(`## Open tee times: ${longDate(day.date)}`, "", `Data as of ${day.asOf}. Availability and prices change.`, "");
    lines.push("| Time | Price | Open spots | Book |", "|---|---|---|---|");
    for (const slot of openSlots(day)) {
      const link = chatLink(c, { q: `Book a tee time at ${f.name} on ${longDate(day.date)} at ${formatTime(slot.time)}`, date: day.date, time: slot.time });
      lines.push(`| ${formatTime(slot.time)} | ${slot.priceUsd !== null ? `$${slot.priceUsd.toFixed(2)}` : "n/a"} | ${slot.spots} | [Book](${link}) |`);
    }
    lines.push("");
  }
  const p = c.ops.policies;
  const pol = [p.cancellation, p.dressCode, p.carts, p.walking, p.groupingNote].filter(Boolean) as string[];
  if (pol.length || p.maxPlayers || p.bookingWindowDays) {
    lines.push("## Policies", "");
    for (const x of pol) lines.push(`- ${x}`);
    if (p.maxPlayers) lines.push(`- Up to ${p.maxPlayers} players per booking.`);
    if (p.bookingWindowDays) lines.push(`- Tee times open ${p.bookingWindowDays} days ahead.`);
    lines.push("");
  }
  if (c.ops.faq.length) {
    lines.push("## FAQ", "");
    for (const q of c.ops.faq) lines.push(`**${q.q}**`, "", q.a, "");
  }
  return lines.join("\n");
}

/** JSON-LD for a hub: the breadcrumb and the list of course pages it links to. */
export function hubJsonLd(crumbs: { name: string; path: string }[], items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.path) ?? undefined })),
      },
      {
        "@type": "ItemList",
        numberOfItems: items.length,
        itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, url: absoluteUrl(x.path) ?? undefined })),
      },
    ],
  };
}
