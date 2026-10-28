import type { Metadata } from "next";
import { HubPage } from "@/components/HubPage";
import { BRAND, HUB_MIN_COURSES, absoluteUrl, coursePath, showGate } from "@/lib/config";
import { courseCard, hubChatLink, hubIndexable, hubPrompts, listRegions, placeList, publishedCourses, topCity } from "@/lib/hub";
import { hubJsonLd } from "@/lib/seo";

export const revalidate = 300;

const PER_REGION = 6;

export async function generateMetadata(): Promise<Metadata> {
  const courses = await publishedCourses();
  const regions = await listRegions();
  const title = `Golf Tee Times You Can Book with Bob | ${BRAND.name}`;
  const description = `Book tee times at ${courses.length} golf course${courses.length === 1 ? "" : "s"} in ${placeList(regions.map((r) => r.name))} with Bob, the AI that finds your tee time.`;
  return {
    title,
    description,
    robots: { index: hubIndexable(courses.length), follow: true },
    alternates: { canonical: absoluteUrl("/courses") ?? undefined },
  };
}

export default async function CoursesHub() {
  const courses = await publishedCourses();
  const regions = await listRegions();
  return (
    <HubPage
      seed="courses"
      gate={showGate ? `Hub gate: ${hubIndexable(courses.length) ? "indexable" : `noindex (${courses.length} published, minimum ${HUB_MIN_COURSES}, or site-wide noindex)`}` : null}
      crumbs={[{ name: "Courses", href: "/courses" }]}
      eyebrow="Tee times"
      h1="Book golf tee times with Bob"
      lead={`${courses.length} golf course${courses.length === 1 ? "" : "s"} in ${placeList(regions.map((r) => r.name))} you can book with Bob, the AI that finds your tee time.`}
      cta={{ label: "Ask Bob for a tee time", href: hubChatLink("Find me a tee time") }}
      prompts={hubPrompts(topCity(courses), courses).map((q) => ({ q, href: hubChatLink(q) }))}
      groups={regions.map((r) => ({
        id: `region-${r.region}`,
        heading: `Golf courses in ${r.name}`,
        cards: r.courses.slice(0, PER_REGION).map((c) => courseCard(c)),
        more: { href: r.path, label: r.courses.length > PER_REGION ? `See all ${r.courses.length} courses in ${r.name}` : `See ${r.name} tee times` },
      }))}
      jsonLd={hubJsonLd(
        [{ name: BRAND.name, path: "/" }, { name: "Courses", path: "/courses" }],
        courses.map((c) => ({ name: c.facts.name, path: coursePath(c.facts) })),
      )}
    />
  );
}
