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

export function hubChatLink(q: string) {
  return `${APP.chatBaseUrl}/?${new URLSearchParams({ q }).toString()}`;
}

/**
 * Questions for Bob on a hub. Not tied to one city: "near me" on the all-courses hub, the state name on a state hub.
 * Relative wording ("tomorrow", "this weekend"), same reasoning as on the course page.
 */
export function hubPrompts(area: string | null, courses: CourseData[]): string[] {
  const days = courses.flatMap((c) => c.ops.teeTimes.map(summarizeDay)).filter((s) => s.count > 0);
  const where = area ? `in ${area}` : "near me";
  const out = [`Find a tee time ${where} tomorrow`];
  if (days.some((s) => s.minPrice !== null)) out.push(`What is the cheapest tee time ${where} this weekend?`);
  if (days.some((s) => s.hasMorning && s.hasFour)) out.push(`Find a morning tee time for 4 players ${where}`);
  if (days.some((s) => s.hasTwilight)) out.push(area ? `Which ${area} courses have afternoon tee times today?` : "Which courses near me have afternoon tee times today?");
  return out;
}

/** Courses ordered by the first day with open times, then by how many times are open that day. */
export function byAvailability(courses: CourseData[]): CourseData[] {
  const key = (c: CourseData) => {
    const d = c.ops.teeTimes.find((x) => openSlots(x).length > 0);
    return d ? { date: d.date, n: openSlots(d).length } : { date: "9999", n: 0 };
  };
  return [...courses].sort((a, b) => key(a).date.localeCompare(key(b).date) || key(b).n - key(a).n || a.facts.name.localeCompare(b.facts.name));
}

export const slugify = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Text for the development banner (NEXT_PUBLIC_SHOW_GATE=1). */
export function hubGateText(publishedCount: number) {
  if (hubIndexable(publishedCount)) return "Hub gate: indexable";
  const why = [!indexingAllowed && "site-wide noindex", publishedCount < HUB_MIN_COURSES && `${publishedCount} published, minimum ${HUB_MIN_COURSES}`].filter(Boolean);
  return `Hub gate: noindex (${why.join("; ")})`;
}

export function hubIndexable(publishedCount: number) {
  return indexingAllowed && publishedCount >= HUB_MIN_COURSES;
}

/** States with published courses, largest first. */
export async function listRegions() {
  const courses = await publishedCourses();
  return groupBy(courses, (c) => `${c.facts.country}/${c.facts.region}`)
    .map((g) => {
      const { country, region } = g.courses[0].facts;
      const cities = groupBy(g.courses, (c) => c.facts.city).sort((a, b) => b.courses.length - a.courses.length || a.key.localeCompare(b.key));
      return { country, region, name: regionName(country, region), path: regionPath(country, region), courses: g.courses, cities };
    })
    .sort((a, b) => b.courses.length - a.courses.length || a.name.localeCompare(b.name));
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
