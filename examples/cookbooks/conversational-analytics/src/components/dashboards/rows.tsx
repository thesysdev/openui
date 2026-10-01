"use client";

import { ChartPanel, LinePlot } from "../f1-charts-special/chart-kit";
import { Sparkline } from "../f1-charts-special/f1-charts-special";
import { TeamLogo } from "../f1-team-logos";
import { Ask, Missing, Settle } from "./ask";
import { Avatar } from "./avatar";
import { shortTeam, type DriverStanding, type Progression, type TeamStanding } from "./data";

/* Standings rows shared by Home and Standings: one driver or team per row, each asking about itself. */

// Fixed row heights, so the loader and the Missing state can reserve exactly the rows' space.
export const DRIVER_ROW = 56;
export const TEAM_ROW = 64;

/** Cumulative points per round for one key ("ANT", "Mercedes"), with the circuits as labels. */
export function pointsByRound(progression: Progression | null | undefined, key: string) {
  if (!progression?.rows.length) return null;
  const values = progression.rows.map((r) => Number(r[key] ?? 0));
  return { values, labels: progression.rows.map((r) => String(r.circuit ?? `Round ${r.round}`)) };
}

export const seasonOf = (session: string | undefined) => session?.match(/\b(20\d\d)\b/)?.[1] ?? "2026";

export function DriverRows({
  rows,
  progression,
  year,
  count = rows?.length ?? 10,
}: {
  rows: DriverStanding[] | null | undefined;
  progression?: Progression | null;
  year: string;
  count?: number;
}) {
  if (rows === undefined) return <Settle height={count * DRIVER_ROW} />;
  if (rows === null) return <Missing height={count * DRIVER_ROW} what="the drivers' standings" />;
  const leader = rows[0]?.points ?? 0;
  return (
    <div className="f1d-rows">
      {rows.slice(0, count).map((r, i) => {
        const spark = pointsByRound(progression, r.code);
        return (
          <Ask
            key={r.code}
            q={`How is ${r.name}'s ${year} season going?`}
            className="f1d-row f1d-drow"
            style={{ height: DRIVER_ROW }}
          >
            <span className="f1d-pos" data-lead={i === 0 || undefined}>
              {r.position}
            </span>
            <Avatar code={r.code} size={36} teamColour={r.teamColour} />
            <span className="f1d-name">
              <b>{r.name}</b>
              <span>{r.team ?? r.code}</span>
            </span>
            <span className="f1d-spark">{spark && spark.values.length > 1 && <Sparkline values={spark.values} labels={spark.labels} driver={r.code} format={(v) => `${v} pts`} />}</span>
            <span className="f1d-pts">{r.points}</span>
            <span className="f1d-gap">{i === 0 ? "Leader" : `−${leader - r.points}`}</span>
          </Ask>
        );
      })}
    </div>
  );
}

export function TeamRows({ rows, year, count = 11 }: { rows: TeamStanding[] | null | undefined; year: string; count?: number }) {
  if (rows === undefined) return <Settle height={count * TEAM_ROW} />;
  if (rows === null) return <Missing height={count * TEAM_ROW} what="the constructors' standings" />;
  const leader = rows[0]?.points || 1;
  return (
    <div className="f1d-rows">
      {rows.slice(0, count).map((r) => (
        <Ask key={r.team} q={`How is ${r.team}'s ${year} season going?`} className="f1d-row f1d-trow" style={{ height: TEAM_ROW }}>
          <span className="f1d-trow-top">
            <span className="f1d-pos" style={{ width: 24 }}>
              {r.position}
            </span>
            <TeamLogo team={r.team} size={24} />
            <span className="f1d-name">
              <b>{shortTeam(r.team)}</b>
            </span>
            <span className="f1d-pts">{r.points}</span>
          </span>
          <span className="f1d-bar">
            <i style={{ width: `${Math.max((r.points / leader) * 100, 0.5)}%`, background: r.teamColour ?? "#949498" }} />
          </span>
        </Ask>
      ))}
    </div>
  );
}

/** Constructors' points by round: one line per team in its colour, labelled at the end. */
export function TeamProgress({ progression, teams, title }: { progression: Progression; teams: TeamStanding[]; title?: string }) {
  const rounds = progression.rows.map((r) => Number(r.round));
  const series = teams.map((t) => ({
    code: shortTeam(t.team),
    colour: t.teamColour ?? "#949498",
    points: progression.rows.map((r): [number, number | null] => [Number(r.round), Number(r[t.team] ?? 0)]),
    endValue: String(t.points),
  }));
  const circuit = (x: number) => String(progression.rows.find((r) => Number(r.round) === x)?.circuit ?? "");
  return (
    <ChartPanel title={title} yLabel="Points" xLabel="Round">
      <LinePlot
        series={series}
        xTicks={rounds}
        // Room for every end label: they stack 22px apart.
        height={Math.max(300, teams.length * 34)}
        tipTitle={(x) => (
          <>
            <small>Round {x}</small>
            {circuit(x)}
          </>
        )}
        tipValue={(y) => `${y} pts`}
      />
    </ChartPanel>
  );
}
