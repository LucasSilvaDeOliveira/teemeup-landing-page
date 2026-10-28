import { APP, HUB_MIN_COURSES, coursePath, indexingAllowed } from "./config";
import { indexabilityProblems, type CourseData } from "./course-data";
import { listCourses } from "./courses";
import { longDate, moneyShort, openSlots, summarizeDay } from "./derive";
import { regionName, regionPath } from "./regions";

/**
 * Hub (list) pages: everything is computed from the same course data as the course pages.
 * Only courses that pass the publication gate are listed, so a hub never links to a page we do not want indexed.
 */

export type CardData = {
  href: string;
  name: string;
  place: string;
  detail: string | null;
  availability: string | null;
  photo: CourseData["facts"]["photos"][number] | null;
};

export async function publishedCourses(): Promise<CourseData[]> {
  return (await listCourses()).filter((c) => indexabilityProblems(c).length === 0);
}

/** Card for one course: first day with open times, its count and lowest price. */
export function courseCard(c: CourseData, distanceMiles: number | null = null): CardData {
  const f = c.facts;
  const day = c.ops.teeTimes.find((d) => openSlots(d).length > 0);
  let availability: string | null = null;
  if (day) {
    const s = summarizeDay(day);
    availability = `${s.count} open tee time${s.count === 1 ? "" : "s"} on ${longDate(day.date)}${s.minPrice !== null ? `, from ${moneyShort(s.minPrice)}` : ""}`;
  }
  const detail = [`${f.holes} holes`, f.par ? `par ${f.par}` : null, f.designer ? `designed by ${f.designer}` : null].filter(Boolean).join(" · ");
  const dist = distanceMiles !== null ? ` · ${distanceMiles < 10 ? distanceMiles.toFixed(1) : Math.round(distanceMiles)} miles away` : "";
  return { href: coursePath(f), name: f.name, place: `${f.city}, ${f.region.toUpperCase()}${dist}`, detail: detail || null, availability, photo: f.photos[0] ?? null };
}

/** Groups keep the data order of first appearance; courses inside a group are sorted by name. */
export function groupBy<T extends CourseData>(courses: T[], key: (c: T) => string): { key: string; courses: T[] }[] {
  const m = new Map<string, T[]>();
  for (const c of courses) m.set(key(c), [...(m.get(key(c)) ?? []), c]);
  return [...m.entries()].map(([k, list]) => ({ key: k, courses: list.sort((a, b) => a.facts.name.localeCompare(b.facts.name)) }));
}

/** "Charlotte", "Charlotte and Concord", "Charlotte, Concord and 3 more cities". */
export function placeList(names: string[]) {
  const u = [...new Set(names)];
  if (u.length <= 1) return u[0] ?? "";
  if (u.length === 2) return `${u[0]} and ${u[1]}`;
  return `${u[0]}, ${u[1]} and ${u.length - 2} more ${u.length - 2 === 1 ? "city" : "cities"}`;
}

/** The city with the most published courses, for the example questions. */
export function topCity(courses: CourseData[]) {
  return groupBy(courses, (c) => c.facts.city).sort((a, b) => b.courses.length - a.courses.length || a.key.localeCompare(b.key))[0]?.key ?? "";
}

export function hubChatLink(q: string) {
  return `${APP.chatBaseUrl}/?${new URLSearchParams({ q }).toString()}`;
}

/** Questions for Bob about an area. Relative wording, same reasoning as on the course page. */
export function hubPrompts(area: string, courses: CourseData[]): string[] {
  const days = courses.flatMap((c) => c.ops.teeTimes.map(summarizeDay)).filter((s) => s.count > 0);
  const out = [`Find a tee time in ${area} tomorrow`];
  if (days.some((s) => s.minPrice !== null)) out.push(`What is the cheapest tee time in ${area} this week?`);
  if (days.some((s) => s.hasMorning && s.hasFour)) out.push(`Find a morning tee time for 4 players near ${area}`);
  if (days.some((s) => s.hasTwilight)) out.push(`Which courses near ${area} have afternoon tee times this weekend?`);
  return out;
}

export function hubIndexable(publishedCount: number) {
  return indexingAllowed && publishedCount >= HUB_MIN_COURSES;
}

export async function listRegions() {
  const courses = await publishedCourses();
  return groupBy(courses, (c) => `${c.facts.country}/${c.facts.region}`).map((g) => {
    const { country, region } = g.courses[0].facts;
    return { country, region, name: regionName(country, region), path: regionPath(country, region), courses: g.courses };
  });
}
