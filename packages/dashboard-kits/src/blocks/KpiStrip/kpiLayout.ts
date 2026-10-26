/** Narrowest a KPI tile gets before the strip wraps to another row. */
export const KPI_MIN_WIDTH = 168;
/** On phones, keep two tiles a row; one column would make the strip very tall. */
const PHONE_WIDTH = 520;
const PHONE_MIN_WIDTH = 140;

/**
 * Columns for a strip of tiles: as many as fit, then balanced across the rows
 * that needs, so six tiles wrap as 3 + 3 rather than 5 + 1.
 */
export function kpiColumns(count: number, width: number): number {
  const min = width < PHONE_WIDTH ? PHONE_MIN_WIDTH : KPI_MIN_WIDTH;
  const fit = Math.max(1, Math.min(count, Math.floor(width / min)));
  return Math.ceil(count / Math.ceil(count / fit));
}
