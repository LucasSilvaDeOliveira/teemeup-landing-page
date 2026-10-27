"use client";

import { useId, useState } from "react";

export type SlotView = { time: string; label: string; price: string; spots: number; href: string };
export type DayView = { date: string; tab: string; heading: string; sentence: string; asOf: string; slots: SlotView[] };

type Period = "any" | "morning" | "midday" | "afternoon";
const PERIODS: { id: Period; label: string; test: (t: string) => boolean }[] = [
  { id: "any", label: "Any time", test: () => true },
  { id: "morning", label: "Morning", test: (t) => t < "12:00" },
  { id: "midday", label: "Midday", test: (t) => t >= "12:00" && t < "15:00" },
  { id: "afternoon", label: "Afternoon", test: (t) => t >= "15:00" },
];
const PLAYERS = [0, 1, 2, 3, 4]; // 0 = any
const FIRST_VIEW = 8;

/**
 * Day, time-of-day and players filter over the tee times.
 * All days and all times are in the server HTML (the first render has no filter and nothing hidden except the
 * "show more" overflow). JavaScript only narrows what is visible; it never fetches or builds the list.
 */
export function TeeTimeBrowser({ name, days }: { name: string; days: DayView[] }) {
  const uid = useId();
  const [dayIdx, setDayIdx] = useState(0);
  const [period, setPeriod] = useState<Period>("any");
  const [players, setPlayers] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const day = days[dayIdx];
  const periodTest = PERIODS.find((p) => p.id === period)!.test;
  const matches = (s: SlotView) => periodTest(s.time) && s.spots >= players;
  const shown = day.slots.filter(matches);
  const countFor = (p: Period) => day.slots.filter((s) => PERIODS.find((x) => x.id === p)!.test(s.time) && s.spots >= players).length;

  return (
    <div className="tt">
      <div className="tt-filters" role="group" aria-label="Filter tee times">
        <div className="chips" role="tablist" aria-label="Day" hidden={days.length < 2}>
          <span className="rowlabel" aria-hidden="true">Day</span>
          {days.map((d, i) => (
            <button key={d.date} type="button" role="tab" id={`${uid}-d${i}`} aria-selected={i === dayIdx} className="chip" onClick={() => { setDayIdx(i); setExpanded(false); }}>
              {d.tab}
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Time of day">
          <span className="rowlabel" aria-hidden="true">Time</span>
          {PERIODS.map((p) => {
            const n = countFor(p.id);
            return (
              <button key={p.id} type="button" aria-pressed={period === p.id} disabled={n === 0 && period !== p.id} className="chip" onClick={() => { setPeriod(p.id); setExpanded(false); }}>
                {p.label}{p.id !== "any" ? ` (${n})` : ""}
              </button>
            );
          })}
        </div>
        <div className="chips" role="group" aria-label="Players">
          <span className="rowlabel" aria-hidden="true">Players</span>
          {PLAYERS.map((n) => (
            <button key={n} type="button" aria-pressed={players === n} aria-label={n === 0 ? "Any number of players" : `${n} player${n === 1 ? "" : "s"}`} className="chip" onClick={() => { setPlayers(n); setExpanded(false); }}>
              {n === 0 ? "Any" : n}
            </button>
          ))}
        </div>
      </div>

      {days.map((d, i) => {
        const visible = d.slots.filter(matches);
        const isActive = i === dayIdx;
        return (
          <div key={d.date} hidden={!isActive} role="tabpanel" aria-labelledby={`${uid}-d${i}`}>
            <h3 className="tt-day">{d.heading}</h3>
            <p className="sub">{d.sentence}</p>
            {isActive && visible.length === 0 && <p className="empty">No tee times match these filters. Try another time of day or fewer players.</p>}
            <ul className={`times${isActive && !expanded ? " collapsed" : ""}`}>
              {d.slots.map((s) => {
                const ok = !isActive || matches(s);
                const rank = isActive ? visible.indexOf(s) : -1;
                return (
                  <li key={s.time} hidden={!ok} data-extra={isActive && ok && rank >= FIRST_VIEW ? "" : undefined}>
                    <a className="time" href={s.href}>
                      <b>{s.label}</b>
                      <span>{s.price} · {s.spots} open</span>
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
            <p className="asof">Times and prices for {d.heading}, as of {d.asOf}. Availability changes. Booking happens in the chat with Bob.</p>
          </div>
        );
      })}
      <span className="sr-only">Tee times at {name}</span>
    </div>
  );
}
