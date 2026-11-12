import { mapsStyles } from "../../components/maps/styles";
import type { Group } from "../group";
import { GeoMapComponent } from "./GeoMap";
import { PointMapComponent } from "./PointMap";
export const maps: Group = {
  components: [GeoMapComponent, PointMapComponent],
  styles: { maps: mapsStyles },
};
