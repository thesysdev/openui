import type { Meta, StoryObj } from "@storybook/react";
import { useId, useState } from "react";
import {
  LegendStoreProvider,
  PieChart,
  RadialChart,
  StackedLegend,
  StackedLegendItem,
  StackedLegendProps,
  useLegendEntry,
} from "../../../..";
import { Card } from "../../../../../Card";

// Sample data sets - each chart publishes one legend row per category

// Six-slice part-to-whole data - the typical chart + legend pairing
const trafficSourceData = [
  { source: "Organic Search", visits: 42800 },
  { source: "Direct", visits: 26400 },
  { source: "Referral", visits: 15300 },
  { source: "Social", visits: 12100 },
  { source: "Email", visits: 8700 },
  { source: "Paid Search", visits: 6200 },
];

// Department budget - used with the RadialChart
const departmentBudgetData = [
  { department: "Engineering", budget: 420000 },
  { department: "Sales", budget: 280000 },
  { department: "Marketing", budget: 190000 },
  { department: "Operations", budget: 140000 },
  { department: "Support", budget: 90000 },
];

// Team headcount - the second chart in the two-chart story
const headcountData = [
  { team: "Platform", people: 34 },
  { team: "Product", people: 22 },
  { team: "Design", people: 12 },
  { team: "Data", people: 9 },
];

// Thirteen categories - enough to overflow the legend
const productCategoryData = [
  { category: "Electronics", sales: 12500 },
  { category: "Apparel", sales: 9800 },
  { category: "Groceries", sales: 14500 },
  { category: "Home Goods", sales: 13200 },
  { category: "Books", sales: 8800 },
  { category: "Toys", sales: 7600 },
  { category: "Automotive", sales: 6500 },
  { category: "Health", sales: 11200 },
  { category: "Beauty", sales: 9300 },
  { category: "Sports", sales: 8100 },
  { category: "Outdoors", sales: 7200 },
  { category: "Music", sales: 4500 },
  { category: "Software", sales: 10500 },
];

// Hand-built rows for the standalone (no chart, no store) legend
const storageItems: StackedLegendItem[] = [
  { key: "photos", label: "Photos", color: "#383FC9", value: 48.2 },
  { key: "videos", label: "Videos", color: "#5F67F4", value: 31.5 },
  { key: "documents", label: "Documents", color: "#97A9FF", value: 12.4 },
  { key: "backups", label: "Backups", color: "#CBD7FF", value: 7.9 },
];

/**
 * # StackedLegend Component Documentation
 *
 * StackedLegend is the vertical legend of the polar charts (PieChart, RadialChart) as a
 * component of its own: one row per category - colour swatch, label and value - placed
 * anywhere in the tree, away from the chart it describes.
 *
 * - **LegendStoreProvider**: Owns a small store scoped to its subtree
 * - **legendKey**: The address a chart publishes its rows to and a legend reads them from
 * - **Bidirectional**: Hovering or clicking a row drives the chart; hovering a slice highlights the row
 * - **useLegendEntry**: Reads a published entry to build custom UI
 */

type StandaloneLegendProps = Extract<StackedLegendProps, { items: StackedLegendItem[] }>;
type StackedLegendStoryArgs = Partial<Omit<StandaloneLegendProps, "legendKey">> & {
  legendKey?: string;
};

const meta: Meta<StackedLegendStoryArgs> = {
  title: "Components/Charts/StackedLegend",
  component: StackedLegend,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { LegendStoreProvider, PieChart, StackedLegend } from '@openuidev/react-ui/Charts';

<LegendStoreProvider>
  <PieChart data={data} categoryKey="source" dataKey="visits" legendKey="traffic" />
  <div style={{ height: 280 }}>
    <StackedLegend legendKey="traffic" />
  </div>
</LegendStoreProvider>
\`\`\`

## How the Legend Store Works

- **\`LegendStoreProvider\`** owns one store, scoped to its subtree. Wrap it around the chart
  *and* the legend - they can sit in completely different parts of that subtree.
- **A chart with a \`legendKey\`** (\`PieChart\`, \`RadialChart\`) publishes its legend rows to the
  store under that key and stops rendering its own legend.
- **\`<StackedLegend legendKey="…" />\`** renders the rows published under the same key and
  writes hover and toggle back, so the chart and the legend always stay in sync.
- **Key resolution**: an explicit \`legendKey\` prop wins; otherwise both sides fall back to the
  provider's own \`legendKey\`. For one chart + one legend, say the key once on the provider.
- **Graceful fallback**: without a provider, a chart given a \`legendKey\` falls back to its compact
  inline legend, and a connected \`StackedLegend\` renders nothing until a chart publishes.

## When to Use It

- **Use the chart's built-in legend** (\`legendVariant="stacked"\`, the default) when the legend
  belongs right next to the chart - it already switches between side by side (400px and wider)
  and legend-below-chart for you.
- **Use \`StackedLegend\` + \`LegendStoreProvider\`** when the legend lives somewhere else: a
  sidebar, a separate card, your own grid, or one legend panel for several charts.
- **Use \`StackedLegend\` with \`items\`** for a purely presentational legend that you drive
  with your own state - no chart and no store involved.

## Layout Requirements

StackedLegend fills **100% of its container's height**: rows are centred vertically and the list
scrolls when it overflows. Always give its container a definite height (a fixed-height box or a
flex row with a set height). The \`showMore\` layout is the exception - it grows with its rows.

## Rules of Thumb
- **One chart per key**: two charts publishing to one key log a duplicate \`legendKey\` warning.
  Any number of legends may read the same key.
- **Unique keys**: use \`useId()\` so repeated instances on one page never collide.
- **Never empty**: the last visible row cannot be hidden.
        `,
      },
    },
  },
  tags: ["dev", "autodocs"],
  argTypes: {
    legendKey: {
      description:
        "**Connected mode.** The store key to read - the same `legendKey` the chart publishes under. Falls back to the nearest provider's `legendKey`; renders nothing until a chart has published.",
      control: false,
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "provider's legendKey" },
        category: "📊 Data Configuration",
      },
    },
    items: {
      description:
        "**Standalone mode.** Rows to render directly, without a store (`{ key, label, color, value }[]`). Passing `items` makes the legend presentational - `legendKey` is ignored.",
      control: false,
      table: {
        type: { summary: "StackedLegendItem[]" },
        defaultValue: { summary: "undefined" },
        category: "📊 Data Configuration",
      },
    },
    format: {
      description: `
**Value Format:**

- **percentage**: Each row's share of the visible total. Hidden rows are left out of the total but still show their value against it, so they can read above 100%
- **number**: The raw value

A connected legend inherits the publishing chart's \`format\` when this is not set.
      `,
      control: "radio",
      options: ["percentage", "number"],
      table: {
        type: { summary: '"percentage" | "number"' },
        defaultValue: { summary: "chart's format (connected) / percentage (standalone)" },
        category: "📱 Display Options",
      },
    },
    layout: {
      description: `
**Overflow Behavior:**

- **auto**: Show more when \`containerWidth\` is set and is under 450px or there are more than 6 rows; scrollable otherwise
- **scrollable**: Full list in its container; a header with "N labels" and up/down buttons appears when it overflows
- **showMore**: First 6 rows plus a Show more / Show less button
      `,
      control: "radio",
      options: ["auto", "scrollable", "showMore"],
      table: {
        type: { summary: '"auto" | "scrollable" | "showMore"' },
        defaultValue: { summary: "auto" },
        category: "📱 Display Options",
      },
    },
    containerWidth: {
      description:
        "Fixed legend width in pixels. Also feeds the `auto` layout decision. When unset the legend is 100% wide.",
      control: { type: "number", min: 160, max: 600 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "undefined (100%)" },
        category: "📱 Display Options",
      },
    },
    showTitle: {
      description:
        'Shows the "N labels" title in the scroll header. The header only appears when a scrollable list overflows.',
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    separator: {
      description: "Draws a separator line between rows.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "🎨 Visual Styling",
      },
    },
    className: {
      description: "Extra class name on the legend's root element.",
      control: false,
      table: {
        type: { summary: "string" },
        category: "🎨 Visual Styling",
      },
    },
    style: {
      description: "Inline styles on the legend's root element.",
      control: false,
      table: {
        type: { summary: "React.CSSProperties" },
        category: "🎨 Visual Styling",
      },
    },
    activeKey: {
      description:
        "**Standalone mode only.** Key of the highlighted row. In connected mode the store supplies it.",
      control: false,
      table: {
        type: { summary: "string | null" },
        category: "🎬 Animation & Interaction",
      },
    },
    hiddenKeys: {
      description:
        "**Standalone mode only.** Keys of hidden rows - drawn dimmed and left out of the percentage total. In connected mode the store supplies them.",
      control: false,
      table: {
        type: { summary: "Set<string>" },
        category: "🎬 Animation & Interaction",
      },
    },
    onItemHover: {
      description:
        "**Standalone mode only.** Called with a row's key on mouse enter and with `null` on mouse leave. In connected mode hover is written to the store.",
      control: false,
      table: {
        type: { summary: "(key: string | null) => void" },
        category: "🎬 Animation & Interaction",
      },
    },
    onItemToggle: {
      description:
        "**Standalone mode only.** Called with a row's key on click. Rows are only clickable when it is set. In connected mode the toggle is written to the store.",
      control: false,
      table: {
        type: { summary: "(key: string) => void" },
        category: "🎬 Animation & Interaction",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const titleStyle = { margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" };
const subtitleStyle = { margin: 0, color: "#666", fontSize: "14px" };
const noteStyle = {
  marginTop: "16px",
  padding: "12px",
  backgroundColor: "#f8f9fa",
  borderRadius: "6px",
  fontSize: "12px",
  color: "#666",
};

/**
 * Custom UI built on `useLegendEntry`: reads the entry a chart published and shows the
 * highlighted row, the hidden rows and the visible total.
 */
function LegendStateReadout({ legendKey }: { legendKey: string }) {
  const entry = useLegendEntry(legendKey);
  if (!entry) return <div style={noteStyle}>Waiting for the chart to publish…</div>;

  const visible = entry.items.filter((item) => !entry.hiddenKeys.includes(item.key));
  const visibleTotal = visible.reduce((sum, item) => sum + item.value, 0);
  const active = entry.items.find((item) => item.key === entry.activeKey);

  return (
    <div
      style={{ ...noteStyle, display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 12px" }}
    >
      <strong>Highlighted</strong>
      <span>
        {active
          ? `${active.label} - ${((active.value / visibleTotal) * 100).toFixed(1)}% of visible`
          : "none"}
      </span>
      <strong>Hidden</strong>
      <span>{entry.hiddenKeys.length ? entry.hiddenKeys.join(", ") : "none"}</span>
      <strong>Visible total</strong>
      <span>
        {visibleTotal.toLocaleString()} visits ({visible.length} of {entry.items.length} rows)
      </span>
    </div>
  );
}

/**
 * ## Interactive Playground
 *
 * A donut chart publishing to a StackedLegend beside it. Use the Controls panel to try every
 * display prop of the legend.
 */
export const InteractivePlayground: Story = {
  name: "🎮 Interactive Playground",
  args: {
    legendKey: "playground",
    format: "percentage",
    layout: "auto",
    showTitle: true,
    separator: false,
    containerWidth: undefined,
  },
  render: (args: any) => (
    <Card style={{ width: "640px", padding: "24px" }}>
      <LegendStoreProvider>
        <div style={{ display: "flex", gap: "24px", alignItems: "center", height: "300px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PieChart
              data={trafficSourceData}
              categoryKey="source"
              dataKey="visits"
              variant="donut"
              legendKey={args.legendKey}
              maxChartSize={260}
            />
          </div>
          <div style={{ width: "280px", height: "100%" }}>
            <StackedLegend {...args} />
          </div>
        </div>
      </LegendStoreProvider>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Every display prop of the legend is wired to the Controls panel. The chart publishes with its
default \`format="number"\`; the legend's \`format\` arg overrides it. With \`layout="auto"\`, set
\`containerWidth\` below 450 to switch the legend to show-more.
        `,
      },
      source: {
        code: `
<LegendStoreProvider>
  <div style={{ display: "flex", gap: 24, alignItems: "center", height: 300 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <PieChart data={data} categoryKey="source" dataKey="visits" variant="donut" legendKey="playground" />
    </div>
    <div style={{ width: 280, height: "100%" }}>
      <StackedLegend legendKey="playground" format="percentage" layout="auto" showTitle separator={false} />
    </div>
  </div>
</LegendStoreProvider>
`,
      },
    },
  },
};

function PieWithLegendDemo() {
  // One chart + one legend: state the key once, on the provider.
  const uid = useId();
  return (
    <LegendStoreProvider legendKey={uid}>
      <div style={{ display: "flex", gap: "24px", alignItems: "center", height: "280px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <PieChart
            data={trafficSourceData}
            categoryKey="source"
            dataKey="visits"
            format="percentage"
            maxChartSize={260}
          />
        </div>
        <div style={{ width: "260px", height: "100%" }}>
          <StackedLegend />
        </div>
      </div>
    </LegendStoreProvider>
  );
}

/**
 * ## Pie Chart with an External Legend
 *
 * The most common composition: a PieChart and a StackedLegend side by side, sharing one store.
 */
export const PieChartWithExternalLegend: Story = {
  name: "🥧 Pie Chart + StackedLegend",
  render: () => (
    <Card style={{ width: "640px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={titleStyle}>Traffic Sources</h3>
        <p style={subtitleStyle}>Share of 111,500 visits by acquisition channel</p>
      </div>
      <PieWithLegendDemo />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Say the key once.** Here the key lives on the provider (\`legendKey={useId()}\`), so neither
the chart nor the legend repeats it - both fall back to the provider's key.

**What you get:**
- The chart publishes its rows and suppresses its own legend
- The legend inherits the chart's \`format="percentage"\`
- Hovering and clicking rows drives the chart, and hovering slices highlights rows
- The legend box has a fixed height; rows are centred inside it
        `,
      },
      source: {
        code: `
const uid = useId();

<LegendStoreProvider legendKey={uid}>
  <div style={{ display: "flex", gap: 24, alignItems: "center", height: 280 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <PieChart data={trafficSourceData} categoryKey="source" dataKey="visits" format="percentage" />
    </div>
    <div style={{ width: 260, height: "100%" }}>
      <StackedLegend />
    </div>
  </div>
</LegendStoreProvider>
`,
      },
    },
  },
};

/**
 * ## Radial Chart with an External Legend
 *
 * The same wiring with a RadialChart, this time with explicit keys and the legend below the chart.
 */
export const RadialChartWithExternalLegend: Story = {
  name: "🎯 Radial Chart + StackedLegend",
  args: {
    separator: true,
  },
  render: (args: any) => (
    <Card style={{ width: "420px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={titleStyle}>Department Budget</h3>
        <p style={subtitleStyle}>Annual budget in USD</p>
      </div>
      <LegendStoreProvider>
        <RadialChart
          data={departmentBudgetData}
          categoryKey="department"
          dataKey="budget"
          legendKey="budget"
          maxChartSize={240}
        />
        <div style={{ height: "220px", marginTop: "16px" }}>
          <StackedLegend {...args} legendKey="budget" />
        </div>
      </LegendStoreProvider>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Explicit keys.** The chart and the legend both name \`legendKey="budget"\`. An explicit prop
always wins over a provider's default key.

**Configuration Details:**
- **Chart**: RadialChart with its default \`format="number"\` - the legend inherits raw values
- **Legend**: Below the chart in a 220px-tall box, with \`separator\` lines between rows
        `,
      },
      source: {
        code: `
<LegendStoreProvider>
  <RadialChart data={departmentBudgetData} categoryKey="department" dataKey="budget" legendKey="budget" />
  <div style={{ height: 220, marginTop: 16 }}>
    <StackedLegend legendKey="budget" separator />
  </div>
</LegendStoreProvider>
`,
      },
    },
  },
};

/**
 * ## Bidirectional Hover & Toggle
 *
 * The chart and the legend drive each other through the store. The panel underneath is custom UI
 * built with `useLegendEntry`, showing the store state live.
 */
export const BidirectionalInteraction: Story = {
  name: "🔁 Bidirectional Hover & Toggle",
  render: () => (
    <Card style={{ width: "640px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={titleStyle}>Traffic Sources</h3>
        <p style={subtitleStyle}>Hover a slice or a row, click a row to hide its slice</p>
      </div>
      <LegendStoreProvider>
        <div style={{ display: "flex", gap: "24px", alignItems: "center", height: "280px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PieChart
              data={trafficSourceData}
              categoryKey="source"
              dataKey="visits"
              variant="donut"
              format="percentage"
              paddingAngle={1}
              legendKey="traffic"
              maxChartSize={260}
            />
          </div>
          <div style={{ width: "260px", height: "100%" }}>
            <StackedLegend legendKey="traffic" />
          </div>
        </div>
        <LegendStateReadout legendKey="traffic" />
      </LegendStoreProvider>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Legend → chart:**
- **Hover a row**: its slice is highlighted and the other slices dim
- **Click a row**: its slice is hidden; the row stays in the legend, dimmed, so a second click brings it back
- **Percentages re-normalize** over the visible rows, matching the redrawn slices
- **Never empty**: clicking the last visible row does nothing

**Chart → legend:**
- **Hover a slice**: the matching row gets the active background

**Reading the store yourself:** \`useLegendEntry(key)\` returns the published entry -
\`items\`, \`activeKey\`, \`hiddenKeys\` and \`format\` - or \`undefined\` before the chart publishes.
It is read-only: hover and toggle are written by the chart and the StackedLegend.
        `,
      },
      source: {
        code: `
function LegendStateReadout({ legendKey }: { legendKey: string }) {
  const entry = useLegendEntry(legendKey);
  if (!entry) return null;
  const active = entry.items.find((item) => item.key === entry.activeKey);
  return (
    <div>
      Highlighted: {active?.label ?? "none"} · Hidden: {entry.hiddenKeys.join(", ") || "none"}
    </div>
  );
}

<LegendStoreProvider>
  <PieChart data={data} categoryKey="source" dataKey="visits" variant="donut" format="percentage" legendKey="traffic" />
  <div style={{ width: 260, height: 280 }}>
    <StackedLegend legendKey="traffic" />
  </div>
  <LegendStateReadout legendKey="traffic" />
</LegendStoreProvider>
`,
      },
    },
  },
};

/**
 * ## Legend Far From Its Chart
 *
 * A dashboard layout where the legend sits in a sidebar and the chart in the main panel.
 */
export const LegendInSidebar: Story = {
  name: "🧭 Legend in a Sidebar",
  render: () => (
    <Card style={{ width: "820px", padding: "24px" }}>
      <LegendStoreProvider>
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "24px" }}>
          <Card variant="sunk" width="full" style={{ padding: "16px" }}>
            <div>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600" }}>
                Budget breakdown
              </h4>
              <p style={{ ...subtitleStyle, fontSize: "12px" }}>Click a department to hide it</p>
            </div>
            <div style={{ height: "220px" }}>
              <StackedLegend legendKey="sidebar-budget" format="percentage" />
            </div>
          </Card>
          <div>
            <div style={{ marginBottom: "16px" }}>
              <h3 style={titleStyle}>Department Budget FY26</h3>
              <p style={subtitleStyle}>$1.12M allocated across five departments</p>
            </div>
            <PieChart
              data={departmentBudgetData}
              categoryKey="department"
              dataKey="budget"
              variant="donut"
              appearance="semiCircular"
              cornerRadius={4}
              paddingAngle={1}
              legendKey="sidebar-budget"
              maxChartSize={400}
            />
          </div>
        </div>
      </LegendStoreProvider>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
The legend and the chart are in different branches of the layout - a sidebar and a main panel.
They only need a common \`LegendStoreProvider\` above them and the same key.

**Why this needs StackedLegend:** a chart's built-in legend always sits beside or below the chart.
To put the legend anywhere else, publish with \`legendKey\` and place the legend where you want it.

**Note:** \`format="percentage"\` on the legend overrides the chart's default \`number\` format.
        `,
      },
      source: {
        code: `
<LegendStoreProvider>
  <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>
    <aside>
      <div style={{ height: 220 }}>
        <StackedLegend legendKey="sidebar-budget" format="percentage" />
      </div>
    </aside>
    <main>
      <PieChart
        data={departmentBudgetData}
        categoryKey="department"
        dataKey="budget"
        variant="donut"
        appearance="semiCircular"
        legendKey="sidebar-budget"
      />
    </main>
  </div>
</LegendStoreProvider>
`,
      },
    },
  },
};

/**
 * ## Two Charts, One Provider
 *
 * One provider can hold several chart + legend pairs, each addressed by its own key.
 */
export const MultipleChartsOneProvider: Story = {
  name: "🧩 Two Charts, One Provider",
  render: () => (
    <Card style={{ width: "760px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={titleStyle}>Company Overview</h3>
        <p style={subtitleStyle}>Two charts, two keys, one LegendStoreProvider</p>
      </div>
      <LegendStoreProvider>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
              Traffic by channel
            </h4>
            <PieChart
              data={trafficSourceData}
              categoryKey="source"
              dataKey="visits"
              variant="donut"
              legendKey="channels"
              maxChartSize={220}
            />
            <div style={{ height: "230px", marginTop: "12px" }}>
              <StackedLegend legendKey="channels" format="percentage" />
            </div>
          </div>
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
              Headcount by team
            </h4>
            <RadialChart
              data={headcountData}
              categoryKey="team"
              dataKey="people"
              legendKey="teams"
              maxChartSize={220}
            />
            <div style={{ height: "230px", marginTop: "12px" }}>
              <StackedLegend legendKey="teams" />
            </div>
          </div>
        </div>
      </LegendStoreProvider>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Independent entries.** The store holds one entry per key, so hovering or hiding a row in the
"channels" legend never touches the "teams" chart.

**Best Practices:**
- Give every chart its own key - two charts publishing to one key log a duplicate \`legendKey\` warning
- Keep the provider local: wrap just the charts and legends that belong together
- The headcount legend inherits the RadialChart's default \`number\` format, the traffic legend overrides it with \`percentage\`
        `,
      },
      source: {
        code: `
<LegendStoreProvider>
  <PieChart data={trafficSourceData} categoryKey="source" dataKey="visits" variant="donut" legendKey="channels" />
  <div style={{ height: 230 }}>
    <StackedLegend legendKey="channels" format="percentage" />
  </div>

  <RadialChart data={headcountData} categoryKey="team" dataKey="people" legendKey="teams" />
  <div style={{ height: 230 }}>
    <StackedLegend legendKey="teams" />
  </div>
</LegendStoreProvider>
`,
      },
    },
  },
};

/**
 * ## Many Items: Scroll vs Show More
 *
 * Thirteen categories in two overflow layouts.
 */
export const ManyItems: Story = {
  name: "📜 Many Items: Scroll vs Show More",
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", width: "760px" }}>
      <Card style={{ padding: "24px" }}>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
          layout="scrollable"
        </h4>
        <LegendStoreProvider legendKey="scrollable-sales">
          <PieChart
            data={productCategoryData}
            categoryKey="category"
            dataKey="sales"
            variant="donut"
            maxChartSize={200}
          />
          <div style={{ height: "240px", marginTop: "16px" }}>
            <StackedLegend layout="scrollable" format="percentage" />
          </div>
        </LegendStoreProvider>
      </Card>
      <Card style={{ padding: "24px" }}>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
          layout="showMore"
        </h4>
        <LegendStoreProvider legendKey="show-more-sales">
          <PieChart
            data={productCategoryData}
            categoryKey="category"
            dataKey="sales"
            variant="donut"
            maxChartSize={200}
          />
          <div style={{ marginTop: "16px" }}>
            <StackedLegend layout="showMore" format="percentage" />
          </div>
        </LegendStoreProvider>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Scrollable** (left): the list stays inside its fixed-height box. When the rows overflow, a header
appears with the row count ("13 labels", hidden with \`showTitle={false}\`) and up/down buttons
that scroll one row at a time. The scrollbar itself is hidden.

**Show More** (right): the first 6 rows are shown with a Show more / Show less button. This layout
grows with its rows, so its container can have an auto height.

**Auto** (the default) picks show-more when \`containerWidth\` is set and is under 450px or there
are more than 6 rows, and scrollable otherwise.
        `,
      },
      source: {
        code: `
// Scrollable: definite height, header + up/down buttons on overflow
<LegendStoreProvider legendKey="scrollable-sales">
  <PieChart data={productCategoryData} categoryKey="category" dataKey="sales" variant="donut" />
  <div style={{ height: 240 }}>
    <StackedLegend layout="scrollable" format="percentage" />
  </div>
</LegendStoreProvider>

// Show more: first 6 rows + toggle button, grows with its rows
<LegendStoreProvider legendKey="show-more-sales">
  <PieChart data={productCategoryData} categoryKey="category" dataKey="sales" variant="donut" />
  <StackedLegend layout="showMore" format="percentage" />
</LegendStoreProvider>
`,
      },
    },
  },
};

/**
 * ## Value Format: Inherited vs Overridden
 *
 * Two legends reading the same key: one inherits the chart's format, one overrides it.
 */
export const ValueFormats: Story = {
  name: "🔢 Value Format: Inherited vs Overridden",
  render: () => (
    <Card style={{ width: "760px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={titleStyle}>Department Budget</h3>
        <p style={subtitleStyle}>One chart, two legends on the same key</p>
      </div>
      <LegendStoreProvider>
        <div style={{ display: "flex", gap: "24px", alignItems: "center", height: "260px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PieChart
              data={departmentBudgetData}
              categoryKey="department"
              dataKey="budget"
              format="number"
              legendKey="formats"
              maxChartSize={240}
            />
          </div>
          <div style={{ width: "220px", height: "100%" }}>
            <p style={{ ...subtitleStyle, fontSize: "12px", paddingLeft: "8px" }}>
              Inherited (number)
            </p>
            <div style={{ height: "calc(100% - 20px)" }}>
              <StackedLegend legendKey="formats" />
            </div>
          </div>
          <div style={{ width: "220px", height: "100%" }}>
            <p style={{ ...subtitleStyle, fontSize: "12px", paddingLeft: "8px" }}>
              format="percentage"
            </p>
            <div style={{ height: "calc(100% - 20px)" }}>
              <StackedLegend legendKey="formats" format="percentage" />
            </div>
          </div>
        </div>
      </LegendStoreProvider>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Data Display Format:**

- **Inherited**: a connected legend without \`format\` uses the publishing chart's \`format\` - here \`number\`, so rows show raw values
- **percentage**: each row's share of the **visible** total. Hide a row and the others re-normalize to 100%
- **number**: the raw value, whatever is hidden

**Many readers, one publisher.** Both legends read the same key, so hovering or clicking a row
in either one updates the chart and the other legend.
        `,
      },
      source: {
        code: `
<LegendStoreProvider>
  <PieChart data={departmentBudgetData} categoryKey="department" dataKey="budget" format="number" legendKey="formats" />
  <div style={{ height: 240 }}>
    <StackedLegend legendKey="formats" />                      {/* inherits "number" */}
  </div>
  <div style={{ height: 240 }}>
    <StackedLegend legendKey="formats" format="percentage" />  {/* overrides */}
  </div>
</LegendStoreProvider>
`,
      },
    },
  },
};

function StandaloneLegendDemo(args: any) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      // Mirror the store's guard: keep at least one row visible.
      else if (next.size < storageItems.length - 1) next.add(key);
      return next;
    });

  const visible = storageItems.filter((item) => !hiddenKeys.has(item.key));
  const visibleTotal = visible.reduce((sum, item) => sum + item.value, 0);

  return (
    <>
      {/* Your own visualization, driven by the same state as the legend */}
      <div style={{ display: "flex", height: "16px", borderRadius: "8px", overflow: "hidden" }}>
        {visible.map((item) => (
          <div
            key={item.key}
            style={{
              width: `${(item.value / visibleTotal) * 100}%`,
              backgroundColor: item.color,
              opacity: activeKey && activeKey !== item.key ? 0.4 : 1,
              transition: "all 0.2s ease",
            }}
          />
        ))}
      </div>
      <div style={{ height: "150px" }}>
        <StackedLegend
          {...args}
          items={storageItems}
          activeKey={activeKey}
          hiddenKeys={hiddenKeys}
          onItemHover={setActiveKey}
          onItemToggle={toggle}
        />
      </div>
    </>
  );
}

/**
 * ## Standalone Legend
 *
 * With `items`, StackedLegend is purely presentational - no provider, no chart, no store.
 */
export const StandaloneLegend: Story = {
  name: "🧱 Standalone Legend (items)",
  args: {
    format: "number",
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={titleStyle}>Storage Usage</h3>
        <p style={subtitleStyle}>GB used per file type</p>
      </div>
      <StandaloneLegendDemo {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Presentational path.** Pass \`items\` and the legend renders them directly; \`legendKey\` is
ignored. You own the interaction state:

- **\`activeKey\`** + **\`onItemHover\`**: highlight a row and react to hover
- **\`hiddenKeys\`** + **\`onItemToggle\`**: dim hidden rows and react to clicks (rows are only clickable when \`onItemToggle\` is set)

Use it for a legend next to your own visualization - here a plain bar made of divs, driven by the
same state as the legend. The store's never-empty guard does not apply here, so this demo adds its own.
        `,
      },
      source: {
        code: `
const [activeKey, setActiveKey] = useState<string | null>(null);
const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
const toggle = (key: string) =>
  setHiddenKeys((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

<div style={{ height: 150 }}>
  <StackedLegend
    items={[
      { key: "photos", label: "Photos", color: "#383FC9", value: 48.2 },
      { key: "videos", label: "Videos", color: "#5F67F4", value: 31.5 },
      // ...
    ]}
    format="number"
    activeKey={activeKey}
    hiddenKeys={hiddenKeys}
    onItemHover={setActiveKey}
    onItemToggle={toggle}
  />
</div>
`,
      },
    },
  },
};
