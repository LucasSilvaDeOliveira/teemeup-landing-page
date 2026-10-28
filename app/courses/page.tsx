import type { Metadata } from "next";
import { HubPage } from "@/components/HubPage";
import { BRAND, absoluteUrl, coursePath, showGate } from "@/lib/config";
import { byAvailability, courseCard, hubChatLink, hubGateText, hubIndexable, hubPrompts, listRegions, placeList, plural, publishedCourses } from "@/lib/hub";
import { hubJsonLd } from "@/lib/seo";

export const revalidate = 300;

/** How many course cards the all-courses hub shows; the state hubs list every course. */
const FEATURED = 9;

export async function generateMetadata(): Promise<Metadata> {
  const courses = await publishedCourses();
  const regions = await listRegions();
  return {
    title: `Golf Tee Times in ${plural(regions.length, "State")} | Book with Bob | ${BRAND.name}`,
    description: `Book tee times at ${plural(courses.length, "golf course")} in ${placeList(regions.map((r) => r.name))} with Bob, the AI that finds your tee time.`,
    robots: { index: hubIndexable(courses.length), follow: true },
    alternates: { canonical: absoluteUrl("/courses") ?? undefined },
  };
}

/** All-courses hub: states first (the directory), then a sample of courses with open tee times. */
export default async function CoursesHub() {
  const courses = await publishedCourses();
  const regions = await listRegions();
  return (
    <HubPage
      seed="courses"
      gate={showGate ? hubGateText(courses.length) : null}
      crumbs={[{ name: "Courses", href: "/courses" }]}
      eyebrow="Tee times · United States"
      h1="Book golf tee times with Bob"
      lead={`Find and book tee times at ${plural(courses.length, "golf course")} in ${plural(regions.length, "state")}, in a chat with Bob, the AI that finds your tee time.`}
      cta={{ label: "Ask Bob for a tee time", href: hubChatLink("Find me a tee time near me") }}
      prompts={hubPrompts(null, courses).map((q) => ({ q, href: hubChatLink(q) }))}
      browse={{
        heading: "Golf courses by state",
        style: "tiles",
        items: regions.map((r) => ({ href: r.path, name: r.name, meta: `${plural(r.courses.length, "course")} · ${placeList(r.cities.map((c) => c.key))}` })),
      }}
      groups={[
        {
          id: "courses",
          heading: "Courses with open tee times",
          cards: byAvailability(courses).slice(0, FEATURED).map((c) => courseCard(c)),
        },
      ]}
      jsonLd={hubJsonLd(
        [{ name: BRAND.name, path: "/" }, { name: "Courses", path: "/courses" }],
        courses.map((c) => ({ name: c.facts.name, path: coursePath(c.facts) })),
      )}
    />
  );
}
