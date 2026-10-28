import { getCourse, getTeeTimes } from "@/lib/courses";
import { addDays, todayAt, toDayView } from "@/lib/day-view";

/**
 * Tee times for one course and one day, for the date picker on the course page.
 * GET /api/tee-times?country=us&region=nc&slug=highland-creek-golf-club&date=2026-11-02
 * Only dates inside the booking window are answered. Not for search engines (noindex, disallowed in robots.txt).
 */
const DEFAULT_WINDOW_DAYS = 14;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const date = q.get("date") ?? "";
  const headers = { "X-Robots-Tag": "noindex", "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ error: "bad date" }, { status: 400, headers });
  const c = await getCourse(q.get("country") ?? "", q.get("region") ?? "", q.get("slug") ?? "");
  if (!c) return Response.json({ error: "unknown course" }, { status: 404, headers });
  const first = todayAt(c.facts.timeZone);
  const last = addDays(first, (c.ops.policies.bookingWindowDays ?? DEFAULT_WINDOW_DAYS) - 1);
  if (date < first || date > last) return Response.json({ error: "outside the booking window", first, last }, { status: 422, headers });
  const day = await getTeeTimes(c, date);
  return Response.json({ day: day ? toDayView(c, day) : null }, { headers });
}
