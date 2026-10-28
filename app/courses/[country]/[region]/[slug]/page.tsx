import type { CSSProperties } from "react";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseCard } from "@/components/CourseCard";
import { Qr } from "@/components/Qr";
import { TeeTimeBrowser, type DayView } from "@/components/TeeTimeBrowser";
import { BRAND, absoluteUrl, coursePath, indexingAllowed, showGate } from "@/lib/config";
import { indexabilityProblems } from "@/lib/course-data";
import { contourPaths } from "@/lib/contours";
import { getCourse, getNearby, listCourses } from "@/lib/courses";
import { askBobPrompts, chatLink, daySentence, formatPhone, formatTime, longDate, metaDescription, milesBetween, parseDate, metaTitle, money, openSlots, slotPrompt, summarizeDay } from "@/lib/derive";
import { courseJsonLd, jsonLdString } from "@/lib/seo";
import { courseCard } from "@/lib/hub";
import { regionName, regionPath } from "@/lib/regions";
import { resolveAccent } from "@/lib/theme";

// Tee times change during the day: regenerate the HTML at most every 5 minutes.
export const revalidate = 300;

type Props = { params: Promise<{ country: string; region: string; slug: string }> };

export async function generateStaticParams() {
  return (await listCourses()).map((c) => ({ country: c.facts.country, region: c.facts.region, slug: c.facts.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, region, slug } = await params;
  const c = await getCourse(country, region, slug);
  if (!c) return { title: BRAND.name, robots: { index: false } };
  const path = coursePath({ country, region, slug });
  const canonical = absoluteUrl(path);
  const title = metaTitle(c);
  const description = metaDescription(c);
  const indexable = indexabilityProblems(c).length === 0;
  return {
    title,
    description,
    robots: { index: indexable && indexingAllowed, follow: true },
    alternates: {
      canonical: canonical ?? undefined,
      types: { "text/markdown": `${path}/index.md` },
    },
    openGraph: { type: "website", siteName: BRAND.name, title, description, url: canonical ?? undefined, images: c.facts.photos[0] ? [{ url: c.facts.photos[0].url, width: c.facts.photos[0].width, height: c.facts.photos[0].height, alt: c.facts.photos[0].alt }] : undefined },
    twitter: { card: c.facts.photos[0] ? "summary_large_image" : "summary", title, description, images: c.facts.photos[0] ? [c.facts.photos[0].url] : undefined },
  };
}

export default async function CoursePage({ params }: Props) {
  const { country, region, slug } = await params;
  const c = await getCourse(country, region, slug);
  if (!c) notFound();

  const f = c.facts;
  const theme = resolveAccent(f.themeColor);
  const problems = indexabilityProblems(c);
  const prompts = askBobPrompts(c);
  const days = c.ops.teeTimes.filter((d) => openSlots(d).length > 0);
  const p = c.ops.policies;
  const policyLines = [p.cancellation, p.dressCode, p.carts, p.walking, p.groupingNote].filter(Boolean) as string[];
  const rings = contourPaths(f.slug);
  const dayViews: DayView[] = days.map((day) => {
    const d = parseDate(day.date);
    return {
      date: day.date,
      tab: `${d.weekday.slice(0, 3)}, ${d.month.slice(0, 3)} ${d.day}`,
      heading: longDate(day.date),
      sentence: daySentence(f.name, summarizeDay(day)),
      asOf: day.asOf.replace("T", " ").replace(":00Z", " UTC"),
      slots: openSlots(day).sort((a, b) => a.time.localeCompare(b.time)).map((slot) => ({
        time: slot.time,
        label: formatTime(slot.time),
        price: slot.priceUsd !== null ? money(slot.priceUsd) : "Price on request",
        spots: slot.spots,
        href: chatLink(c, { q: slotPrompt(f.name, day.date, slot), date: day.date, time: slot.time }),
      })),
    };
  });
  const nearby = (await getNearby(c))
    .filter((n) => indexabilityProblems(n).length === 0)
    .map((n) => ({ n, miles: f.geo && n.facts.geo ? milesBetween(f.geo, n.facts.geo) : null }))
    .sort((a, b) => (a.miles ?? 1e9) - (b.miles ?? 1e9));
  const photo = f.photos[0] ?? null;
  const bobGeneral = chatLink(c, { q: `Find me a tee time at ${f.name}` });
  const yardRange = f.optional?.yardsMin && f.optional?.yardsMax ? { min: f.optional.yardsMin, max: f.optional.yardsMax } : null;

  return (
    <>
      {showGate && (
        <div className="gate">
          Publication gate: {problems.length === 0 ? "indexable" : `noindex (${problems.join("; ")})`}
          {!indexingAllowed && " · Site-wide noindex (no NEXT_PUBLIC_SITE_URL, or NEXT_PUBLIC_NOINDEX=1)"}
        </div>
      )}
      <div className="page" style={{ "--accent": theme.accent, "--accent-hover": theme.hover } as CSSProperties}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(courseJsonLd(c)) }} />
        <div className="contours" aria-hidden="true">
          <svg viewBox="-640 -520 1280 1040" preserveAspectRatio="xMidYMid slice">
            {rings.map((d, i) => (
              <path key={i} d={d} style={{ strokeOpacity: Math.max(0.1, 0.34 - i * 0.025) }} />
            ))}
          </svg>
        </div>

        <div className="wrap">
          <header className="top">
            <a className="wordmark" href="/">teemeup</a>
            <nav className="crumbs" aria-label="Breadcrumb">
              <ol>
                <li><a href="/courses">Courses</a></li>
                <li><a href={regionPath(f.country, f.region)}>{regionName(f.country, f.region)}</a></li>
                <li aria-current="page">{f.name}</li>
              </ol>
            </nav>
          </header>

          <main>
            <section className="hero rise">
              <p className="eyebrow">Tee times · {f.city}, {f.region.toUpperCase()}</p>
              <div className="hero-grid">
                <div>
                  <h1>Book {f.name} tee times with Bob</h1>
                  <p className="lead">{BRAND.tagline}</p>
                  <div className="cta-row">
                    <a className="btn primary" href={bobGeneral}>Ask Bob about {f.name}</a>
                    <a className="btn ghost" href="#times">See open tee times</a>
                  </div>
                  {prompts.length > 0 && (
                    <div className="prompts">
                      <p className="label">Try asking Bob</p>
                      {prompts.map((q) => (
                        <a key={q} className="prompt" href={chatLink(c, { q })}>“{q}”</a>
                      ))}
                    </div>
                  )}
                </div>
                <aside className="app" aria-label="Get the Teemeup app">
                  {c.teemeup.deepLinkUrl && (
                    <figure className="qrcard">
                      <Qr value={c.teemeup.deepLinkUrl} label={`QR code to open Teemeup at ${f.name}`} />
                      <figcaption>Scan to open on your phone</figcaption>
                    </figure>
                  )}
                  <div className="stores">
                    <a className="store" href={c.teemeup.appStoreUrl} rel="noopener" target="_blank">App Store</a>
                    <a className="store" href={c.teemeup.playStoreUrl} rel="noopener" target="_blank">Google Play</a>
                  </div>
                </aside>
              </div>
            </section>

            {dayViews.length > 0 && (
              <section className="block" id="times">
                <h2>Open tee times at {f.name}</h2>
                <TeeTimeBrowser name={f.name} days={dayViews} />
              </section>
            )}

            <section className="block">
              {photo && (
                <figure className="photo">
                  <Image src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} sizes="(min-width: 1152px) 1088px, calc(100vw - 40px)" />
                </figure>
              )}
              <div className="cols">
                <div>
                  <h2>About {f.name}</h2>
                  {f.description && <p className="sub">{f.description}</p>}
                  <dl className="facts">
                    <dt>Address</dt><dd>{f.address.street}, {f.city}, {f.region.toUpperCase()} {f.address.postalCode}</dd>
                    {f.phone && (<><dt>Phone</dt><dd><a href={`tel:${f.phone}`}>{formatPhone(f.phone)}</a></dd></>)}
                    <dt>Holes</dt><dd>{f.holes}{f.par ? ` · par ${f.par}` : ""}</dd>
                    {f.designer && (<><dt>Architect</dt><dd>{f.designer}</dd></>)}
                    {f.yearOpened && (<><dt>Opened</dt><dd>{f.yearOpened}</dd></>)}
                    {yardRange && (<><dt>Tees</dt><dd>{yardRange.min.toLocaleString("en-US")}–{yardRange.max.toLocaleString("en-US")} yards</dd></>)}
                    {f.website && (<><dt>Club website</dt><dd><a href={f.website} rel="noopener">{f.website.replace(/^https?:\/\//, "")}</a></dd></>)}
                  </dl>
                  <p className="asof"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${f.name} ${f.address.street} ${f.city} ${f.region}`)}`} rel="noopener">Get directions</a></p>
                </div>
                <div>
                  {f.amenities.length > 0 && (
                    <>
                      <h2>What is on site</h2>
                      <ul className="plain">{f.amenities.map((a) => <li key={a}>{a}</li>)}</ul>
                    </>
                  )}
                  {(policyLines.length > 0 || p.maxPlayers || p.bookingWindowDays) && (
                    <div style={{ marginTop: f.amenities.length ? 28 : 0 }}>
                      <h2>Booking policies</h2>
                      <ul className="plain">
                        {policyLines.map((l) => <li key={l}>{l}</li>)}
                        {p.maxPlayers && <li>Up to {p.maxPlayers} players per booking.</li>}
                        {p.bookingWindowDays && <li>Tee times open {p.bookingWindowDays} days ahead.</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {c.ops.faq.length > 0 && (
              <section className="block">
                <h2>Questions golfers ask</h2>
                {c.ops.faq.map((q) => (
                  <div key={q.q} style={{ marginBottom: 14 }}>
                    <p><b>{q.q}</b></p>
                    <p className="sub">{q.a}</p>
                  </div>
                ))}
              </section>
            )}

            {nearby.length > 0 && (
              <section className="block" id="nearby">
                <h2>Golf courses near {f.name}</h2>
                <ul className="nearby">
                  {nearby.map(({ n, miles }) => (
                    <li key={n.facts.slug}><CourseCard card={courseCard(n, miles)} /></li>
                  ))}
                </ul>
                <p className="asof"><a href={regionPath(f.country, f.region)}>See all golf courses in {regionName(f.country, f.region)}</a></p>
              </section>
            )}
          </main>

          <footer className="foot">
            <p className="disclaimer">Course details come from public sources and the booking system, and can change. Confirm with the club.</p>
            <p><a href="#">Terms</a> · <a href="#">Privacy</a> · <a href={`${coursePath({ country, region, slug })}/index.md`}>Markdown version</a></p>
          </footer>
        </div>
      </div>
    </>
  );
}
