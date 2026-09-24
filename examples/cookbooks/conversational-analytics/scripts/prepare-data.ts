import { mkdir, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { importRaceData, race } from "../src/lib/f1-data";

const raw: Record<string, unknown> = {};
for (const endpoint of ["sessions", "drivers", "laps"]) {
  const response = await fetch(
    `https://api.openf1.org/v1/${endpoint}?session_key=${race.sessionKey}`,
    { signal: AbortSignal.timeout(30000) },
  );
  if (!response.ok)
    throw new Error(`OpenF1 ${endpoint}: HTTP ${response.status}. Retry preparation later.`);
  raw[endpoint] = await response.json();
}

// Build a fresh file, then swap it in so a failed import never leaves a partial database.
await mkdir("data", { recursive: true });
const temporary = resolve("data", `f1-${process.pid}.sqlite`);
const db = new DatabaseSync(temporary);
let closed = false;
try {
  importRaceData(db, raw);
  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM laps WHERE duration_ms > 0")
    .get() as { total: number };
  db.close();
  closed = true;
  await rename(temporary, resolve("data", "f1.sqlite"));
  console.log(`Prepared ${race.name}: ${total} recorded lap times.`);
} catch (error) {
  if (!closed) db.close();
  await rm(temporary, { force: true });
  throw error;
}
