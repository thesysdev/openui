import { compositionStyles } from "../../components/composition/styles";
import type { Group } from "../group";
import { DonutComponent } from "./Donut";
import { SegmentedBarComponent } from "./SegmentedBar";
import { TreemapComponent } from "./Treemap";
import { WaterfallComponent } from "./Waterfall";
export const composition: Group = {
  components: [DonutComponent, SegmentedBarComponent, TreemapComponent, WaterfallComponent],
  styles: { composition: compositionStyles },
};
