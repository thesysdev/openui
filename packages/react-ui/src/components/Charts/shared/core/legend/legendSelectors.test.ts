import { describe, expect, it } from "vitest";
import { indexToKey, keyToIndex, stackedItemsFromSlices } from "./legendSelectors";

const slices = [
  { label: "Apples", value: 10, color: "#a00" },
  { label: "Pears", value: 5, color: "#0a0" },
];

describe("stackedItemsFromSlices", () => {
  it("maps slices to items keyed by label", () => {
    expect(stackedItemsFromSlices(slices)).toEqual([
      { key: "Apples", label: "Apples", color: "#a00", value: 10 },
      { key: "Pears", label: "Pears", color: "#0a0", value: 5 },
    ]);
  });
});

describe("indexToKey / keyToIndex", () => {
  it("round-trips a valid index/key", () => {
    expect(indexToKey(slices, 1)).toBe("Pears");
    expect(keyToIndex(slices, "Pears")).toBe(1);
  });
  it("returns null for null/out-of-range/missing", () => {
    expect(indexToKey(slices, null)).toBeNull();
    expect(indexToKey(slices, 9)).toBeNull();
    expect(keyToIndex(slices, null)).toBeNull();
    expect(keyToIndex(slices, "Bananas")).toBeNull();
  });
  it("returns null for negative index and empty slice arrays", () => {
    expect(indexToKey(slices, -1)).toBeNull();
    expect(indexToKey([], 0)).toBeNull();
    expect(keyToIndex([], "x")).toBeNull();
  });
});
