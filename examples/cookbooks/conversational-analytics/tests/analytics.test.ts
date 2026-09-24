import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { formatLapTime, queryRace } from "../src/lib/analytics";
import { raceQuerySchema } from "../src/lib/query-args";
import { importRaceData, race } from "../src/lib/race-data";

const base = { view: "fastest_laps", driver_numbers: [], lap_start: 1, lap_end: 57, limit: 5 };
function data() {
  return {
    sessions: [
      {
        session_key: race.sessionKey,
        session_name: "Race",
        circuit_short_name: "Miami",
        year: 2024,
      },
    ],
    drivers: [
      {
        session_key: race.sessionKey,
        driver_number: 4,
        full_name: "Lando Norris",
        name_acronym: "NOR",
        team_name: "McLaren",
      },
      {
        session_key: race.sessionKey,
        driver_number: 1,
        full_name: "Max Verstappen",
        name_acronym: "VER",
        team_name: "Red Bull",
      },
    ],
    laps: [
      [4, 1, 93.1],
      [4, 2, 91.2],
      [4, 3, 91.2],
      [4, 4, null],
      [4, 58, null],
      [1, 1, 92.8],
      [1, 2, null],
      [1, 3, 92.0],
    ].map(([driver_number, lap_number, lap_duration]) => ({
      session_key: race.sessionKey,
      driver_number,
      lap_number,
      lap_duration,
    })),
  };
}
function fixture() {
  const db = new DatabaseSync(":memory:");
  importRaceData(db, data());
  return db;
}

test("ranks each driver's best lap with deterministic ties, range and driver selection", () => {
  const db = fixture();
  try {
    const result = queryRace(db, base);
    assert.deepEqual(
      result.fastestLaps.map((row) => [row.driverNumber, row.lap, row.time]),
      [
        [4, 2, "1:31.200"],
        [1, 3, "1:32.000"],
      ],
    );
    assert.equal(queryRace(db, { ...base, lap_end: 1 }).fastestLaps[0].driverNumber, 1);
    assert.equal(queryRace(db, { ...base, driver_numbers: [1] }).fastestLaps[0].seconds, 92);
    assert.equal(queryRace(db, { ...base, limit: 1 }).fastestLaps.length, 1);
    assert.equal(formatLapTime(90634), "1:30.634");
  } finally {
    db.close();
  }
});

test("aligns comparisons on shared lap numbers without filling missing times with zero", () => {
  const db = fixture();
  try {
    const result = queryRace(db, {
      ...base,
      view: "lap_times",
      driver_numbers: [4, 1],
      lap_end: 4,
    });
    assert.deepEqual(result.comparison?.labels, ["1", "3"]);
    assert.deepEqual(
      result.comparison?.series.map((series) => series.values),
      [
        [93.1, 91.2],
        [92.8, 92],
      ],
    );
    assert.deepEqual(result.comparison?.omittedLaps, [2, 4]);
    assert.deepEqual(result.comparison?.gaps?.series[0].values, [-0.3, 0.8]);
    assert.equal(result.comparison?.gaps?.reference, "Lando Norris");
    const empty = queryRace(db, {
      ...base,
      view: "lap_times",
      driver_numbers: [4, 1],
      lap_start: 4,
      lap_end: 4,
    });
    assert.equal(empty.empty, true);
    assert.deepEqual(empty.comparison?.labels, []);
    assert.equal(queryRace(db, { ...base, lap_start: 50 }).empty, true);
  } finally {
    db.close();
  }
});

test("validates driver membership, inclusive lap ranges and bounded tool arguments", () => {
  for (const changes of [
    { lap_start: 0 },
    { lap_end: 58 },
    { lap_start: 20, lap_end: 10 },
    { driver_numbers: [4, 4] },
    { driver_numbers: [1, 2, 3, 4, 5] },
    { limit: 21 },
    { view: "lap_times" },
    { sql: "DROP TABLE laps" },
    { driver_numbers: ["4 OR 1=1"] },
  ])
    assert.equal(raceQuerySchema.safeParse({ ...base, ...changes }).success, false);
  const db = fixture();
  try {
    assert.throws(() => queryRace(db, { ...base, driver_numbers: [99] }), RangeError);
  } finally {
    db.close();
  }
});

test("import rejects wrong sessions and duplicate laps and omits the post-race marker", () => {
  const db = fixture();
  try {
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM laps").get() as { n: number }).n, 7);
  } finally {
    db.close();
  }
  for (const wrong of [
    { ...data(), sessions: [{ ...data().sessions[0], session_key: 1 }] },
    { ...data(), laps: [...data().laps, data().laps[0]] },
    { ...data(), laps: [{ ...data().laps[0], driver_number: 99 }] },
  ]) {
    const target = new DatabaseSync(":memory:");
    try {
      assert.throws(() => importRaceData(target, wrong));
    } finally {
      target.close();
    }
  }
});
