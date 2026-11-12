# Teemeup course pages (SEO template)

Next.js (App Router) template for one public page per golf course on Teemeup, plus list pages (hubs) by state. The pages are built to rank for the course name and to send golfers to Bob (web chat and app). The data is example data; the dev team connects the real source.

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000/courses
npm run build && npm start
```

## Pages

| URL | What it shows |
|---|---|
| `/courses/{country}/{region}/{slug}` | Course page: hero with the course photo, tee sheet (day cards, price chart, filters, date picker), questions for Bob, course facts, what is on site, booking policies, nearby courses. |
| `/courses/{country}/{region}` | State hub: country / state / city filter and every published course in the state, grouped by city. |
| `/courses` | All-courses hub: the same filter and a selection of courses with open tee times. |
| `.../{slug}/index.md`, `/llms.txt` | Markdown version of each course page and a list of published courses, for AI tools. |
| `/api/tee-times` | Tee times of one day, used by the date picker. Not for search engines. |

## How it works

- Pages are rendered on the server. Course facts, tee times (as links into the chat with Bob), the questions for Bob and policies are in the HTML without JavaScript. JavaScript only adds interaction: the tee time filters, the date picker, the price chart highlight, the bar at the bottom on phones and the hub location filter.
- One object per course, `CourseData` (`lib/course-data.ts`), feeds the page, the JSON-LD, the Markdown version and `llms.txt`, so they always match.
- The page puts Teemeup first (H1 "Book {course} tee times with Bob"); the course is the subject.
- Publication rule: `indexabilityProblems()` in `lib/course-data.ts`. A course without the required data gets `noindex` and stays out of the sitemap, `llms.txt` and the hubs. A hub is indexed only when it lists at least 3 published courses (`HUB_MIN_COURSES`). These rules are ours, to be tuned after a pilot.
- Tee times: the first 3 days are in the HTML, every time included (times past the first 12 of a day are hidden with CSS until "Show all"). "More dates" opens a date picker for the rest of the club's booking window (`policies.bookingWindowDays`, default 14); those days are loaded from `/api/tee-times` and get no URL of their own. Prices are per player and times are local to the course (`facts.timeZone`).
- Questions for Bob are worded relative to the moment of the click ("tomorrow", "this weekend"), so a cached page never shows a past date. Phones show three, desktop up to six.
- App links: App Store and Google Play badges in the hero and in "Try asking Bob", and the Safari app banner on iPhone.
- The course photo is the hero background (loaded first, served by `next/image`), and is also used for `og:image` and the JSON-LD.
- Design: Javier Mula. Tokens and layout are in `app/globals.css`; icons are inline SVG from Phosphor (`components/Icon.tsx`), so no icon font is loaded. Shared header, footer, store badges and "Try asking Bob" are in `components/SiteChrome.tsx`.
- Club colors: `facts.themeColor` replaces the Teemeup purple on that course page (all example clubs use the purple; set a hex color on one to see it); tints and the "Try asking Bob" gradient are mixed from it.
- Layout: on desktop the tee sheet stays in a column on the right while the page scrolls; on phones it comes after the hero, and a bar at the bottom brings the golfer back to it.

## What the dev team connects

| Where | What |
|---|---|
| `lib/courses.ts` | Replace `getCourse()`, `listCourses()`, `getTeeTimes()` and `getNearby()` with the real source. `getCourse()` returns the first days with times; `getTeeTimes(course, date)` returns one day for the date picker. Return `null` when a course or day is unknown. Pages revalidate every 5 minutes. |
| `lib/derive.ts` `chatLink()` | Link into the chat with Bob (`course`, `q`, `date`, `time`). A proposal: adapt it to the real deep link, ideally opening Bob with the chosen tee time already selected. |
| `lib/fixtures.ts` | Placeholder for the chat URL (`chatBaseUrl`); same for `APP.chatBaseUrl` in `lib/config.ts`. Store links are the real ones. |
| `public/brand/` | Logo and store badges, copied from teemeup.ai. Replace them if the brand files change. |
| Footer | Terms and Privacy links are `#`. |
| `app/page.tsx` | Development redirect to `/courses`. |

## Settings (`.env`)

| Variable | Effect |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public address, no trailing slash. While empty, the whole site is `noindex`, there are no canonical URLs and the sitemap is empty. |
| `NEXT_PUBLIC_NOINDEX=1` | Keeps the site `noindex` even with an address (staging). |
| `NEXT_PUBLIC_SHOW_GATE=1` | Shows, at the top of each page, whether it is indexable and why not (development only). |

## Example data

Five CourseRev clubs in `lib/fixtures.ts`, each field with its source in `provenance`. Tee times in `lib/fixture-tee-times.ts` were read from the CourseRev v2 booking API on 3 Nov 2026 for 4-17 Nov. Photos are the clubs' banners on the CourseRev CDN (licence for Teemeup not confirmed). Fields that were not found are left empty on purpose.

## Open decisions

- Domain for these pages, and which page is canonical when a club also has a CourseRev page.
- URL rule for two courses with the same name in one state (add the city to the slug?).
- Minimum number of courses for a hub to be indexed (now 3).
- Tee times beyond the first 12 of a day are in the HTML but hidden until "Show all" is clicked; Google does not document how it weighs hidden content.

## Quick checks

- `curl -s <url> | grep -c 'class="slot '`: number of tee times in the HTML.
- `curl -s <url> | grep -o '<meta name="robots"[^>]*>'`: `noindex` until the page can be indexed.
- `curl -s <url>/index.md`: Markdown version.
- Google Rich Results Test on a public URL, once there is one.

Runs anywhere Node runs (`next build && next start`); nothing depends on Vercel.
