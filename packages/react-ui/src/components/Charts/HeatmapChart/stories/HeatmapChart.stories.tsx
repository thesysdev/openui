import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { HeatmapChart, HeatmapChartData, HeatmapChartProps } from "../..";
import { Card } from "../../../Card";

// 📊 COMPREHENSIVE DATA VARIATIONS - Designed to test various heatmap scenarios.
// Heatmap data is row-shaped like every other chart: each object is one COLUMN
// (its `categoryKey` field is the x-axis label) and every other key of the
// first object becomes a ROW (y-axis). `object[rowKey]` is the cell value.

// Website sessions per 2-hour slot, one row per weekday.
const weeklyTrafficData: HeatmapChartData = [
  { slot: "6 AM", Mon: 120, Tue: 135, Wed: 128, Thu: 142, Fri: 118, Sat: 62, Sun: 48 },
  { slot: "8 AM", Mon: 410, Tue: 438, Wed: 425, Thu: 447, Fri: 392, Sat: 118, Sun: 96 },
  { slot: "10 AM", Mon: 690, Tue: 712, Wed: 705, Thu: 731, Fri: 640, Sat: 244, Sun: 187 },
  { slot: "12 PM", Mon: 585, Tue: 604, Wed: 612, Thu: 598, Fri: 552, Sat: 352, Sun: 298 },
  { slot: "2 PM", Mon: 742, Tue: 768, Wed: 781, Thu: 756, Fri: 614, Sat: 331, Sun: 276 },
  { slot: "4 PM", Mon: 655, Tue: 671, Wed: 688, Thu: 642, Fri: 488, Sat: 287, Sun: 262 },
  { slot: "6 PM", Mon: 402, Tue: 418, Wed: 421, Thu: 395, Fri: 301, Sat: 256, Sun: 318 },
  { slot: "8 PM", Mon: 288, Tue: 297, Wed: 305, Thu: 276, Fri: 214, Sat: 231, Sun: 352 },
];

// Monthly revenue ($K) per sales region.
const regionalRevenueData: HeatmapChartData = [
  { month: "Jan", "North America": 412, Europe: 318, "Asia Pacific": 256, "Latin America": 124 },
  { month: "Feb", "North America": 398, Europe: 305, "Asia Pacific": 271, "Latin America": 118 },
  { month: "Mar", "North America": 455, Europe: 342, "Asia Pacific": 298, "Latin America": 139 },
  { month: "Apr", "North America": 468, Europe: 351, "Asia Pacific": 312, "Latin America": 146 },
  { month: "May", "North America": 482, Europe: 337, "Asia Pacific": 335, "Latin America": 158 },
  { month: "Jun", "North America": 510, Europe: 322, "Asia Pacific": 348, "Latin America": 171 },
  { month: "Jul", "North America": 494, Europe: 286, "Asia Pacific": 362, "Latin America": 165 },
  { month: "Aug", "North America": 476, Europe: 264, "Asia Pacific": 371, "Latin America": 162 },
  { month: "Sep", "North America": 521, Europe: 348, "Asia Pacific": 384, "Latin America": 177 },
  { month: "Oct", "North America": 548, Europe: 372, "Asia Pacific": 396, "Latin America": 189 },
  { month: "Nov", "North America": 596, Europe: 405, "Asia Pacific": 418, "Latin America": 204 },
  { month: "Dec", "North America": 642, Europe: 438, "Asia Pacific": 402, "Latin America": 231 },
];

// Month-over-month revenue change (%) per product line — SIGNED and deliberately
// asymmetric (-14…+32) so a zero-centered diverging ramp is visibly different
// from a plain min→max ramp.
const revenueChangeData: HeatmapChartData = [
  { month: "Jan", Hardware: -8, Software: 12, Services: 4, Support: -2, Training: -14 },
  { month: "Feb", Hardware: -5, Software: 9, Services: 6, Support: 1, Training: -9 },
  { month: "Mar", Hardware: 3, Software: 15, Services: 8, Support: 2, Training: -4 },
  { month: "Apr", Hardware: 6, Software: 18, Services: 5, Support: 0, Training: 2 },
  { month: "May", Hardware: 2, Software: 21, Services: -3, Support: -1, Training: 7 },
  { month: "Jun", Hardware: -4, Software: 24, Services: -6, Support: 3, Training: 11 },
  { month: "Jul", Hardware: -11, Software: 19, Services: -2, Support: 4, Training: 6 },
  { month: "Aug", Hardware: -7, Software: 14, Services: 1, Support: 2, Training: -3 },
  { month: "Sep", Hardware: 5, Software: 22, Services: 7, Support: -2, Training: 9 },
  { month: "Oct", Hardware: 9, Software: 27, Services: 10, Support: -4, Training: 13 },
  { month: "Nov", Hardware: 14, Software: 32, Services: 12, Support: -3, Training: 4 },
  { month: "Dec", Hardware: 18, Software: 29, Services: 6, Support: -6, Training: -5 },
];

// Builds the column objects from a row-major table — the natural way to write
// a matrix down. Each row array holds one value per column, in column order.
const fromRowTable = (
  categoryKey: string,
  columns: string[],
  rows: Record<string, number[]>,
): HeatmapChartData =>
  columns.map((column, i) => {
    const entry: Record<string, string | number> = { [categoryKey]: column };
    for (const [rowKey, values] of Object.entries(rows)) entry[rowKey] = values[i] ?? "";
    return entry;
  });

// Pearson correlation between product KPIs (−1…1) — a symmetric matrix whose
// columns and rows are the same metrics.
const KPIS = ["Revenue", "Ad Spend", "Sessions", "Churn", "NPS", "Tickets"];
const correlationData = fromRowTable("metric", KPIS, {
  Revenue: [1, 0.72, 0.81, -0.64, 0.48, -0.22],
  "Ad Spend": [0.72, 1, 0.86, -0.18, 0.12, 0.09],
  Sessions: [0.81, 0.86, 1, -0.35, 0.27, 0.31],
  Churn: [-0.64, -0.18, -0.35, 1, -0.77, 0.58],
  NPS: [0.48, 0.12, 0.27, -0.77, 1, -0.69],
  Tickets: [-0.22, 0.09, 0.31, 0.58, -0.69, 1],
});

// Deterministic pseudo-random generator (mulberry32) so generated fixtures are
// stable across reloads and screenshots.
const seeded = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const HOSTS = [
  "api-01",
  "api-02",
  "api-03",
  "api-04",
  "db-primary",
  "db-replica",
  "cache-01",
  "worker-01",
];

// CPU utilisation (%) per host in 30-minute slots over one day: 48 columns × 8
// rows. Web/db hosts follow the daytime curve; the batch worker peaks overnight.
const denseCpuData: HeatmapChartData = (() => {
  const random = seeded(7);
  return Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const time = `${String(hour).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`;
    const daytime = 0.5 - 0.5 * Math.cos(((hour - 3) / 24) * 2 * Math.PI);
    const row: Record<string, string | number> = { time };
    HOSTS.forEach((host) => {
      const load = host.startsWith("worker")
        ? 18 + (1 - daytime) * 64
        : (host.startsWith("db") ? 30 : 22) + daytime * 58;
      row[host] = Math.min(100, Math.max(0, Math.round(load + random() * 12 - 6)));
    });
    return row;
  });
})();

// Weekly survey response rate (%) per team. Empty strings are "no value" — the
// survey didn't run for that team that week — and render as muted cells.
const sparseSurveyData: HeatmapChartData = [
  { week: "Wk 1", Design: 82, Engineering: 64, Marketing: "", Sales: 41, Support: 77 },
  { week: "Wk 2", Design: "", Engineering: 71, Marketing: 58, Sales: "", Support: 80 },
  { week: "Wk 3", Design: 88, Engineering: "", Marketing: 62, Sales: 38, Support: "" },
  { week: "Wk 4", Design: "", Engineering: "", Marketing: 67, Sales: 45, Support: 84 },
  { week: "Wk 5", Design: 91, Engineering: 76, Marketing: "", Sales: "", Support: 79 },
  { week: "Wk 6", Design: 86, Engineering: 69, Marketing: 70, Sales: 52, Support: "" },
];

// Adoption (%) of cloud products (columns) per metro area (rows) — long labels
// on BOTH axes.
const longLabelData = fromRowTable(
  "product",
  [
    "Managed Kubernetes Service",
    "Serverless Functions Platform",
    "Enterprise Object Storage",
    "Real-time Analytics Warehouse",
    "Global Content Delivery Network",
    "Machine Learning Inference API",
  ],
  {
    "San Francisco–Oakland–Berkeley, CA Metro Area": [68, 74, 81, 57, 63, 49],
    "New York–Newark–Jersey City, NY-NJ-PA Metro Area": [54, 61, 77, 63, 70, 38],
    "Greater London Region": [49, 58, 72, 46, 66, 31],
    "Tokyo Metropolitan Area": [41, 36, 69, 32, 58, 27],
    "Mexico City Federal District": [23, 28, 44, 17, 35, 12],
  },
);

const dataVariations = {
  weeklyTraffic: weeklyTrafficData,
  regionalRevenue: regionalRevenueData,
  revenueChange: revenueChangeData,
  correlation: correlationData,
  denseCpu: denseCpuData,
  sparseSurvey: sparseSurveyData,
  longLabels: longLabelData,
} satisfies Record<string, HeatmapChartData>;

// Map data variations to their category keys
const categoryKeys: Record<keyof typeof dataVariations, string> = {
  weeklyTraffic: "slot",
  regionalRevenue: "month",
  revenueChange: "month",
  correlation: "metric",
  denseCpu: "time",
  sparseSurvey: "week",
  longLabels: "product",
};

// Ordered low → high ramp (a magma-style sequential palette).
const sunsetPalette = [
  "#0D0887",
  "#42049E",
  "#6A00A8",
  "#900DA4",
  "#B12A90",
  "#CC4678",
  "#E16462",
  "#F1844B",
  "#FCA636",
  "#FCCE25",
  "#FFE06E",
];

// Ordered low → neutral → high diverging ramp (purple ↔ green). Odd length, so
// zero lands on exactly one neutral middle color.
const purpleGreenPalette = [
  "#762A83",
  "#9970AB",
  "#C2A5CF",
  "#E7D4E8",
  "#F7F7F7",
  "#D9F0D3",
  "#A6DBA0",
  "#5AAE61",
  "#1B7837",
];

const PaletteSwatches = ({ colors, label }: { colors: string[]; label: string }) => (
  <div
    style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#666" }}
  >
    <strong style={{ minWidth: "90px" }}>{label}</strong>
    <div
      style={{ display: "flex", borderRadius: "4px", overflow: "hidden", border: "1px solid #ddd" }}
    >
      {colors.map((color) => (
        <span
          key={color}
          title={color}
          style={{ width: "18px", height: "14px", backgroundColor: color }}
        />
      ))}
    </div>
  </div>
);

const meta: Meta<HeatmapChartProps<HeatmapChartData>> = {
  title: "Components/Charts/HeatmapChart",
  component: HeatmapChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { HeatmapChart } from '@openuidev/react-ui/Charts/HeatmapChart';

// Basic implementation
<HeatmapChart
  data={yourData}
  categoryKey="slot"
/>

// Signed data (profit/loss, deltas, correlation) — zero sits on the neutral middle color
<HeatmapChart
  data={yourData}
  categoryKey="month"
  rampMode="diverging"
  showCellLabels
/>
\`\`\`

## Data Structure Requirements

Heatmap data uses the same row-shaped contract as the other charts:
- The **category field** (\`categoryKey\`) of each object is a **column** label (x-axis).
- Every other key of the **first** object becomes a **row** (y-axis) and a legend item.
- \`object[rowKey]\` is the **cell value**. Non-numeric, empty (\`""\`) or missing values render as muted "no value" cells.

\`\`\`tsx
const trafficData = [
  { slot: "8 AM",  Mon: 410, Tue: 438, Wed: 425 },
  { slot: "10 AM", Mon: 690, Tue: 712, Wed: 705 },
  { slot: "12 PM", Mon: 585, Tue: 604, Wed: 612 },
];
// → 3 columns (8 AM, 10 AM, 12 PM) × 3 rows (Mon, Tue, Wed)
\`\`\`

## Key Features

- **Color Encodes Value**: Cells are colored by quantizing each value onto an ordered ramp (one bucket per palette color).
- **Two Ramp Modes**: \`sequential\` spreads the ramp over min→max; \`diverging\` forces a symmetric ±max domain so zero always sits on the neutral middle color.
- **Color Scale Key**: A bucket strip under the grid labelled with the domain endpoints (hover a bucket for its exact range) — the only value readout on touch and in print.
- **Cell Labels**: Optional in-cell values that auto-hide when they don't fit and auto-contrast against each cell's color.
- **Interactive Legend**: One item per row (swatch = the color of the row's mean); click to hide/show a row — the color domain re-fits to the visible rows.
- **Rich Tooltip**: Hovering a cell shows its value plus the row and column averages.
- **Theming**: Sequential mode uses \`customPalette\`, else the ThemeProvider's \`defaultChartPalette\`, else the built-in ocean ramp. Diverging mode without a \`customPalette\` uses a built-in blue ↔ orange ramp tuned for light and dark mode.

## When to Use

- Two categorical dimensions × one numeric measure (activity by weekday × hour, revenue by region × month).
- Matrices such as correlation tables, where the sign matters as much as the size.
- Spotting patterns, hot spots and gaps across many cells at once.

Prefer a line or bar chart when exact values or trends of a few series matter more than the overall pattern.

## Performance Considerations

- **Data Size**: Comfortably renders hundreds of cells; x-axis labels thin out automatically once columns get narrow.
- **Responsive**: Width follows the container; the default height is 296px, or pass \`height\`.
- **Animation**: The entrance animation is **off by default** (streaming-safe).
        `,
      },
    },
  },
  tags: ["dev", "autodocs"],
  argTypes: {
    data: {
      description: `
**Required.** An array of data objects. Each object is one **column** of the grid and should contain:
- The column label under \`categoryKey\` (string).
- One numeric value per **row** — every non-category key of the first object becomes a row.

**Best Practices:**
- Keep the same keys on every object; use \`""\` for a cell with no value.
- 3–12 rows and up to a few dozen columns read best.
`,
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        defaultValue: { summary: "[]" },
        category: "📊 Data Configuration",
      },
    },
    categoryKey: {
      description: `
**Required.** The key in your data objects that holds the **column** (x-axis) label.

**Examples:**
- "slot" for a weekday × time-of-day activity grid.
- "month" for a region × month revenue grid.
`,
      control: false,
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    customPalette: {
      description: `
**Custom Color Ramp.** An **ordered** array of colors, low → high, that replaces the ThemeProvider's \`defaultChartPalette\` (and the built-in ocean ramp).

- Each color is one bucket of the value scale — more colors means finer steps.
- In \`diverging\` mode it is read as the full low → neutral → high ramp; use an **odd** length so zero lands on one exact middle color.
`,
      control: "object",
      table: {
        type: { summary: "string[]" },
        defaultValue: { summary: "undefined" },
        category: "🎨 Visual Styling",
      },
    },
    rampMode: {
      description: `
**How values map onto the ramp:**

- **sequential**: spreads the ramp over the plain min → max extent of the visible values.
- **diverging**: forces a symmetric domain (±max absolute value) so zero sits on the neutral middle color and the two signs get opposing hues. Use for profit/loss, deltas and correlations.
`,
      control: "radio",
      options: ["sequential", "diverging"],
      table: {
        type: { summary: '"sequential" | "diverging"' },
        defaultValue: { summary: "sequential" },
        category: "🎨 Visual Styling",
      },
    },
    cellGap: {
      description: "Gap between cells in px. Never allowed to eat more than half a cell.",
      control: { type: "number", min: 0, max: 12 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "2" },
        category: "🎨 Visual Styling",
      },
    },
    cellRadius: {
      description: "Corner radius of each cell in px.",
      control: { type: "number", min: 0, max: 12 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "2" },
        category: "🎨 Visual Styling",
      },
    },
    className: {
      description: "Extra class name added to the chart's root container.",
      control: "text",
      table: {
        type: { summary: "string" },
        category: "🎨 Visual Styling",
      },
    },
    legend: {
      description: `
**Legend Visibility.** The legend lists one item per **row**; its swatch is the color of the row's mean value. Clicking an item hides/shows that row.
`,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    showColorScale: {
      description: `
**Color Scale Key.** Shows the value → color bucket strip under the grid, labelled with the domain's endpoints (diverging ramps get a zero notch at the center).

**Keep it on** unless an outer surface provides its own key — the tooltip is mouse-only, so on touch or in print this strip is the only way to read color as magnitude.
`,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    showCellLabels: {
      description: `
**In-cell Values.** Draws each cell's (compactly formatted) value inside the cell.

Safe on any data: a label auto-hides when it doesn't fit its cell, and its text color auto-contrasts with the cell color. Off by default because dense matrices read better through color alone.
`,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "📱 Display Options",
      },
    },
    showYAxis: {
      description:
        "Shows the row labels on the left. Long labels are truncated (max 200px) with a tooltip carrying the full text.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    height: {
      description:
        'The height of the chart. A number is in px; a CSS string (e.g. `"100%"`) sizes the container and is measured. When omitted, the grid area is 296px tall and the color scale and legend sit below it.',
      control: "number",
      table: {
        type: { summary: "string | number" },
        category: "📱 Display Options",
      },
    },
    width: {
      description:
        'The width of the chart: a number in px or a CSS string (e.g. `"100%"`). Defaults to the container\'s width.',
      control: "number",
      table: {
        type: { summary: "string | number" },
        category: "📱 Display Options",
      },
    },
    fitLegendInHeight: {
      description: `
Whether the legend and color scale are laid out **inside** \`height\` (the grid shrinks to make room) or placed **below** the chart.

Defaults to \`true\` when a \`height\` is set, otherwise \`false\`.
`,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "height !== undefined" },
        category: "📱 Display Options",
      },
    },
    isAnimationActive: {
      description: `
**Entrance Animation.** A left-to-right column fade-in wave. Only the entrance is gated — recolors on data updates always tween, and printing always disables it.

**Default is false** (unlike most charts) so cells mounted while data streams in don't replay staggered entrances.
`,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "🎬 Animation & Interaction",
      },
    },
    onClick: {
      description:
        "Called when a cell is clicked with the original data object (the column), its column index, and the row key. Cells show a pointer cursor when set.",
      control: false,
      table: {
        type: { summary: "(row: T[number], columnIndex: number, rowKey: string) => void" },
        category: "🎬 Animation & Interaction",
      },
    },
  },
} satisfies Meta<typeof HeatmapChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Interactive Playground
 *
 * Switch datasets with the buttons and use the Controls panel to try every prop.
 * Click a cell to see the `onClick` payload.
 */
export const InteractivePlayground: Story = {
  name: "🎮 Interactive Playground",
  args: {
    rampMode: "sequential",
    legend: true,
    showColorScale: true,
    showCellLabels: false,
    showYAxis: true,
    cellGap: 2,
    cellRadius: 2,
    isAnimationActive: false,
    height: undefined,
    width: undefined,
  },
  render: (args: any) => {
    const [selectedDataType, setSelectedDataType] =
      useState<keyof typeof dataVariations>("weeklyTraffic");
    const [lastClick, setLastClick] = useState<string | null>(null);

    const currentData: HeatmapChartData = dataVariations[selectedDataType];
    const currentCategoryKey = categoryKeys[selectedDataType];

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
            🟪 Heatmap Chart Test Suite
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {(Object.keys(dataVariations) as Array<keyof typeof dataVariations>).map((key) => (
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
            <strong>Current Dataset:</strong> {selectedDataType} | <strong>Columns:</strong>{" "}
            {currentData.length} | <strong>Rows:</strong>{" "}
            {Object.keys(currentData[0] ?? {}).length - 1} | <strong>Category Key:</strong>{" "}
            {currentCategoryKey}
          </div>
          <div style={{ marginTop: "6px", fontSize: "12px", color: "#666" }}>
            <strong>Last clicked cell:</strong> {lastClick ?? "— click any cell"}
          </div>
        </Card>
        <Card
          style={{
            width: "100%",
            padding: "24px",
            resize: "horizontal",
            overflow: "hidden",
            minWidth: "320px",
          }}
        >
          <HeatmapChart
            {...args}
            data={currentData}
            categoryKey={currentCategoryKey}
            onClick={(row, columnIndex, rowKey) =>
              setLastClick(
                `${rowKey} × ${String(row[currentCategoryKey])} (column ${columnIndex}) = ${
                  row[rowKey] === "" ? "no value" : String(row[rowKey])
                }`,
              )
            }
          />
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Use the buttons to switch between datasets (sequential, signed, correlation, dense, sparse and long-label data) and the Controls panel to change every prop in real time.
Try switching **Revenue Change** or **Correlation** to \`rampMode: "diverging"\`, and click legend items to hide rows — the color domain re-fits to what's visible.
The card is horizontally resizable (drag its bottom-right corner).
`,
      },
    },
  },
};

/**
 * ## Default Configuration
 *
 * The HeatmapChart with its default settings: sequential ramp, color scale key,
 * row labels and row legend.
 */
export const DefaultConfiguration: Story = {
  name: "📊 Default Configuration",
  args: {
    data: weeklyTrafficData,
    categoryKey: "slot",
  },
  render: (args: any) => (
    <Card style={{ width: "720px", height: "auto", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
          Website Traffic by Day and Time
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Sessions per 2-hour slot — weekday peaks mid-morning and mid-afternoon, weekends in the
          evening.
        </p>
      </div>
      <HeatmapChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
The recommended starting configuration: pass \`data\` and \`categoryKey\`, everything else uses its default.

**Configuration Details:**
- **Data**: 8 time slots (columns) × 7 weekdays (rows).
- **Ramp**: \`sequential\` over the ThemeProvider's \`defaultChartPalette\` (the built-in ocean ramp when the theme has none); low values take the first color.
- **Color Scale**: On — the strip below the grid maps colors back to values.
- **Legend**: One item per weekday; click one to hide that row.
- **Tooltip**: Hover a cell for its value plus the row and column averages.
        `,
      },
      source: {
        code: `<HeatmapChart data={weeklyTrafficData} categoryKey="slot" />`,
      },
    },
  },
};

/**
 * ## Ramp Modes: Sequential vs Diverging
 *
 * The same signed dataset rendered with both ramp modes.
 */
export const RampModes: Story = {
  name: "⚖️ Ramp Modes: Sequential vs Diverging",
  args: {
    data: revenueChangeData,
    categoryKey: "month",
    showCellLabels: true,
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "760px" }}>
      <Card style={{ width: "100%", padding: "24px" }}>
        <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>
          rampMode="sequential"
        </h3>
        <p style={{ margin: "0 0 16px 0", color: "#666", fontSize: "14px" }}>
          The ramp spans min → max (−14% … +32%): small losses and small gains look alike.
        </p>
        <HeatmapChart {...args} rampMode="sequential" />
      </Card>
      <Card style={{ width: "100%", padding: "24px" }}>
        <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>
          rampMode="diverging"
        </h3>
        <p style={{ margin: "0 0 16px 0", color: "#666", fontSize: "14px" }}>
          The domain is forced symmetric (±32%): zero is the neutral middle, losses are blue and
          gains are orange.
        </p>
        <HeatmapChart {...args} rampMode="diverging" />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Month-over-month revenue change per product line is **signed**, and zero is meaningful.

- **sequential** (default) quantizes the plain min → max extent, so the ramp's middle falls at +9% — not at zero.
- **diverging** makes the domain symmetric around zero (\`±max(|min|, |max|)\`), so zero always lands on the neutral middle bucket and the color scale shows a zero notch at its center. Without a \`customPalette\` it uses a built-in blue ↔ orange ramp (colorblind-safer than red/green) with separate light- and dark-mode variants.
        `,
      },
      source: {
        code: `<HeatmapChart data={revenueChangeData} categoryKey="month" rampMode="diverging" showCellLabels />`,
      },
    },
  },
};

/**
 * ## Cell Value Labels
 *
 * In-cell values on a correlation matrix, and their auto-hiding on a dense grid.
 */
export const CellValueLabels: Story = {
  name: "🔢 Cell Value Labels",
  args: {
    data: correlationData,
    categoryKey: "metric",
    rampMode: "diverging",
    showCellLabels: true,
    legend: false,
    height: 380,
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "760px" }}>
      <Card style={{ width: "100%", padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
            KPI Correlation Matrix
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Pearson correlation between product KPIs — values in every cell, zero on the neutral
            middle.
          </p>
        </div>
        <HeatmapChart {...args} />
      </Card>
      <Card style={{ width: "100%", padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
            Labels auto-hide when they don't fit
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            The same <code>showCellLabels</code> on a 48-column grid: cells too narrow for their
            value simply show color.
          </p>
        </div>
        <HeatmapChart data={denseCpuData} categoryKey="time" showCellLabels legend={false} />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
\`showCellLabels\` draws each value inside its cell using the chart's compact number format (\`0.72\`, \`1.3K\`, \`2.4M\`).

- **Auto-contrast**: each label picks dark or light text against its own cell color.
- **Auto-hide**: a label that doesn't fit its cell (width or height) is skipped, so the prop is safe to enable on any data.
- **Diverging + labels** is the natural fit for correlation tables, where both sign and size matter.
        `,
      },
      source: {
        code: `<HeatmapChart
  data={correlationData}
  categoryKey="metric"
  rampMode="diverging"
  showCellLabels
  legend={false}
  height={380}
/>`,
      },
    },
  },
};

/**
 * ## Display & Shape Options
 *
 * Toggling the color scale, legend and row labels, and changing cell gap and radius.
 */
export const DisplayOptions: Story = {
  name: "🧩 Display & Shape Options",
  args: {
    data: regionalRevenueData,
    categoryKey: "month",
  },
  render: (args: any) => {
    const variants: Array<{
      title: string;
      note: string;
      props: Partial<HeatmapChartProps<HeatmapChartData>>;
    }> = [
      { title: "Defaults", note: "Color scale, legend and row labels on", props: {} },
      {
        title: "showColorScale={false}",
        note: "Relies on the tooltip for values",
        props: { showColorScale: false },
      },
      { title: "legend={false}", note: "No row legend or row toggling", props: { legend: false } },
      {
        title: "showYAxis={false}",
        note: "Row labels hidden — grid takes the width",
        props: { showYAxis: false },
      },
      {
        title: "cellGap={0} cellRadius={0}",
        note: "A continuous, seamless surface",
        props: { cellGap: 0, cellRadius: 0 },
      },
      {
        title: "cellGap={6} cellRadius={8}",
        note: "Rounded, tile-like cells",
        props: { cellGap: 6, cellRadius: 8 },
      },
    ];

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", width: "960px" }}>
        {variants.map((variant) => (
          <Card key={variant.title} style={{ width: "100%", padding: "20px" }}>
            <h4
              style={{
                margin: "0 0 4px 0",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "monospace",
              }}
            >
              {variant.title}
            </h4>
            <p style={{ margin: "0 0 12px 0", color: "#666", fontSize: "12px" }}>{variant.note}</p>
            <HeatmapChart {...args} {...variant.props} height={260} />
          </Card>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Monthly revenue per region, rendered with the display and shape props that change the chart's chrome.

- **\`showColorScale\`**: the value key under the grid. Keep it unless the surrounding UI provides its own — without it, touch and print readers can't decode color.
- **\`legend\`**: the row legend; each swatch is the color of that row's average.
- **\`showYAxis\`**: the row labels; hiding them gives the grid the full width.
- **\`cellGap\` / \`cellRadius\`**: pixel gap and corner radius of every cell.

All panels pass \`height={260}\`, so the legend and color scale fit inside that height (\`fitLegendInHeight\` defaults to \`true\` when \`height\` is set).
        `,
      },
    },
  },
};

/**
 * ## Custom Palette
 *
 * Custom sequential and diverging ramps via `customPalette`.
 */
export const CustomPalette: Story = {
  name: "🎨 Custom Palette",
  args: {
    data: regionalRevenueData,
    categoryKey: "month",
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "760px" }}>
      <Card style={{ width: "100%", padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
            Sequential ramp: Regional Revenue ($K)
          </h3>
          <PaletteSwatches colors={sunsetPalette} label="low → high" />
        </div>
        <HeatmapChart {...args} customPalette={sunsetPalette} />
      </Card>
      <Card style={{ width: "100%", padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
            Diverging ramp: Revenue Change (%)
          </h3>
          <PaletteSwatches colors={purpleGreenPalette} label="− → 0 → +" />
        </div>
        <HeatmapChart
          data={revenueChangeData}
          categoryKey="month"
          rampMode="diverging"
          customPalette={purpleGreenPalette}
          showCellLabels
        />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
\`customPalette\` is an **ordered ramp** (low → high), not a list of series colors: each color becomes one bucket of the value scale, so more colors means finer steps.

- **Sequential**: the ramp spans min → max of the visible values.
- **Diverging**: the ramp is read as low → neutral → high. Use an **odd** number of colors so zero lands on one exact middle color.

A \`customPalette\` always wins over the ThemeProvider's \`defaultChartPalette\` and over the built-in diverging ramp.
        `,
      },
      source: {
        code: `const sunset = ["#0D0887", "#42049E", "#6A00A8", /* … */ "#FCCE25", "#FFE06E"];
const purpleGreen = ["#762A83", "#9970AB", "#C2A5CF", "#E7D4E8", "#F7F7F7", "#D9F0D3", "#A6DBA0", "#5AAE61", "#1B7837"];

<HeatmapChart data={regionalRevenueData} categoryKey="month" customPalette={sunset} />

<HeatmapChart
  data={revenueChangeData}
  categoryKey="month"
  rampMode="diverging"
  customPalette={purpleGreen}
  showCellLabels
/>`,
      },
    },
  },
};

/**
 * ## Data Edge Cases
 *
 * A dense grid, a sparse grid with missing values, and long labels on both axes.
 */
export const DataEdgeCases: Story = {
  name: "📈 Dense, Sparse & Long-Label Data",
  args: {
    data: denseCpuData,
    categoryKey: "time",
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "860px" }}>
      <Card style={{ width: "100%", padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
            Dense: CPU Utilisation (%) — 48 columns × 8 hosts
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            X-axis labels thin out to every n-th column once bands get too narrow to read.
          </p>
        </div>
        <HeatmapChart {...args} cellGap={1} customPalette={sunsetPalette} />
      </Card>
      <Card style={{ width: "100%", padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
            Sparse: Survey Response Rate (%)
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Empty values render as muted cells; hovering one shows "No value".
          </p>
        </div>
        <HeatmapChart data={sparseSurveyData} categoryKey="week" showCellLabels />
      </Card>
      <Card style={{ width: "100%", padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
            Long Labels: Product Adoption (%) by Metro Area
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Row labels wider than 200px are truncated (hover one for the full name); column labels
            truncate to their band.
          </p>
        </div>
        <HeatmapChart data={longLabelData} categoryKey="product" customPalette={sunsetPalette} />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Dense grids** — 48 half-hour columns × 8 hosts. Once a column is narrower than a readable tick, the x-axis shows every n-th label instead of an ellipsis per column; the cell gap is capped at half a cell so the grid never disappears.

**Sparse grids** — cells whose value is \`""\`, missing or non-numeric are drawn as muted "no value" cells. They are excluded from the color domain and the row/column averages, and their tooltip reads **No value**.

**Long labels** — row labels get up to 200px and are truncated with a hover tooltip carrying the full text; column labels are truncated to their band width.
        `,
      },
      source: {
        code: `// "" marks a cell with no value
const survey = [
  { week: "Wk 1", Design: 82, Engineering: 64, Marketing: "", Sales: 41, Support: 77 },
  { week: "Wk 2", Design: "", Engineering: 71, Marketing: 58, Sales: "", Support: 80 },
  // …
];

<HeatmapChart data={survey} categoryKey="week" showCellLabels />`,
      },
    },
  },
};

/**
 * ## Responsive Widths
 *
 * The same chart in containers of different widths.
 */
export const ResponsiveWidths: Story = {
  name: "📱 Responsive Behavior Demo",
  args: {
    data: weeklyTrafficData,
    categoryKey: "slot",
    showCellLabels: true,
  },
  render: (args: any) => (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "flex-start" }}
    >
      {[340, 560, 860].map((containerWidth) => (
        <div key={containerWidth}>
          <div
            style={{
              marginBottom: "8px",
              fontSize: "12px",
              color: "#666",
              fontFamily: "monospace",
            }}
          >
            container: {containerWidth}px
          </div>
          <Card style={{ width: `${containerWidth}px`, padding: "20px", boxSizing: "border-box" }}>
            <HeatmapChart {...args} />
          </Card>
        </div>
      ))}
      <div
        style={{
          padding: "12px",
          backgroundColor: "#f8f9fa",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#666",
          maxWidth: "860px",
        }}
      >
        <strong>📊 Responsive Features Demonstrated:</strong>
        <ul style={{ margin: "8px 0 0 0", paddingLeft: "16px" }}>
          <li>The grid fills the container width; row labels keep their measured width</li>
          <li>Cell labels appear only where the value fits inside the cell</li>
          <li>X-axis labels truncate, then thin out as columns get narrower</li>
          <li>The legend wraps and collapses behind an expand toggle when space runs out</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Responsive Design:**

- The chart measures its container with a ResizeObserver; width always follows the container unless \`width\` is set.
- Height stays at the 296px default (or your \`height\`), so narrow containers get narrower — not shorter — cells.
- Cell labels (\`showCellLabels\` is on here) hide per cell as cells shrink, and x-axis labels thin out below ~28px per column.
        `,
      },
    },
  },
};
