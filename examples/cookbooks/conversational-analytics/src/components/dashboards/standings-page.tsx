"use client";

import { ChampionshipProgress, RankedBars } from "../f1-charts-special/f1-charts-special";
import { AskChart, Head, Settle } from "./ask";
import { surname, useF1, type DriverStanding, type Progression, type Standings, type TeamStanding } from "./data";
import { DriverRows, seasonOf, TeamProgress, TeamRows } from "./rows";

/* Standings: both championships in full, how the gaps moved round by round, and who scored last time out. */

export function StandingsPage() {
  const drivers = useF1<Standings<DriverStanding>>("get_standings", { kind: "drivers" });
  const teams = useF1<Standings<TeamStanding>>("get_standings", { kind: "teams" });
  const progression = useF1<Progression>("get_standings", { view: "progression", top: 22 });
  const teamProgression = useF1<Progression>("get_standings", { kind: "teams", view: "progression", top: 11 });
  const year = seasonOf(drivers?.session);
  const after = drivers?.session.match(/after the (.+?) \(round (\d+)\)$/);
  const race = after?.[1];
  const [p1] = drivers?.rows ?? [];

  const top5 = progression?.rows.length
    ? progression.rows.map((r) => {
        const keep: Record<string, string | number> = { round: r.round, race: r.race, circuit: r.circuit };
        for (const d of drivers?.rows.slice(0, 5) ?? []) keep[d.code] = r[d.code] ?? 0;
        return keep;
      })
    : null;
  const scorers = (drivers?.rows ?? [])
    .filter((r) => (r.gained ?? 0) > 0)
    .sort((a, b) => b.gained! - a.gained!)
    .slice(0, 10)
    .map((r) => ({ code: r.code, value: r.gained!, name: r.name }));

  return (
    <div className="f1d">
      <header>
        <h1 className="f1d-page-title">Standings</h1>
        {/* Only the round: the leader and the gaps are in the tables below. */}
        <p className="f1d-lede" style={{ minHeight: 24 }}>
          {after ? `After round ${after[2]}` : " "}
        </p>
      </header>

      <section className="f1d-section" aria-label="Drivers' championship">
        <Head title="Drivers" more={{ label: "Title maths →", q: `Who can still win the ${year} drivers' championship?` }} />
        <DriverRows rows={drivers === undefined ? undefined : (drivers?.rows ?? null)} progression={progression} year={year} count={drivers?.rows.length ?? 22} />
      </section>

      <section className="f1d-section" aria-label="Gap to the leader">
        <Head title="Gap to the leader" more={{ label: "Who can catch them →", q: `How many points does each contender need to catch ${p1?.name ?? "the leader"}?` }} />
        {progression === undefined || drivers === undefined ? (
          <Settle height={340} />
        ) : top5 ? (
          <AskChart q={`How has the gap to the ${year} championship leader changed round by round?`}>
            <ChampionshipProgress rows={top5} mode="gap" title="Top five" />
          </AskChart>
        ) : null}
      </section>

      {(drivers === undefined || scorers.length > 1) && (
        <section className="f1d-section" aria-label="Points last time out">
          <Head title="Points at the last race" />
          {drivers === undefined ? (
            <Settle height={320} />
          ) : (
            <AskChart
              q={`Who scored the most points at the ${year} ${race ?? "last race"}?`}
              rowSelector=".f1s-ranked-row"
              row={(i) => scorers[i] && `How did ${surname(scorers[i].name)} score ${scorers[i].value} points at the ${year} ${race ?? "last race"}?`}
            >
              <RankedBars rows={scorers} unit="pts" />
            </AskChart>
          )}
        </section>
      )}

      <section className="f1d-section" aria-label="Constructors' championship">
        <Head title="Constructors" more={{ label: "Season chart →", q: `Show the ${year} constructors' championship round by round` }} />
        <TeamRows rows={teams === undefined ? undefined : (teams?.rows ?? null)} year={year} count={teams?.rows.length ?? 11} />
        {teamProgression === undefined || teams === undefined ? (
          <Settle height={380} />
        ) : teamProgression?.rows.length && teams ? (
          <AskChart q={`How has the ${year} constructors' championship developed round by round?`}>
            <TeamProgress progression={teamProgression} teams={teams.rows.slice(0, 6)} title="Top six" />
          </AskChart>
        ) : null}
      </section>
    </div>
  );
}
