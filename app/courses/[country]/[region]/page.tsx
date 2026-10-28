import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HubPage } from "@/components/HubPage";
import { BRAND, absoluteUrl, coursePath, showGate } from "@/lib/config";
import { byAvailability, courseCard, hubChatLink, hubGateText, hubIndexable, hubPrompts, listRegions, placeList, plural, slugify } from "@/lib/hub";
import { hubJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ country: string; region: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listRegions()).map((r) => ({ country: r.country, region: r.region }));
}

async function load(country: string, region: string) {
  const all = await listRegions();
  const r = all.find((x) => x.country === country && x.region === region) ?? null;
  return r ? { r, others: all.filter((x) => x !== r) } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, region } = await params;
  const hit = await load(country, region);
  if (!hit) return { title: BRAND.name, robots: { index: false } };
  const { r } = hit;
  return {
    title: `${r.name} Golf Tee Times – ${plural(r.courses.length, "Course")} | ${BRAND.name}`,
    description: `Book tee times at ${plural(r.courses.length, "golf course")} in ${placeList(r.cities.map((c) => c.key))}, ${r.name}, with Bob, the AI that finds your tee time.`,
    robots: { index: hubIndexable(r.courses.length), follow: true },
    alternates: { canonical: absoluteUrl(r.path) ?? undefined },
  };
}

/** State hub: city navigation, then every published course grouped by city, then links to the other states. */
export default async function RegionHub({ params }: Props) {
  const { country, region } = await params;
  const hit = await load(country, region);
  if (!hit) notFound();
  const { r, others } = hit;
  return (
    <HubPage
      seed={`${country}-${region}`}
      gate={showGate ? hubGateText(r.courses.length) : null}
      crumbs={[{ name: "Courses", href: "/courses" }, { name: r.name, href: r.path }]}
      eyebrow={`Tee times · ${r.name}`}
      h1={`Book ${r.name} tee times with Bob`}
      lead={`Find and book tee times at ${plural(r.courses.length, "golf course")} ${r.cities.length === 1 ? `in ${r.cities[0].key}, ${r.name}` : `in ${r.cities.length} cities across ${r.name}`}, in a chat with Bob, the AI that finds your tee time.`}
      cta={{ label: "Ask Bob for a tee time", href: hubChatLink(`Find me a tee time in ${r.name}`) }}
      prompts={hubPrompts(r.name, r.courses).map((q) => ({ q, href: hubChatLink(q) }))}
      browse={r.cities.length < 2 ? undefined : {
        heading: `Golf courses in ${r.name} by city`,
        style: "chips",
        items: r.cities.map((g) => ({ href: `#city-${slugify(g.key)}`, name: g.key, meta: String(g.courses.length) })),
      }}
      groups={r.cities.map((g) => ({
        id: `city-${slugify(g.key)}`,
        heading: `Golf courses in ${g.key}, ${region.toUpperCase()}`,
        cards: byAvailability(g.courses).map((c) => courseCard(c)),
      }))}
      others={{ heading: "Golf courses in other states", links: others.map((o) => ({ href: o.path, name: o.name })) }}
      jsonLd={hubJsonLd(
        [{ name: BRAND.name, path: "/" }, { name: "Courses", path: "/courses" }, { name: r.name, path: r.path }],
        r.courses.map((c) => ({ name: c.facts.name, path: coursePath(c.facts) })),
      )}
    />
  );
}
