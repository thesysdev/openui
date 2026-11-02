import { ButtonComponent } from "./Button";
import { ButtonGroupComponent } from "./ButtonGroup";
import { CalloutComponent } from "./Callout";
import { CardRowComponent } from "./CardRow";
import { AreaChartComponent } from "./Charts/AreaChart";
import { BarChartComponent } from "./Charts/BarChart";
import { HorizontalBarChartComponent } from "./Charts/HorizontalBarChart";
import { LineChartComponent } from "./Charts/LineChart";
import { PieChartComponent } from "./Charts/PieChart";
import { RadarChartComponent } from "./Charts/RadarChart";
import { RadialChartComponent } from "./Charts/RadialChart";
import { ScatterChartComponent } from "./Charts/ScatterChart";
import {
  PointComponent,
  ScatterSeriesComponent,
  SeriesComponent,
  SliceComponent,
} from "./Charts/dataComponents";
import { DashboardComponent } from "./Dashboard";
import { DashboardCardHeaderComponent } from "./DashboardCardHeader";
import { DashboardHeaderComponent } from "./DashboardHeader";
import { DatePickerComponent } from "./DatePicker";
import { EntityListComponent } from "./EntityList";
import { FilterBarComponent } from "./FilterBar";
import { FilterMultiSelectComponent, FilterSelectComponent } from "./FilterSelect";
import { IconComponent } from "./Icon";
import { IconButtonComponent } from "./IconButton";
import { IconTagComponent } from "./IconTag";
import { IconTextComponent } from "./IconText";
import { ImageBlockComponent } from "./ImageBlock";
import { LargeCardComponent } from "./LargeCard";
import { ListComponent, ListItemComponent } from "./List";
import { MarkDownRendererComponent } from "./MarkDownRenderer";
import { MediumCardComponent } from "./MediumCard";
import { MetricIndicatorComponent } from "./MetricIndicator";
import { OverviewCardBlockComponent, OverviewCardItemComponent } from "./OverviewCardBlock";
import { SectionComponent } from "./Section";
import { SelectComponent, SelectItemComponent } from "./Select";
import { SmallCardComponent } from "./SmallCard";
import { ColComponent, TableComponent } from "./Table";
import { TagBlockComponent, TagComponent } from "./TagBlock";
import { TextBlockComponent } from "./TextBlock";
import { TextCalloutComponent } from "./TextCallout";
import { TextContentComponent } from "./TextContent";
/**
 * All openui-lang components that make up the Dashboard artifact.
 *
 * Consumers using Mode B (embed Dashboard inside a bigger chat library)
 * import this array and spread it into their own `createLibrary({...})` call
 * — importing from here is side-effect-free; no `createLibrary` runs at
 * module load.
 */
export const dashboardComponents = [
  // Root + Layout (4)
  DashboardComponent,
  DashboardHeaderComponent,
  SectionComponent,
  CardRowComponent,
  // Cards (3)
  SmallCardComponent,
  MediumCardComponent,
  LargeCardComponent,
  // Card internals (4)
  DashboardCardHeaderComponent,
  MetricIndicatorComponent,
  OverviewCardItemComponent,
  OverviewCardBlockComponent,
  // Filtering (3)
  FilterBarComponent,
  FilterSelectComponent,
  FilterMultiSelectComponent,
  // Charts (8)
  LineChartComponent,
  BarChartComponent,
  AreaChartComponent,
  HorizontalBarChartComponent,
  RadarChartComponent,
  ScatterChartComponent,
  RadialChartComponent,
  PieChartComponent,
  // Chart data helpers
  SeriesComponent,
  ScatterSeriesComponent,
  PointComponent,
  SliceComponent,
  // Utility (5)
  CalloutComponent,
  DatePickerComponent,
  EntityListComponent,
  IconButtonComponent,
  IconTextComponent,
  // Text primitives (3)
  IconComponent,
  IconTagComponent,
  TextBlockComponent,
  // Table (2)
  ColComponent,
  TableComponent,
  // Content & interaction (12)
  ButtonComponent,
  ButtonGroupComponent,
  SelectItemComponent,
  SelectComponent,
  TextContentComponent,
  MarkDownRendererComponent,
  TextCalloutComponent,
  ImageBlockComponent,
  TagComponent,
  TagBlockComponent,
  ListItemComponent,
  ListComponent,
];
