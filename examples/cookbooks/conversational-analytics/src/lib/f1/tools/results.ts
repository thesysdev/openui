import { z } from "zod/v4";
import { formatLap, getLaps, getSessionResult, getStartingGrid, round3, type SessionResult } from "../data";
import { allSessions, sessionDrivers, driverMap } from "../resolve";
import { defineF1Tool, joinNotes, openSession, sessionArg } from "./define";

function gapText(r: SessionResult, leaderLaps: number | null) {
  if (r.dsq) return "DSQ";
  if (r.dns) return "DNS";
  if (r.dnf) return "DNF";
  const gap = Array.isArray(r.gap_to_leader) ? null : r.gap_to_leader;
  if (typeof gap === "string") return gap;
  if (r.position === 1) return null;
  if (typeof gap === "number" && gap > 0) return `+${gap.toFixed(3)}s`;
  if (leaderLaps && r.number_of_laps != null && r.number_of_laps < leaderLaps)
    return `+${leaderLaps - r.number_of_laps} lap${leaderLaps - r.number_of_laps > 1 ? "s" : ""}`;
  return null;
}

export const getResults = defineF1Tool({
  name: "get_results",
  description:
    "Classified result of a session. Race and sprint: position, grid, places gained, laps, time or gap, points, status (DNF/DNS/DSQ), each driver's fastest lap. Qualifying: Q1/Q2/Q3 times. Practice: best lap and gap. Defaults to the latest race.",
  input: z.object({
    session: sessionArg("session"),
    top: z.number().int().min(1).max(22).optional().describe("Only the first N classified rows."),
  }),
  output: {
    session: "2026 Azerbaijan Grand Prix · Race",
    rows: [{ position: 1, code: "RUS", name: "George Russell", team: "Mercedes", teamColour: "#00D7B6", grid: 1, gained: 0, laps: 51, time: "1:38:02.143", gap: null, points: 25, status: "Finished", fastestLap: "1:45.901", fastestLapSeconds: 105.901 }],
    fastestLap: { code: "LEC", lap: 44, time: "1:45.101" },
  },
  async run({ session: ref, top }, { signal }) {
    const { session, label, note } = await openSession(ref, signal, "Race");
    const [results, drivers, laps] = await Promise.all([
      getSessionResult(session, signal),
      sessionDrivers(session, signal),
      getLaps(session, signal),
    ]);
    if (!results.length)
      return { session: label, rows: [], note: joinNotes(note, "OpenF1 has no classified result for this session yet.") };
    const who = driverMap(drivers);
    const sorted = [...results].sort((a, b) => (a.position ?? 99) - (b.position ?? 99) || (b.number_of_laps ?? 0) - (a.number_of_laps ?? 0));
    const base = (r: SessionResult) => {
      const d = who.get(r.driver_number);
      return { position: r.position, number: r.driver_number, code: d?.code ?? String(r.driver_number), name: d?.name ?? null, team: d?.team ?? null, teamColour: d?.teamColour ?? null };
    };

    // Best lap per driver, from lap data.
    const best = new Map<number, { lap: number; seconds: number }>();
    for (const lap of laps) {
      const current = best.get(lap.driver_number);
      if (lap.lap_duration && (!current || lap.lap_duration < current.seconds))
        best.set(lap.driver_number, { lap: lap.lap_number, seconds: lap.lap_duration });
    }
    const overall = [...best.entries()].sort((a, b) => a[1].seconds - b[1].seconds)[0];
    const fastestLap = overall
      ? { code: who.get(overall[0])?.code ?? String(overall[0]), lap: overall[1].lap, time: formatLap(overall[1].seconds), seconds: overall[1].seconds }
      : null;

    if (session.name === "Qualifying" || session.name === "Sprint Qualifying") {
      const rows = sorted.map((r) => {
        const times = Array.isArray(r.duration) ? r.duration : [r.duration];
        const gaps = Array.isArray(r.gap_to_leader) ? r.gap_to_leader : [r.gap_to_leader];
        const last = times.map((t, i) => [t, gaps[i]] as const).filter(([t]) => typeof t === "number").at(-1);
        return {
          ...base(r),
          q1: formatLap(times[0] as number | null),
          q2: formatLap((times[1] ?? null) as number | null),
          q3: formatLap((times[2] ?? null) as number | null),
          bestSeconds: typeof last?.[0] === "number" ? last[0] : null,
          gapToPole: typeof last?.[1] === "number" ? round3(last[1]) : null,
          laps: r.number_of_laps,
          status: r.dsq ? "DSQ" : r.dns ? "DNS" : r.dnf ? "DNF" : null,
        };
      });
      return { session: label, rows: rows.slice(0, top ?? rows.length), note };
    }

    if (session.name.startsWith("Practice")) {
      const rows = sorted.map((r) => ({
        ...base(r),
        best: formatLap(typeof r.duration === "number" ? r.duration : null),
        bestSeconds: typeof r.duration === "number" ? r.duration : null,
        gap: typeof r.gap_to_leader === "number" ? round3(r.gap_to_leader) : null,
        laps: r.number_of_laps,
      }));
      return { session: label, rows: rows.slice(0, top ?? rows.length), note };
    }

    // Race or sprint: the grid comes from the matching qualifying session's starting grid.
    const qualiName = session.name === "Sprint" ? "Sprint Qualifying" : "Qualifying";
    const quali = (await allSessions(session.year, signal)).find(
      (s) => s.meetingKey === session.meetingKey && s.name === qualiName,
    );
    let grid = new Map<number, number>();
    let gridNote: string | undefined;
    if (quali) {
      const sg = await getStartingGrid(quali, signal);
      if (sg.length) grid = new Map(sg.map((g) => [g.driver_number, g.position]));
      else {
        const qr = await getSessionResult(quali, signal);
        grid = new Map(qr.filter((q) => q.position).map((q) => [q.driver_number, q.position!]));
        if (grid.size) gridNote = "Grid is the qualifying order; penalties are not applied.";
      }
    }
    const leaderLaps = sorted[0]?.number_of_laps ?? null;
    const winnerTime = typeof sorted[0]?.duration === "number" ? sorted[0].duration : null;
    const rows = sorted.map((r) => {
      const g = grid.get(r.driver_number) ?? null;
      const b = best.get(r.driver_number);
      return {
        ...base(r),
        grid: g,
        gained: g && r.position ? g - r.position : null,
        laps: r.number_of_laps,
        time: r.position === 1 && winnerTime ? formatDuration(winnerTime) : null,
        gap: gapText(r, leaderLaps),
        points: r.points ?? 0,
        status: r.dsq ? "DSQ" : r.dns ? "DNS" : r.dnf ? "DNF" : "Finished",
        fastestLap: formatLap(b?.seconds),
        fastestLapSeconds: b?.seconds ?? null,
      };
    });
    return {
      session: label,
      rows: rows.slice(0, top ?? rows.length),
      fastestLap,
      summary: `${rows[0]?.name} won${rows[1] ? `, ${rows[1].name} ${rows[1].gap ?? ""} behind` : ""}. ${rows.filter((r) => r.status !== "Finished").length} did not finish or were disqualified.`,
      note: joinNotes(note, gridNote),
    };
  },
});

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(3).padStart(6, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
