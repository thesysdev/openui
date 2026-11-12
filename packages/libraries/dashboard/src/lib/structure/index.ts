import type { Group } from "../group";
import { CardComponent } from "./Card";
import { DashboardComponent } from "./Dashboard";
import { RowComponent } from "./Row";
import { SectionComponent } from "./Section";
export const structure: Group = {
  components: [DashboardComponent, SectionComponent, RowComponent, CardComponent],
  // The structure block is added by lib/styles.ts itself.
  styles: {},
};
