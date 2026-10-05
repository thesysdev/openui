"use client";

import { useEffect, useRef, useState } from "react";
import { CircuitMap, CountryFlag } from "../f1-assets";
import { ChampionshipProgress, RankedBars, StatCallout } from "../f1-charts-special/f1-charts-special";
import { findCircuit } from "../f1-genui";
import { Ask, AskChart, Head, Missing, Settle } from "./ask";
import { Avatar } from "./avatar";
import { TeamCar } from "./team-car";
import { FinishLine } from "../finish-line";
import { surname, useF1, type DriverStanding, type Progression, type Results, type Schedule, type ScheduleRow, type Standings, type TeamStanding } from "./data";
import { DriverRows, seasonOf, TeamRows } from "./rows";

/*
 * Home: the pit wall. The next race with its countdown and sessions, the season in four figures,
 * the title fight, the last race and the calendar. Every piece asks Team Radio about itself.
 */

const circuitOf = (row: Pick<ScheduleRow, "location" | "circuit" | "name">) =>
  findCircuit(row.location) ?? findCircuit(row.circuit) ?? findCircuit(row.name);

// "Azerbaijan Grand Prix" → "Azerbaijan"; the race word for big type.
const gpWord = (name: string) => name.replace(/ Grand Prix$/, "");

export function HomeDashboard() {
  const schedule = useF1<Schedule>("get_schedule", { include_sessions: true });
  const drivers = useF1<Standings<DriverStanding>>("get_standings", { kind: "drivers" });
  const teams = useF1<Standings<TeamStanding>>("get_standings", { kind: "teams" });
  const progression = useF1<Progression>("get_standings", { view: "progression", top: 22 });
  const lastRace = useF1<Results>("get_results", {});
  const year = seasonOf(schedule?.session ?? drivers?.session);
  const next = schedule?.rows.find((r) => r.status === "next" || r.status === "in progress");

  return (
    <div className="f1d">
      <NextRace schedule={schedule} next={next} year={year} />
      <Overview schedule={schedule} drivers={drivers} teams={teams} year={year} />
      <TitleFight drivers={drivers} teams={teams} progression={progression} year={year} />
      <LastRace results={lastRace} />
      <Calendar schedule={schedule} year={year} />
      <BigQuestions drivers={drivers} next={next} year={year} />
    </div>
  );
}

/* ── Next race ─────────────────────────────────────────────────────────── */

function useNow(everyMs: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    // The countdown's figures change once a minute; nothing animates.
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");

function Countdown({ to, q }: { to: string; q: string }) {
  const now = useNow(30_000);
  const left = Math.max(0, Date.parse(to) - (now ?? Date.parse(to)));
  const days = Math.floor(left / 86_400_000);
  const hours = Math.floor((left % 86_400_000) / 3_600_000);
  const mins = Math.floor((left % 3_600_000) / 60_000);
  return (
    <Ask q={q} className="f1d-count" label="Countdown to lights out">
      {[
        [days, "Days"],
        [hours, "Hrs"],
        [mins, "Min"],
      ].map(([v, unit]) => (
        <span key={unit}>
          <b>{now == null ? "––" : pad(v as number)}</b>
          <small>{unit}</small>
        </span>
      ))}
    </Ask>
  );
}

const SESSION_SHORT: Record<string, string> = {
  "Practice 1": "FP1",
  "Practice 2": "FP2",
  "Practice 3": "FP3",
  Qualifying: "Quali",
  "Sprint Qualifying": "Sprint quali",
  "Sprint Shootout": "Sprint quali",
  Sprint: "Sprint",
  Race: "Race",
};

function sessionQuestion(session: string, race: string) {
  if (session === "Race") return `Who is favourite to win the ${race}?`;
  if (session === "Qualifying") return `Who is favourite for pole at the ${race}?`;
  if (session === "Sprint") return `What should I watch for in the ${race} sprint?`;
  if (session.startsWith("Sprint")) return `Who is quickest over one lap heading into ${race} sprint qualifying?`;
  return `What should I watch for in ${session} at the ${race}?`;
}

function NextRace({ schedule, next, year }: { schedule: Schedule | null | undefined; next: ScheduleRow | undefined; year: string }) {
  // The hero and session strip hold their final height while loading.
  if (schedule === undefined)
    return (
      <section className="f1d-section">
        <Settle height={300} />
        <Settle height={78} />
      </section>
    );
  if (schedule === null || !next)
    return (
      <section className="f1d-section">
        <Head title={schedule ? "Season complete" : "Next race"} more={{ label: "Season review →", q: `Review the ${year} season so far` }} />
        {schedule === null && <Missing height={120} what="the calendar" />}
      </section>
    );
  const race = gpWord(next.name);
  const circuit = circuitOf(next);
  const previous = Number(year) - 1;
  const raceStart = next.raceStart ?? `${next.end}T12:00:00Z`;
  return (
    <section className="f1d-section" aria-label="Next race">
      <div className="f1d-hero" style={{ minHeight: 300 }}>
        <div className="f1d-hero-l">
          <div>
            <div className="f1d-eyebrow">
              {next.status === "in progress" ? "This weekend" : "Next race"} · Round {next.round}
            </div>
            <Ask q={`Preview the ${year} ${next.name}`} className="f1d-race">
              {race}
            </Ask>
            <div className="f1d-race-sub">
              {circuit && <CountryFlag code={circuit.countryCode} size={18} />}
              <span>
                {circuit?.name ?? next.circuit} ·{" "}
                {new Date(next.start).toLocaleDateString(undefined, { day: "numeric", month: "short" })}–
                {new Date(next.end).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                {next.sprint && " · Sprint weekend"}
              </span>
            </div>
          </div>
          <Countdown to={raceStart} q={`When is every ${next.name} session in my local time?`} />
          <div className="f1d-links">
            <Ask q={`Who won the ${previous} ${next.name} and how?`} className="f1d-link">
              Last year&apos;s race
            </Ask>
            <PreviousWinner location={next.location} previous={previous} race={next.name} />
            <Ask q={`Where can drivers overtake at ${circuit?.name ?? next.location}?`} className="f1d-link">
              Where to overtake
            </Ask>
            <Ask q={`What weather is expected for the ${year} ${next.name}?`} className="f1d-link">
              Weather
            </Ask>
          </div>
        </div>
        {circuit && (
          <Ask q={`Show me the ${circuit.name} corner by corner`} className="f1d-circuit" label={`${circuit.name} layout`}>
            <CircuitMap id={circuit.id} size={280} strokeWidth={28} />
          </Ask>
        )}
      </div>
      {next.sessions && next.sessions.length > 0 && (
        <div className="f1d-sessions">
          {next.sessions.slice(-5).map((s) => {
            const at = new Date(s.start);
            return (
              <Ask key={s.name} q={sessionQuestion(s.name, next.name)} className="f1d-tile f1d-session" style={{ height: 78 }} data-done={s.finished || undefined}>
                <small>
                  {SESSION_SHORT[s.name] ?? s.name} · {at.toLocaleDateString(undefined, { weekday: "short" })}
                </small>
                <b>{at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</b>
              </Ask>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Last year's winner here, from the previous season's results (a race that hasn't run yet has none of its own). */
function PreviousWinner({ location, previous, race }: { location: string; previous: number; race: string }) {
  const results = useF1<Results>("get_results", { session: `${previous} ${location}` });
  const winner = results?.rows.find((r) => r.position === 1);
  if (!winner) return null;
  return (
    <Ask q={`How did ${winner.name ?? winner.code} win the ${previous} ${race}?`} className="f1d-link">
      {previous}: {surname(winner.name ?? winner.code)} from P{winner.grid ?? "?"}
    </Ask>
  );
}

/* ── Season overview ───────────────────────────────────────────────────── */

function Overview({
  schedule,
  drivers,
  teams,
  year,
}: {
  schedule: Schedule | null | undefined;
  drivers: Standings<DriverStanding> | null | undefined;
  teams: Standings<TeamStanding> | null | undefined;
  year: string;
}) {
  const head = <Head title="Season overview" more={{ label: "Season review →", q: `Give me a review of the ${year} season so far` }} />;
  if (schedule === undefined || drivers === undefined || teams === undefined)
    return (
      <section className="f1d-section">
        {head}
        <Settle height={124} />
      </section>
    );
  const races = schedule?.rows.filter((r) => r.status !== "cancelled") ?? [];
  const done = races.filter((r) => r.status === "completed").length;
  const left = races.filter((r) => r.status !== "completed");
  // 25 for a win, 8 for a sprint win; no point for fastest lap since 2025.
  const onOffer = left.length * 25 + left.filter((r) => r.sprint).length * 8;
  const [p1, p2] = drivers?.rows ?? [];
  const [t1, t2] = teams?.rows ?? [];
  const gap = p1 && p2 ? p1.points - p2.points : 0;
  const tiles = [
    p1 && {
      q: `Can anyone still catch ${p1.name} in the ${year} championship?`,
      stat: <StatCallout label="Leads the title" value={String(p1.points)} unit="pts" driver={p1.code} note={p2 ? `${gap} clear of ${surname(p2.name)}` : undefined} />,
    },
    {
      q: `Which ${year} races are still to come, and which ones matter most?`,
      stat: <StatCallout label="Rounds run" value={String(done)} unit={`/ ${races.length}`} note={`${left.length} to go`} />,
    },
    {
      q: `How many points are left in ${year}, and when could the title be decided?`,
      stat: (
        <StatCallout
          label="Points on offer"
          value={String(onOffer)}
          note={p1 && p2 ? (gap > onOffer ? `${surname(p1.name)} has it sealed` : `Lead must grow by ${onOffer - gap + 1} to be safe`) : undefined}
        />
      ),
    },
    t1 && {
      q: `How did ${t1.team} build its constructors' lead in ${year}?`,
      stat: <StatCallout label={`${t1.team} lead the teams`} value={String(t1.points)} unit="pts" note={t2 ? `${t1.points - t2.points} clear of ${t2.team}` : undefined} />,
    },
  ].filter(Boolean) as { q: string; stat: React.ReactNode }[];
  return (
    <section className="f1d-section" aria-label="Season overview">
      {head}
      <div className="f1d-stats">
        {tiles.map((t) => (
          <Ask key={t.q} q={t.q} className="f1d-tile f1d-stat">
            {t.stat}
          </Ask>
        ))}
      </div>
    </section>
  );
}

/* ── Title fight ───────────────────────────────────────────────────────── */

function TitleFight({
  drivers,
  teams,
  progression,
  year,
}: {
  drivers: Standings<DriverStanding> | null | undefined;
  teams: Standings<TeamStanding> | null | undefined;
  progression: Progression | null | undefined;
  year: string;
}) {
  const top5 = progression?.rows.length
    ? progression.rows.map((r) => {
        const keep: Record<string, string | number> = { round: r.round, race: r.race, circuit: r.circuit };
        for (const d of drivers?.rows.slice(0, 5) ?? []) keep[d.code] = r[d.code] ?? 0;
        return keep;
      })
    : null;
  return (
    <section className="f1d-section" aria-label="Championship">
      <div className="f1d-split">
        <div className="f1d-section">
          <Head title="Drivers" more={{ label: "Title maths →", q: `Who can still win the ${year} drivers' championship?` }} />
          <DriverRows rows={drivers === undefined ? undefined : (drivers?.rows ?? null)} progression={progression} year={year} count={10} />
        </div>
        <div className="f1d-section">
          <Head title="Constructors" more={{ label: "Season chart →", q: `Show the ${year} constructors' championship round by round` }} />
          <TeamRows rows={teams === undefined ? undefined : (teams?.rows ?? null)} year={year} count={9} />
        </div>
      </div>
      {progression === undefined || drivers === undefined ? (
        <Settle height={340} />
      ) : top5 ? (
        <AskChart q={`How has the ${year} title fight swung round by round?`}>
          <ChampionshipProgress rows={top5} title="Top five, points by round" />
        </AskChart>
      ) : null}
    </section>
  );
}

/* ── Last race ─────────────────────────────────────────────────────────── */

function LastRace({ results }: { results: Results | null | undefined }) {
  if (results === undefined)
    return (
      <section className="f1d-section">
        <Head title="Last race" />
        <Settle height={420} />
      </section>
    );
  if (results === null || !results.rows.length)
    return (
      <section className="f1d-section">
        <Head title="Last race" />
        <Missing height={420} what="the last race" />
      </section>
    );
  const [label] = results.session.split(" · ");
  const race = label.replace(/^\d{4} /, "");
  const place = gpWord(race);
  const podium = results.rows.filter((r) => r.position != null && r.position <= 3).sort((a, b) => a.position! - b.position!);
  const fastest = results.rows.filter((r) => r.fastestLapSeconds != null).sort((a, b) => a.fastestLapSeconds! - b.fastestLapSeconds!)[0];
  const climber = [...results.rows].filter((r) => (r.gained ?? 0) > 0).sort((a, b) => b.gained! - a.gained!)[0];
  const out = results.rows.filter((r) => r.status !== "Finished" && !/lap/i.test(r.status));
  const gainers = results.rows
    .filter((r) => (r.gained ?? 0) > 0)
    .sort((a, b) => b.gained! - a.gained!)
    .slice(0, 6)
    .map((r) => ({ code: r.code, value: r.gained!, name: r.name ?? r.code }));
  const who = (r: { name: string | null; code: string }) => r.name ?? r.code;
  return (
    <section className="f1d-section" aria-label="Last race">
      <Head title={`Last race: ${place}`} more={{ label: "Full recap →", q: `Recap the ${label} in 60 seconds` }} />
      <Podium podium={podium} label={label} />
      <div className="f1d-facts">
        {fastest && (
          <Ask q={`Show the fastest laps from the ${label}`} className="f1d-fact">
            <b>{fastest.fastestLap}</b>
            <span>Fastest lap · {surname(who(fastest))}</span>
          </Ask>
        )}
        {climber && (
          <Ask q={`How did ${who(climber)} gain ${climber.gained} places at the ${label}?`} className="f1d-fact">
            <b>+{climber.gained}</b>
            <span>Places gained · {surname(who(climber))}</span>
          </Ask>
        )}
        <Ask q={out.length ? `Who retired from the ${label} and why?` : `Did anyone have trouble at the ${label}?`} className="f1d-fact">
          <b>{out.length}</b>
          <span>{out.length === 1 ? "Retirement" : "Retirements"}</span>
        </Ask>
        <Ask q={`Show the pit stops and strategies from the ${label}`} className="f1d-fact">
          <b>{results.rows[0]?.laps ?? "–"}</b>
          <span>Laps · strategies</span>
        </Ask>
      </div>
      {gainers.length > 1 && (
        <AskChart
          q={`Who made up the most places at the ${label}?`}
          rowSelector=".f1s-ranked-row"
          row={(i) => gainers[i] && `How did ${gainers[i].name} gain ${gainers[i].value} places at the ${label}?`}
        >
          <RankedBars rows={gainers} title="Places gained from the grid" unit="places" />
        </AskChart>
      )}
    </section>
  );
}

/* The podium: the top three cars on the checkered floor, the winner out front in the middle,
   each with its driver above it. Each column asks about that driver's race. */

// Podium order across the floor: P2, P1, P3. Where each car sits on the floor (%), the winner a car's
// length ahead. The floor is drawn 1.6× around its centre, so these land under each third of the page.
const SLOTS: Record<number, { left: number; top: number }> = { 2: { left: 29.5, top: 34 }, 1: { left: 50, top: 37 }, 3: { left: 70.5, top: 34 } };

const FLOOR_HEIGHT = 430;
const FLOOR_COLUMNS = 28;

function Podium({ podium, label }: { podium: Results["rows"]; label: string }) {
  const who = (r: Results["rows"][number]) => r.name ?? r.code;
  const order = [2, 1, 3].map((p) => podium.find((r) => r.position === p)).filter((r): r is Results["rows"][number] => !!r);
  // The checkered floor rolls toward the viewer. It's drawn as a repeating background laid on
  // FinishLine's floor (which gets transparent tiles) so it can scroll without a seam; each tile
  // is one of FinishLine's columns wide, so it sits in the same perspective.
  const ref = useRef<HTMLDivElement>(null);
  const [tile, setTile] = useState(0);
  useEffect(() => {
    const box = ref.current!;
    const observer = new ResizeObserver(() => setTile(box.clientWidth / FLOOR_COLUMNS));
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="f1d-podium" style={{ ["--f1d-tile" as string]: `${tile}px` }}>
      <FinishLine
        height={FLOOR_HEIGHT}
        columns={FLOOR_COLUMNS}
        colorA="transparent"
        colorB="transparent"
        perspective={50}
        onFloor={[<div key="floor" className="f1d-podium-floor" aria-hidden />].concat(order.map((r) => (
          <div key={r.code} className="f1d-podium-car" style={{ left: `${SLOTS[r.position!].left}%`, top: `${SLOTS[r.position!].top}%` }}>
            <TeamCar team={r.team} colour={r.teamColour ?? "#E10600"} width={r.position === 1 ? 118 : 88} />
          </div>
        )))}
      >
        <div className="f1d-podium-cols">
          {order.map((r) => (
            <Ask
              key={r.code}
              q={r.position === 1 ? `How did ${who(r)} win the ${label}?` : `How did ${who(r)}'s ${label} go?`}
              className="f1d-podium-col"
              data-p={r.position}
            >
              <Avatar code={r.code} size={r.position === 1 ? 80 : 64} teamColour={r.teamColour} />
              <span className="f1d-pod-driver">
                <span className="f1d-pod-p">P{r.position}</span>
                <span className="f1d-pod-who">{surname(who(r))}</span>
              </span>
              <span className="f1d-pod-meta">
                {r.team} · {r.time ?? r.gap ?? r.status}
              </span>
            </Ask>
          ))}
        </div>
      </FinishLine>
    </div>
  );
}

/* ── Calendar ──────────────────────────────────────────────────────────── */

function Calendar({ schedule, year }: { schedule: Schedule | null | undefined; year: string }) {
  const head = <Head title="Calendar" more={{ label: "Full calendar →", q: `Show the full ${year} calendar` }} />;
  if (schedule === undefined)
    return (
      <section className="f1d-section">
        {head}
        <Settle height={260} />
      </section>
    );
  if (schedule === null) return null;
  const rounds = schedule.rows.filter((r) => r.status !== "cancelled" && r.round != null);
  return (
    <section className="f1d-section" aria-label="Calendar">
      {head}
      <div className="f1d-cal">
        {rounds.map((r) => {
          const c = circuitOf(r);
          const q =
            r.status === "completed"
              ? `Recap the ${year} ${r.name}`
              : r.status === "upcoming"
                ? `Who has won the ${r.name} in recent years?`
                : `Preview the ${year} ${r.name}`;
          return (
            <Ask key={`${r.round}-${r.name}`} q={q} className="f1d-round" data-status={r.status}>
              {c ? <CircuitMap id={c.id} size={56} strokeWidth={56} showStart={false} /> : <svg width={56} height={56} />}
              <small>R{r.round}</small>
              <b>{r.location}</b>
            </Ask>
          );
        })}
      </div>
    </section>
  );
}

/* ── Questions to ask ─────────────────────────────────────────────────── */

function BigQuestions({ drivers, next, year }: { drivers: Standings<DriverStanding> | null | undefined; next: ScheduleRow | undefined; year: string }) {
  const [p1, p2] = drivers?.rows ?? [];
  const questions = [
    p1 && p2 ? `Can ${surname(p2.name)} still beat ${surname(p1.name)} to the ${year} title?` : `Who will win the ${year} title?`,
    "Who has the best race pace right now?",
    next ? `Who wins the ${next.name}?` : "Which team has improved most this season?",
    "Which teammate battle is closest this season?",
  ];
  return (
    <section className="f1d-section" aria-label="Questions to ask">
      <Head title="Ask Team Radio" />
      <div className="f1d-bigq">
        {questions.map((q) => (
          <Ask key={q} q={q}>
            {q}
          </Ask>
        ))}
      </div>
    </section>
  );
}
