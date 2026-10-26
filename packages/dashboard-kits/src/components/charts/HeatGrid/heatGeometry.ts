/** Shade steps from the quietest cell to the busiest, as in the legend. */
export const HEAT_STEPS = 7;

/**
 * A cell's shade step, 0 (none) to HEAT_STEPS, relative to the busiest cell:
 * quantized so equal steps read as equal differences and the legend can name
 * each one. Zero stays zero; any activity gets at least the first step.
 */
export function heatStep(value: number, max: number, steps = HEAT_STEPS): number {
  if (!(value > 0) || !(max > 0)) return 0;
  return Math.max(1, Math.min(steps, Math.ceil((value / max) * steps)));
}

/** How much of the series color a step mixes into the card color, in percent. */
export function heatMix(step: number, steps = HEAT_STEPS): number {
  if (step <= 0) return 0;
  return Math.round(12 + ((step - 1) / Math.max(1, steps - 1)) * 88);
}

/** The cell under a point: its row and column, or null outside the grid. */
export function cellAt(
  px: number,
  py: number,
  grid: {
    left: number;
    top: number;
    cellWidth: number;
    cellHeight: number;
    rows: number;
    cols: number;
  },
): { row: number; col: number } | null {
  const col = Math.floor((px - grid.left) / grid.cellWidth);
  const row = Math.floor((py - grid.top) / grid.cellHeight);
  if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return null;
  return { row, col };
}
