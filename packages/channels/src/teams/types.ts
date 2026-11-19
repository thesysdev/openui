// Teams-specific types.

/**
 * One rendered Teams card: a complete Adaptive Card document (schema 1.5, the
 * version Teams bots support). Chart Image elements carry a marker URL
 * (https://openui-chart.invalid/<chartId>) the transport replaces with a data
 * URI or hosted image when sending.
 */
export type TeamsCard = Record<string, any>;

/** Marker URL prefix for chart images awaiting transport-side resolution. */
export const CHART_MARKER_PREFIX = "https://openui-chart.invalid/";
