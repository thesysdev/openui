// The Recharts chart names, typed with the Recharts props, each rendering the
// D3Charts chart that replaces it. The stories under D3Charts/*/stories are
// copies of the Recharts chart stories that import these instead of the
// Recharts charts — same args, same renders — so every Recharts story renders
// the D3 charts with its props unchanged. Props a D3 chart doesn't take are
// passed through and ignored.
import type {
  AreaChartCondensedProps,
  AreaChartData,
  AreaChartProps,
  BarChartCondensedProps,
  BarChartData,
  BarChartProps,
  HorizontalBarChartData,
  HorizontalBarChartProps,
  LineChartCondensedProps,
  LineChartData,
  LineChartProps,
  MiniAreaChartProps,
  MiniBarChartProps,
  MiniLineChartProps,
  PieChartData,
  PieChartProps,
  RadarChartData,
  RadarChartProps,
  RadialChartData,
  RadialChartProps,
  ScatterChartProps,
  SingleStackedBarData,
  SingleStackedBarProps,
} from "../../Charts";
import { AreaChart as D3AreaChart } from "../AreaChart";
import { BarChart as D3BarChart } from "../BarChart";
import { LineChart as D3LineChart } from "../LineChart";
import { MiniAreaChart as D3MiniAreaChart } from "../MiniAreaChart";
import { MiniBarChart as D3MiniBarChart } from "../MiniBarChart";
import { MiniLineChart as D3MiniLineChart } from "../MiniLineChart";
import { PieChart as D3PieChart } from "../PieChart";
import { RadarChart as D3RadarChart } from "../RadarChart";
import { RadialChart as D3RadialChart } from "../RadialChart";
import { ScatterChart as D3ScatterChart } from "../ScatterChart";
import { SegmentedBar } from "../SegmentedBar";

export type {
  AreaChartCondensedProps,
  AreaChartProps,
  BarChartCondensedProps,
  BarChartProps,
  HorizontalBarChartProps,
  LineChartCondensedProps,
  LineChartProps,
  MiniBarChartProps,
  PieChartProps,
  RadarChartProps,
  RadialChartProps,
  ScatterChartProps,
  SingleStackedBarProps,
};

export const AreaChart = <T extends AreaChartData>(props: AreaChartProps<T>) => (
  <D3AreaChart {...(props as any)} />
);

export const AreaChartCondensed = <T extends AreaChartData>(props: AreaChartCondensedProps<T>) => (
  <D3AreaChart {...(props as any)} condensed />
);

export const BarChart = <T extends BarChartData>(props: BarChartProps<T>) => (
  <D3BarChart {...(props as any)} />
);

export const BarChartCondensed = <T extends BarChartData>(props: BarChartCondensedProps<T>) => (
  <D3BarChart {...(props as any)} condensed />
);

export const HorizontalBarChart = <T extends HorizontalBarChartData>(
  props: HorizontalBarChartProps<T>,
) => <D3BarChart {...(props as any)} orientation="horizontal" />;

export const LineChart = <T extends LineChartData>(props: LineChartProps<T>) => (
  <D3LineChart {...(props as any)} />
);

export const LineChartCondensed = <T extends LineChartData>(props: LineChartCondensedProps<T>) => (
  <D3LineChart {...(props as any)} condensed />
);

export const PieChart = <T extends PieChartData>(props: PieChartProps<T>) => (
  <D3PieChart {...(props as any)} />
);

export const RadarChart = <T extends RadarChartData>(props: RadarChartProps<T>) => (
  <D3RadarChart {...(props as any)} />
);

export const RadialChart = <T extends RadialChartData>(props: RadialChartProps<T>) => (
  <D3RadialChart {...(props as any)} />
);

export const ScatterChart = (props: ScatterChartProps) => <D3ScatterChart {...(props as any)} />;

export const SingleStackedBar = <T extends SingleStackedBarData>(
  props: SingleStackedBarProps<T>,
) => <SegmentedBar {...(props as any)} />;

export const MiniAreaChart = (props: MiniAreaChartProps) => <D3MiniAreaChart {...(props as any)} />;

export const MiniBarChart = (props: MiniBarChartProps) => <D3MiniBarChart {...(props as any)} />;

export const MiniLineChart = (props: MiniLineChartProps) => <D3MiniLineChart {...(props as any)} />;
