import { relationshipsStyles } from "../../components/relationships/styles";
import type { Group } from "../group";
import { CohortsComponent } from "./Cohorts";
import { HeatmapComponent } from "./Heatmap";
import { ScatterComponent } from "./Scatter";
export const relationships: Group = {
  components: [ScatterComponent, HeatmapComponent, CohortsComponent],
  styles: { relationships: relationshipsStyles },
};
