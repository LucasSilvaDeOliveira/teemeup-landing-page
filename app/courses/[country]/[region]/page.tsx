import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HubPage } from "@/components/HubPage";
import { LocationFilter } from "@/components/LocationFilter";
import { BRAND, absoluteUrl, coursePath, showGate } from "@/lib/config";
import { byAvailability, courseCard, hubChatLink, hubGateText, hubIndexable, hubPrompts, listRegions, locationTree, slugify } from "@/lib/hub";
import { hubJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ country: string; region: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listRegions()).map((r) => ({ country: r.country, region: r.region }));
}

async function load(country: string, region: string) {
  const all = await listRegions();
  const r = all.find((x) => x.country === country && x.region === region) ?? null;
  return r ? { r } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, region } = await params;
  const hit = await load(country, region);
  if (!hit) return { title: BRAND.name, robots: { index: false } };
  const { r } = hit;
  return {
    title: `${r.name} Golf Tee Times | Book with Bob | ${BRAND.name}`,
    description: `Find and book golf tee times across ${r.name} in a chat with Bob, the AI that finds your tee time.`,
    robots: { index: hubIndexable(r.courses.length), follow: true },
    alternates: { canonical: absoluteUrl(r.path) ?? undefined },
  };
}

/** State hub: location filter and every published course grouped by city. */
export default async function RegionHub({ params }: Props) {
  const { country, region } = await params;
  const hit = await load(country, region);
  if (!hit) notFound();
  const { r } = hit;
  const cities = [...r.cities].sort((a, b) => a.key.localeCompare(b.key));
  return (
    <HubPage
      seed={`${country}-${region}`}
      gate={showGate ? hubGateText(r.courses.length) : null}
      crumbs={[{ name: "Courses", href: "/courses" }, { name: r.name, href: r.path }]}
      eyebrow={`Tee times · ${r.name}`}
      h1={`Book ${r.name} tee times with Bob`}
      lead={`Find and book tee times at golf courses across ${r.name}, in a chat with Bob, the AI that finds your tee time.`}
      cta={{ label: "Ask Bob for a tee time", href: hubChatLink(`Find me a tee time in ${r.name}`) }}
      prompts={hubPrompts(r.name, r.courses).map((q) => ({ q, href: hubChatLink(q) }))}
      list={{
        heading: `Golf courses in ${r.name}`,
        filter: <LocationFilter tree={await locationTree()} country={country} state={region} />,
        groups: cities.map((g) => ({
          id: `city-${slugify(g.key)}`,
          cityId: slugify(g.key),
          heading: `${g.key}, ${region.toUpperCase()}`,
          cards: byAvailability(g.courses).map((c) => courseCard(c)),
        })),
      }}
      jsonLd={hubJsonLd(
        [{ name: BRAND.name, path: "/" }, { name: "Courses", path: "/courses" }, { name: r.name, path: r.path }],
        r.courses.map((c) => ({ name: c.facts.name, path: coursePath(c.facts) })),
      )}
    />
  );
}
