import { z } from "zod/v4";
import { formatLap, getLaps, round1, round3, type Lap } from "../data";
import { openf1 } from "../openf1";
import { cacheFor, resolveDrivers, sessionDrivers, type Driver, type Session } from "../resolve";
import { defineF1Tool, joinNotes, openSession, sessionArg } from "./define";

// Car telemetry for single laps. OpenF1 samples car_data and location about four times a
// second; one lap is fetched by time window (cached forever once the session is final).
// Distance along the lap comes from the car's track positions: the first driver's path is
// measured, and a compared driver is projected onto that path, so both laps share corners
// exactly. Without positions, distance falls back to integrating speed.

type CarSample = { date: string; speed: number; throttle: number; brake: number; n_gear: number; rpm: number; drs: number | null };
type LocSample = { date: string; x: number; y: number; z: number };
type Point = { t: number; d: number; speed: number; throttle: number; brake: number; gear: number; rpm: number; drs: number | null; x?: number; y?: number };

interface Trace {
  driver: Driver;
  lap: Lap;
  /** Car samples: seconds from the lap start, distance (m) filled in by measure(). */
  points: Point[];
  /** Track positions: seconds from the lap start, x/y in OpenF1 units (decimetres). */
  locs: Array<{ t: number; x: number; y: number }>;
  /** Distance (m) against time (s), from the lap start to the line; set by measure(). */
  track: Array<{ t: number; d: number }>;
}

async function lapTrace(session: Session, driver: Driver, lap: Lap, signal?: AbortSignal): Promise<Trace> {
  if (!lap.date_start || !lap.lap_duration) throw new RangeError(`${driver.code} lap ${lap.lap_number} has no timing, so telemetry can't be windowed.`);
  const start = Date.parse(lap.date_start);
  const duration = lap.lap_duration;
  const window = {
    session_key: session.key,
    driver_number: driver.number,
    "date>=": new Date(start - 500).toISOString(),
    "date<=": new Date(start + duration * 1000 + 500).toISOString(),
  };
  const [car, loc] = await Promise.all([
    openf1<CarSample>("car_data", window, cacheFor(session, signal)),
    openf1<LocSample>("location", window, cacheFor(session, signal)),
  ]);
  const within = <T extends { date: string }>(rows: T[]) =>
    rows
      .map((r) => ({ ...r, t: (Date.parse(r.date) - start) / 1000 }))
      .filter((r) => r.t >= 0 && r.t <= duration)
      .sort((a, b) => a.t - b.t);
  const samples = within(car);
  if (samples.length < 10) throw new RangeError(`OpenF1 has no car telemetry for ${driver.code} on lap ${lap.lap_number}.`);
  return {
    driver,
    lap,
    points: samples.map((s) => ({ t: s.t, d: 0, speed: s.speed, throttle: s.throttle, brake: s.brake > 0 ? 1 : 0, gear: s.n_gear, rpm: s.rpm, drs: s.drs })),
    locs: within(loc).map((l) => ({ t: l.t, x: l.x, y: l.y })),
    track: [],
  };
}

/** Linear interpolation of y at x over points sorted by x. */
function interp<T>(list: T[], x: (p: T) => number, y: (p: T) => number, at: number) {
  if (!list.length) return NaN;
  let lo = 0;
  let hi = list.length - 1;
  if (at <= x(list[0])) return y(list[0]);
  if (at >= x(list[hi])) return y(list[hi]);
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (x(list[mid]) <= at) lo = mid;
    else hi = mid;
  }
  const span = x(list[hi]) - x(list[lo]);
  const f = span ? (at - x(list[lo])) / span : 0;
  return y(list[lo]) + (y(list[hi]) - y(list[lo])) * f;
}

/** Give every trace a distance-against-time track and every car sample a distance. */
function measure(traces: Trace[]) {
  const [ref] = traces;
  const geometric = traces.every((tr) => tr.locs.length >= 50);
  if (geometric) {
    // The reference path, in metres, closed back to its first point at the line.
    const path = ref.locs;
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y) / 10);
    const lapLength = cum.at(-1)! + Math.hypot(path[0].x - path.at(-1)!.x, path[0].y - path.at(-1)!.y) / 10;
    for (const tr of traces) {
      let j = 0;
      const mapped = tr.locs.map((p, i) => {
        if (tr === ref) return { t: p.t, d: cum[i] };
        // Nearest reference point, searching forward from the last match so the lap never runs backwards.
        let best = j;
        let bestDist = Infinity;
        for (let k = Math.max(0, j - 3); k < Math.min(path.length, j + 40); k++) {
          const dist = (path[k].x - p.x) ** 2 + (path[k].y - p.y) ** 2;
          if (dist < bestDist) [bestDist, best] = [dist, k];
        }
        j = best;
        // Project onto the segment towards the neighbouring point for sub-sample precision.
        const a = path[best];
        const b = path[Math.min(best + 1, path.length - 1)];
        const seg = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
        const f = seg ? Math.min(1, Math.max(0, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / seg)) : 0;
        return { t: p.t, d: cum[best] + (cum[Math.min(best + 1, cum.length - 1)] - cum[best]) * f };
      });
      // Anchor both ends at the timing line, then keep distance non-decreasing.
      const end = tr.lap.lap_duration!;
      const track = [{ t: 0, d: 0 }, ...mapped.filter((m) => m.t > 0.05 && m.t < end - 0.05), { t: end, d: lapLength }];
      for (let i = 1; i < track.length; i++) track[i].d = Math.max(track[i].d, track[i - 1].d);
      tr.track = track;
    }
  } else {
    // Integrate speed, then scale each lap to the same length so both end at the line.
    for (const tr of traces) {
      let d = 0;
      tr.track = tr.points.map((p, i) => {
        if (i) d += ((tr.points[i - 1].speed + p.speed) / 2 / 3.6) * (p.t - tr.points[i - 1].t);
        return { t: p.t, d };
      });
      const last = tr.points.at(-1)!;
      tr.track.unshift({ t: 0, d: 0 });
      tr.track.push({ t: tr.lap.lap_duration!, d: d + (last.speed / 3.6) * (tr.lap.lap_duration! - last.t) });
    }
    const length = traces.reduce((s, tr) => s + tr.track.at(-1)!.d, 0) / traces.length;
    for (const tr of traces) {
      const k = length / tr.track.at(-1)!.d;
      for (const p of tr.track) p.d *= k;
    }
  }
  for (const tr of traces) {
    for (const p of tr.points) {
      p.d = interp(tr.track, (q) => q.t, (q) => q.d, p.t);
      if (tr.locs.length) {
        p.x = Math.round(interp(tr.locs, (q) => q.t, (q) => q.x, p.t));
        p.y = Math.round(interp(tr.locs, (q) => q.t, (q) => q.y, p.t));
      }
    }
  }
  return { geometric, length: Math.max(...traces.map((tr) => tr.track.at(-1)!.d)) };
}

function valueAt(trace: Trace, key: "speed" | "throttle" | "rpm", dist: number) {
  return interp(trace.points, (p) => p.d, (p) => p[key], dist);
}
function nearest(trace: Trace, dist: number) {
  return trace.points.reduce((best, p) => (Math.abs(p.d - dist) < Math.abs(best.d - dist) ? p : best));
}
function timeAt(trace: Trace, dist: number) {
  return interp(trace.track, (p) => p.d, (p) => p.t, dist);
}

/** Centred moving average over ±w samples, keeping the first and last values exact. */
function smooth(values: number[], w: number) {
  if (w < 1) return values;
  return values.map((v, i) => {
    if (i === 0 || i === values.length - 1) return v;
    const lo = Math.max(0, i - w);
    const hi = Math.min(values.length - 1, i + w);
    let sum = 0;
    for (let k = lo; k <= hi; k++) sum += values[k];
    return sum / (hi - lo + 1);
  });
}

function pickLap(laps: Lap[], driver: Driver, lap: number | "fastest") {
  const mine = laps.filter((l) => l.driver_number === driver.number && l.lap_duration && l.date_start);
  if (lap === "fastest") {
    const best = mine.filter((l) => !l.is_pit_out_lap).sort((a, b) => a.lap_duration! - b.lap_duration!)[0];
    if (!best) throw new RangeError(`${driver.code} has no timed lap in this session.`);
    return best;
  }
  const hit = mine.find((l) => l.lap_number === lap);
  if (!hit) throw new RangeError(`${driver.code} has no timed lap ${lap} in this session.`);
  return hit;
}

function stats(trace: Trace) {
  const p = trace.points;
  const dt = (i: number) => (i ? p[i].t - p[i - 1].t : 0);
  const total = trace.lap.lap_duration!;
  const fullThrottle = p.reduce((s, x, i) => s + (x.throttle >= 98 ? dt(i) : 0), 0);
  const braking = p.reduce((s, x, i) => s + (x.brake ? dt(i) : 0), 0);
  let zones = 0;
  for (let i = 1; i < p.length; i++) if (p[i].brake && !p[i - 1].brake) zones++;
  return {
    code: trace.driver.code,
    lap: trace.lap.lap_number,
    lapTime: formatLap(total),
    lapSeconds: total,
    topSpeed: Math.max(...p.map((x) => x.speed)),
    minSpeed: Math.min(...p.map((x) => x.speed)),
    avgSpeed: round1((trace.track.at(-1)!.d / total) * 3.6),
    fullThrottlePct: round1((fullThrottle / total) * 100),
    brakingPct: round1((braking / total) * 100),
    brakingZones: zones,
  };
}

export const getTelemetry = defineF1Tool({
  name: "get_telemetry",
  description:
    "Car telemetry for one lap (default the driver's fastest), resampled on an even distance grid: speed (km/h), throttle (%), brake (0/1), gear, RPM, and optionally track x/y. Pass compare to overlay a second driver's lap and get the time delta along the lap (where time was gained or lost). Works for any session.",
  input: z.object({
    session: sessionArg("session"),
    driver: z.string().max(30).describe('Driver code ("LEC"), number or surname.'),
    lap: z.union([z.number().int().min(1).max(90), z.literal("fastest")]).default("fastest"),
    compare: z.string().max(30).optional().describe("A second driver to compare on their own lap (fastest, or the same lap number)."),
    points: z.number().int().min(50).max(500).default(200).describe("Samples along the lap (default 200, max 500)."),
    include_track: z.boolean().default(false).describe("Add x/y track coordinates for a track map."),
    channels: z
      .array(z.enum(["speed", "throttle", "brake", "gear", "rpm"]))
      .default(["speed", "throttle", "brake", "gear"])
      .describe("Channels in rows (speed is always charted)."),
  }),
  output: {
    session: "2026 Azerbaijan Grand Prix · Qualifying",
    rows: [{ distance: 0, RUS_speed: 297, RUS_throttle: 100, RUS_brake: 0, RUS_gear: 7 }],
    chart: { labels: ["0"], series: [{ name: "RUS", values: [297] }], xLabel: "Distance (m)", yLabel: "Speed (km/h)" },
    delta: { meaning: "Positive: LEC is behind RUS at that point.", chart: { labels: ["0"], series: [{ name: "LEC − RUS", values: [0] }] } },
    summary: [{ code: "RUS", lap: 25, lapTime: "1:42.526", topSpeed: 331, fullThrottlePct: 60.1 }],
  },
  async run({ session: ref, driver, lap, compare, points, include_track, channels }, { signal }) {
    const { session, label, note } = await openSession(ref, signal, "Race");
    const [laps, drivers] = await Promise.all([getLaps(session, signal), sessionDrivers(session, signal)]);
    const [main, other] = resolveDrivers(compare ? [driver, compare] : [driver], drivers);
    const traces = [await lapTrace(session, main, pickLap(laps, main, lap), signal)];
    if (other) traces.push(await lapTrace(session, other, pickLap(laps, other, lap), signal));
    const { geometric, length } = measure(traces);

    const step = length / (points - 1);
    const grid = Array.from({ length: points }, (_, i) => Math.round(i * step));
    const speeds = new Map(traces.map((tr) => [tr.driver.code, [] as number[]]));
    const rows = grid.map((dist) => {
      const row: Record<string, unknown> = { distance: dist };
      for (const tr of traces) {
        const n = nearest(tr, dist);
        const c = tr.driver.code;
        const speed = Math.round(valueAt(tr, "speed", dist));
        speeds.get(c)!.push(speed);
        if (channels.includes("speed")) row[`${c}_speed`] = speed;
        if (channels.includes("throttle")) row[`${c}_throttle`] = Math.round(valueAt(tr, "throttle", dist));
        if (channels.includes("brake")) row[`${c}_brake`] = n.brake;
        if (channels.includes("gear")) row[`${c}_gear`] = n.gear;
        if (channels.includes("rpm")) row[`${c}_rpm`] = Math.round(valueAt(tr, "rpm", dist));
        if (include_track && n.x !== undefined) {
          row[`${c}_x`] = n.x;
          row[`${c}_y`] = n.y;
        }
      }
      return row;
    });
    const labels = grid.map(String);
    const chart = {
      labels,
      series: traces.map((tr) => ({ name: tr.driver.code, values: speeds.get(tr.driver.code)! })),
      xLabel: "Distance (m)",
      yLabel: "Speed (km/h)",
    };
    const [a, b] = traces;
    const delta = b
      ? {
          meaning: `Cumulative time difference along the lap. Positive: ${b.driver.code} is behind ${a.driver.code} at that point; where the line rises, ${b.driver.code} is losing time; where it falls, gaining. It ends at the lap-time difference; smoothed over about 150 m because positions are sampled four times a second.`,
          chart: {
            labels,
            series: [{ name: `${b.driver.code} − ${a.driver.code}`, values: smooth(grid.map((dist) => timeAt(b, dist) - timeAt(a, dist)), Math.round(75 / step)).map(round3) }],
            xLabel: "Distance (m)",
            yLabel: "Time delta (s)",
          },
        }
      : undefined;
    // 2026 cars have no DRS channel in OpenF1; say so rather than showing an empty series.
    const noDrs = traces.every((tr) => tr.points.every((p) => p.drs == null));
    return {
      session: label,
      lapLength: Math.round(length),
      rows,
      chart,
      delta,
      summary: traces.map(stats),
      note: joinNotes(
        note,
        !geometric && "Distance is integrated from speed (no track positions), so corners can be a few metres apart between laps.",
        noDrs && "No DRS channel in this data.",
      ),
    };
  },
});
