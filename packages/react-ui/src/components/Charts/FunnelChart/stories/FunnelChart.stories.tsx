import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FunnelChart, FunnelChartProps } from "../..";
import { Card } from "../../../Card";

// 📊 DATA VARIATIONS - One row per stage, ordered from the top (widest) stage
// to the bottom. Every dataset shares the same `stage` / `count` keys so they
// can be swapped freely in the playground.
type FunnelRow = { stage: string; count: number };

const dataVariations = {
  // Classic SaaS conversion funnel — the default specimen.
  saas: [
    { stage: "Visited", count: 12480 },
    { stage: "Signed up", count: 5210 },
    { stage: "Activated", count: 3140 },
    { stage: "Subscribed", count: 1380 },
    { stage: "Renewed", count: 940 },
  ],
  // E-commerce checkout — six stages with a steep first drop.
  ecommerce: [
    { stage: "Product views", count: 48200 },
    { stage: "Added to cart", count: 14650 },
    { stage: "Checkout started", count: 7820 },
    { stage: "Shipping entered", count: 6130 },
    { stage: "Payment entered", count: 5410 },
    { stage: "Order placed", count: 4980 },
  ],
  // Hiring pipeline — small absolute numbers, very steep taper.
  hiring: [
    { stage: "Applications", count: 1240 },
    { stage: "Phone screen", count: 386 },
    { stage: "Onsite", count: 94 },
    { stage: "Offer", count: 21 },
    { stage: "Hired", count: 17 },
  ],
  // Two-stage funnel — the smallest meaningful funnel.
  twoStage: [
    { stage: "Trial started", count: 2400 },
    { stage: "Converted to paid", count: 612 },
  ],
  // Ten stages — a dense acquisition funnel spanning three orders of magnitude.
  manyStages: [
    { stage: "Impressions", count: 184000 },
    { stage: "Ad clicks", count: 9420 },
    { stage: "Landing views", count: 8110 },
    { stage: "Sign-up started", count: 3260 },
    { stage: "Email verified", count: 2540 },
    { stage: "Onboarded", count: 1870 },
    { stage: "First project", count: 1310 },
    { stage: "Invited team", count: 720 },
    { stage: "Converted", count: 410 },
    { stage: "Annual plan", count: 128 },
  ],
  // A near-empty stage and a zero stage at the bottom of the funnel.
  tinyAndZero: [
    { stage: "Leads", count: 4800 },
    { stage: "Qualified", count: 1150 },
    { stage: "Proposal", count: 310 },
    { stage: "Closed won", count: 6 },
    { stage: "Expansion", count: 0 },
  ],
  // Non-monotonic: the replay audience is larger than the live audience.
  nonMonotonic: [
    { stage: "Registered", count: 1200 },
    { stage: "Attended live", count: 540 },
    { stage: "Watched replay", count: 760 },
    { stage: "Booked demo", count: 180 },
    { stage: "Closed", count: 45 },
  ],
  // Long, sentence-like stage names — exercises label angling and wrapping.
  longNames: [
    { stage: "Landed on the pricing page from paid search", count: 9600 },
    { stage: "Started the 14-day free trial", count: 3820 },
    { stage: "Connected a first data source", count: 2210 },
    { stage: "Invited at least one teammate", count: 1180 },
    { stage: "Upgraded to a paid workspace", count: 530 },
  ],
} satisfies Record<string, FunnelRow[]>;

type DatasetKey = keyof typeof dataVariations;

const brandPalette = ["#10451D", "#1A7431", "#25A244", "#4AD66D", "#92E6A7", "#B7EFC5"];
const categoricalPalette = ["#F97316", "#EC4899", "#8B5CF6"];

/**
 * # FunnelChart Component Documentation
 *
 * The FunnelChart visualizes how a quantity shrinks as it flows through an
 * ordered sequence of stages — conversion funnels, sales and hiring pipelines,
 * onboarding flows. Each stage tapers into the next, so the steepest drop-off
 * is visible at a glance.
 *
 * ## Key Features
 * - **Orientation**: Horizontal (left → right) or vertical (top → bottom)
 * - **Shape**: Curved or straight edges, plus a multi-ring halo (`layers`)
 * - **Readouts**: Stage labels, compact values and retention percentages
 * - **Interactive**: Hover bloom + tooltip, legend toggling, `onClick`
 * - **Colors**: The ThemeProvider's chart palette, or `customPalette`
 */

const meta: Meta<FunnelChartProps<FunnelRow[]>> = {
  title: "Components/Charts/FunnelChart",
  component: FunnelChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { FunnelChart } from '@openuidev/react-ui';

// Basic implementation
<FunnelChart
  data={yourData}
  categoryKey="stage"
  dataKey="count"
/>

// Vertical, straight-edged funnel with a custom palette
<FunnelChart
  data={yourData}
  categoryKey="stage"
  dataKey="count"
  orientation="vertical"
  edges="straight"
  customPalette={["#10451D", "#1A7431", "#25A244", "#4AD66D"]}
/>
\`\`\`

## Data Structure Requirements

Your data should be an array of objects, **one per stage, ordered from the top
(widest) stage to the bottom**. Each object contains:
- A **category field** (string): The stage name, used for labels, legend and tooltip
- A **value field** (number): The volume that reached that stage

\`\`\`tsx
const signupFunnel = [
  { stage: "Visited", count: 12480 },
  { stage: "Signed up", count: 5210 },
  { stage: "Activated", count: 3140 },
  { stage: "Subscribed", count: 1380 },
];
\`\`\`

Stage widths are scaled against the **largest visible value**, so the shape always
fits even when the data is not strictly decreasing. Missing or non-numeric values
are treated as \`0\`.

## Percentages Are Retention

The percentage pill shows each stage's value **relative to the first visible stage**
(which is always 100%). It is not a share of the total, so a later stage that is larger
than the first reads above 100%.

## When to Use

- ✅ Sequential processes where each stage is a subset of the previous one
- ✅ Highlighting where the largest drop-off happens
- ❌ Unordered categories or part-to-whole breakdowns — use a PieChart or BarChart
- ❌ Comparing several series — the funnel is single-series

## Performance Considerations

- **Stage Count**: Best with 3–8 stages. In-stage values and percentages are hidden
  once a stage is narrower than ~44px; the tooltip still shows them.
- **Responsiveness**: Fills its container's width; height defaults to 296px.
- **Animation**: The entrance animation is off by default so streamed data never replays it.
        `,
      },
    },
  },
  tags: ["dev", "autodocs"],
  argTypes: {
    data: {
      description: `
**Required.** An array of data objects, one per funnel stage, ordered from the top (widest) stage to the bottom. Each object should contain a stage name (string) and a numeric value.

**Best Practices:**
- Use 3-8 stages for optimal readability.
- Keep stage names short; long names are angled (horizontal) or wrapped (vertical).
`,
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        defaultValue: { summary: "[]" },
        category: "📊 Data Configuration",
      },
    },
    categoryKey: {
      description:
        "**Required.** The key in your data objects that holds the stage name (e.g., 'stage', 'step'). Used for labels, the legend and the tooltip.",
      control: false,
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    dataKey: {
      description:
        "**Required.** The key in your data objects that holds each stage's numeric value (e.g., 'count', 'users'). Non-numeric or missing values are treated as 0.",
      control: false,
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    orientation: {
      description: `
**Flow Direction:**
- **horizontal**: Stages flow left → right. Labels sit in a band below and angle when they don't fit.
- **vertical**: Stages flow top → bottom. Labels sit in a right-hand column and wrap onto up to 3 lines.
`,
      control: "radio",
      options: ["horizontal", "vertical"],
      table: {
        type: { summary: '"horizontal" | "vertical"' },
        defaultValue: { summary: "horizontal" },
        category: "🎨 Visual Styling",
      },
    },
    edges: {
      description:
        "Stage-to-stage edge shape: `curved` tapers smoothly with a bezier belly; `straight` uses flat trapezoid sides.",
      control: "radio",
      options: ["curved", "straight"],
      table: {
        type: { summary: '"curved" | "straight"' },
        defaultValue: { summary: "curved" },
        category: "🎨 Visual Styling",
      },
    },
    layers: {
      description:
        "Number of concentric halo rings drawn per stage. Outer rings are larger and fainter; the innermost is the solid core. `1` draws a single solid shape. Clamped to ≥ 1 and rounded.",
      control: { type: "number", min: 1, max: 6, step: 1 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "3" },
        category: "🎨 Visual Styling",
      },
    },
    customPalette: {
      description:
        "Ordered colors for the stages, top → bottom; overrides the ThemeProvider's chart palette. One color per stage (the halo is built from opacity, not extra hues); colors cycle when there are more stages than colors.",
      control: "object",
      table: {
        type: { summary: "string[]" },
        category: "🎨 Visual Styling",
      },
    },
    showLabels: {
      description:
        "Show each stage's name. When hidden, the reserved label band/column is reclaimed by the funnel.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    showValues: {
      description:
        "Show each stage's raw value inside the stage, compact-formatted (e.g. 940, 5.2K, 12K). Hidden automatically when a stage is too small to fit it.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    showPercentage: {
      description:
        "Show each stage's percentage **relative to the first visible stage** (which is 100%) in a pill — funnel retention, not share of total.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    legend: {
      description:
        "Show the legend (one swatch per stage). Clicking an item hides or shows that stage; percentages then re-base on the first visible stage.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    height: {
      description: "The height of the chart. Defaults to 296px, with the legend placed below.",
      control: "text",
      table: {
        type: { summary: "string | number" },
        category: "📱 Display Options",
      },
    },
    width: {
      description: "The width of the chart. Defaults to the full width of its container.",
      control: "text",
      table: {
        type: { summary: "string | number" },
        category: "📱 Display Options",
      },
    },
    fitLegendInHeight: {
      description:
        "When true, the legend's height is subtracted from `height` so the funnel and legend together fit it. Defaults to true when `height` is set, false otherwise.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        category: "📱 Display Options",
      },
    },
    className: {
      description: "Custom CSS class to apply to the chart's container.",
      control: "text",
      table: {
        type: { summary: "string" },
        category: "📱 Display Options",
      },
    },
    isAnimationActive: {
      description:
        "Plays the staggered entrance animation. Off by default so stages that mount while data streams in don't replay it. Hover and data-update motion are independent of this flag.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "🎬 Animation & Interaction",
      },
    },
    onClick: {
      description:
        "Called when a stage is clicked, with the original data row and its index among the currently **visible** stages (top = 0; the index shifts when stages are hidden via the legend).",
      action: "onClick",
      control: false,
      table: {
        type: { summary: "(row: T[number], index: number) => void" },
        category: "🎬 Animation & Interaction",
      },
    },
  },
} satisfies Meta<typeof FunnelChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const panelTitleStyle: React.CSSProperties = {
  margin: "0 0 12px 0",
  fontSize: "14px",
  fontWeight: 600,
  textAlign: "center",
};

// Cards shrink to their content by default; grid panels must fill their cell.
const panelCardStyle: React.CSSProperties = { width: "100%", padding: "20px" };

const gridStyle = (width: number): React.CSSProperties => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
  width: `${width}px`,
});

export const InteractivePlayground: Story = {
  name: "🎮 Interactive Playground",
  args: {
    categoryKey: "stage",
    dataKey: "count",
    orientation: "horizontal",
    edges: "curved",
    layers: 3,
    showLabels: true,
    showValues: true,
    showPercentage: true,
    legend: true,
    isAnimationActive: false,
  },
  render: (args: any) => {
    const [selectedDataType, setSelectedDataType] = useState<DatasetKey>("saas");
    const [lastClick, setLastClick] = useState<string | null>(null);
    const currentData = dataVariations[selectedDataType];

    const buttonStyle: React.CSSProperties = {
      margin: "2px",
      padding: "6px 12px",
      fontSize: "12px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      cursor: "pointer",
      background: "#fff",
      color: "#333",
      fontFamily: "monospace",
      transition: "all 0.2s",
    };

    const activeButtonStyle: React.CSSProperties = {
      ...buttonStyle,
      background: "#3b82f6",
      color: "white",
      border: "1px solid #3b82f6",
      fontWeight: 600,
    };

    return (
      <div style={{ width: "760px" }}>
        <Card style={{ width: "100%", padding: "20px", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
            🔻 Funnel Chart Test Suite
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {(Object.keys(dataVariations) as DatasetKey[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedDataType(key);
                  setLastClick(null);
                }}
                style={selectedDataType === key ? activeButtonStyle : buttonStyle}
              >
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
              </button>
            ))}
          </div>
          <div style={{ marginTop: "12px", fontSize: "12px", color: "#666" }}>
            <strong>Current Dataset:</strong> {selectedDataType} | <strong>Stages:</strong>{" "}
            {currentData.length} | <strong>Last Click:</strong> {lastClick ?? "—"}
          </div>
        </Card>
        <Card
          style={{
            width: "100%",
            padding: "24px",
            resize: "both",
            overflow: "hidden",
            minWidth: "280px",
          }}
        >
          <FunnelChart
            {...args}
            data={currentData}
            onClick={(row: FunnelRow, index: number) => {
              args.onClick?.(row, index);
              setLastClick(
                `${row.stage} (${row.count.toLocaleString()}) at visible index ${index}`,
              );
            }}
          />
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Swap datasets to see how the funnel handles steep drops, tiny and zero stages,
non-monotonic data and long stage names. Every other prop is driven by the Controls panel.

**Things to try:**
- Hover a stage to see the bloom, the dimmed siblings and the value/retention tooltip
- Click a legend item to hide a stage — percentages re-base on the first visible stage
- Click a stage to see the \`onClick\` payload (also logged in the Actions panel)
        `,
      },
    },
  },
};

export const DefaultConfiguration: Story = {
  name: "📊 Default Configuration",
  args: {
    data: dataVariations.saas,
    categoryKey: "stage",
    dataKey: "count",
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "640px", height: "auto", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
          Signup Conversion Funnel
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          How last quarter&apos;s 12,480 visitors converted into renewing customers.
        </p>
      </div>
      <FunnelChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
This is the recommended starting configuration for most use cases.

**Configuration Details:**
- **Orientation**: Horizontal, stages flowing left → right
- **Edges**: Curved bezier taper between stages
- **Layers**: 3 halo rings around a solid core
- **Readouts**: Stage names below, compact values on top, retention % in the pill
- **Colors**: The ThemeProvider's chart palette, applied in stage order
- **Animation**: Enabled here to show the staggered entrance (off by default)
        `,
      },
      source: {
        code: `
const signupFunnel = [
  { stage: "Visited", count: 12480 },
  { stage: "Signed up", count: 5210 },
  { stage: "Activated", count: 3140 },
  { stage: "Subscribed", count: 1380 },
  { stage: "Renewed", count: 940 },
];

<FunnelChart data={signupFunnel} categoryKey="stage" dataKey="count" isAnimationActive />
`,
      },
    },
  },
};

export const OrientationComparison: Story = {
  name: "↕️ Horizontal vs Vertical",
  args: {
    data: dataVariations.hiring,
    categoryKey: "stage",
    dataKey: "count",
  },
  render: (args: any) => (
    <div style={gridStyle(880)}>
      <div>
        <h4 style={panelTitleStyle}>orientation=&quot;horizontal&quot;</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} orientation="horizontal" />
        </Card>
      </div>
      <div>
        <h4 style={panelTitleStyle}>orientation=&quot;vertical&quot;</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} orientation="vertical" />
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Choosing an orientation:**

- **Horizontal** (default): Stages flow left → right. Stage names live in a band below the
  funnel; when any name is wider than its stage, all labels angle together.
- **Vertical**: Stages flow top → bottom, like a physical funnel. Stage names live in a
  right-hand column (capped at about a third of the width) and wrap onto up to 3 lines.

Vertical funnels suit narrow containers and long stage names; horizontal funnels suit wide
dashboard rows.
        `,
      },
      source: {
        code: `
<FunnelChart data={hiringPipeline} categoryKey="stage" dataKey="count" orientation="horizontal" />
<FunnelChart data={hiringPipeline} categoryKey="stage" dataKey="count" orientation="vertical" />
`,
      },
    },
  },
};

export const EdgesAndLayers: Story = {
  name: "🎨 Edges & Halo Layers",
  args: {
    data: dataVariations.saas,
    categoryKey: "stage",
    dataKey: "count",
    legend: false,
  },
  render: (args: any) => (
    <div style={gridStyle(900)}>
      <div>
        <h4 style={panelTitleStyle}>edges=&quot;curved&quot; (default, layers=3)</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} edges="curved" />
        </Card>
      </div>
      <div>
        <h4 style={panelTitleStyle}>edges=&quot;straight&quot;</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} edges="straight" />
        </Card>
      </div>
      <div>
        <h4 style={panelTitleStyle}>layers={"{1}"} — solid, no halo</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} layers={1} />
        </Card>
      </div>
      <div>
        <h4 style={panelTitleStyle}>layers={"{5}"} — deep halo</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} layers={5} />
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Edges:**
- **curved**: A bezier taper between stages — soft and organic.
- **straight**: Flat trapezoid sides — precise and geometric.

**Layers:** Each stage is drawn as \`layers\` concentric rings, outermost first. Outer rings
are larger and fainter; the innermost ring is the solid core. \`layers={1}\` draws a single,
fully opaque shape. On hover, the core swells outward through the halo.
        `,
      },
      source: {
        code: `
<FunnelChart data={data} categoryKey="stage" dataKey="count" edges="straight" />
<FunnelChart data={data} categoryKey="stage" dataKey="count" layers={1} />
<FunnelChart data={data} categoryKey="stage" dataKey="count" layers={5} />
`,
      },
    },
  },
};

export const LabelsValuesAndLegend: Story = {
  name: "🏷️ Labels, Values & Legend",
  args: {
    data: dataVariations.ecommerce,
    categoryKey: "stage",
    dataKey: "count",
  },
  render: (args: any) => (
    <div style={gridStyle(960)}>
      <div>
        <h4 style={panelTitleStyle}>All readouts (default)</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} />
        </Card>
      </div>
      <div>
        <h4 style={panelTitleStyle}>Values only — showPercentage=false</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} showPercentage={false} />
        </Card>
      </div>
      <div>
        <h4 style={panelTitleStyle}>Retention only — showValues=false, legend=false</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} showValues={false} legend={false} />
        </Card>
      </div>
      <div>
        <h4 style={panelTitleStyle}>Shape + legend — all readouts off</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} showLabels={false} showValues={false} showPercentage={false} />
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Readouts:**
- **showLabels**: Stage names in their own band (horizontal) or column (vertical). When
  hidden, the funnel reclaims that space.
- **showValues**: Compact-formatted raw values (48K, 15K, 7.8K, …) at the top of each stage.
- **showPercentage**: Retention relative to the first stage, in a high-contrast pill.

**Legend:** One swatch per stage. Clicking an item hides that stage; the other stages keep
their colors and percentages re-base on the first visible stage. With every readout off,
the legend and tooltip carry all the information — useful for compact dashboard widgets.

Values and percentages are dropped automatically when a stage is too small to hold them;
the tooltip always shows both.
        `,
      },
      source: {
        code: `
<FunnelChart data={data} categoryKey="stage" dataKey="count" showPercentage={false} />
<FunnelChart data={data} categoryKey="stage" dataKey="count" showValues={false} legend={false} />
<FunnelChart
  data={data}
  categoryKey="stage"
  dataKey="count"
  showLabels={false}
  showValues={false}
  showPercentage={false}
/>
`,
      },
    },
  },
};

export const CustomPalette: Story = {
  name: "🖌️ Custom Palette",
  args: {
    data: dataVariations.ecommerce,
    categoryKey: "stage",
    dataKey: "count",
    customPalette: brandPalette,
  },
  render: (args: any) => {
    const swatches = (colors: string[]) => (
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
        {colors.map((color) => (
          <div
            key={color}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              background: "white",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "12px",
            }}
          >
            <div
              style={{ width: "12px", height: "12px", borderRadius: "2px", background: color }}
            />
            <span style={{ fontFamily: "monospace", color: "#333" }}>{color}</span>
          </div>
        ))}
      </div>
    );

    return (
      <div style={gridStyle(960)}>
        <Card style={{ ...panelCardStyle, padding: "24px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 600 }}>
            Sequential brand ramp
          </h3>
          <p style={{ margin: "0 0 16px 0", color: "#666", fontSize: "14px" }}>
            Dark → light, one color per stage.
          </p>
          <FunnelChart {...args} />
          {swatches(args.customPalette ?? [])}
        </Card>
        <Card style={{ ...panelCardStyle, padding: "24px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 600 }}>
            Short categorical palette
          </h3>
          <p style={{ margin: "0 0 16px 0", color: "#666", fontSize: "14px" }}>
            Three colors cycle across six stages.
          </p>
          <FunnelChart {...args} customPalette={categoricalPalette} />
          {swatches(categoricalPalette)}
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
When \`customPalette\` is provided, it overrides the ThemeProvider's chart palette.

**How colors are applied:**
- 🎯 **In data order**: the first color paints the top stage, the second the next, and so on
- 🔁 **Cycling**: with fewer colors than stages, colors repeat from the start
- 🔒 **Stable**: hiding a stage via the legend never recolors the remaining stages
- 🌫️ **One hue per stage**: the halo rings are built from opacity, not extra colors

A sequential ramp (dark → light) reinforces the funnel's narrowing; a categorical palette
emphasizes that each stage is distinct.
        `,
      },
      source: {
        code: `
<FunnelChart
  data={checkoutFunnel}
  categoryKey="stage"
  dataKey="count"
  customPalette={["#10451D", "#1A7431", "#25A244", "#4AD66D", "#92E6A7", "#B7EFC5"]}
/>
`,
      },
    },
  },
};

export const DataEdgeCases: Story = {
  name: "🧪 Data Edge Cases",
  args: {
    categoryKey: "stage",
    dataKey: "count",
  },
  render: (args: any) => (
    <div style={gridStyle(920)}>
      <div style={{ gridColumn: "1 / -1" }}>
        <h4 style={panelTitleStyle}>Ten stages</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} data={dataVariations.manyStages} />
        </Card>
      </div>
      <div>
        <h4 style={panelTitleStyle}>Two stages</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} data={dataVariations.twoStage} />
        </Card>
      </div>
      <div>
        <h4 style={panelTitleStyle}>Tiny (6) and zero stages</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} data={dataVariations.tinyAndZero} />
        </Card>
      </div>
      <div>
        <h4 style={panelTitleStyle}>Non-monotonic data</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} data={dataVariations.nonMonotonic} />
        </Card>
      </div>
      <div>
        <h4 style={panelTitleStyle}>Long stage names — vertical (wrapped)</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} data={dataVariations.longNames} orientation="vertical" />
        </Card>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <h4 style={panelTitleStyle}>Long stage names — horizontal (angled), height=440</h4>
        <Card style={panelCardStyle}>
          <FunnelChart {...args} data={dataVariations.longNames} height={440} />
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Stage count:**
- **Ten stages**: Stages narrow and labels angle once they no longer fit their stage.
- **Two stages**: The smallest meaningful funnel — a single taper into a flat final stage.

**Values:**
- **Tiny and zero stages**: A near-zero stage tapers to a sliver and a zero stage collapses;
  both read 0% (percentages are rounded to whole numbers) without breaking the layout.
- **Non-monotonic data**: Widths scale against the largest value, so a stage larger than
  the one before simply widens again. Percentages stay relative to the first stage.

**Long stage names:**
- **Vertical**: Names wrap onto up to 3 lines in the right-hand column, then truncate.
- **Horizontal**: Labels angle but are not truncated, so the label band grows with the
  longest name. Prefer the vertical orientation for long names, or pin a taller \`height\`.
        `,
      },
      source: {
        code: `
const dealPipeline = [
  { stage: "Leads", count: 4800 },
  { stage: "Qualified", count: 1150 },
  { stage: "Proposal", count: 310 },
  { stage: "Closed won", count: 6 },
  { stage: "Expansion", count: 0 },
];

<FunnelChart data={dealPipeline} categoryKey="stage" dataKey="count" />
<FunnelChart data={longNamedStages} categoryKey="stage" dataKey="count" orientation="vertical" />
`,
      },
    },
  },
};

export const ResponsiveWidths: Story = {
  name: "📱 Responsive Widths",
  args: {
    data: dataVariations.ecommerce,
    categoryKey: "stage",
    dataKey: "count",
    legend: false,
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
      {[320, 480, 760].map((width) => (
        <div key={width}>
          <h4 style={panelTitleStyle}>{width}px container</h4>
          <Card style={{ width: `${width}px`, padding: "20px", border: "2px dashed #9ca3af" }}>
            <FunnelChart {...args} height={220} />
          </Card>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
The funnel always fills its container's width and adapts its readouts to the space available:

- **Narrow (320px)**: Stages are too small for in-stage values and percentages, so they are
  dropped (the tooltip still shows them) and labels angle to fit.
- **Medium (480px)**: Values and percentages return; labels still angle.
- **Wide (760px)**: Every label fits its stage and stands upright.

**Implementation Notes:**
- Uses ResizeObserver to track the container size
- Label angling is shared across all stages so the band stays aligned
- Pass \`height\` to pin the chart height (the legend then fits inside it)
        `,
      },
      source: {
        code: `
<div style={{ width: 320 }}>
  <FunnelChart data={checkoutFunnel} categoryKey="stage" dataKey="count" height={220} />
</div>
`,
      },
    },
  },
};
