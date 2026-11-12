import {
  goalStyles,
  keyValuesStyles,
  kpiStyles,
  statStyles,
} from "../../components/metrics/styles";
import type { Group } from "../group";
import { GoalComponent } from "./Goal";
import { KeyValueComponent } from "./KeyValue";
import { KeyValuesComponent } from "./KeyValues";
import { KpiComponent } from "./Kpi";
import { KpisComponent } from "./Kpis";
import { StatComponent } from "./Stat";

export const metrics: Group = {
  components: [
    KpisComponent,
    KpiComponent,
    StatComponent,
    KeyValuesComponent,
    KeyValueComponent,
    GoalComponent,
  ],
  styles: {
    kpi: kpiStyles,
    stat: statStyles,
    keyValues: keyValuesStyles,
    goal: goalStyles,
  },
};
