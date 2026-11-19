import { cohortsRules } from "./Cohorts/cohorts.styles";
import { relationshipsRules } from "./relationships.styles";
import { scatterRules } from "./Scatter/scatter.styles";

// Raw CSS: compiled once, in a fixed order, by lib/styles.ts.
export const relationshipsStyles = [
  ...scatterRules,
  relationshipsRules[0],
  cohortsRules[0],
  relationshipsRules[1],
  cohortsRules[1],
  relationshipsRules[2],
].join("");
