import { describe, expect, it } from "vitest";
import {
  findNearestSnapPosition,
  getSnapPositions,
  getWidthOfData,
  getWidthOfGroup,
} from "./scrollUtils";

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ x: i }));

describe("getWidthOfGroup (density → px per category group)", () => {
  it("maps the three densities to 48 / 72 / 96", () => {
    expect(getWidthOfGroup("compact")).toBe(48);
    expect(getWidthOfGroup("default")).toBe(72);
    expect(getWidthOfGroup("spacious")).toBe(96);
  });

  it("defaults to the default density", () => {
    expect(getWidthOfGroup()).toBe(72);
  });
});

describe("getWidthOfData (inner scroll width)", () => {
  it("is data.length × group width when that exceeds the container", () => {
    expect(getWidthOfData(rows(10), 300)).toBe(720);
    expect(getWidthOfData(rows(10), 300, getWidthOfGroup("compact"))).toBe(480);
    expect(getWidthOfData(rows(10), 300, getWidthOfGroup("spacious"))).toBe(960);
    // a group widened to fit its labels
    expect(getWidthOfData(rows(10), 300, 130)).toBe(1300);
  });

  it("floors at the available container width (no horizontal scroll)", () => {
    expect(getWidthOfData(rows(10), 1000)).toBe(1000);
    expect(getWidthOfData(rows(10), 720)).toBe(720); // exact fit counts as fitting
  });

  it("returns the container width for empty data", () => {
    expect(getWidthOfData([], 555)).toBe(555);
  });

  it("floors a single point at 200px when the container is narrower than a group", () => {
    expect(getWidthOfData(rows(1), 40, getWidthOfGroup("compact"))).toBe(200);
    // …but a container wider than the group still wins
    expect(getWidthOfData(rows(1), 500, getWidthOfGroup("compact"))).toBe(500);
  });
});

describe("getSnapPositions (one stop per group)", () => {
  it("steps by the group width", () => {
    expect(getSnapPositions(rows(4))).toEqual([0, 72, 144, 216]);
    expect(getSnapPositions(rows(3), 130)).toEqual([0, 130, 260]);
    expect(getSnapPositions([], 130)).toEqual([0]);
  });
});

describe("findNearestSnapPosition (scroll-button stepping)", () => {
  const positions = [0, 72, 144, 216];

  it("steps to the neighbor of the last snap at or before the current scroll", () => {
    // currentScroll 100 sits in [72, 144) → current index 1
    expect(findNearestSnapPosition(positions, 100, "left")).toBe(0);
    expect(findNearestSnapPosition(positions, 100, "right")).toBe(2);
    // exactly on a snap counts as being at it
    expect(findNearestSnapPosition(positions, 72, "left")).toBe(0);
    expect(findNearestSnapPosition(positions, 72, "right")).toBe(2);
  });

  it("clamps at both ends", () => {
    expect(findNearestSnapPosition(positions, 0, "left")).toBe(0);
    expect(findNearestSnapPosition(positions, 9999, "right")).toBe(3);
  });

  it("scrolled past the last snap, left steps back to the second-to-last", () => {
    expect(findNearestSnapPosition(positions, 9999, "left")).toBe(2);
  });
});
