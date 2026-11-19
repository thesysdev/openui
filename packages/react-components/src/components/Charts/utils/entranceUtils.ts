/**
 * Per-element entrance stagger, shared by every painter's element map.
 *
 * PURE, not a hook — 6 of the 7 painters call this inside `data.map(...)`,
 * where a hook would violate rules-of-hooks. The caller passes a pre-computed
 * `delayMs` so each chart keeps its own intentional stagger basis (scatter
 * per-point, radar per-series, heatmap per-column, …) and cap (heatmap clamps
 * the delay; the others don't).
 *
 * Owns only the half that's identical everywhere: gate the `--animated`
 * modifier and format the delay on `animate`. The base class and any other
 * modifiers (`--negative`, `--empty`, funnel's `-stage`) stay in the caller's
 * className expression; the returned `animationDelay` is the raw value (not a
 * wrapped `style`) so callers merge it into their own style object.
 */
const entranceProps = (
  animate: boolean | undefined,
  animatedClass: string,
  delayMs: number,
): { className: string; animationDelay: string | undefined } => ({
  className: animate ? animatedClass : "",
  animationDelay: animate ? `${delayMs}ms` : undefined,
});

export { entranceProps };
