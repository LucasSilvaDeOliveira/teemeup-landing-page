import type { MetadataRoute } from "next";
import { absoluteUrl, coursePath, siteUrl } from "@/lib/config";
import { indexabilityProblems } from "@/lib/course-data";
import { listCourses } from "@/lib/courses";

export const revalidate = 300;

/** Only courses that pass the publication gate. Empty until the site URL is configured. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteUrl) return [];
  const courses = await listCourses();
  return courses
    .filter((c) => indexabilityProblems(c).length === 0)
    .map((c) => ({ url: absoluteUrl(coursePath(c.facts)) as string }));
}
