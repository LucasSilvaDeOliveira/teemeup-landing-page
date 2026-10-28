import type { MetadataRoute } from "next";
import { absoluteUrl, coursePath, siteUrl } from "@/lib/config";
import { indexabilityProblems } from "@/lib/course-data";
import { listCourses } from "@/lib/courses";
import { hubIndexable, listRegions } from "@/lib/hub";

export const revalidate = 300;

/** Courses that pass the publication gate and hubs with enough of them. Empty until the site URL is configured. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteUrl) return [];
  const courses = (await listCourses()).filter((c) => indexabilityProblems(c).length === 0);
  const regions = await listRegions();
  const hubs = [
    ...(hubIndexable(courses.length) ? ["/courses"] : []),
    ...regions.filter((r) => hubIndexable(r.courses.length)).map((r) => r.path),
  ];
  return [...hubs, ...courses.map((c) => coursePath(c.facts))].map((path) => ({ url: absoluteUrl(path) as string }));
}
