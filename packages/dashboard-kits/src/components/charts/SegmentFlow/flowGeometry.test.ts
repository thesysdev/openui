import { describe, expect, it } from "vitest";
import { flowLayout } from "./flowGeometry";

const LINKS = [
  { from: "A", to: "A", value: 60 },
  { from: "A", to: "B", value: 40 },
  { from: "B", to: "A", value: 20 },
  { from: "B", to: "B", value: 80 },
];
const OPTIONS = { order: ["A", "B"], top: 0, bottom: 210, gap: 10, x0: 0, x1: 100 };

describe("flowLayout", () => {
  const { nodes, ribbons } = flowLayout(LINKS, OPTIONS);

  it("stacks each side's nodes in rank order on one scale", () => {
    expect(nodes.map((n) => `${n.side}:${n.name}`)).toEqual([
      "left:A",
      "left:B",
      "right:A",
      "right:B",
    ]);
    const [a, b] = nodes;
    expect(a!.y1 - a!.y0).toBeCloseTo(100);
    expect(b!.y0).toBeCloseTo(110);
    expect(nodes[2]!.y1 - nodes[2]!.y0).toBeCloseTo(80);
  });

  it("fills every node with its ribbons, end to end, without gaps", () => {
    const leaving = ribbons.filter((r) => r.from === "A");
    expect(leaving[0]!.source[0]).toBeCloseTo(nodes[0]!.y0);
    expect(leaving[0]!.source[1]).toBeCloseTo(leaving[1]!.source[0]);
    expect(leaving[1]!.source[1]).toBeCloseTo(nodes[0]!.y1);
    const arriving = ribbons.filter((r) => r.to === "B").sort((x, y) => x.target[0] - y.target[0]);
    expect(arriving[0]!.from).toBe("A");
    expect(arriving.at(-1)!.target[1]).toBeCloseTo(nodes[3]!.y1);
  });

  it("draws a closed ribbon from the left edge to the right", () => {
    expect(ribbons[0]!.d).toMatch(/^M0,.*L100,.*Z$/);
  });
});
