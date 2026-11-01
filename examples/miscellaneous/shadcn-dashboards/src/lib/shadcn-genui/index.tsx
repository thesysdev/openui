"use client";

import type { ComponentGroup } from "@openuidev/react-lang";
import { createLibrary } from "@openuidev/react-lang";
import { Alert } from "./components/alert";
import { CardHeader } from "./components/card-header";
import { AreaChart, BarChart, LineChart, PieChart, Series } from "./components/charts";
import { Card, Stack, TabItem, Tabs } from "./components/containers";
import { Metric } from "./components/metric";
import { Progress } from "./components/progress";
import { Select, SelectItem } from "./components/select";
import { Separator } from "./components/separator";
import { Col, Table } from "./components/table";
import { Tag, TagBlock } from "./components/tag";
import { TextContent } from "./components/text-content";

export const dashboardComponentGroups: ComponentGroup[] = [
  {
    name: "Layout",
    components: ["Stack", "Card", "CardHeader", "Tabs", "TabItem", "Separator"],
    notes: [
      '- root is always a Stack. Rows are Stacks with direction "row"; their children share the width.',
      "- Group each chart or table in a Card with a CardHeader.",
    ],
  },
  {
    name: "KPIs and text",
    components: ["Metric", "TextContent", "Alert", "TagBlock", "Tag", "Progress"],
    notes: [
      '- Metric("Weekly downloads", dl.packages[0].total, "compact", dl.packages[0].change_pct)',
      "- Use Alert for a finding worth calling out, such as an unpatched critical advisory.",
    ],
  },
  {
    name: "Charts",
    components: ["LineChart", "AreaChart", "BarChart", "PieChart", "Series"],
    notes: [
      '- Charts take column arrays from a Query: LineChart(dl.periods, [Series("react", dl.packages[0].downloads)]).',
      '- One Series per item: LineChart(dl.periods, @Each(dl.packages, "p", Series(p.name, p.downloads)))',
      "- PieChart(labels, values) takes two arrays of the same length.",
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Col"],
    notes: [
      '- Table is column-oriented: Table([Col("Version", pkg.releases.version), Col("Date", pkg.releases.date, "date")]).',
      '- Styled cells: Col("Severity", @Each(v.vulnerabilities, "x", Tag(x.severity, "warning")))',
    ],
  },
  {
    name: "Filters",
    components: ["Select", "SelectItem"],
    notes: [
      '- Select("range", [SelectItem("3", "3 months"), SelectItem("6", "6 months")], null, null, $months), then Query("…", {months: $months}, …).',
    ],
  },
];

/** shadcn/ui components for live dashboards. Its root, Stack, lays out the whole dashboard. */
export const dashboardLibrary = createLibrary({
  root: "Stack",
  componentGroups: dashboardComponentGroups,
  components: [
    Stack,
    Card,
    CardHeader,
    Tabs,
    TabItem,
    Separator,
    Metric,
    TextContent,
    Alert,
    TagBlock,
    Tag,
    Progress,
    LineChart,
    AreaChart,
    BarChart,
    PieChart,
    Series,
    Table,
    Col,
    Select,
    SelectItem,
  ],
});
