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
- Client JavaScript is limited to the tee time filter (see below). Light and dark follow the system setting.

## What the dev team wires
| Where | What |
|---|---|
| `lib/courses.ts` | Replace `getCourse()` and `listCourses()` with the real source. Return `null` for unknown courses, throw on transient failures. The page revalidates every 5 minutes (`revalidate = 300`). |
| `lib/fixtures.ts`, `lib/fixture-tee-times.ts` | Example data for five CourseRev clubs and where each field came from. Tee times: CourseRev v2 booking API read on 28 Oct 2026 for 29-31 Oct, a placeholder for the real feed. |
| `lib/derive.ts` `chatLink()` | The query parameters sent to the web chat (`course`, `q`, `date`, `time`) are a proposal. Adapt them to the real deep link. |
| `.env` | `NEXT_PUBLIC_SITE_URL` (public origin, no trailing slash). While empty: no canonical, empty sitemap, no absolute URLs in JSON-LD, and the whole site is `noindex`. Never guess a domain. `NEXT_PUBLIC_NOINDEX=1` keeps the site `noindex` even with a domain (staging). |
| `teemeup.deepLinkUrl`, store URLs, `chatBaseUrl` | Placeholders in the fixture. |
| Footer links | Terms and Privacy are `#`. |
| `app/page.tsx` | Development redirect to `/courses`. Replace before production. |

## Tee time filter

`components/TeeTimeBrowser.tsx` (client component): day tabs, time of day (morning / midday / afternoon) and players. The first view shows 8 times and a "Show all N times" button. All days and all times are in the server HTML; JavaScript only narrows what is visible (extra times are hidden with CSS, `display: none`, until expanded). Whether Google gives full weight to times behind "show all" is not documented; if it matters, show all times for the first day and keep the filter only for the other days.

## Photo and nearby courses

- The course photo (`facts.photos[0]`) sits in the About block, below the fold, rendered with `next/image` (AVIF/WebP, responsive `srcset`, width and height set so the layout does not jump, lazy-loaded). The hero stays text-only so the largest element above the fold is text. If a photo is ever moved into the hero, give it `priority` (fetchpriority high) and never lazy-load it.
- The same photo is used for `og:image` and the JSON-LD `image`.
- `teemeup.nearby` lists slugs. The page shows only nearby courses that pass the publication gate, with the distance computed from the coordinates and the open tee times of the first day with times. `lib/courses.ts` `getNearby()` is the stub to replace (a real source would query by distance).
- The example courses take their photo from the CourseRev CDN (the v2 banner). `next.config.ts` allows that host. Licensing of club photos for Teemeup is not confirmed.
- Example data sources: coordinates come from the "Get Directions" link of the v2 booking page; The Tradition's facts come from the Chronogolf listing (reworded).

## Ask Bob prompts
- "Try asking Bob" (`askBobPrompts()` in `lib/derive.ts`): up to six questions, worded relative to when the golfer clicks ("tomorrow", "this weekend"), so a cached page never offers a past date. Availability questions appear only when the window has matching times; the weather question needs coordinates; the cancellation question needs a cancellation policy. Confirm with the app team that Bob answers weather questions.

## Hub pages
- `/courses` (all states) and `/courses/{country}/{region}` (one state) are the directory the breadcrumb links to. One template (`components/HubPage.tsx`), same look as the course page. The copy is the same on every hub except the state name; there are no hand-written counts or city names.
- Location filter (`components/LocationFilter.tsx`): country, state and city selects. Options and counts are computed from the published courses. Country and state are pages: choosing one opens its hub. City filters the state hub in place (other city groups are hidden; the choice is kept in the URL hash, so no new URLs exist). This is the only client JavaScript on a hub.
- `/courses`: questions for Bob worded "near me", the filter, up to 9 course cards ordered by the first day with open times, and plain links to every state (for crawlers and people without JavaScript).
- `/courses/{country}/{region}`: questions for Bob about the state, the filter, every course grouped by city, and plain links to the other states.
- Course card (`components/CourseCard.tsx`, also used for "Golf courses near ..."): photo, name, and city and state (plus the distance on the course page). Nothing else, so the card stays the same for every course.
- Only courses that pass the publication gate are listed. A hub is `noindex, follow` until it lists at least `HUB_MIN_COURSES` published courses (our rule, 3 for now); then it gets a canonical and enters the sitemap. A state with no published course returns 404.
- JSON-LD: `BreadcrumbList` and an `ItemList` of the course pages. State names come from `lib/regions.ts` (US only for now).

## Known gaps and decisions still open
- Example data: five CourseRev clubs (`lib/fixtures.ts`), with tee times for 29-31 Oct 2026 read from the CourseRev v2 booking API on 28 Oct (`lib/fixture-tee-times.ts`). Facts not found are `null` or empty on purpose.
- Store badges are plain text buttons. Apple and Google require their official badge artwork.
- Hub indexing threshold (`HUB_MIN_COURSES`, now 3) and the placeholder brand links in `APP` (`lib/config.ts`) are to be confirmed.
- URL structure: `/courses/{country}/{region}/{slug}`. Same-name courses in one state need the city added to the slug (rule to confirm with Chris).
- Which domain hosts the pages (teemeup.ai or another) and the canonical rule for clubs that also have a CourseRev page.
- Hosting: the app team runs Next.js on GCP. Nothing here depends on Vercel-only features; `next build && next start` works anywhere Node runs.

## Checks (no tools needed)
- `curl -s <url> | grep -c 'class="time"'` returns the number of tee times in the server HTML.
- `curl -s <url> | grep -o '<meta name="robots"[^>]*>'` shows `noindex` until the gate passes.
- `curl -s <url>/index.md` returns the Markdown twin; `/llms.txt` lists only published courses.
- Validate the JSON-LD in Google's Rich Results Test once there is a public URL.
