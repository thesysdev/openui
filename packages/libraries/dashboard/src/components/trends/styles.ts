import { smallMultiplesRules } from "./SmallMultiples/smallMultiples.styles";
import { statusTimelineRules } from "./StatusTimeline/statusTimeline.styles";
import { timeSeriesRules } from "./TimeSeries/timeSeries.styles";
// Raw CSS: compiled once, in a fixed order, by lib/styles.ts.
export const trendsStyles = [
  ...timeSeriesRules,
  ...statusTimelineRules,
  ...smallMultiplesRules,
].join("");
