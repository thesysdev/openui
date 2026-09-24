import { openDatabase, queryRace } from "./analytics";
import { raceQuerySchema } from "./query-args";
import { race, type Driver } from "./race-data";

export function raceQueryTool(drivers: Driver[]) {
  return {
    type: "function" as const,
    name: "query_race",
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

export async function executeRaceQuery(
  argsJson: string,
  { signal }: { signal?: AbortSignal } = {},
) {
  signal?.throwIfAborted();
  const args = raceQuerySchema.parse(JSON.parse(argsJson));
  const db = openDatabase();
  try {
    return JSON.stringify(queryRace(db, args));
  } finally {
    db.close();
  }
}
