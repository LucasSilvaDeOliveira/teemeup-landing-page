import type { CourseData } from "./course-data";
import type { TeeTimeDay } from "./course-data";
import { cottonwood, fixtureDay, highlandCreek, theDivide, tradition, waterford } from "./fixtures";

/**
 * DATA LAYER STUB. The dev team replaces these two functions with the real source.
 * Contract: return null for an unknown course; throw for transient failures (the page then shows the error boundary).
 * Keep them fast and cacheable: the page revalidates every few minutes (see `revalidate` in the page file).
 */
const FIXTURES: CourseData[] = [highlandCreek, tradition, theDivide, waterford, cottonwood];

export async function getCourse(country: string, region: string, slug: string): Promise<CourseData | null> {
  return FIXTURES.find((c) => c.facts.country === country && c.facts.region === region && c.facts.slug === slug) ?? null;
}

export async function listCourses(): Promise<CourseData[]> {
  return FIXTURES;
}

/** Resolve `teemeup.nearby` slugs to courses. Unknown slugs are skipped; the real source can filter to published ones. */
export async function getNearby(c: CourseData): Promise<CourseData[]> {
  const all = await listCourses();
  return c.teemeup.nearby.map((slug) => all.find((x) => x.facts.slug === slug)).filter((x): x is CourseData => Boolean(x));
}

/**
 * Tee times of one course on one day (local date at the course), for the date picker. Replace with the real feed.
 * Return a day with an empty `slots` list when nothing is bookable, and null when the day is not known.
 */
export async function getTeeTimes(c: CourseData, date: string): Promise<TeeTimeDay | null> {
  return fixtureDay(c.facts.slug, date);
}
