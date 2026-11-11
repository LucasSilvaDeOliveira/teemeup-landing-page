"use client";

import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Icon } from "@/components/Icon";
import type { DayView, SlotView } from "@/lib/day-view";

export type { DayView, SlotView };

type Period = "any" | "morning" | "midday" | "afternoon";
const PERIODS: { id: Period; label: string; test: (t: string) => boolean }[] = [
  { id: "any", label: "Any", test: () => true },
  { id: "morning", label: "Morning", test: (t) => t < "12:00" },
  { id: "midday", label: "Midday", test: (t) => t >= "12:00" && t < "15:00" },
  { id: "afternoon", label: "Afternoon", test: (t) => t >= "15:00" },
];
const PLAYERS = [0, 1, 2, 3, 4]; // 0 = any
/** Times in the first view: 12 fills whole rows of 2. */
const FIRST_VIEW = 12;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "2026-11-02" -> ["Mon", "Nov 2"], without time zone shifts. */
function shortDate(date: string): [string, string] {
  const [y, m, d] = date.split("-").map(Number);
  return [WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()], `${MONTHS[m - 1]} ${d}`];
}
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

type Picker = {
  /** API URL without the date, e.g. "/api/tee-times?country=us&region=nc&slug=x". */
  api: string;
  /** First and last day the golfer can pick (today at the course and the end of the booking window). */
  min: string;
  max: string;
  /** Chat link for a day with nothing to show; "__DATE__" is replaced by the readable date. */
  askHref: string;
};

type Picked = { date: string; status: "loading" | "ready" | "error"; view?: DayView | null };

/**
 * The tee sheet: day cards, a price-through-the-day chart, time-of-day and players filters, the times, and a date
 * picker for any other day in the booking window. Also renders the phone dock that appears once the sheet has
 * scrolled away.
 * The first days are in the server HTML (what search engines and AI crawlers read), every time included: times past
 * the first 12 are only hidden with CSS. The date picker loads other days from /api/tee-times on demand; those
 * results are only for the golfer and never get their own URL.
 */
export function TeeTimeBrowser({ name, days, tz, picker }: { name: string; days: DayView[]; tz: string; picker: Picker }) {
  const uid = useId();
  const dateRef = useRef<HTMLInputElement>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [period, setPeriod] = useState<Period>("any");
  const [players, setPlayers] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [hot, setHot] = useState<string | null>(null);
  const [dockOn, setDockOn] = useState(false);

  const active: DayView | null = picked ? (picked.view ?? null) : days[dayIdx];
  const activeDate = picked ? picked.date : days[dayIdx].date;
  const periodTest = PERIODS.find((p) => p.id === period)!.test;
  const matches = (s: SlotView) => periodTest(s.time) && s.spots >= players;
  const countFor = (p: Period) => (active ? active.slots.filter((s) => PERIODS.find((x) => x.id === p)!.test(s.time) && s.spots >= players).length : 0);
  const visible = active ? active.slots.filter(matches) : [];

  // Phone dock: shown while the tee sheet is out of view (CSS hides it on desktop).
  useEffect(() => {
    const el = document.getElementById("times");
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setDockOn(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const resetView = () => {
    setExpanded(false);
    setHot(null);
    setPeriod("any");
  };

  const pickDate = async (date: string) => {
    if (!date) return;
    resetView();
    const known = days.findIndex((d) => d.date === date);
    if (known >= 0) {
      setPicked(null);
      setDayIdx(known);
      return;
    }
    setPicked({ date, status: "loading" });
    try {
      const r = await fetch(`${picker.api}&date=${date}`);
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as { day: DayView | null };
      setPicked({ date, status: "ready", view: j.day });
    } catch {
      setPicked({ date, status: "error" });
    }
  };

  const openPicker = () => {
    const el = dateRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };

  const askHref = (date: string) => picker.askHref.replace("__DATE__", encodeURIComponent(shortDate(date).join(", ")));

  const slotCard = (s: SlotView, lowest: number | null, isActive: boolean) => {
    const [hm, ap] = s.label.split(" ");
    const hover = isActive ? { onPointerEnter: () => setHot(s.time), onPointerLeave: () => setHot(null), onFocus: () => setHot(s.time), onBlur: () => setHot(null) } : {};
    return (
      <a className={`slot num${isActive && hot === s.time ? " hot" : ""}`} href={s.href} aria-label={`${s.label}, ${s.price} per player, ${s.spots} open. Book with Bob`} {...hover}>
        <span className="slot-time">{hm}<small>{ap}</small></span>
        <span className="slot-price">{s.price}</span>
        <span className={`slot-open${s.spots === 1 ? " few" : ""}`}>
          <span className="dots" aria-hidden="true">{[1, 2, 3, 4].map((n) => <b key={n} className={n <= s.spots ? "on" : undefined} />)}</span>
          {s.spots} open
        </span>
        {lowest !== null && s.priceValue === lowest && <span className="slot-tag">Lowest</span>}
        <Icon name="arrow-up-right" className="slot-go" />
      </a>
    );
  };

  const list = (d: DayView, isActive: boolean) => {
    const shown = isActive ? visible : d.slots;
    const prices = d.slots.map((s) => s.priceValue).filter((p): p is number => p !== null);
    const lowest = prices.length > 1 && Math.min(...prices) !== Math.max(...prices) ? Math.min(...prices) : null;
    return (
      <>
        <div className="dayline"><h3 aria-live={isActive ? "polite" : undefined}>{d.heading}</h3></div>
        {isActive && d.slots.length > 0 && shown.length === 0 ? (
          <div className="empty">
            <Icon name="flag-pennant" />
            <p>No open times match those filters on {d.heading.split(",")[0]}.</p>
            <button type="button" className="btn btn-primary" onClick={() => { setPeriod("any"); setPlayers(0); }}>Show all {d.slots.length} times</button>
          </div>
        ) : (
          <ul className={`times${isActive && !expanded ? " collapsed" : ""}`}>
            {d.slots.map((s) => {
              const ok = !isActive || matches(s);
              const rank = isActive ? shown.indexOf(s) : -1;
              return (
                <li key={s.time} hidden={!ok} data-extra={isActive && ok && rank >= FIRST_VIEW ? "" : undefined}>
                  {slotCard(s, lowest, isActive)}
                </li>
              );
            })}
          </ul>
        )}
        {isActive && shown.length > FIRST_VIEW && (
          <button type="button" className="more" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show fewer times" : `Show all ${shown.length} times`}
            <Icon name="caret-down" />
          </button>
        )}
        <p className="daysum">{d.sentence}</p>
      </>
    );
  };

  const prices = active ? active.slots.map((s) => s.priceValue).filter((p): p is number => p !== null) : [];
  const dockText = active && active.slots.length ? `${active.slots.length} open${prices.length ? ` from $${Math.min(...prices).toFixed(2)}` : ""}` : "Ask Bob for times";
  const [pw, pd] = picked ? shortDate(picked.date) : ["", ""];

  return (
    <>
      <div className="sheet">
        <div className="sheet-head">
          <h2 id="times-h">Open tee times at {name}</h2>
          <p>Tap a time to book it with Bob. Prices are per player.</p>
          <div className="days" role="tablist" aria-label="Day" style={{ gridTemplateColumns: `repeat(${days.length + 1}, minmax(0, 1fr))` }}>
            {days.map((d, i) => {
              const [wd, md] = shortDate(d.date);
              return (
                <button key={d.date} type="button" role="tab" id={`${uid}-d${i}`} aria-selected={!picked && i === dayIdx} className="day" onClick={() => { setPicked(null); setDayIdx(i); resetView(); }}>
                  <span className="dow">{wd}</span>
                  <span className="md">{md}</span>
                  <span className="ct num">{d.slots.length} times</span>
                </button>
              );
            })}
            <button type="button" role="tab" aria-selected={Boolean(picked)} aria-label={picked ? `Chosen date ${pw}, ${pd}. Choose another date` : "More dates, open calendar"} className="day" onClick={openPicker}>
              {picked ? <span className="dow">{pw}</span> : <Icon name="calendar-dots" />}
              <span className="md">{picked ? pd : "More"}</span>
              <span className="ct num">{picked?.status === "ready" && picked.view ? `${picked.view.slots.length} times` : picked ? "Change" : "Dates"}</span>
            </button>
            <input ref={dateRef} className="dateinput" type="date" tabIndex={-1} aria-hidden="true" min={picker.min} max={picker.max} value={picked?.date ?? ""} onChange={(e) => pickDate(e.target.value)} />
          </div>
        </div>

        <div className="sheet-body">
          {active && active.slots.length > 1 && (
            <PriceRibbon key={activeDate} slots={active.slots} visible={visible} hot={hot} setHot={setHot} span={days} />
          )}
          {active && active.slots.length > 0 && (
            <div className="filters" role="group" aria-label="Filter tee times">
              <div className="frow">
                <span className="flabel" id={`${uid}-tod`}>Time of day</span>
                <div className="chips tod" role="group" aria-labelledby={`${uid}-tod`}>
                  {PERIODS.map((p) => {
                    const n = countFor(p.id);
                    return (
                      <button key={p.id} type="button" className="chip" aria-pressed={period === p.id} disabled={n === 0 && period !== p.id} onClick={() => { setPeriod(p.id); setExpanded(false); }}>
                        {p.label}<small className="num">{n}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="frow">
                <span className="flabel" id={`${uid}-pl`}>Players</span>
                <div className="chips" role="group" aria-labelledby={`${uid}-pl`}>
                  {PLAYERS.map((n) => (
                    <button key={n} type="button" className="chip round num" aria-pressed={players === n} aria-label={n === 0 ? "Any number of players" : `${n} player${n === 1 ? "" : "s"}`} onClick={() => { setPlayers(n); setExpanded(false); }}>
                      {n === 0 ? "Any" : n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {days.map((d, i) => (
            <div key={d.date} hidden={Boolean(picked) || i !== dayIdx} role="tabpanel" aria-labelledby={`${uid}-d${i}`}>
              {list(d, !picked && i === dayIdx)}
            </div>
          ))}

          {picked && (
            <div role="tabpanel" aria-live="polite">
              {picked.status === "loading" && <p className="daysum">Loading tee times for {pw}, {pd}…</p>}
              {picked.status === "error" && (
                <div className="empty">
                  <Icon name="calendar-dots" />
                  <p>Tee times for {pw}, {pd} could not be loaded. Bob can check that date for you.</p>
                  <a className="btn btn-primary" href={askHref(picked.date)}>Ask Bob about {pd}</a>
                </div>
              )}
              {picked.status === "ready" && picked.view && picked.view.slots.length > 0 && list(picked.view, true)}
              {picked.status === "ready" && (!picked.view || picked.view.slots.length === 0) && (
                <div className="empty">
                  <Icon name="calendar-dots" />
                  <p>No open tee times are listed at {name} for {pw}, {pd}. Bob can check again or find another course nearby.</p>
                  <a className="btn btn-primary" href={askHref(picked.date)}>Ask Bob about {pd}</a>
                </div>
              )}
            </div>
          )}

          <p className="fine">Times are local to the course ({tz}). Updated {(active ?? days[0]).asOf}; availability changes.</p>
        </div>
      </div>

      <div className={`dock on-dark${dockOn ? " show" : ""}`} aria-hidden={!dockOn}>
        <div>
          <strong>{shortDate(activeDate).join(", ")}</strong>
          <span className="num">{dockText}</span>
        </div>
        <a className="btn btn-primary" href="#times" tabIndex={dockOn ? undefined : -1}>See open tee times</a>
      </div>
    </>
  );
}

/**
 * Step line of the price per player through the day, one dot per tee time. Hovering it highlights the nearest time in
 * the list (and the other way round); a click books that time. The x axis spans the earliest to the latest time of the
 * days on the page, so days line up when switching.
 */
function PriceRibbon({ slots, visible, hot, setHot, span }: { slots: SlotView[]; visible: SlotView[]; hot: string | null; setHot: (t: string | null) => void; span: DayView[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const priced = slots.filter((s) => s.priceValue !== null);
  if (priced.length < 2) return null;

  const W = 360, H = 92, L = 3, R = 3, T = 12, B = 20;
  const all = [...span.flatMap((d) => d.slots), ...slots].map((s) => minutes(s.time));
  const x0 = Math.min(...all), x1 = Math.max(...all);
  const lo = Math.min(...priced.map((s) => s.priceValue!)), hi = Math.max(...priced.map((s) => s.priceValue!));
  const y0 = lo, y1 = hi > lo ? hi : lo + 1;
  const rx = (m: number) => L + ((m - x0) / Math.max(1, x1 - x0)) * (W - L - R);
  const ry = (p: number) => T + (1 - (p - y0) / (y1 - y0)) * (H - T - B - 8);
  const base = H - B + 4;

  let d = `M${rx(minutes(priced[0].time)).toFixed(1)} ${ry(priced[0].priceValue!).toFixed(1)}`;
  for (const s of priced.slice(1)) d += `H${rx(minutes(s.time)).toFixed(1)}V${ry(s.priceValue!).toFixed(1)}`;

  const ticks: number[] = [];
  for (let h = Math.ceil(x0 / 120) * 2; h * 60 <= x1; h += 2) if (rx(h * 60) > L + 10 && rx(h * 60) < W - R - 10) ticks.push(h);
  const tickLabel = (h: number) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;

  const vis = new Set(visible.map((s) => s.time));
  const hotSlot = hot ? priced.find((s) => s.time === hot) ?? null : null;
  const money = (n: number) => `$${n.toFixed(2)}`;
  const read = hotSlot ? `${hotSlot.label}  ${hotSlot.price}  ${hotSlot.spots} open` : lo === hi ? money(lo) : `${money(lo)} to ${money(hi)}`;

  const nearest = (e: ReactMouseEvent<SVGSVGElement>) => {
    const r = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const pool = priced.filter((s) => vis.has(s.time));
    if (!pool.length) return null;
    return pool.reduce((a, b) => (Math.abs(rx(minutes(b.time)) - x) < Math.abs(rx(minutes(a.time)) - x) ? b : a));
  };

  return (
    <div className="ribbon">
      <div className="ribbon-top"><span>Price through the day</span><span className="ribbon-read num">{read}</span></div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        onPointerMove={(e) => setHot(nearest(e)?.time ?? null)}
        onPointerLeave={() => setHot(null)}
        onClick={(e) => { const s = nearest(e); if (s) window.location.href = s.href; }}
      >
        <line className="rb-base" x1={0} x2={W} y1={base} y2={base} />
        <path className="rb-area" d={`${d}V${base}H${rx(minutes(priced[0].time)).toFixed(1)}Z`} />
        <path className="rb-line" pathLength={1} d={d} />
        {priced.map((s) => (
          <circle key={s.time} className={`rb-dot${vis.has(s.time) ? "" : " off"}${s.priceValue === lo && lo !== hi ? " low" : ""}`} cx={rx(minutes(s.time)).toFixed(1)} cy={ry(s.priceValue!).toFixed(1)} r={2.1} />
        ))}
        {ticks.map((h) => <text key={h} className="rb-tick" x={rx(h * 60)} y={H - 3} textAnchor="middle">{tickLabel(h)}</text>)}
        {hotSlot && (
          <g className="rb-cur">
            <line x1={rx(minutes(hotSlot.time))} x2={rx(minutes(hotSlot.time))} y1={T - 6} y2={base} />
            <circle cx={rx(minutes(hotSlot.time))} cy={ry(hotSlot.priceValue!)} r={4.5} />
          </g>
        )}
      </svg>
    </div>
  );
}
