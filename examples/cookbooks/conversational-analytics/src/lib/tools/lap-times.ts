import type { DatabaseSync } from "node:sqlite";
import { z } from "zod/v4";
import { listDrivers, openDatabase, race, type Driver } from "../f1-data";

// The query_lap_times function tool: its JSON schema for Gateway, argument validation,
// the read-only query, and the executor the tool loop calls.

export function queryLapTimesTool(drivers: Driver[]) {
  return {
    type: "function" as const,
    name: "query_lap_times",
    description: `Query recorded lap times from the ${race.name}. Rank each driver's fastest lap or compare up to four drivers lap by lap. Times are seconds; lower is faster. Read-only server-owned SQL.`,
    parameters: {
      type: "object",
      properties: {
        view: { type: "string", enum: ["fastest_laps", "lap_times"] },
        driver_numbers: {
          type: "array",
          items: { type: "integer", enum: drivers.map((driver) => driver.number) },
          maxItems: 4,
          description: "Empty for all drivers in fastest_laps; select one to four for lap_times.",
        },
        lap_start: {
          type: "integer",
          minimum: 1,
          maximum: race.laps,
          description: "First lap, inclusive. Use 1 for the whole race.",
        },
        lap_end: {
          type: "integer",
          minimum: 1,
          maximum: race.laps,
          description: "Last lap, inclusive. Use 57 for the whole race.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 20,
          description:
            "Number of drivers in the fastest-lap ranking. Use 5 unless asked otherwise.",
        },
      },
      required: ["view", "driver_numbers", "lap_start", "lap_end", "limit"],
      additionalProperties: false,
    },
    strict: true,
  };
}

// Validate arguments again on the server; the model's output is untrusted input.
const argsSchema = z
  .object({
    view: z.enum(["fastest_laps", "lap_times"]),
    driver_numbers: z.array(z.number().int().positive()).max(4),
    lap_start: z.number().int().min(1).max(race.laps),
    lap_end: z.number().int().min(1).max(race.laps),
    limit: z.number().int().min(1).max(20),
  })
  .strict()
  .superRefine((args, ctx) => {
    if (args.lap_start > args.lap_end)
      ctx.addIssue({ code: "custom", message: "The start lap must be at or before the end lap." });
    if (new Set(args.driver_numbers).size !== args.driver_numbers.length)
      ctx.addIssue({ code: "custom", message: "Choose each driver only once." });
    if (args.view === "lap_times" && args.driver_numbers.length === 0)
      ctx.addIssue({
        code: "custom",
        message: "Choose one to four drivers for a lap-time comparison.",
      });
  });

export async function executeQueryLapTimes(
  argsJson: string,
  { signal }: { signal?: AbortSignal } = {},
) {
  signal?.throwIfAborted();
  const args = argsSchema.parse(JSON.parse(argsJson));
  const db = openDatabase();
  try {
    return JSON.stringify(queryLapTimes(db, args));
  } finally {
    db.close();
  }
}

type Lap = { driver_number: number; lap_number: number; duration_ms: number };

function formatLapTime(ms: number) {
  return `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000).toFixed(3).padStart(6, "0")}`;
}

function queryLapTimes(db: DatabaseSync, args: z.infer<typeof argsSchema>) {
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
