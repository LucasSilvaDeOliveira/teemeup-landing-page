import type { ReactNode } from "react";
import { CourseCard } from "@/components/CourseCard";
import { Icon } from "@/components/Icon";
import { AskBob, Site, SiteFooter, SiteHeader, Stores } from "@/components/SiteChrome";
import type { CardData } from "@/lib/hub";
import { jsonLdString } from "@/lib/seo";

/** A group of course cards. `cityId` lets the location filter show one city at a time. */
export type HubGroup = { id: string; heading?: string; cityId?: string; cards: CardData[] };

type Props = {
  /** Breadcrumb trail; the last item is the current page and is not linked. */
  crumbs: { name: string; href: string }[];
  eyebrow: string;
  h1: string;
  lead: string;
  cta: { label: string; href: string };
  prompts: { q: string; href: string }[];
  /** The course list: one heading, the location filter, then the groups. */
  list: { heading: string; filter: ReactNode; groups: HubGroup[] };
  jsonLd: object;
  gate?: string | null;
};

/** Shared layout of the hub pages (all courses, one state). Same look as the course page; the only client JavaScript is the location filter. */
export function HubPage({ crumbs, eyebrow, h1, lead, cta, prompts, list, jsonLd, gate }: Props) {
  return (
    <Site gate={gate} className="no-photo">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <div className="page">
        <SiteHeader crumbs={crumbs} />
        <main>
          <div className="shell">
            <section className="hero hub-hero">
              <p className="eyebrow"><Icon name="map-pin" />{eyebrow}</p>
              <h1>{h1}</h1>
              <p className="sub">{lead}</p>
              <div className="cta">
                <a className="btn btn-primary" href={cta.href}><Icon name="chat-circle-dots" />{cta.label}</a>
                <a className="btn btn-ghost" href="#courses">See courses</a>
              </div>
              <Stores />
            </section>
            {prompts.length > 0 && <AskBob prompts={prompts} className="hub-ask" />}
            <section className="hub-list" id="courses" aria-labelledby="courses-h">
              <h2 id="courses-h" className="section-h">{list.heading}</h2>
              {list.filter}
              {list.groups.map((g) => (
                <div className="cardgroup" key={g.id} id={g.id} data-city-group={g.cityId}>
                  {g.heading && <h3>{g.heading}</h3>}
                  <div className="near-grid">
                    {g.cards.map((card) => <CourseCard key={card.href} card={card} heading={g.heading ? "h4" : "h3"} />)}
                  </div>
                </div>
              ))}
            </section>
          </div>
        </main>
        <SiteFooter note="Tee times and prices change. Bob checks live availability when you ask." links={[{ label: "Terms", href: "#" }, { label: "Privacy", href: "#" }]} />
      </div>
    </Site>
  );
}
