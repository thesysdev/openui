// Real OpenF1 data for the F1 Charts gallery samples, taken from the local snapshot through the
// same tools the chat uses. Writes src/components/f1-charts-special/samples.json.
//
//   npx tsx scripts/f1-chart-samples.ts
import { writeFileSync } from "node:fs";
import { runF1Tool } from "../src/lib/f1/tools";

type Row = Record<string, unknown>;
type Out = { session?: string; rows?: Row[]; [k: string]: unknown };
const run = (name: string, args: Row) => runF1Tool(name, args) as Promise<Out>;

const race = await run("get_results", { session: "Baku" });
const top = (race.rows ?? []).slice(0, 6).map((r) => r.code as string);

// Lap times for the top six (the tool takes four at a time), merged by lap.
const [a, b] = await Promise.all([
  run("get_lap_times", { session: "Baku", drivers: top.slice(0, 4) }),
  run("get_lap_times", { session: "Baku", drivers: top.slice(4) }),
]);
const laps = (a.rows ?? []).map((row, i) => ({ ...row, ...(b.rows ?? [])[i] }));

const gaps = await run("get_gaps", { session: "Baku", drivers: top.slice(0, 4) });
const stints = await run("get_stints", { session: "Baku" });
const quali = await run("get_results", { session: "Baku qualifying" });
const progression = await run("get_standings", { view: "progression" });

// Hamilton vs Leclerc over the season so far, from each round's race and qualifying results.
const pair = ["LEC", "HAM"];
const rounds = (progression.rows ?? []).map((r) => r.round as number);
const h2h = Object.fromEntries(pair.map((c) => [c, { points: 0, wins: 0, podiums: 0, finishes: [] as number[], aheadInQuali: 0, aheadInRace: 0 }]));
for (const round of rounds) {
  const [r, q] = await Promise.all([
    run("get_results", { session: `round ${round}` }),
    run("get_results", { session: `round ${round} qualifying` }).catch(() => ({ rows: [] }) as Out),
  ]);
  const pos = (rows: Row[] | undefined, c: string) => rows?.find((x) => x.code === c);
  for (const c of pair) {
    const row = pos(r.rows, c);
    if (!row) continue;
    const s = h2h[c];
    s.points += Number(row.points ?? 0);
    if (row.position === 1) s.wins++;
    if (typeof row.position === "number" && row.position <= 3) s.podiums++;
    if (typeof row.position === "number" && row.status === "Finished") s.finishes.push(row.position);
  }
  const [x, y] = pair.map((c) => pos(r.rows, c)?.position as number | undefined);
  if (x && y) h2h[x < y ? pair[0] : pair[1]].aheadInRace++;
  const [qx, qy] = pair.map((c) => pos(q.rows, c)?.position as number | undefined);
  if (qx && qy) h2h[qx < qy ? pair[0] : pair[1]].aheadInQuali++;
}
const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, v) => s + v, 0) / xs.length) * 10) / 10 : 0);

const samples = {
  session: race.session,
  race: (race.rows ?? []).slice(0, 10).map(({ position, code, gap, time, grid, points, status }) => ({ position, code, gap, time, grid, points, status })),
  summary: race.summary,
  fastestLap: race.fastestLap,
  laps,
  gaps: { session: gaps.session, rows: gaps.rows },
  stints: {
    rows: (stints.rows ?? []).map(({ code, stint, compound, lapStart, lapEnd, laps, tyreAgeAtStart }) => ({ code, stint, compound, lapStart, lapEnd, laps, tyreAgeAtStart })),
    pitStops: stints.pitStops,
  },
  quali: { session: quali.session, rows: (quali.rows ?? []).map(({ position, code, bestSeconds, gapToPole }) => ({ position, code, bestSeconds, gapToPole })) },
  progression: { session: progression.session, rows: progression.rows },
  headToHead: {
    drivers: pair,
    rounds: rounds.length,
    measures: [
      // Championship points include sprints, which the race results above leave out.
      { label: "Points", values: pair.map((c) => Number((progression.rows ?? []).at(-1)?.[c] ?? h2h[c].points)) },
      { label: "Wins", values: pair.map((c) => h2h[c].wins) },
      { label: "Podiums", values: pair.map((c) => h2h[c].podiums) },
      { label: "Ahead in qualifying", values: pair.map((c) => h2h[c].aheadInQuali) },
      { label: "Ahead in the race", values: pair.map((c) => h2h[c].aheadInRace) },
      { label: "Average finish", values: pair.map((c) => avg(h2h[c].finishes)), better: "lower" },
    ],
  },
};

const out = new URL("../src/components/f1-charts-special/samples.json", import.meta.url);
writeFileSync(out, JSON.stringify(samples) + "\n");
console.log(`Wrote ${out.pathname}: top six ${top.join(" ")}, ${laps.length} laps, ${rounds.length} rounds`);
console.log(JSON.stringify(samples.headToHead));
