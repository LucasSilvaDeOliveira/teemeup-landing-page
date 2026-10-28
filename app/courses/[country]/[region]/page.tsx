import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HubPage } from "@/components/HubPage";
import { BRAND, HUB_MIN_COURSES, absoluteUrl, coursePath, showGate } from "@/lib/config";
import { courseCard, groupBy, hubChatLink, hubIndexable, hubPrompts, listRegions, placeList, topCity } from "@/lib/hub";
import { regionName, regionPath } from "@/lib/regions";
import { hubJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ country: string; region: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listRegions()).map((r) => ({ country: r.country, region: r.region }));
}

async function load(country: string, region: string) {
  return (await listRegions()).find((r) => r.country === country && r.region === region) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, region } = await params;
  const r = await load(country, region);
  if (!r) return { title: BRAND.name, robots: { index: false } };
  const cities = placeList(r.courses.map((c) => c.facts.city));
  return {
    title: `${r.name} Golf Tee Times – ${r.courses.length} Course${r.courses.length === 1 ? "" : "s"} | ${BRAND.name}`,
    description: `Book tee times at ${r.courses.length} golf course${r.courses.length === 1 ? "" : "s"} in ${cities}, ${r.name}, with Bob, the AI that finds your tee time.`,
    robots: { index: hubIndexable(r.courses.length), follow: true },
    alternates: { canonical: absoluteUrl(r.path) ?? undefined },
  };
}

/** State hub: published courses grouped by city. Links to every course page; the course pages link back via the breadcrumb. */
export default async function RegionHub({ params }: Props) {
  const { country, region } = await params;
  const r = await load(country, region);
  if (!r) notFound();
  const name = regionName(country, region);
  const byCity = groupBy(r.courses, (c) => c.facts.city).sort((a, b) => b.courses.length - a.courses.length || a.key.localeCompare(b.key));
  return (
    <HubPage
      seed={`${country}-${region}`}
      gate={showGate ? `Hub gate: ${hubIndexable(r.courses.length) ? "indexable" : `noindex (${r.courses.length} published, minimum ${HUB_MIN_COURSES}, or site-wide noindex)`}` : null}
      crumbs={[{ name: "Courses", href: "/courses" }, { name, href: regionPath(country, region) }]}
      eyebrow={`Tee times · ${name}`}
      h1={`Book ${name} tee times with Bob`}
      lead={`${r.courses.length} golf course${r.courses.length === 1 ? "" : "s"} in ${placeList(byCity.map((g) => g.key))} you can book with Bob, the AI that finds your tee time.`}
      cta={{ label: "Ask Bob for a tee time", href: hubChatLink(`Find me a tee time in ${name}`) }}
      prompts={hubPrompts(topCity(r.courses) || name, r.courses).map((q) => ({ q, href: hubChatLink(q) }))}
      groups={byCity.map((g) => ({
        id: `city-${g.key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        heading: `Golf courses in ${g.key}, ${region.toUpperCase()}`,
        cards: g.courses.map((c) => courseCard(c)),
      }))}
      jsonLd={hubJsonLd(
        [{ name: BRAND.name, path: "/" }, { name: "Courses", path: "/courses" }, { name, path: regionPath(country, region) }],
        r.courses.map((c) => ({ name: c.facts.name, path: coursePath(c.facts) })),
      )}
    />
  );
}
