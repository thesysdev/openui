// Golden regression suite: every sample program and interaction is rendered
// and compared against the committed fixture. Any output change fails here;
// intended changes are re-baselined with `pnpm run golden` and reviewed in the
// fixture diff.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "vitest";
import { buildScenarios } from "./fixtures/scenarios";

const golden = JSON.parse(readFileSync(new URL("./fixtures/golden.json", import.meta.url), "utf8"));
const actual = await buildScenarios();

describe("golden outputs match fixtures", () => {
  test("scenario set is unchanged", () => {
    assert.deepEqual(
      Object.keys(actual).sort(),
      Object.keys(golden).sort(),
      "scenario set changed",
    );
  });
  for (const key of Object.keys(golden)) {
    test(key, () => {
      assert.deepEqual(actual[key], golden[key]);
    });
  }
});
