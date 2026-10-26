import { describe, expect, it } from "vitest";
import { kpiColumns } from "./kpiLayout";

describe("kpiColumns", () => {
  it("keeps every tile in one row when they fit", () => {
    expect(kpiColumns(7, 1350)).toBe(7);
  });

  it("balances rows instead of leaving a lone tile", () => {
    expect(kpiColumns(6, 900)).toBe(3); // 3 + 3, not 5 + 1
    expect(kpiColumns(7, 900)).toBe(4); // 4 + 3
  });

  it("keeps two tiles a row on a phone", () => {
    expect(kpiColumns(6, 318)).toBe(2);
  });
});
