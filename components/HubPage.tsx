import { CourseCard } from "@/components/CourseCard";
import { APP, BRAND } from "@/lib/config";
import { contourPaths } from "@/lib/contours";
import type { CardData } from "@/lib/hub";
import { jsonLdString } from "@/lib/seo";

export type HubGroup = { id: string; heading: string; intro?: string; more?: { href: string; label: string }; cards: CardData[] };

/** Navigation block under the hero: state tiles on the all-courses hub, city chips on a state hub. */
export type HubBrowse = { heading: string; style: "tiles" | "chips"; items: { href: string; name: string; meta: string }[] };

type Props = {
  /** Breadcrumb trail; the last item is the current page and is not linked. */
  crumbs: { name: string; href: string }[];
  eyebrow: string;
  h1: string;
  lead: string;
  cta: { label: string; href: string };
  prompts: { q: string; href: string }[];
  browse?: HubBrowse;
  groups: HubGroup[];
  /** Links to sibling hubs (other states), so every hub links across the whole directory. */
  others?: { heading: string; links: { href: string; name: string }[] };
  jsonLd: object;
  seed: string;
  gate?: string | null;
};

/** Shared layout of the hub pages (all courses, one state). Same look as the course page, no client JavaScript. */
export function HubPage({ crumbs, eyebrow, h1, lead, cta, prompts, browse, groups, others, jsonLd, seed, gate }: Props) {
  const rings = contourPaths(seed);
  return (
    <>
      {gate && <div className="gate">{gate}</div>}
      <div className="page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
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
                {crumbs.map((c, i) => (i < crumbs.length - 1 ? <li key={c.href}><a href={c.href}>{c.name}</a></li> : <li key={c.href} aria-current="page">{c.name}</li>))}
              </ol>
            </nav>
          </header>
          <main>
            <section className="hero rise">
              <p className="eyebrow">{eyebrow}</p>
              <h1>{h1}</h1>
              <p className="lead">{lead}</p>
              <div className="cta-row">
                <a className="btn primary" href={cta.href}>{cta.label}</a>
                <a className="btn ghost" href={`#${browse ? "browse" : (groups[0]?.id ?? "courses")}`}>{browse?.style === "tiles" ? "Browse by state" : "See courses"}</a>
              </div>
              {prompts.length > 0 && (
                <div className="prompts hub-prompts">
                  <p className="label">Try asking Bob</p>
                  {prompts.map((p) => <a key={p.q} className="prompt" href={p.href}>“{p.q}”</a>)}
                </div>
              )}
            </section>
            {browse && (
              <section className="block" id="browse">
                <h2>{browse.heading}</h2>
                {browse.style === "tiles" ? (
                  <ul className="tiles">
                    {browse.items.map((x) => (
                      <li key={x.href}><a className="tile" href={x.href}><b>{x.name}</b><span>{x.meta}</span></a></li>
                    ))}
                  </ul>
                ) : (
                  <ul className="citychips">
                    {browse.items.map((x) => (
                      <li key={x.href}><a className="citychip" href={x.href}>{x.name} <span>{x.meta}</span></a></li>
                    ))}
                  </ul>
                )}
              </section>
            )}
            {groups.map((g) => (
              <section className="block" id={g.id} key={g.id}>
                <h2>{g.heading}</h2>
                {g.intro && <p className="sub">{g.intro}</p>}
                <ul className="nearby">
                  {g.cards.map((card) => <li key={card.href}><CourseCard card={card} /></li>)}
                </ul>
                {g.more && <p className="asof"><a href={g.more.href}>{g.more.label}</a></p>}
              </section>
            ))}
            {others && others.links.length > 0 && (
              <section className="block">
                <h2>{others.heading}</h2>
                <ul className="citychips">
                  {others.links.map((l) => <li key={l.href}><a className="citychip" href={l.href}>{l.name}</a></li>)}
                </ul>
              </section>
            )}
          </main>
          <footer className="foot">
            <p className="disclaimer">Tee times and prices change. Bob checks live availability when you ask.</p>
            <p>Get the {BRAND.name} app: <a href={APP.appStoreUrl} rel="noopener">App Store</a> · <a href={APP.playStoreUrl} rel="noopener">Google Play</a> · <a href="#">Terms</a> · <a href="#">Privacy</a></p>
          </footer>
        </div>
      </div>
    </>
  );
}
