# teemeup course SEO template

Next.js (App Router) template for a public, server-rendered page per golf course on Teemeup. It is meant to rank for the course name and to send people to the Teemeup web chat and app. Draft v0, 23 Oct 2026. Built to be handed to the dev team (Nivas, VJ) as the base for the dynamic version.

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000  ->  /courses/us/nc/highland-creek-golf-club
npm run build && npm start
```

## What the page does
- Server-rendered HTML: course facts, the open tee times (as real `<a href>` links into the web chat) and policies are in the initial HTML, no client JavaScript needed to read them.
- Everything on the page is computed from one object, `CourseData` (`lib/course-data.ts`): the page, the JSON-LD, the Markdown twin (`.../index.md`) and `llms.txt`. They cannot disagree.
- Teemeup comes first on this page (H1 "Book {course} tee times with Bob"); the course is the subject. The CourseRev pages work the other way around.
- Publication gate: `indexabilityProblems()` in `lib/course-data.ts`. A course missing required data renders with `noindex` and stays out of the sitemap and `llms.txt`. Set `NEXT_PUBLIC_SHOW_GATE=1` to see the reason at the top of the page. The thresholds are ours, not Google's; tune them after the pilot.
- Client JavaScript is limited to the tee time filter and date picker (see below) and the hub location filter. Light and dark follow the system setting.

## What the dev team wires
| Where | What |
|---|---|
| `lib/courses.ts` | Replace `getCourse()`, `listCourses()` and `getTeeTimes()` with the real source. `getCourse()` returns the first few days with times (rendered in the HTML); `getTeeTimes(course, date)` returns any other day for the date picker. Return `null` for unknown courses or days, throw on transient failures. The page revalidates every 5 minutes (`revalidate = 300`). |
| `lib/fixtures.ts`, `lib/fixture-tee-times.ts` | Example data for five CourseRev clubs and where each field came from. Tee times: CourseRev v2 booking API read on 28 Oct 2026 for 29 Oct to 11 Nov (the first 3 days go in the HTML), a placeholder for the real feed. |
| `lib/derive.ts` `chatLink()` | The query parameters sent to the web chat (`course`, `q`, `date`, `time`) are a proposal. Adapt them to the real deep link. |
| `.env` | `NEXT_PUBLIC_SITE_URL` (public origin, no trailing slash). While empty: no canonical, empty sitemap, no absolute URLs in JSON-LD, and the whole site is `noindex`. Never guess a domain. `NEXT_PUBLIC_NOINDEX=1` keeps the site `noindex` even with a domain (staging). |
| `teemeup.deepLinkUrl`, `chatBaseUrl` | Placeholders in the fixture. Store links are the ones on teemeup.ai; `APP.appStoreId` drives the Safari smart app banner. |
| Footer links | Terms and Privacy are `#`. |
| `app/page.tsx` | Development redirect to `/courses`. Replace before production. |

## Tee times: filter and date picker

`components/TeeTimeBrowser.tsx` (client component):
- A line above the list says what a tap does and that prices are per player; the note under the list gives the course time zone ("Times are local to the course (ET)", from `facts.timeZone`) and the update date.
- Day cards (weekday, date, number of open times) for the days in the HTML, in a row that scrolls sideways on narrow screens, plus a "More dates" card: a native date picker limited to today (at the course) through the end of the booking window (`policies.bookingWindowDays`, default 14). A day in the HTML just switches tab; any other day is loaded from `GET /api/tee-times?country=&region=&slug=&date=` (`app/api/tee-times/route.ts`, built with the same `toDayView()` as the page). Results of the picker never get their own URL; `/api/` is `noindex` and disallowed in `robots.txt`. Loading, error and "no times that day" states link to Bob.
- Time of day (any / morning / midday / afternoon, with counts) and players as segmented controls. Times sit in an even grid (3 columns on phones, 6 on desktop); the first view shows 12 times, which fills whole rows at 2, 3, 4 and 6 columns, and a "Show all N times" button. The days in the HTML are complete there; JavaScript only narrows what is visible (extra times are hidden with CSS, `display: none`, until expanded). Whether Google gives full weight to times behind "show all" is not documented; if it matters, show all times for the first day and keep the filter only for the other days.

## Photo and nearby courses

- The course photo (`facts.photos[0]`) sits in the About block, below the fold, rendered with `next/image` (AVIF/WebP, responsive `srcset`, width and height set so the layout does not jump, lazy-loaded). The hero stays text-only so the largest element above the fold is text. If a photo is ever moved into the hero, give it `priority` (fetchpriority high) and never lazy-load it.
- The same photo is used for `og:image` and the JSON-LD `image`.
- `teemeup.nearby` lists slugs. The page shows only nearby courses that pass the publication gate, with the straight-line distance computed from the coordinates. `lib/courses.ts` `getNearby()` is the stub to replace (a real source would query by distance).
- The example courses take their photo from the CourseRev CDN (the v2 banner). `next.config.ts` allows that host. Licensing of club photos for Teemeup is not confirmed.
- Example data sources: coordinates come from the "Get Directions" link of the v2 booking page; The Tradition's facts come from the Chronogolf listing (reworded).

## Ask Bob prompts
- "Try asking Bob" (`askBobPrompts()` in `lib/derive.ts`): up to six questions on desktop and the first three on phones (availability tomorrow, cheapest this week, morning for 4), so the tee times come up sooner; worded relative to when the golfer clicks ("tomorrow", "this weekend"), so a cached page never offers a past date. Availability questions appear only when the window has matching times; the weather question needs coordinates; the cancellation question needs a cancellation policy. Confirm with the app team that Bob answers weather questions.

## App links
- Desktop: QR code (deep link) and store buttons in the right column. Phones: store buttons under the main buttons (the QR column is hidden), and Safari on iOS shows its own app banner from `itunes.appId` in `app/layout.tsx`. Store badges are text buttons; Apple and Google require their official artwork.

## Hub pages
- `/courses` (all states) and `/courses/{country}/{region}` (one state) are the directory the breadcrumb links to. One template (`components/HubPage.tsx`), same look as the course page. The copy is the same on every hub except the state name; there are no hand-written counts or city names.
- Location filter (`components/LocationFilter.tsx`): country, state and city selects. Options and counts are computed from the published courses. Country and state are pages: choosing one opens its hub. City filters the state hub in place (other city groups are hidden; the choice is kept in the URL hash, so no new URLs exist). This is the only client JavaScript on a hub. Crawlers reach the state hubs through the breadcrumb of every course page and the sitemap, so there is no separate list of state links.
- `/courses`: questions for Bob worded "near me", the filter, up to 9 course cards ordered by the first day with open times.
- `/courses/{country}/{region}`: questions for Bob about the state, the filter, and every course grouped by city.
- Course card (`components/CourseCard.tsx`, also used for "Golf courses near ..."): photo, name, and city and state (plus the distance on the course page). Nothing else, so the card stays the same for every course.
- Only courses that pass the publication gate are listed. A hub is `noindex, follow` until it lists at least `HUB_MIN_COURSES` published courses (our rule, 3 for now); then it gets a canonical and enters the sitemap. A state with no published course returns 404.
- JSON-LD: `BreadcrumbList` and an `ItemList` of the course pages. State names come from `lib/regions.ts` (US only for now).

## Known gaps and decisions still open
- Example data: five CourseRev clubs (`lib/fixtures.ts`), with tee times for 29-31 Oct 2026 read from the CourseRev v2 booking API on 28 Oct (`lib/fixture-tee-times.ts`). Facts not found are `null` or empty on purpose.
- Hub indexing threshold (`HUB_MIN_COURSES`, now 3) and the placeholder brand links in `APP` (`lib/config.ts`) are to be confirmed.
- URL structure: `/courses/{country}/{region}/{slug}`. Same-name courses in one state need the city added to the slug (rule to confirm with Chris).
- Which domain hosts the pages (teemeup.ai or another) and the canonical rule for clubs that also have a CourseRev page.
- Hosting: the app team runs Next.js on GCP. Nothing here depends on Vercel-only features; `next build && next start` works anywhere Node runs.

## Checks (no tools needed)
- `curl -s <url> | grep -c 'class="time"'` returns the number of tee times in the server HTML.
- `curl -s <url> | grep -o '<meta name="robots"[^>]*>'` shows `noindex` until the gate passes.
- `curl -s <url>/index.md` returns the Markdown twin; `/llms.txt` lists only published courses.
- Validate the JSON-LD in Google's Rich Results Test once there is a public URL.
