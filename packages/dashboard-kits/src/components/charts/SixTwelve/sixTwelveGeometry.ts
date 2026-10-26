// Amazon's 6-12 chart: the last 6 weeks beside the last 12 months, each with
// last year faded behind it and the plan dashed. Weeks and months sum to
// different sizes, so each panel has its own value scale; the weeks panel
// takes a third of the width so a week and a month are drawn the same width.

export interface Panel {
  labels: string[];
  current: number[];
  yearAgo: number[];
  plan?: number[];
}

/** A panel's value range with 10% headroom, from zero when the values sit near it. */
export function panelDomain(panel: Panel): [number, number] {
  const values = [...panel.current, ...panel.yearAgo, ...(panel.plan ?? [])].filter(
    Number.isFinite,
  );
  if (values.length === 0) return [0, 1];
  const low = Math.min(...values);
  const high = Math.max(...values);
  const pad = (high - low || Math.abs(high) || 1) * 0.1;
  const from = low - pad < high * 0.25 ? 0 : low - pad;
  return [Math.max(0, from), high + pad];
}

/** Where the two panels sit across `width`, with `gap` between them. */
export function panelSpans(
  width: number,
  gap: number,
): { weeks: [number, number]; months: [number, number] } {
  const inner = Math.max(0, width - gap);
  const split = inner / 3;
  return { weeks: [0, split], months: [split + gap, width] };
}
