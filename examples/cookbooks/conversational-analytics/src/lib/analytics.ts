import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { raceQuerySchema } from "./query-args";
import { listDrivers, race } from "./race-data";

type Lap = { driver_number: number; lap_number: number; duration_ms: number };
function formatLapTime(ms: number) {
  return `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000).toFixed(3).padStart(6, "0")}`;
}
export function openDatabase() {
  const path = resolve(process.cwd(), "data/race.sqlite");
  if (!existsSync(path))
    throw new Error("Dataset not prepared. Run npm run prepare:data, then retry.");
  return new DatabaseSync(path, { readOnly: true });
}

export function queryRace(db: DatabaseSync, input: unknown) {
  const args = raceQuerySchema.parse(input);
  const drivers = listDrivers(db);
  if (args.driver_numbers.some((number) => !drivers.some((driver) => driver.number === number)))
    throw new RangeError("Choose a driver in the 2024 Miami Grand Prix.");
  const selected = args.driver_numbers.length
    ? args.driver_numbers.map((number) => drivers.find((driver) => driver.number === number)!)
    : drivers;
  const numbers = selected.map((driver) => driver.number);
  const placeholders = numbers.map(() => "?").join(",");
  const laps = db
    .prepare(
      `
    SELECT driver_number, lap_number, duration_ms FROM laps
    WHERE lap_number BETWEEN ? AND ? AND duration_ms > 0
      AND driver_number IN (${placeholders})
    ORDER BY duration_ms, lap_number, driver_number
  `,
    )
    .all(args.lap_start, args.lap_end, ...numbers) as Lap[];
  const best = new Map<number, Lap>();
  for (const lap of laps) if (!best.has(lap.driver_number)) best.set(lap.driver_number, lap);
  const fastestLaps = [...best.values()]
    .map((lap, index) => {
      const driver = selected.find((driver) => driver.number === lap.driver_number)!;
      return {
        rank: index + 1,
        driver: driver.name,
        team: driver.team,
        driverNumber: driver.number,
        lap: lap.lap_number,
        time: formatLapTime(lap.duration_ms),
        seconds: lap.duration_ms / 1000,
      };
    })
    .slice(0, args.limit);

  const byDriver = new Map(selected.map((driver) => [driver.number, new Map<number, number>()]));
  for (const lap of laps)
    byDriver.get(lap.driver_number)!.set(lap.lap_number, lap.duration_ms / 1000);
  const requestedLaps = Array.from(
    { length: args.lap_end - args.lap_start + 1 },
    (_, i) => args.lap_start + i,
  );
  // Series accepts numbers, so compare only laps with a recorded time for every selected driver.
  // Never turn a missing time into zero or shift another driver's values onto a different lap.
  const sharedLaps = requestedLaps.filter((lap) =>
    numbers.every((number) => byDriver.get(number)!.has(lap)),
  );
  const comparison =
    args.view === "lap_times"
      ? {
          labels: sharedLaps.map(String),
          series: selected.map((driver) => ({
            name: driver.name,
            values: sharedLaps.map((lap) => byDriver.get(driver.number)!.get(lap)!),
          })),
          gaps:
            selected.length > 1
              ? {
                  reference: selected[0].name,
                  meaning: `Positive values mean ${selected[0].name} completed that lap faster; negative values mean the other driver was faster. This is a lap-time difference, not the cumulative race gap.`,
                  series: selected.slice(1).map((driver) => ({
                    name: `${driver.name} minus ${selected[0].name}`,
                    values: sharedLaps.map(
                      (lap) =>
                        Math.round(
                          (byDriver.get(driver.number)!.get(lap)! -
                            byDriver.get(selected[0].number)!.get(lap)!) *
                            1000,
                        ) / 1000,
                    ),
                  })),
                }
              : null,
          omittedLaps: requestedLaps.filter((lap) => !sharedLaps.includes(lap)),
        }
      : null;
  const empty = args.view === "lap_times" ? sharedLaps.length === 0 : fastestLaps.length === 0;
  return {
    race: race.name,
    scope: `Laps ${args.lap_start}–${args.lap_end} · ${args.driver_numbers.length ? selected.map((driver) => driver.name).join(", ") : "All drivers"}`,
    view: args.view,
    empty,
    summary: empty
      ? "No recorded lap times for this selection. Try another lap range or driver."
      : args.view === "fastest_laps"
        ? `The fastest recorded lap per driver, ranked by time. Showing ${fastestLaps.length} drivers.`
        : `Comparing ${selected.length} drivers across ${sharedLaps.length} shared timed laps. Lower times are faster.`,
    fastestLaps,
    comparison,
  };
}
