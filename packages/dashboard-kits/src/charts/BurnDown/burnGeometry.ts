// Where a commit's lines go, in term-share (x, 0–1) and credits (y):
//   used      = cumulative use at the end of each month of the term so far
//   ideal     = a straight line from nothing to the full commit at renewal
//   projected = from today's use to where this pace ends at renewal

export interface BurnInput {
  /** Cumulative use at the end of each month so far. */
  burn: number[];
  committed: number;
  /** Share of the term gone, 0–1. */
  elapsed: number;
  projected: number;
}

export type Point = [x: number, y: number];

export function burnGeometry({ burn, committed, elapsed, projected }: BurnInput) {
  const n = burn.length;
  const used: Point[] = [[0, 0], ...burn.map((v, i): Point => [(elapsed * (i + 1)) / n, v])];
  const now = used[used.length - 1]!;
  return {
    used,
    ideal: [
      [0, 0],
      [1, committed],
    ] as Point[],
    projected: [now, [1, projected]] as Point[],
    top: Math.max(committed, projected, now[1]),
  };
}
