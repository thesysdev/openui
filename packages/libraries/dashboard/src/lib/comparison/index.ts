import { comparisonStyles } from "../../components/comparison/styles";
import type { Group } from "../group";
import { BarsComponent } from "./Bars";
import { DistributionComponent } from "./Distribution";
import { DumbbellComponent } from "./Dumbbell";
import { IntervalsComponent } from "./Intervals";
import { LeaderboardComponent } from "./Leaderboard";

// Bars takes Series and Reference, which the Trends group registers.
export const comparison: Group = {
  components: [
    BarsComponent,
    LeaderboardComponent,
    DumbbellComponent,
    DistributionComponent,
    IntervalsComponent,
  ],
  styles: { comparison: comparisonStyles },
};
