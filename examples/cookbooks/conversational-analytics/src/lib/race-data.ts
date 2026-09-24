import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod/v4";

export const race = {
  sessionKey: 9507,
  name: "2024 Miami Grand Prix",
  date: "2024-05-05",
  laps: 57,
  source: "https://openf1.org/docs/",
} as const;

const sessionSchema = z.object({
  session_key: z.literal(race.sessionKey),
  session_name: z.literal("Race"),
  circuit_short_name: z.literal("Miami"),
  year: z.literal(2024),
});
const driverSchema = z.object({
  session_key: z.literal(race.sessionKey),
  driver_number: z.number().int().positive(),
  full_name: z.string().min(1),
  name_acronym: z.string().min(1),
  team_name: z.string().min(1),
});
const lapSchema = z.object({
  session_key: z.literal(race.sessionKey),
  driver_number: z.number().int().positive(),
  lap_number: z.number().int().positive(),
  lap_duration: z.number().positive().nullable(),
});
const raceDataSchema = z.object({
  sessions: z.array(sessionSchema).length(1),
  drivers: z.array(driverSchema).min(1),
  laps: z.array(lapSchema).min(1),
});
export type Driver = { number: number; name: string; acronym: string; team: string };

export function importRaceData(db: DatabaseSync, input: unknown) {
  const data = raceDataSchema.parse(input);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE drivers (number INTEGER PRIMARY KEY, name TEXT NOT NULL,
      acronym TEXT NOT NULL, team TEXT NOT NULL);
    CREATE TABLE laps (driver_number INTEGER REFERENCES drivers(number),
      lap_number INTEGER NOT NULL, duration_ms INTEGER,
      PRIMARY KEY (driver_number, lap_number));
  `);
  const driverInsert = db.prepare("INSERT INTO drivers VALUES (?, ?, ?, ?)");
  const lapInsert = db.prepare("INSERT INTO laps VALUES (?, ?, ?)");
  db.exec("BEGIN");
  try {
    for (const driver of data.drivers)
      driverInsert.run(
        driver.driver_number,
        driver.full_name,
        driver.name_acronym,
        driver.team_name,
      );
    for (const lap of data.laps) {
      // OpenF1 can emit a new-lap marker after the race ends. It is not a completed race lap.
      if (lap.lap_number > race.laps) continue;
      lapInsert.run(
        lap.driver_number,
        lap.lap_number,
        lap.lap_duration === null ? null : Math.round(lap.lap_duration * 1000),
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function openDatabase() {
  const path = resolve(process.cwd(), "data/race.sqlite");
  if (!existsSync(path))
    throw new Error("Dataset not prepared. Run npm run prepare:data, then retry.");
  return new DatabaseSync(path, { readOnly: true });
}

export function listDrivers(db: DatabaseSync): Driver[] {
  return db
    .prepare("SELECT number, name, acronym, team FROM drivers ORDER BY number")
    .all() as Driver[];
}
