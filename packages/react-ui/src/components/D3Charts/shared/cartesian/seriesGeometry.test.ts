import { curveLinear, curveMonotoneX, area as d3Area, line as d3Line } from "d3-shape";
import { describe, expect, it } from "vitest";
import { AREA_STRIDE, buildAreaD, buildAreaEdgeD, buildLineD, LINE_STRIDE } from "./seriesGeometry";

type Pt = { x: number; y0: number; y1: number; yEdge: number };

const pts: Pt[] = [
  { x: 0, y0: 200, y1: 120, yEdge: 120 },
  { x: 50, y0: 200, y1: 80, yEdge: 80 },
  { x: 100, y0: 200, y1: 150, yEdge: 150 },
  { x: 150, y0: 200, y1: 60, yEdge: 60 },
];

const lineVector = Float64Array.from(pts.flatMap((p) => [p.x, p.y1]));
const areaVector = Float64Array.from(pts.flatMap((p) => [p.x, p.y0, p.y1, p.yEdge]));

describe("flat-vector path builders match direct d3 output", () => {
  it.each([
    ["linear", curveLinear],
    ["monotoneX", curveMonotoneX],
  ] as const)("buildLineD (%s curve)", (_name, curve) => {
    const direct = d3Line<Pt>()
      .x((p) => p.x)
      .y((p) => p.y1)
      .curve(curve)(pts);
    expect(buildLineD(lineVector, curve)).toBe(direct);
    expect(lineVector.length).toBe(pts.length * LINE_STRIDE);
  });

  it.each([
    ["linear", curveLinear],
    ["monotoneX", curveMonotoneX],
  ] as const)("buildAreaD (%s curve)", (_name, curve) => {
    const direct = d3Area<Pt>()
      .x((p) => p.x)
      .y0((p) => p.y0)
      .y1((p) => p.y1)
      .curve(curve)(pts);
    expect(buildAreaD(areaVector, curve)).toBe(direct);
    expect(areaVector.length).toBe(pts.length * AREA_STRIDE);
  });

  it("buildAreaEdgeD strokes the yEdge scalar, not y1", () => {
    // A diverging-stack shape: the edge differs from y1 on the "negative"
    // point (index 2), which is exactly what the edge scalar exists for.
    const edgy = areaVector.slice();
    edgy[2 * AREA_STRIDE + 3] = 230; // negative segment: edge = y(d[0]) below zero
    const direct = d3Line<number>()
      .x((i) => edgy[i * AREA_STRIDE]!)
      .y((i) => edgy[i * AREA_STRIDE + 3]!)
      .curve(curveLinear)(pts.map((_, i) => i));
    expect(buildAreaEdgeD(edgy, curveLinear)).toBe(direct);
    expect(buildAreaEdgeD(edgy, curveLinear)).not.toBe(buildLineD(lineVector, curveLinear));
  });

  it("empty vectors build empty path data", () => {
    expect(buildLineD(new Float64Array(0), curveLinear)).toBe("");
    expect(buildAreaD(new Float64Array(0), curveLinear)).toBe("");
    expect(buildAreaEdgeD(new Float64Array(0), curveLinear)).toBe("");
  });
});
