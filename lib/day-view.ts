import type { CourseData, TeeTimeDay } from "./course-data";
import { chatLink, daySentence, formatTime, longDate, money, openSlots, parseDate, slotPrompt, summarizeDay } from "./derive";

/** What the tee time list shows for one day. Built on the server, for the page and for the date picker API. */
export type SlotView = { time: string; label: string; price: string; spots: number; href: string };
export type DayView = { date: string; tab: string; heading: string; sentence: string; asOf: string; slots: SlotView[] };

/** "2026-10-28" or an ISO timestamp -> "Oct 28, 2026". */
export function formatAsOf(asOf: string) {
  const d = parseDate(asOf.slice(0, 10));
  return `${d.month.slice(0, 3)} ${d.day}, ${d.year}`;
}

/** "ET", "PT"... for the course time zone (generic name, so it does not switch between EDT and EST). */
export function tzLabel(timeZone: string) {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortGeneric" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName");
    return part?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

/** Today's date at the course, "YYYY-MM-DD". */
export function todayAt(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Date plus n days, "YYYY-MM-DD", no time zone shifts. */
export function addDays(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function toDayView(c: CourseData, day: TeeTimeDay): DayView {
  const d = parseDate(day.date);
  const name = c.facts.name;
  return {
    date: day.date,
    tab: `${d.weekday.slice(0, 3)}, ${d.month.slice(0, 3)} ${d.day}`,
    heading: longDate(day.date),
    sentence: daySentence(name, summarizeDay(day)),
    asOf: formatAsOf(day.asOf),
    slots: openSlots(day)
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((slot) => ({
        time: slot.time,
        label: formatTime(slot.time),
        price: slot.priceUsd !== null ? money(slot.priceUsd) : "Price on request",
        spots: slot.spots,
        href: chatLink(c, { q: slotPrompt(name, day.date, slot), date: day.date, time: slot.time }),
      })),
  };
}
