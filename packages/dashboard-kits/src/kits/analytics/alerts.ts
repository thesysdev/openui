// How an alert rule turns daily values into notifications.
//
//   below      = the value fell more than the allowed drop under its usual level
//   N of M     = the alert is on for a day when at least N of the last M days were below
//   an alert   = a run of consecutive days the rule is on: a person is told once
//   quiet weekends = an alert that starts on a Saturday or Sunday is held to Monday
//                    9:00 (our rule); alerts that land on the same Monday are one

/** Whether the rule is on each day: at least `need` of the last `of` days below. */
export function nOfM(below: boolean[], need: number, of: number): boolean[] {
  return below.map((_, i) => {
    let count = 0;
    for (let k = Math.max(0, i - of + 1); k <= i; k++) if (below[k]) count++;
    return count >= need;
  });
}

/** Runs of consecutive days the rule is on, as [first, last] day indexes. */
export function runsOf(on: boolean[]): [number, number][] {
  const runs: [number, number][] = [];
  on.forEach((v, i) => {
    if (!v) return;
    const last = runs.at(-1);
    if (last && last[1] === i - 1) last[1] = i;
    else runs.push([i, i]);
  });
  return runs;
}

/**
 * The day each run's notification goes out: its first day, or with quiet
 * weekends the Monday after a weekend start (an index past the data means it
 * is still held). `weekday(i)` is 0 for Sunday … 6 for Saturday.
 */
export function deliveries(
  runs: [number, number][],
  weekday: (i: number) => number,
  quietWeekends: boolean,
): { run: [number, number]; day: number; held: boolean }[] {
  const out: { run: [number, number]; day: number; held: boolean }[] = [];
  for (const run of runs) {
    const w = weekday(run[0]);
    const wait = quietWeekends ? (w === 6 ? 2 : w === 0 ? 1 : 0) : 0;
    const day = run[0] + wait;
    const same = out.find((d) => d.day === day);
    if (same) same.run = [same.run[0], run[1]];
    else out.push({ run: [...run], day, held: wait > 0 });
  }
  return out;
}
