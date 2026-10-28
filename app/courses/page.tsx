import type { Metadata } from "next";
import { HubPage } from "@/components/HubPage";
import { LocationFilter } from "@/components/LocationFilter";
import { BRAND, absoluteUrl, coursePath, showGate } from "@/lib/config";
import { byAvailability, courseCard, hubChatLink, hubGateText, hubIndexable, hubPrompts, listRegions, locationTree, publishedCourses } from "@/lib/hub";
import { hubJsonLd } from "@/lib/seo";

export const revalidate = 300;

/** How many course cards the all-courses hub shows; the state hubs list every course. */
const FEATURED = 9;

export async function generateMetadata(): Promise<Metadata> {
  const courses = await publishedCourses();
  return {
    title: `Golf Tee Times Across the US | Book with Bob | ${BRAND.name}`,
    description: "Find and book golf tee times across the US in a chat with Bob, the AI that finds your tee time.",
    robots: { index: hubIndexable(courses.length), follow: true },
    alternates: { canonical: absoluteUrl("/courses") ?? undefined },
  };
}

/** All-courses hub: location filter (country / state / city), courses with open tee times, links to every state. */
export default async function CoursesHub() {
  const courses = await publishedCourses();
  const regions = await listRegions();
  return (
    <HubPage
      seed="courses"
      gate={showGate ? hubGateText(courses.length) : null}
      crumbs={[{ name: "Courses", href: "/courses" }]}
      eyebrow="Tee times"
      h1="Book golf tee times with Bob"
      lead="Find and book tee times at golf courses across the US, in a chat with Bob, the AI that finds your tee time."
      cta={{ label: "Ask Bob for a tee time", href: hubChatLink("Find me a tee time near me") }}
      prompts={hubPrompts(null, courses).map((q) => ({ q, href: hubChatLink(q) }))}
      list={{
        heading: "Find a golf course",
        filter: <LocationFilter tree={await locationTree()} country="us" state={null} />,
        groups: [{ id: "open", heading: "Courses with open tee times", cards: byAvailability(courses).slice(0, FEATURED).map((c) => courseCard(c)) }],
      }}
      others={{ heading: "Golf courses by state", links: [...regions].sort((a, b) => a.name.localeCompare(b.name)).map((r) => ({ href: r.path, name: r.name })) }}
      jsonLd={hubJsonLd(
        [{ name: BRAND.name, path: "/" }, { name: "Courses", path: "/courses" }],
        courses.map((c) => ({ name: c.facts.name, path: coursePath(c.facts) })),
      )}
    />
  );
}
