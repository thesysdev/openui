"use client";

import { Tabs as ShadcnTabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { defineComponent } from "@openuidev/react-lang";
import { useState } from "react";
import { z } from "zod";
import { asArray, isElement } from "../format";
import { Alert } from "./alert";
import { CardHeader } from "./card-header";
import { AreaChart, BarChart, LineChart, PieChart } from "./charts";
import { Metric } from "./metric";
import { Progress } from "./progress";
import { Select } from "./select";
import { Separator } from "./separator";
import { Table } from "./table";
import { TagBlock } from "./tag";
import { TextContent } from "./text-content";

const gaps: Record<string, string> = { none: "gap-0", s: "gap-2", m: "gap-4", l: "gap-6" };

// The dashboard's root and its rows. A row is a grid of equal columns that wraps on narrow
// screens, so a row of Metric tiles or Cards stays even.
export const Stack = defineComponent({
  name: "Stack",
  props: z.object({
    children: z.array(z.any()),
    direction: z.enum(["column", "row"]).optional(),
    gap: z.enum(["none", "s", "m", "l"]).optional(),
    align: z.enum(["start", "center", "end", "stretch"]).optional(),
  }),
  description:
    'Layout container; the dashboard root. direction "column" (default) stacks sections; "row" puts children side by side, sharing the width equally and wrapping on narrow screens (KPI rows, two charts side by side, a filter bar). gap: "none" | "s" | "m" (default) | "l".',
  component: ({ props, renderNode }) => {
    const row = props.direction === "row";
    return (
      <div
        className={cn(
          "min-w-0",
          row
            ? // Rows of Cards (charts, tables) wrap sooner than rows of Metric tiles.
              "grid grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] has-[>[data-slot=card]]:grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))]"
            : "flex flex-col",
          gaps[props.gap ?? "m"] ?? gaps.m,
          props.align === "center" && "items-center",
          props.align === "end" && "items-end",
          props.align === "start" && "items-start",
          props.align === "stretch" && "items-stretch",
        )}
      >
        {renderNode(props.children)}
      </div>
    );
  },
});

const ContentChild = z.union([
  Stack.ref,
  CardHeader.ref,
  TextContent.ref,
  Metric.ref,
  Alert.ref,
  TagBlock.ref,
  Progress.ref,
  Separator.ref,
  BarChart.ref,
  LineChart.ref,
  AreaChart.ref,
  PieChart.ref,
  Table.ref,
  Select.ref,
]);

export const TabItem = defineComponent({
  name: "TabItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(ContentChild),
  }),
  description: "One tab: an id, its label, and its content.",
  component: () => null,
});

export const Tabs = defineComponent({
  name: "Tabs",
  props: z.object({ items: z.array(TabItem.ref) }),
  description: "Switches between views of the same data, such as chart types or time ranges.",
  component: ({ props, renderNode }) => {
    const items = asArray(props.items)
      .filter(isElement)
      .filter((item) => item.props.value != null && item.props.trigger != null);
    const [selected, setSelected] = useState<string | null>(null);
    if (!items.length) return null;
    const values = items.map((item) => String(item.props.value));
    const active = selected && values.includes(selected) ? selected : values[0];
    return (
      <ShadcnTabs value={active} onValueChange={setSelected}>
        <TabsList>
          {items.map((item, index) => (
            <TabsTrigger key={values[index]} value={values[index]} className="px-3">
              {String(item.props.trigger)}
            </TabsTrigger>
          ))}
        </TabsList>
        {items.map((item, index) => (
          <TabsContent
            key={values[index]}
            value={values[index]}
            className="flex flex-col gap-4 pt-2"
          >
            {renderNode(item.props.content)}
          </TabsContent>
        ))}
      </ShadcnTabs>
    );
  },
});

export const Card = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(z.union([...ContentChild.options, Tabs.ref])),
  }),
  description:
    "A bordered section: start with a CardHeader, then a chart, table, or more. Put Cards in a Stack row to show them side by side.",
  component: ({ props, renderNode }) => (
    <div
      data-slot="card"
      className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-xs"
    >
      {renderNode(props.children)}
    </div>
  ),
});
