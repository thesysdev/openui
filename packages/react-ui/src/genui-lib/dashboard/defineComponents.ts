import { ButtonComponent } from "./components/Button";
import { ButtonGroupComponent } from "./components/ButtonGroup";
import { CalloutComponent } from "./components/Callout";
import { CardRowComponent } from "./components/CardRow";
import { DashboardComponent } from "./components/Dashboard";
import { DashboardCardHeaderComponent } from "./components/DashboardCardHeader";
import { AreaChartComponent } from "./components/DashboardCharts/AreaChart";
import { BarChartComponent } from "./components/DashboardCharts/BarChart";
import { HorizontalBarChartComponent } from "./components/DashboardCharts/HorizontalBarChart";
import { LineChartComponent } from "./components/DashboardCharts/LineChart";
import { PieChartComponent } from "./components/DashboardCharts/PieChart";
import { RadarChartComponent } from "./components/DashboardCharts/RadarChart";
import { RadialChartComponent } from "./components/DashboardCharts/RadialChart";
import { ScatterChartComponent } from "./components/DashboardCharts/ScatterChart";
import {
  PointComponent,
  ScatterSeriesComponent,
  SeriesComponent,
} from "./components/DashboardCharts/dataComponents";
import { DashboardHeaderComponent } from "./components/DashboardHeader";
import { DatePickerComponent } from "./components/DatePicker";
import { EntityListComponent } from "./components/EntityList";
import { FilterBarComponent } from "./components/FilterBar";
import {
  FilterMultiSelectComponent,
  FilterOptionComponent,
  FilterSelectComponent,
} from "./components/FilterSelect";
import { IconComponent } from "./components/Icon";
import { IconButtonComponent } from "./components/IconButton";
import { IconTagComponent } from "./components/IconTag";
import { IconTextComponent } from "./components/IconText";
import { ImageBlockComponent } from "./components/ImageBlock";
import { LargeCardComponent } from "./components/LargeCard";
import { ListComponent, ListItemComponent } from "./components/List";
import { MarkDownRendererComponent } from "./components/MarkDownRenderer";
import { MediumCardComponent } from "./components/MediumCard";
import { MetricIndicatorComponent } from "./components/MetricIndicator";
import {
  OverviewCardBlockComponent,
  OverviewCardItemComponent,
} from "./components/OverviewCardBlock";
import { SectionComponent } from "./components/Section";
import { SelectComponent, SelectItemComponent } from "./components/Select";
import { SmallCardComponent } from "./components/SmallCard";
import { ColComponent, TableComponent } from "./components/Table";
import { TagBlockComponent, TagComponent } from "./components/TagBlock";
import { TextBlockComponent } from "./components/TextBlock";
import { TextCalloutComponent } from "./components/TextCallout";
import { TextContentComponent } from "./components/TextContent";
import { TrendComponent } from "./components/Trend";

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
  // Card internals (5)
  DashboardCardHeaderComponent,
  MetricIndicatorComponent,
  TrendComponent,
  OverviewCardItemComponent,
  OverviewCardBlockComponent,
  // Filtering (4)
  FilterBarComponent,
  FilterSelectComponent,
  FilterMultiSelectComponent,
  FilterOptionComponent,
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
