import assert from "node:assert/strict";
import { openDatabase, queryRace } from "../src/lib/analytics";
import { listDrivers } from "../src/lib/race-data";

const db = openDatabase();
try {
  assert.equal(listDrivers(db).length, 20);
  const args = { view: "fastest_laps", driver_numbers: [], lap_start: 1, lap_end: 57, limit: 5 };
  const ranking = queryRace(db, args);
  assert.deepEqual(
    ranking.fastestLaps.map((lap) => [lap.driverNumber, lap.seconds]),
    [
      [81, 90.634],
      [23, 90.849],
      [11, 90.855],
      [55, 90.928],
      [4, 90.98],
    ],
  );
  assert.equal(ranking.fastestLaps[0].lap, 43);
  const comparison = queryRace(db, {
    ...args,
    view: "lap_times",
    driver_numbers: [4, 1],
    lap_start: 48,
  });
  assert.deepEqual(
    comparison.comparison?.labels,
    Array.from({ length: 10 }, (_, i) => String(i + 48)),
  );
  assert.equal(comparison.comparison?.series[0].values.at(-1), 91.575);
  assert.equal(comparison.comparison?.series[1].values.at(-1), 91.699);
  assert.equal(comparison.comparison?.gaps?.series[0].values.at(-1), 0.124);
  assert.deepEqual(comparison.comparison?.omittedLaps, []);
  console.log(
    "Verified Miami 2024: 20 drivers, the five fastest drivers, and Norris/Verstappen over laps 48–57.",
  );
} finally {
  db.close();
}
