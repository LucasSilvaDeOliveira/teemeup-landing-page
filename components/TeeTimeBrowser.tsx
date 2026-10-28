"use client";

import { useId, useRef, useState } from "react";
import type { DayView, SlotView } from "@/lib/day-view";

export type { DayView, SlotView };

type Period = "any" | "morning" | "midday" | "afternoon";
const PERIODS: { id: Period; label: string; test: (t: string) => boolean }[] = [
  { id: "any", label: "Any time", test: () => true },
  { id: "morning", label: "Morning", test: (t) => t < "12:00" },
  { id: "midday", label: "Midday", test: (t) => t >= "12:00" && t < "15:00" },
  { id: "afternoon", label: "Afternoon", test: (t) => t >= "15:00" },
];
const PLAYERS = [0, 1, 2, 3, 4]; // 0 = any
/** Times in the first view: 12 fills whole rows at 2, 3, 4 and 6 columns. */
const FIRST_VIEW = 12;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "2026-11-02" -> "Mon, Nov 2", without time zone shifts. */
function shortDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return `${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${MONTHS[m - 1]} ${d}`;
}

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
 * Tee time list with day, time-of-day and players filters, and a date picker for any day in the booking window.
 * The first days are in the server HTML (what search engines and AI crawlers read). The date picker loads other days
 * from /api/tee-times on demand; those results are only for the golfer and never get their own URL.
 */
export function TeeTimeBrowser({ name, days, tz, picker }: { name: string; days: DayView[]; tz: string; picker: Picker }) {
  const uid = useId();
  const dateRef = useRef<HTMLInputElement>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [period, setPeriod] = useState<Period>("any");
  const [players, setPlayers] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const active: DayView | null = picked ? (picked.view ?? null) : days[dayIdx];
  const periodTest = PERIODS.find((p) => p.id === period)!.test;
  const matches = (s: SlotView) => periodTest(s.time) && s.spots >= players;
  const countFor = (p: Period) => (active ? active.slots.filter((s) => PERIODS.find((x) => x.id === p)!.test(s.time) && s.spots >= players).length : 0);

  const pickDate = async (date: string) => {
    if (!date) return;
    setExpanded(false);
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

  const list = (d: DayView, isActive: boolean) => {
    const visible = d.slots.filter(matches);
    return (
      <>
        <h3 className="tt-day">{d.heading}</h3>
        <p className="sub">{d.sentence}</p>
        {isActive && d.slots.length > 0 && visible.length === 0 && <p className="empty">No tee times match these filters. Try another time of day or fewer players.</p>}
        <ul className={`times${isActive && !expanded ? " collapsed" : ""}`}>
          {d.slots.map((s) => {
            const ok = !isActive || matches(s);
            const rank = isActive ? visible.indexOf(s) : -1;
            return (
              <li key={s.time} hidden={!ok} data-extra={isActive && ok && rank >= FIRST_VIEW ? "" : undefined}>
                <a className="time" href={s.href} aria-label={`${s.label}, ${s.price} per player, ${s.spots} open. Book with Bob`}>
                  <b>{s.label}</b>
                  <span className="price">{s.price}</span>
                  <span className="spots">{s.spots} open</span>
                </a>
              </li>
            );
          })}
        </ul>
        {isActive && visible.length > FIRST_VIEW && (
          <button type="button" className="more" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show fewer times" : `Show all ${visible.length} times`}
          </button>
        )}
        <p className="asof">Times are local to the course ({tz}). Updated {d.asOf}; availability changes.</p>
      </>
    );
  };

  const askHref = (date: string) => picker.askHref.replace("__DATE__", encodeURIComponent(shortDate(date)));

  return (
    <div className="tt">
      <p className="tt-hint">Tap a time to book it with Bob. Prices are per player.</p>
      <div className="tt-filters" role="group" aria-label="Filter tee times">
        <p className="flabel" aria-hidden="true">Day</p>
        <div className="daystrip" role="tablist" aria-label="Day">
          {days.map((d, i) => {
            const [wd, md] = d.tab.split(", ");
            return (
              <button key={d.date} type="button" role="tab" id={`${uid}-d${i}`} aria-selected={!picked && i === dayIdx} className="daycard" onClick={() => { setPicked(null); setDayIdx(i); setExpanded(false); }}>
                <span className="dw">{wd}</span>
                <b className="dd">{md}</b>
                <span className="dn">{d.slots.length} times</span>
              </button>
            );
          })}
          <button type="button" role="tab" aria-selected={Boolean(picked)} aria-label={picked ? `Chosen date ${shortDate(picked.date)}. Choose another date` : "Choose another date"} className="daycard datecard" onClick={openPicker}>
            <span className="dw">{picked ? shortDate(picked.date).split(", ")[0] : "More"}</span>
            <b className="dd">
              {!picked && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>
              )}
              {picked ? shortDate(picked.date).split(", ")[1] : "Dates"}
            </b>
            <span className="dn">{picked?.status === "ready" && picked.view ? `${picked.view.slots.length} times` : picked ? " " : "Calendar"}</span>
          </button>
          <input
            ref={dateRef}
            className="dateinput"
            type="date"
            aria-label="Choose another date"
            min={picker.min}
            max={picker.max}
            value={picked?.date ?? ""}
            onChange={(e) => pickDate(e.target.value)}
          />
        </div>
        <div className="frow">
          <div>
            <p className="flabel" aria-hidden="true">Time of day</p>
            <div className="seg seg-4" role="group" aria-label="Time of day">
              {PERIODS.map((p) => {
                const n = countFor(p.id);
                return (
                  <button key={p.id} type="button" aria-pressed={period === p.id} disabled={n === 0 && period !== p.id} onClick={() => { setPeriod(p.id); setExpanded(false); }}>
                    <b>{p.id === "any" ? "Any" : p.label}</b>
                    <small>{n}</small>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="flabel" aria-hidden="true">Players</p>
            <div className="seg seg-5" role="group" aria-label="Players">
              {PLAYERS.map((n) => (
                <button key={n} type="button" aria-pressed={players === n} aria-label={n === 0 ? "Any number of players" : `${n} player${n === 1 ? "" : "s"}`} onClick={() => { setPlayers(n); setExpanded(false); }}>
                  <b>{n === 0 ? "Any" : n}</b>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {days.map((d, i) => (
        <div key={d.date} hidden={Boolean(picked) || i !== dayIdx} role="tabpanel" aria-labelledby={`${uid}-d${i}`}>
          {list(d, !picked && i === dayIdx)}
        </div>
      ))}

      {picked && (
        <div role="tabpanel" aria-live="polite">
          {picked.status === "loading" && <p className="sub">Loading tee times for {shortDate(picked.date)}…</p>}
          {picked.status === "error" && (
            <p className="empty">Tee times for {shortDate(picked.date)} could not be loaded. <a href={askHref(picked.date)}>Ask Bob instead</a>.</p>
          )}
          {picked.status === "ready" && picked.view && picked.view.slots.length > 0 && list(picked.view, true)}
          {picked.status === "ready" && (!picked.view || picked.view.slots.length === 0) && (
            <p className="empty">No open tee times are listed at {name} for {shortDate(picked.date)}. <a href={askHref(picked.date)}>Ask Bob</a> to check or to find another course nearby.</p>
          )}
        </div>
      )}
    </div>
  );
}
