import type { CSSProperties } from "react";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseCard } from "@/components/CourseCard";
import { Icon, type IconName } from "@/components/Icon";
import { AskBob, Site, SiteFooter, SiteHeader, Stores } from "@/components/SiteChrome";
import { TeeTimeBrowser } from "@/components/TeeTimeBrowser";
import { addDays, todayAt, toDayView, tzLabel, type DayView } from "@/lib/day-view";
import { BRAND, absoluteUrl, coursePath, indexingAllowed, showGate } from "@/lib/config";
import { indexabilityProblems } from "@/lib/course-data";
import { getCourse, getNearby, listCourses } from "@/lib/courses";
import { askBobPrompts, chatLink, formatPhone, metaDescription, milesBetween, metaTitle, openSlots } from "@/lib/derive";
import { courseJsonLd, jsonLdString } from "@/lib/seo";
import { courseCard } from "@/lib/hub";
import { regionName, regionPath } from "@/lib/regions";
import { resolveAccent } from "@/lib/theme";
import { POLICY_ICONS, amenityIcon } from "@/lib/icons";

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
  const prompts = askBobPrompts(c).map((q) => ({ q, href: chatLink(c, { q }) }));
  const days = c.ops.teeTimes.filter((d) => openSlots(d).length > 0);
  const p = c.ops.policies;
  const policyLines = (["cancellation", "dressCode", "carts", "walking", "groupingNote"] as const)
    .filter((k) => p[k])
    .map((k): { icon: IconName; text: string } => ({ icon: POLICY_ICONS[k], text: p[k] as string }));
  if (p.maxPlayers) policyLines.push({ icon: POLICY_ICONS.maxPlayers, text: `Up to ${p.maxPlayers} players per booking.` });
  if (p.bookingWindowDays) policyLines.push({ icon: POLICY_ICONS.bookingWindowDays, text: `Tee times open ${p.bookingWindowDays} days ahead.` });
  const dayViews: DayView[] = days.map((day) => toDayView(c, day));
  const firstDate = todayAt(f.timeZone);
  const picker = {
    api: `/api/tee-times?${new URLSearchParams({ country: f.country, region: f.region, slug: f.slug }).toString()}`,
    min: firstDate,
    max: addDays(firstDate, (p.bookingWindowDays ?? 14) - 1),
    askHref: chatLink(c, { q: `Find me a tee time at ${f.name} on __DATE__` }).replace(encodeURIComponent("__DATE__"), "__DATE__"),
  };
  const nearby = (await getNearby(c))
    .filter((n) => indexabilityProblems(n).length === 0)
    .map((n) => ({ n, miles: f.geo && n.facts.geo ? milesBetween(f.geo, n.facts.geo) : null }))
    .sort((a, b) => (a.miles ?? 1e9) - (b.miles ?? 1e9));
  const photo = f.photos[0] ?? null;
  const bobGeneral = chatLink(c, { q: `Find me a tee time at ${f.name}` });
  const yardRange = f.optional?.yardsMin && f.optional?.yardsMax ? { min: f.optional.yardsMin, max: f.optional.yardsMax } : null;
  const place = `${f.city}, ${f.region.toUpperCase()}`;
  const gate = showGate
    ? `Publication gate: ${problems.length === 0 ? "indexable" : `noindex (${problems.join("; ")})`}${indexingAllowed ? "" : " · Site-wide noindex (no NEXT_PUBLIC_SITE_URL, or NEXT_PUBLIC_NOINDEX=1)"}`
    : null;
  // The club's color, if any, replaces the Teemeup purple (globals.css mixes the tints from it).
  const style = f.themeColor ? ({ "--brand": theme.accent } as CSSProperties) : undefined;

  return (
    <Site gate={gate} className={photo ? "has-photo" : "no-photo"} style={style}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(courseJsonLd(c)) }} />
      {photo && (
        <div className="backdrop">
          <Image src={photo.url} alt={photo.alt} fill priority sizes="100vw" />
        </div>
      )}
      <div className="page">
        <SiteHeader
          crumbs={[
            { name: "Courses", href: "/courses" },
            { name: regionName(f.country, f.region), href: regionPath(f.country, f.region) },
            { name: f.name, href: coursePath(f) },
          ]}
        />

        <main>
          <div className="shell grid">
            <section className="hero">
              <h1>Book {f.name} tee times <em>with Bob</em></h1>
              <p className="where"><Icon name="map-pin" />Tee times · {place}</p>
              <p className="sub">{BRAND.tagline}</p>
              <div className="cta">
                <a className="btn btn-primary" href={bobGeneral}><Icon name="chat-circle-dots" />Ask Bob about {f.name}</a>
                {dayViews.length > 0 && <a className="btn btn-ghost" href="#times">See open tee times</a>}
              </div>
              <Stores />
            </section>

            {dayViews.length > 0 && (
              <aside className="rail" id="times" aria-labelledby="times-h">
                <TeeTimeBrowser name={f.name} days={dayViews} tz={tzLabel(f.timeZone)} picker={picker} />
              </aside>
            )}

            <div className="story">
              {prompts.length > 0 && <AskBob prompts={prompts} />}

              <section className="about" aria-labelledby="about-h">
                <h2 id="about-h">About {f.name}</h2>
                {f.description && <p className="lead">{f.description}</p>}
                <dl className="facts">
                  <div className="wide"><dt>Address</dt><dd>{f.address.street}, {place} {f.address.postalCode}</dd></div>
                  {f.phone && <div><dt>Phone</dt><dd><a className="num" href={`tel:${f.phone}`}>{formatPhone(f.phone)}</a></dd></div>}
                  <div><dt>Holes</dt><dd>{f.holes}{f.par ? ` · par ${f.par}` : ""}</dd></div>
                  {f.designer && <div><dt>Architect</dt><dd>{f.designer}</dd></div>}
                  {f.yearOpened && <div><dt>Opened</dt><dd>{f.yearOpened}</dd></div>}
                  {yardRange && <div><dt>Tees</dt><dd className="num">{yardRange.min.toLocaleString("en-US")}–{yardRange.max.toLocaleString("en-US")} yards</dd></div>}
                  {f.website && <div><dt>Club website</dt><dd><a href={f.website} rel="noopener">{f.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></dd></div>}
                </dl>
                <a className="btn btn-line" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${f.name} ${f.address.street} ${f.city} ${f.region}`)}`} rel="noopener">
                  <Icon name="navigation-arrow" />Get directions
                </a>
              </section>

              {(f.amenities.length > 0 || policyLines.length > 0) && (
                <div className="duo">
                  {f.amenities.length > 0 && (
                    <section aria-labelledby="site-h">
                      <h2 id="site-h">What is on site</h2>
                      <ul className="amen">
                        {f.amenities.map((a) => <li key={a}><span className="badge"><Icon name={amenityIcon(a)} /></span>{a}</li>)}
                      </ul>
                    </section>
                  )}
                  {policyLines.length > 0 && (
                    <section aria-labelledby="rules-h">
                      <h2 id="rules-h">Booking policies</h2>
                      <ul className="rules">
                        {policyLines.map((l) => <li key={l.text}><Icon name={l.icon} />{l.text}</li>)}
                      </ul>
                    </section>
                  )}
                </div>
              )}

              {c.ops.faq.length > 0 && (
                <section aria-labelledby="faq-h">
                  <h2 id="faq-h">Questions golfers ask</h2>
                  <div className="faq">
                    {c.ops.faq.map((q) => (
                      <div key={q.q}><h3>{q.q}</h3><p>{q.a}</p></div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          {nearby.length > 0 && (
            <section className="shell nearby" id="nearby" aria-labelledby="near-h">
              <h2 id="near-h" className="section-h">Golf courses near {f.name}</h2>
              <div className={`near-grid${nearby.length === 3 ? " feature" : ""}`}>
                {nearby.map(({ n, miles }) => <CourseCard key={n.facts.slug} card={courseCard(n, miles)} />)}
              </div>
              <a className="all" href={regionPath(f.country, f.region)}>See all golf courses in {regionName(f.country, f.region)}<Icon name="arrow-right" /></a>
            </section>
          )}
        </main>

        <SiteFooter
          note="Course details come from public sources and the booking system, and can change. Confirm with the club."
          links={[{ label: "Terms", href: "#" }, { label: "Privacy", href: "#" }, { label: "Markdown version", href: `${coursePath({ country, region, slug })}/index.md` }]}
        />
      </div>
    </Site>
  );
}
