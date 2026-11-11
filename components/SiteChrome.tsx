import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { APP, BRAND } from "@/lib/config";

/** Logo and breadcrumbs. The last crumb is the current page and is not linked. Phones hide the first crumb. */
export function SiteHeader({ crumbs }: { crumbs: { name: string; href: string }[] }) {
  return (
    <header className="shell nav">
      <a className="logo" href="/" aria-label={`${BRAND.name} home`}>
        <img src="/brand/teemeupai_logo.svg" alt={BRAND.name} width={114} height={26} />
      </a>
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          {crumbs.map((c, i) => (
            <li key={c.href}>
              {i > 0 && <Icon name="caret-right" className="sep" />}
              {i < crumbs.length - 1 ? <a href={c.href}>{c.name}</a> : <span aria-current="page">{c.name}</span>}
            </li>
          ))}
        </ol>
      </nav>
    </header>
  );
}

/** App Store and Google Play badges (official artwork, copied from teemeup.ai). */
export function Stores({ lazy = false }: { lazy?: boolean }) {
  const loading = lazy ? "lazy" : undefined;
  return (
    <div className="stores">
      <a href={APP.appStoreUrl} rel="noopener">
        <img className="as" src="/brand/app-store-badge.svg" alt="Download on the App Store" width={120} height={40} loading={loading} />
      </a>
      <a href={APP.playStoreUrl} rel="noopener">
        <img className="gp" src="/brand/google-play-badge.png" alt="Get it on Google Play" width={152} height={59} loading={loading} />
      </a>
    </div>
  );
}

/**
 * "Try asking Bob": example questions as links into the chat with Bob, plus the store badges.
 * Phones show the first three questions (`data-desktop-only` hides the rest below 768px).
 */
export function AskBob({ prompts, className }: { prompts: { q: string; href: string }[]; className?: string }) {
  return (
    <section className={`ask on-dark${className ? ` ${className}` : ""}`} aria-labelledby="ask-h">
      <div className="ask-head">
        <div className="bob" aria-hidden="true">
          <span><img src="/brand/teemeupai_logo.svg" alt="" width={128} height={29} /></span>
        </div>
        <h2 id="ask-h">Try asking Bob</h2>
      </div>
      <div className="prompts">
        {prompts.map((p, i) => (
          <a key={p.q} className="prompt" data-desktop-only={i >= 3 ? "" : undefined} href={p.href}>
            {p.q}
            <Icon name="arrow-up-right" />
          </a>
        ))}
      </div>
      <Stores lazy />
    </section>
  );
}

export function SiteFooter({ note, links }: { note: string; links: { label: string; href: string }[] }) {
  return (
    <footer className="foot on-dark">
      <div className="shell">
        <a className="logo" href="/" aria-label={`${BRAND.name} home`}>
          <img src="/brand/teemeupai_logo.svg" alt={BRAND.name} width={106} height={24} loading="lazy" />
        </a>
        <p>{note}</p>
        <nav aria-label="Legal">
          {links.map((l) => <a key={l.label} href={l.href}>{l.label}</a>)}
        </nav>
      </div>
    </footer>
  );
}

/** Wrapper shared by every page: optional development gate on top, then the page. */
export function Site({ gate, className, style, children }: { gate?: string | null; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <>
      {gate && <div className="gate">{gate}</div>}
      <div className={`site${className ? ` ${className}` : ""}`} style={style}>{children}</div>
    </>
  );
}
