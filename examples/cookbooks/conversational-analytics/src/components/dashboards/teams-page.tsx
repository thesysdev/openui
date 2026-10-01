"use client";

import { Car3D } from "../car-3d";
import { TeamLogo } from "../f1-team-logos";
import { Ask, AskChart, Head, Missing, Settle } from "./ask";
import { Avatar } from "./avatar";
import { shortTeam, useF1, type DriverStanding, type Progression, type Standings, type TeamStanding } from "./data";
import { seasonOf, TeamProgress } from "./rows";

/* Teams: every constructor with its drivers, points and car, then the season in one chart. */

const CARD = 184;

export function TeamsPage() {
  const teams = useF1<Standings<TeamStanding>>("get_standings", { kind: "teams" });
  const drivers = useF1<Standings<DriverStanding>>("get_standings", { kind: "drivers" });
  const progression = useF1<Progression>("get_standings", { kind: "teams", view: "progression", top: 11 });
  const year = seasonOf(teams?.session);
  const leader = teams?.rows[0]?.points || 1;

  return (
    <div className="f1d">
      <header>
        <h1 className="f1d-page-title">Teams</h1>
      </header>

      <section className="f1d-section" aria-label="Teams">
        {teams === undefined ? (
          <div className="f1d-tgrid">
            {Array.from({ length: 11 }, (_, i) => (
              <Settle key={i} height={CARD} />
            ))}
          </div>
        ) : teams === null ? (
          <Missing height={CARD * 2} what="the teams" />
        ) : (
          <div className="f1d-tgrid">
            {teams.rows.map((t) => {
              const lineup = (drivers?.rows ?? []).filter((d) => d.team === t.team).slice(0, 2);
              const colour = t.teamColour ?? "#949498";
              return (
                <Ask key={t.team} q={`How is ${t.team}'s ${year} season going?`} className="f1d-tile f1d-tcard" style={{ height: CARD }}>
                  <span className="f1d-tcard-main">
                    <span className="f1d-tcard-name">
                      <span className="f1d-pos">{t.position}</span>
                      <TeamLogo team={t.team} size={32} />
                      <b>{shortTeam(t.team)}</b>
                    </span>
                    {/* The drivers load separately; the min height holds their space until they arrive. */}
                    <span className="f1d-team-drivers" style={{ minHeight: 56 }}>
                      {lineup.map((d) => {
                        return (
                          <span key={d.code}>
                            <Avatar code={d.code} size={24} teamColour={d.teamColour} />
                            {d.name}
                            <em>{d.points}</em>
                          </span>
                        );
                      })}
                    </span>
                    <span className="f1d-team-pts">
                      <span>
                        <b>{t.points}</b>
                        <small>{t.gained ? `+${t.gained} last race` : "pts"}</small>
                      </span>
                      <span className="f1d-bar">
                        <i style={{ width: `${Math.max((t.points / leader) * 100, 0.5)}%`, background: colour }} />
                      </span>
                    </span>
                  </span>
                  <span className="f1d-tcard-car">
                    <Car3D colour={colour} width={92} shadow={false} title={`${t.team} car`} />
                  </span>
                </Ask>
              );
            })}
          </div>
        )}
      </section>

      <section className="f1d-section" aria-label="Constructors' championship">
        <Head title="Points by round" more={{ label: "Who improved most →", q: `Which team has improved most over the ${year} season?` }} />
        {progression === undefined || teams === undefined ? (
          <Settle height={460} />
        ) : progression?.rows.length && teams ? (
          <AskChart q={`How has the ${year} constructors' championship developed round by round?`}>
            <TeamProgress progression={progression} teams={teams.rows} />
          </AskChart>
        ) : null}
      </section>
    </div>
  );
}
