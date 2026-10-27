import { BRAND, absoluteUrl, coursePath } from "@/lib/config";
import { indexabilityProblems } from "@/lib/course-data";
import { listCourses } from "@/lib/courses";

export const revalidate = 300;

/** Short index of the published course pages and their Markdown versions. Generated from the same data as the pages. */
export async function GET() {
  const courses = (await listCourses()).filter((c) => indexabilityProblems(c).length === 0);
  const lines = [
    `# ${BRAND.name}`,
    "",
    `> ${BRAND.tagline} Each course page lists open tee times and course facts; every page has a Markdown version at the same address plus /index.md.`,
    "",
    "## Courses",
    "",
    ...courses.map((c) => {
      const path = coursePath(c.facts);
      return `- [${c.facts.name}](${absoluteUrl(path) ?? path}): ${c.facts.city}, ${c.facts.region.toUpperCase()} ([Markdown](${absoluteUrl(`${path}/index.md`) ?? `${path}/index.md`}))`;
    }),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
