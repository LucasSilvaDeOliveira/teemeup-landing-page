"use client";

import { useEffect, useId, useState } from "react";

export type LocationTree = {
  code: string;
  name: string;
  states: { code: string; name: string; path: string; count: number; cities: { id: string; name: string; count: number }[] }[];
}[];

type Props = { tree: LocationTree; country: string; state: string | null };

/**
 * Country / state / city filter. Country and state are pages (choosing one navigates to its hub URL);
 * city is a filter inside the state hub (it hides the other city groups and is kept in the URL hash, so no new URLs
 * are created). Every option and count comes from the data. The hubs also keep plain links to every state for crawlers.
 */
export function LocationFilter({ tree, country, state }: Props) {
  const uid = useId();
  const [city, setCity] = useState("");
  const c = tree.find((x) => x.code === country) ?? tree[0];
  const s = c?.states.find((x) => x.code === state) ?? null;

  useEffect(() => {
    const h = window.location.hash.replace(/^#city-/, "");
    if (s && s.cities.some((x) => x.id === h)) setCity(h);
  }, [s]);

  const go = (path: string) => window.location.assign(path);
  const pickCity = (id: string) => {
    setCity(id);
    history.replaceState(null, "", id ? `#city-${id}` : window.location.pathname);
  };

  return (
    <div className="locfilter" role="group" aria-label="Filter courses by location">
      {city && <style>{`[data-city-group]:not([data-city-group="${city}"]){display:none}`}</style>}
      <label htmlFor={`${uid}-c`}>
        <span>Country</span>
        <select id={`${uid}-c`} value={c?.code} onChange={() => go("/courses")}>
          {tree.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}
        </select>
      </label>
      <label htmlFor={`${uid}-s`}>
        <span>State</span>
        <select id={`${uid}-s`} value={s?.code ?? ""} onChange={(e) => go(c.states.find((x) => x.code === e.target.value)?.path ?? "/courses")}>
          <option value="">All states</option>
          {c?.states.map((x) => <option key={x.code} value={x.code}>{x.name} ({x.count})</option>)}
        </select>
      </label>
      <label htmlFor={`${uid}-ci`}>
        <span>City</span>
        <select id={`${uid}-ci`} value={city} disabled={!s} onChange={(e) => pickCity(e.target.value)}>
          <option value="">{s ? "All cities" : "Choose a state first"}</option>
          {s?.cities.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.count})</option>)}
        </select>
      </label>
    </div>
  );
}
