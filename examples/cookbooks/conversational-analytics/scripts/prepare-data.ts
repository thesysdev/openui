import { createHash } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { importRaceData, race, raceDataSchema } from "../src/lib/race-data";

const directory = resolve("data");
await mkdir(directory, { recursive: true });
const raw: Record<string, unknown> = {};
const sources: { url: string; sha256: string }[] = [];
for (const endpoint of ["sessions", "drivers", "laps"]) {
  const url = `https://api.openf1.org/v1/${endpoint}?session_key=${race.sessionKey}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok)
    throw new Error(`OpenF1 ${endpoint}: HTTP ${response.status}. Retry preparation later.`);
  const text = await response.text();
  raw[endpoint] = JSON.parse(text);
  sources.push({ url, sha256: createHash("sha256").update(text).digest("hex") });
}
const data = raceDataSchema.parse(raw);
const temporary = resolve(directory, `race-${process.pid}.sqlite`);
const db = new DatabaseSync(temporary);
let closed = false;
try {
  importRaceData(db, data);
  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM laps WHERE duration_ms > 0")
    .get() as { total: number };
  if (data.drivers.length !== 20 || total < 1000)
    throw new Error("OpenF1 returned an incomplete race snapshot.");
  db.close();
  closed = true;
  await rename(temporary, resolve(directory, "race.sqlite"));
  await writeFile(
    resolve(directory, "manifest.json"),
    JSON.stringify(
      {
        race,
        fetchedAt: new Date().toISOString(),
        sources,
        drivers: data.drivers.length,
        timedLaps: total,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Prepared ${race.name}: ${data.drivers.length} drivers and ${total} recorded lap times.`,
  );
} catch (error) {
  if (!closed) db.close();
  await rm(temporary, { force: true });
  throw error;
}
