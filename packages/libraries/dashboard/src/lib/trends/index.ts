import { trendsStyles } from "../../components/trends/styles";
import type { Group } from "../group";
import { MarkerComponent } from "./Marker";
import { ReferenceComponent } from "./Reference";
import { SeriesComponent } from "./Series";
import { SmallMultiplesComponent } from "./SmallMultiples";
import { StatusTimelineComponent } from "./StatusTimeline";
import { TimeSeriesComponent } from "./TimeSeries";
export const trends: Group = {
  components: [
    TimeSeriesComponent,
    SeriesComponent,
    ReferenceComponent,
    MarkerComponent,
    SmallMultiplesComponent,
    StatusTimelineComponent,
  ],
  styles: { trends: trendsStyles },
};
