import { baseRules } from "./base.styles";
import { deltaBadgeRules } from "./DeltaBadge/deltaBadge.styles";
import { legendRules } from "./Legend/legend.styles";
import { partsLegendRules } from "./PartsLegend/partsLegend.styles";
import { rampKeyRules } from "./RampKey/rampKey.styles";
import { rankedListRules } from "./RankedList/rankedList.styles";
import { rowHoverRules } from "./RowHover/rowHover.styles";
import { rowMarksRules } from "./RowMarks/rowMarks.styles";
import { scrollAreaRules } from "./ScrollArea/scrollArea.styles";
import { sortToggleRules } from "./SortToggle/sortToggle.styles";
import { statesRules } from "./States/states.styles";
import { statusIconRules } from "./StatusIcon/statusIcon.styles";
import { tooltipCardRules } from "./TooltipCard/tooltipCard.styles";
import { viewSwitchRules } from "./ViewSwitch/viewSwitch.styles";

// Original sharedStyles.ts rule order, including intact responsive blocks.
// Compile once: goober merges repeated at-rules within one stylesheet.
export const sharedStyleRules = [
  viewSwitchRules[0], // segmented control and its small size (ViewSwitch; filters reuse it)
  baseRules[0], // chart header row (ViewSwitch and the chart groups)
  viewSwitchRules[1], // view switch and its label in the chart header
  baseRules[1], // size key (Scatter, PointMap)
  legendRules[0], // legend shape marks
  viewSwitchRules[2], // segmented hover, checked and disabled
  statusIconRules[0], // status icon and its tones
  baseRules[2], // bar textures .tex-0 to .tex-5
  deltaBadgeRules[0], // delta badge and its tones
  legendRules[1], // legend, its overflow menu and swatches
  tooltipCardRules[0], // tooltip card
  rowHoverRules[0], // hoverable rows and the row tooltip
  rowMarksRules[0], // row grid and guide
  baseRules[3], // row baseline and chip (comparison intervals)
  rowMarksRules[1], // tooltip marks
  baseRules[4], // tooltip dot (the chart groups)
  scrollAreaRules[0], // scroll fill
  rankedListRules[0], // rank panel and map side panel
  scrollAreaRules[1], // scroll area, fades and steps; also the filter menus' scrollbars
  rankedListRules[1], // map side panel head
  sortToggleRules[0], // sort toggle
  rankedListRules[2], // ranked list rows, and their narrow-container layout
  partsLegendRules[0], // parts legend
  statesRules[0], // empty and loading states
  baseRules[5], // filter caret and checkbox (filters), chart, and a stat above a chart (cards)
  viewSwitchRules[3], // segmented focus ring
  rampKeyRules[0], // colour ramp key
] as const;

/** Raw CSS: compiled once, in a fixed order, by lib/styles.ts. */
export const sharedStyles = sharedStyleRules.join("");
