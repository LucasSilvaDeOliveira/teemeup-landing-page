import type { CourseData, TeeTimeDay, TeeTimeSlot } from "./course-data";

/** Everything the page says about availability is computed here from the data. No hand-written copy per club. */

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-10-22" -> { weekday: "Thursday", month: "October", day: 22 }. Parsed as a plain date, no time zone shifts. */
export function parseDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { weekday: WEEKDAYS[dow], month: MONTHS[m - 1], day: d, year: y };
}

export const longDate = (date: string) => {
  const p = parseDate(date);
  return `${p.weekday}, ${p.month} ${p.day}`;
};

/** "13:10" -> "1:10 PM" */
export function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export const money = (n: number) => `$${n.toFixed(2)}`;
export const moneyShort = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

export function formatPhone(e164: string) {
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

export const openSlots = (day: TeeTimeDay) => day.slots.filter((s) => s.spots > 0);

export type DaySummary = {
  date: string;
  count: number;
  minPrice: number | null;
  maxPrice: number | null;
  first: TeeTimeSlot | null;
  cheapest: TeeTimeSlot | null;
  hasFour: boolean;
  hasMorning: boolean;
  hasTwilight: boolean;
};

export function summarizeDay(day: TeeTimeDay): DaySummary {
  const open = openSlots(day).sort((a, b) => a.time.localeCompare(b.time));
  const priced = open.filter((s) => s.priceUsd !== null);
  const prices = priced.map((s) => s.priceUsd as number);
  const cheapest = priced.length ? priced.reduce((a, b) => ((b.priceUsd as number) < (a.priceUsd as number) ? b : a)) : null;
  return {
    date: day.date,
    count: open.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    first: open[0] ?? null,
    cheapest,
    hasFour: open.some((s) => s.spots >= 4),
    hasMorning: open.some((s) => s.time < "12:00"),
    hasTwilight: open.some((s) => s.time >= "15:00"),
  };
}

export function daySentence(name: string, s: DaySummary) {
  if (s.count === 0) return `No open tee times are listed at ${name} for ${longDate(s.date)}.`;
  const range =
    s.minPrice !== null && s.maxPrice !== null
      ? s.minPrice === s.maxPrice
        ? `, at ${moneyShort(s.minPrice)}`
        : `, from ${moneyShort(s.minPrice)} to ${moneyShort(s.maxPrice)}`
      : "";
  const first = s.first ? ` The first is at ${formatTime(s.first.time)}.` : "";
  return `On ${longDate(s.date)}, ${s.count} tee time${s.count === 1 ? " is" : "s are"} open at ${name}${range}.${first}`;
}

/** Links into the Teemeup web chat. The query parameter names are a proposal; the app team adapts them. */
export function chatLink(c: CourseData, params: { q: string; date?: string; time?: string }) {
  const u = new URLSearchParams({ course: c.facts.slug, q: params.q });
  if (params.date) u.set("date", params.date);
  if (params.time) u.set("time", params.time);
  return `${c.teemeup.chatBaseUrl}/?${u.toString()}`;
}

export function slotPrompt(name: string, date: string, slot: TeeTimeSlot) {
  return `Book a tee time at ${name} on ${longDate(date)} at ${formatTime(slot.time)}`;
}

/** Example questions for Bob. Only questions the data can actually support are produced. */
/**
 * Example questions shown as links to the chat. Worded relative to when the golfer clicks ("tomorrow", "this weekend"),
 * so a cached page never offers a date that has passed. Availability-based ones only appear when the window has
 * matching times; Bob answers with live data either way.
 * NOTE: the weather question assumes Bob can answer it (the CourseRev booking page already shows a forecast). Confirm with the app team.
 */
export function askBobPrompts(c: CourseData): string[] {
  const name = c.facts.name;
  const days = c.ops.teeTimes.map(summarizeDay).filter((s) => s.count > 0);
  const any = (k: "hasMorning" | "hasFour" | "hasTwilight") => days.some((s) => s[k]);
  const out: string[] = [`What tee times are open at ${name} tomorrow?`];
  if (any("hasMorning")) out.push(any("hasFour") ? `Find a morning tee time for 4 players at ${name}` : `Find a morning tee time at ${name}`);
  if (days.some((s) => s.minPrice !== null)) out.push(`What is the cheapest tee time at ${name} this week?`);
  if (any("hasTwilight")) out.push(`Is there an afternoon tee time at ${name} this weekend?`);
  if (c.facts.geo) out.push(`What will the weather be at ${name} tomorrow?`);
  if (c.ops.policies.cancellation) out.push(`What is the cancellation policy at ${name}?`);
  return out.slice(0, 6);
}

export function metaTitle(c: CourseData) {
  return `${c.facts.name} Tee Times – ${c.facts.city}, ${c.facts.region.toUpperCase()} | Teemeup`;
}

export function metaDescription(c: CourseData) {
  const f = c.facts;
  const day = c.ops.teeTimes.find((d) => openSlots(d).length > 0);
  const base = `Book tee times at ${f.name} in ${f.city}, ${f.region.toUpperCase()} with Bob, the AI that finds your tee time.`;
  if (!day) return base;
  const s = summarizeDay(day);
  const price = s.minPrice !== null ? ` Open times from ${moneyShort(s.minPrice)}.` : "";
  return `${base}${price}`.slice(0, 160);
}

/** Great-circle distance in miles. Used for the "nearby" cards, computed from the coordinates, never typed by hand. */
export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}
