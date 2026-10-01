"use client";

import { TeamChip } from "../f1-assets";
import { Sparkline } from "../f1-charts-special/f1-charts-special";
import { findDriver } from "../f1-genui";
import { Ask, Head, Missing, Settle } from "./ask";
import { Avatar } from "./avatar";
import { shortTeam, surname, useF1, type DriverStanding, type Progression, type Standings } from "./data";
import { pointsByRound, seasonOf } from "./rows";

/* Drivers: the whole grid in championship order, then every teammate battle. */

const CARD = 150;
const MATE = 52;

export function DriversPage() {
  const drivers = useF1<Standings<DriverStanding>>("get_standings", { kind: "drivers" });
  const progression = useF1<Progression>("get_standings", { view: "progression", top: 22 });
  const year = seasonOf(drivers?.session);
  const rows = drivers?.rows ?? [];

  // Teammates, paired in the order their teams stand (by combined points).
  const byTeam = new Map<string, DriverStanding[]>();
  for (const r of rows) if (r.team) byTeam.set(r.team, [...(byTeam.get(r.team) ?? []), r]);
  const pairs = [...byTeam.entries()]
    .filter(([, ds]) => ds.length >= 2)
    .map(([team, ds]) => ({ team, a: ds[0], b: ds[1] }))
    .sort((x, y) => y.a.points + y.b.points - (x.a.points + x.b.points));

  return (
    <div className="f1d">
      <header>
        <h1 className="f1d-page-title">Drivers</h1>
      </header>

      <section className="f1d-section" aria-label="The grid">
        {drivers === undefined ? (
          <div className="f1d-grid">
            {Array.from({ length: 22 }, (_, i) => (
              <Settle key={i} height={CARD} />
            ))}
          </div>
        ) : drivers === null ? (
          <Missing height={CARD * 3} what="the drivers" />
        ) : (
          <div className="f1d-grid">
            {rows.map((r) => {
              const d = findDriver(r.code);
              const spark = pointsByRound(progression, r.code);
              return (
                <Ask key={r.code} q={`How is ${r.name}'s ${year} season going?`} className="f1d-tile f1d-dcard" style={{ height: CARD }}>
                  <Avatar code={r.code} size={64} teamColour={r.teamColour} />
                  <span className="f1d-dcard-top">
                    <small>
                      P{r.position}
                      {d && ` · #${d.number}`}
                    </small>
                    <b>{r.name}</b>
                    <span>{r.team ? <TeamChip team={r.team} size={14} /> : r.code}</span>
                  </span>
                  <span className="f1d-dcard-foot">
                    <span className="f1d-dcard-pts">
                      <b>{r.points}</b>
                      <small>{r.gained ? `+${r.gained} last race` : "pts"}</small>
                    </span>
                    {spark && spark.values.length > 1 && (
                      <Sparkline values={spark.values} labels={spark.labels} driver={r.code} width={104} height={32} format={(v) => `${v} pts`} />
                    )}
                  </span>
                </Ask>
              );
            })}
          </div>
        )}
      </section>

      <section className="f1d-section" aria-label="Teammate battles">
        <Head title="Teammate battles" more={{ label: "Closest fight →", q: `Which teammate battle is closest in ${year}?` }} />
        {drivers === undefined ? (
          <Settle height={MATE * 6} />
        ) : (
          <div className="f1d-mates">
            {pairs.map(({ team, a, b }) => {
              const total = a.points + b.points || 1;
              const colour = a.teamColour ?? "#949498";
              return (
                <Ask key={team} q={`Compare ${a.name} and ${b.name} this season`} className="f1d-mate" label={`${shortTeam(team)}: ${a.name} against ${b.name}`}>
                  <span>
                    {surname(a.name)} <em>{a.points}</em>
                  </span>
                  <span className="f1d-split-bar" title={shortTeam(team)}>
                    <i style={{ width: `${(a.points / total) * 100}%`, background: colour }} />
                    <i style={{ width: `${(b.points / total) * 100}%`, background: colour, opacity: 0.45 }} />
                  </span>
                  <span>
                    <em>{b.points}</em> {surname(b.name)}
                  </span>
                </Ask>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
