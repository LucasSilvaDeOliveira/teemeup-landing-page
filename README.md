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
| `lib/fixtures.ts` | Example data (Highland Creek) and where each field came from. Tee times are a snapshot of the CourseRev v2 page for 27, 28 and 29 Oct 2026, a placeholder for the real feed. |
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
- The two example courses (Highland Creek and The Tradition, about 2 miles apart) take their photo from the CourseRev CDN. `next.config.ts` allows that host. Licensing of club photos for Teemeup is not confirmed.
- Example data sources: coordinates come from the "Get Directions" link of the v2 booking page; The Tradition's facts come from the Chronogolf listing (reworded).

## Known gaps and decisions still open
- Coordinates, opening year, photos and FAQ for the example course were not found in public pages; they are `null` or empty on purpose.
- Store badges are plain text buttons. Apple and Google require their official badge artwork.
- `/courses` and `/courses/{country}/{region}` are `noindex` list pages (hub). Turn on indexing only when there are enough courses with real content.
- URL structure: `/courses/{country}/{region}/{slug}`. Same-name courses in one state need the city added to the slug (rule to confirm with Chris).
- Which domain hosts the pages (teemeup.ai or another) and the canonical rule for clubs that also have a CourseRev page.
- Hosting: the app team runs Next.js on GCP. Nothing here depends on Vercel-only features; `next build && next start` works anywhere Node runs.

## Checks (no tools needed)
- `curl -s <url> | grep -c 'class="time"'` returns the number of tee times in the server HTML.
- `curl -s <url> | grep -o '<meta name="robots"[^>]*>'` shows `noindex` until the gate passes.
- `curl -s <url>/index.md` returns the Markdown twin; `/llms.txt` lists only published courses.
- Validate the JSON-LD in Google's Rich Results Test once there is a public URL.
