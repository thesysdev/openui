import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CalendarHeatmap, CalendarHeatmapDatum, CalendarHeatmapProps } from "../..";
import { Card } from "../../../Card";

// 📊 DATA VARIATIONS - every dataset is built from FIXED dates with a seeded PRNG,
// so each render (and every visual snapshot) is identical. No Date.now(), no Math.random().

/** Seeded PRNG (mulberry32): the same seed always yields the same sequence. */
function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Local `YYYY-MM-DD` for a Date (never routed through UTC, so no day drifts). */
function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** One datum per day from `start` to `end` (inclusive), valued by `valueFor`. */
function eachDay(start: Date, end: Date, valueFor: (date: Date) => number): CalendarHeatmapDatum[] {
  const days: CalendarHeatmapDatum[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push({ date: isoDay(cursor), value: valueFor(cursor) });
  }
  return days;
}

/**
 * GitHub-style daily commit counts: mostly 0-4, quieter weekends, the odd busy
 * day, short zero-value stretches and a two-week summer break (Aug 4-15).
 */
function commitActivity(start: Date, end: Date, seed: number): CalendarHeatmapDatum[] {
  const random = seededRandom(seed);
  let quietDays = 0;
  return eachDay(start, end, (date) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isSummerBreak = date.getMonth() === 7 && date.getDate() >= 4 && date.getDate() <= 15;
    if (isSummerBreak) return 0;
    if (quietDays === 0 && random() < 0.04) quietDays = 2 + Math.floor(random() * 4);
    if (quietDays > 0) {
      quietDays--;
      return 0;
    }
    if (isWeekend) return random() < 0.65 ? 0 : 1 + Math.floor(random() * 2);
    return Math.floor(Math.pow(random(), 1.6) * 8);
  });
}

/** Daily store revenue in dollars: busier weekends, a Nov-Dec holiday lift, closed on 3 holidays. */
function dailyRevenue(year: number, seed: number): CalendarHeatmapDatum[] {
  const random = seededRandom(seed);
  const closed = new Set([`${year}-01-01`, `${year}-07-04`, `${year}-12-25`]);
  return eachDay(new Date(year, 0, 1), new Date(year, 11, 31), (date) => {
    if (closed.has(isoDay(date))) return 0;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const holidayLift = date.getMonth() >= 10 ? 1400 : 0;
    return Math.round((isWeekend ? 2600 : 1500) + holidayLift + random() * 1400 - 400);
  });
}

// Same seed + same start date → the 2025 half of the two-year series equals `commits2025`.
const twoYearsOfCommits = commitActivity(new Date(2025, 0, 1), new Date(2026, 11, 31), 7);
const commits2025 = commitActivity(new Date(2025, 0, 1), new Date(2025, 11, 31), 7);
const projectActivity = commitActivity(new Date(2025, 1, 10), new Date(2025, 10, 21), 11);
const revenue2025 = dailyRevenue(2025, 3);
const quietYear = eachDay(new Date(2025, 0, 1), new Date(2025, 11, 31), () => 0);

// Sparse input: a release train every third Tuesday (skipping the August freeze).
// Missing days are simply level 0 — no need to pad the array.
const productionReleases: CalendarHeatmapDatum[] = [
  { date: "2025-01-14", value: 1 },
  { date: "2025-02-04", value: 2 },
  { date: "2025-02-25", value: 1 },
  { date: "2025-03-18", value: 3 },
  { date: "2025-04-08", value: 1 },
  { date: "2025-04-29", value: 2 },
  { date: "2025-05-20", value: 1 },
  { date: "2025-05-22", value: 4 }, // hotfix day
  { date: "2025-06-10", value: 1 },
  { date: "2025-07-01", value: 2 },
  { date: "2025-07-22", value: 1 },
  { date: "2025-09-02", value: 3 },
  { date: "2025-09-23", value: 1 },
  { date: "2025-10-14", value: 2 },
  { date: "2025-11-04", value: 1 },
  { date: "2025-11-25", value: 2 },
  // Two entries on the same day are SUMMED onto one cell (1 + 2 = 3).
  { date: "2025-12-16", value: 1 },
  { date: "2025-12-16", value: 2 },
];

const YEAR_2025: [string, string] = ["2025-01-01", "2025-12-31"];

// GitHub-green levels 0-4. Level 0 is a translucent slate so it reads on light and dark cards.
const GREEN_LEVELS: [string, string, string, string, string] = [
  "rgba(148, 163, 184, 0.2)",
  "#9BE9A8",
  "#40C463",
  "#30A14E",
  "#216E39",
];

// `range` presets for the playground's select control, mapped to real values. Keys stay
// URL-safe (letters, digits, spaces, hyphens) so a chosen preset survives in the story URL.
const RANGE_PRESETS: Record<string, CalendarHeatmapProps["range"]> = {
  "Jan-Dec 2025": YEAR_2025,
  "Jul-Dec 2025 - 6 months": ["2025-07-01", "2025-12-31"],
  "Oct 2025 - Mar 2026": ["2025-10-01", "2026-03-31"],
  "Data extent - range omitted": undefined,
  "12m - ending today": "12m",
  "6m - ending today": "6m",
};

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const totalOf = (data: CalendarHeatmapDatum[]) => data.reduce((sum, day) => sum + day.value, 0);

/** Shared card chrome: a title, an optional caption, then the chart. */
function ChartCard({
  title,
  caption,
  width = 760,
  children,
}: {
  title: string;
  caption?: React.ReactNode;
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ width: `${width}px`, height: "auto", padding: "24px" }}>
      <div>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>{title}</h3>
        {caption && <p style={{ margin: 0, opacity: 0.7, fontSize: "14px" }}>{caption}</p>}
      </div>
      {children}
    </Card>
  );
}

/**
 * # CalendarHeatmap Component Documentation
 *
 * The CalendarHeatmap lays daily values out as a GitHub-contributions-style grid:
 * one column per week, one row per weekday, each day shaded by a discrete 0-4
 * activity level. It's highly effective for:
 *
 * - **Activity Tracking**: Commits, deploys, workouts, support tickets per day
 * - **Seasonality**: Spotting weekly rhythms, holidays and busy seasons at a glance
 * - **Streaks & Gaps**: Making quiet stretches and bursts of activity obvious
 *
 * ## Key Features
 * - **Date Windows**: `"6m"` / `"12m"` (ending today), an explicit `[start, end]`, or the data's own extent
 * - **Level Scale**: Configurable `thresholds` and `levelColors`, or a ramp sampled from the theme / `customPalette`
 * - **Level Patterns**: Hatch and dot tiles per level for colorblind-safe and print-friendly output
 * - **Layout**: `fluid` square cells, `fill` to stretch into a fixed height, or a fixed `binSize`
 * - **Column Separators**: Quarter or every-N-weeks rules, optional gutters and quarter labels
 * - **Interactive**: Hover tooltips, a Less→More legend linked to the grid, and `onClick`
 */
const meta: Meta<CalendarHeatmapProps> = {
  title: "Components/Charts/CalendarHeatmap",
  component: CalendarHeatmap,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { CalendarHeatmap } from '@openuidev/react-ui/Charts/CalendarHeatmap';

// Basic implementation: the window is the data's own first → last day
<CalendarHeatmap data={dailyCommits} />

// GitHub-style: the last 12 months, ending today
<CalendarHeatmap data={dailyCommits} range="12m" />
\`\`\`

## Data Structure Requirements

Your data should be an array of \`{ date, value }\` objects:
- **date** (\`string | Date\`): A date-only string (\`"2025-03-14"\`) or a \`Date\`. Parsed in LOCAL time, so a day never drifts across a timezone boundary.
- **value** (\`number\`): The day's magnitude (commits, sales, events…).

Sparse data is fine: missing days render as level 0. Several entries on the same day are **summed** onto one cell.

\`\`\`tsx
const dailyCommits = [
  { date: "2025-01-02", value: 3 },
  { date: "2025-01-03", value: 1 },
  { date: "2025-01-06", value: 7 },
];
\`\`\`

## How values become colors

Each day maps to one of five levels. With the default \`thresholds={[1, 2, 3, 4]}\` a day with 0
is level 0 (the "empty" level) and 4+ saturates to level 4. The five level colors are sampled
from the theme's chart palette unless you pass \`customPalette\` (a ramp) or \`levelColors\`
(five exact colors).

## When to Use
- **Use it** for one value per day over weeks to a couple of years.
- **Prefer a LineChart / AreaChart** for trends in precise magnitudes, or a **HeatmapChart** for arbitrary row × column matrices.

## Performance Considerations
- **Data Size**: One SVG cell per day; a year is ~370 cells, two years ~740.
- **Responsiveness**: \`fluid\` and \`fill\` layouts re-measure the container on resize.
- **Animation**: Off by default (streaming-safe); enable \`isAnimationActive\` for a staggered entrance.
        `,
      },
    },
  },
  tags: ["dev", "autodocs"],
  argTypes: {
    data: {
      description: `
**Required.** An array of \`{ date, value }\` objects, one per day.

**Best Practices:**
- Use date-only strings (\`"2025-03-14"\`) to avoid timezone surprises.
- You don't need an entry for every day: missing days are level 0.
- Duplicate dates are summed onto a single cell.
`,
      control: false,
      table: {
        type: { summary: "Array<{ date: string | Date; value: number }>" },
        category: "📊 Data Configuration",
      },
    },
    range: {
      description: `
**Date window** to display.

- **"6m" / "12m"**: a calendar-month window ending on **today** (GitHub-style; the data does not move it).
- **[start, end]**: an explicit window (Dates or date-only strings).
- **omitted**: the data's own earliest → latest day.

The first column is always aligned to \`weekStartDay\`.
`,
      control: false,
      table: {
        type: { summary: '"6m" | "12m" | [Date | string, Date | string]' },
        defaultValue: { summary: "data extent" },
        category: "📊 Data Configuration",
      },
    },
    thresholds: {
      description: `
**Level cutoffs** \`[t1, t2, t3, t4]\` (ascending) for levels 1-4. A day maps to the highest level whose
cutoff it meets; anything below \`t1\` is level 0.

**Tip:** The default is the GitHub scale (4+ saturates). Raise it for larger magnitudes, e.g. \`[1000, 2000, 3000, 4000]\` for revenue.
`,
      control: "object",
      table: {
        type: { summary: "[number, number, number, number]" },
        defaultValue: { summary: "[1, 2, 3, 4]" },
        category: "📊 Data Configuration",
      },
    },
    levelColors: {
      description:
        "Five explicit colors for levels 0-4 (empty → most active). Overrides the theme ramp and `customPalette`.",
      control: "object",
      table: {
        type: { summary: "[string, string, string, string, string]" },
        defaultValue: { summary: "sampled from the theme palette" },
        category: "🎨 Visual Styling",
      },
    },
    customPalette: {
      description:
        "An ordered color ramp (low → high) that five level colors are sampled from, overriding the ThemeProvider's chart palette. Superseded by `levelColors` when both are set.",
      control: "object",
      table: {
        type: { summary: "string[]" },
        category: "🎨 Visual Styling",
      },
    },
    levelStyles: {
      description: `
**Per-level overrides**, indexed 0-4. Each entry may be \`null\` to keep the default.

- **color**: recolor that level (supersedes \`levelColors\` / the palette).
- **pattern**: overlay a tile: \`"diagonal"\`, \`"dots"\`, \`"cross"\`, \`"horizontal"\`, \`"vertical"\`.
- **patternColor**: the pattern's stroke (defaults to the theme foreground).
`,
      control: "object",
      table: {
        type: {
          summary:
            "Array<{ color?: string; pattern?: CalendarLevelPattern; patternColor?: string } | null>",
        },
        category: "🎨 Visual Styling",
      },
    },
    gap: {
      description: "Gap between cells in px. The drawn square is the cell slot minus the gap.",
      control: { type: "number", min: 0, max: 10 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "3" },
        category: "🎨 Visual Styling",
      },
    },
    rowOpacity: {
      description:
        "Per-row opacity multiplier. A number dims every row; an array is indexed by display row (row 0 = top). Handy for de-emphasising weekends.",
      control: "object",
      table: {
        type: { summary: "number | number[]" },
        defaultValue: { summary: "1" },
        category: "🎨 Visual Styling",
      },
    },
    columnSeparators: {
      description: `
**Group the week columns** with vertical rules.

- **groupBy**: \`{ every: N }\` (a rule before every Nth column) or \`"quarter"\` (Jan / Apr / Jul / Oct).
- **spacing**: extra gutter in px opened at each rule (default 0, a hairline).
- **stroke** / **dashed**: rule color and dash style.
- **showLabels** / **labelFormat**: quarter labels (quarter mode only), default \`Q1 2025\`.
`,
      control: "object",
      table: {
        type: { summary: "CalendarColumnSeparators" },
        category: "🎨 Visual Styling",
      },
    },
    className: {
      description: "Extra class name for the chart container.",
      control: "text",
      table: {
        type: { summary: "string" },
        category: "🎨 Visual Styling",
      },
    },
    layout: {
      description: `
**How the grid sizes to its container:**

- **fluid**: square cells sized from the container width; the height hugs the seven rows.
- **fill**: cells stretch to fill both the width and the height (set \`height\`).
`,
      control: "radio",
      options: ["fluid", "fill"],
      table: {
        defaultValue: { summary: "fluid" },
        category: "📱 Display Options",
      },
    },
    binSize: {
      description:
        "Fixed cell slot size in px, overriding the auto-size from `layout`. The drawn square is `binSize - gap`.",
      control: { type: "number", min: 4, max: 32 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "auto" },
        category: "📱 Display Options",
      },
    },
    weekStartDay: {
      description: "The weekday that opens each column (row 0): 0 = Sunday (GitHub), 1 = Monday, …",
      control: {
        type: "select",
        labels: {
          0: "Sunday",
          1: "Monday",
          2: "Tuesday",
          3: "Wednesday",
          4: "Thursday",
          5: "Friday",
          6: "Saturday",
        },
      },
      options: [0, 1, 2, 3, 4, 5, 6],
      table: {
        type: { summary: "0 | 1 | 2 | 3 | 4 | 5 | 6" },
        defaultValue: { summary: "0" },
        category: "📱 Display Options",
      },
    },
    hideGhostCells: {
      description:
        "Drop the padding days outside the window (the corners of the first and last week). Set `false` to draw them as faded level-0 cells.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    weekdayTickFilter: {
      description:
        "Which weekday rows get a label: `odd` (Mon / Wed / Fri for a Sunday start), `even`, or `all`.",
      control: "radio",
      options: ["odd", "even", "all"],
      table: {
        defaultValue: { summary: "odd" },
        category: "📱 Display Options",
      },
    },
    weekdayLabelFormat: {
      description: "Weekday label style: `full` (`Mon`) or `initial` (`M`).",
      control: "radio",
      options: ["full", "initial"],
      table: {
        defaultValue: { summary: "full" },
        category: "📱 Display Options",
      },
    },
    showMonthLabels: {
      description: "Show the short month labels along the top.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    legendVariant: {
      description:
        "The Less → More legend under the grid: five `swatches`, a continuous `gradient` bar, or `none`.",
      control: "radio",
      options: ["swatches", "gradient", "none"],
      table: {
        defaultValue: { summary: "swatches" },
        category: "📱 Display Options",
      },
    },
    legendLabels: {
      description: "Override the legend's bracketing labels.",
      control: "object",
      table: {
        type: { summary: "{ less?: string; more?: string }" },
        defaultValue: { summary: '{ less: "Less", more: "More" }' },
        category: "📱 Display Options",
      },
    },
    height: {
      description: 'The height of the chart. Required for `layout="fill"` to have room to fill.',
      control: "text",
      table: {
        type: { summary: "string | number" },
        category: "📱 Display Options",
      },
    },
    width: {
      description: "The width of the chart.",
      control: "text",
      table: {
        type: { summary: "string | number" },
        category: "📱 Display Options",
      },
    },
    isAnimationActive: {
      description:
        "Play the staggered fade-in entrance. Off by default so charts mounted while data streams in don't replay it; printing always disables it.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "🎬 Animation & Interaction",
      },
    },
    animationDuration: {
      description:
        "Entrance window in ms: the span the per-cell stagger scatters the fade-ins over. Only used when `isAnimationActive`.",
      control: { type: "number", min: 0, max: 5000, step: 100 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "1600" },
        category: "🎬 Animation & Interaction",
      },
    },
    valueLabel: {
      description: "Name of the day's value in the tooltip.",
      control: "text",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: '"Contributions"' },
        category: "🎬 Animation & Interaction",
      },
    },
    formatTooltipLabel: {
      description:
        "Format the tooltip value from the day's summed `value` and its `Date`, e.g. to add units or a currency symbol.",
      control: false,
      table: {
        type: { summary: "(value: number, date: Date) => string" },
        defaultValue: { summary: "the raw value" },
        category: "🎬 Animation & Interaction",
      },
    },
    tooltipDelay: {
      description:
        "Tooltip show / hide delays in ms. The hide grace period keeps the tooltip alive while the pointer crosses between cells.",
      control: "object",
      table: {
        type: { summary: "{ show?: number; hide?: number }" },
        defaultValue: { summary: "{ show: 0, hide: 120 }" },
        category: "🎬 Animation & Interaction",
      },
    },
    onClick: {
      description: "Called when a day is clicked, with its `Date` and summed `value`.",
      control: false,
      table: {
        type: { summary: "(date: Date, value: number) => void" },
        category: "🎬 Animation & Interaction",
      },
    },
  },
} satisfies Meta<typeof CalendarHeatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InteractivePlayground: Story = {
  name: "🎮 Interactive Playground",
  args: {
    data: twoYearsOfCommits,
    // A preset label; Storybook maps it to its value via `argTypes.range.mapping`.
    range: "Jan-Dec 2025" as unknown as CalendarHeatmapProps["range"],
    thresholds: [1, 2, 3, 4],
    layout: "fluid",
    gap: 3,
    weekStartDay: 0,
    hideGhostCells: true,
    weekdayTickFilter: "odd",
    weekdayLabelFormat: "full",
    showMonthLabels: true,
    legendVariant: "swatches",
    legendLabels: { less: "Less", more: "More" },
    tooltipDelay: { show: 0, hide: 120 },
    isAnimationActive: false,
    animationDuration: 1600,
  },
  argTypes: {
    range: {
      control: "select",
      options: Object.keys(RANGE_PRESETS),
      mapping: RANGE_PRESETS,
    },
  },
  render: (args: any) => (
    <Card style={{ width: "760px", height: "auto", padding: "24px" }}>
      <CalendarHeatmap {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use the Controls panel to try every prop. `"12m"` and `"6m"` end on **today**, so their grid moves day by day; the fixed presets always render the same window.',
      },
    },
  },
};

export const DefaultConfiguration: Story = {
  name: "📊 Default Configuration",
  args: {
    data: commits2025,
  },
  render: (args: any) => (
    <ChartCard
      title="Contribution Activity"
      caption={`${totalOf(commits2025).toLocaleString("en-US")} commits in 2025`}
    >
      <CalendarHeatmap {...args} />
    </ChartCard>
  ),
  parameters: {
    docs: {
      description: {
        story: `
The recommended starting point: pass one \`{ date, value }\` per day and nothing else.

**Configuration Details:**
- **Window**: the data's first → last day (Jan 1 - Dec 31 2025), starting on a Sunday column.
- **Levels**: \`[1, 2, 3, 4]\`, so days with 4+ commits saturate the darkest shade.
- **Colors**: five stops sampled from the ThemeProvider's chart palette.
- **Hover**: a cell shows its date and value; hovering a legend swatch dims the other levels.
        `,
      },
      source: {
        code: `
const dailyCommits = [
  { date: "2025-01-01", value: 0 },
  { date: "2025-01-02", value: 3 },
  // ... one entry per day
];

<CalendarHeatmap data={dailyCommits} />
`,
      },
    },
  },
};

export const DateWindows: Story = {
  name: "📅 Date Windows",
  args: {
    levelColors: GREEN_LEVELS,
    data: twoYearsOfCommits,
  },
  render: (args: any) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", width: "784px" }}>
      <ChartCard
        width={380}
        title="Six Months"
        caption={<code>range=["2025-07-01", "2025-12-31"]</code>}
      >
        <CalendarHeatmap {...args} range={["2025-07-01", "2025-12-31"]} />
      </ChartCard>
      <ChartCard
        width={380}
        title="Across a Year Boundary"
        caption={<code>range=["2025-10-01", "2026-03-31"]</code>}
      >
        <CalendarHeatmap {...args} range={["2025-10-01", "2026-03-31"]} />
      </ChartCard>
      <div style={{ gridColumn: "1 / -1" }}>
        <ChartCard
          width={784}
          title="Data Extent (range omitted)"
          caption="A project that ran from Mon Feb 10 to Fri Nov 21 2025: the grid spans exactly those days."
        >
          <CalendarHeatmap {...args} data={projectActivity} />
        </ChartCard>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Window options:**
- **\`[start, end]\`**: an explicit window. The first column is aligned to \`weekStartDay\`, and the padding days before \`start\` / after \`end\` are hidden.
- **omitted**: the data's earliest → latest day.
- **\`"6m"\` / \`"12m"\`**: a GitHub-style window ending **today**. It moves every day, so these examples use fixed windows; try the relative ones in the Interactive Playground.
        `,
      },
      source: {
        code: `
// Last six months of 2025
<CalendarHeatmap data={dailyCommits} range={["2025-07-01", "2025-12-31"]} />

// Any window, including across a year boundary
<CalendarHeatmap data={dailyCommits} range={["2025-10-01", "2026-03-31"]} />

// Rolling window ending today (GitHub-style)
<CalendarHeatmap data={dailyCommits} range="12m" />
`,
      },
    },
  },
};

function RevenueCalendars(args: CalendarHeatmapProps) {
  const [selected, setSelected] = useState<{ date: Date; value: number } | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <ChartCard
        title="Daily Store Revenue: 2025"
        caption="Custom thresholds and level colors, currency tooltips. Click a day to inspect it."
      >
        <CalendarHeatmap {...args} onClick={(date, value) => setSelected({ date, value })} />
        <div style={{ fontSize: "13px", opacity: 0.8 }}>
          {selected
            ? `Selected: ${selected.date.toDateString()} · ${usd.format(selected.value)}`
            : "Selected: none"}
        </div>
      </ChartCard>
      <ChartCard
        title="Ramp from customPalette"
        caption="Same thresholds; five level colors sampled evenly from a 9-color blue ramp."
      >
        <CalendarHeatmap
          {...args}
          levelColors={undefined}
          customPalette={[
            "#EFF6FF",
            "#DBEAFE",
            "#BFDBFE",
            "#93C5FD",
            "#60A5FA",
            "#3B82F6",
            "#2563EB",
            "#1D4ED8",
            "#1E3A8A",
          ]}
        />
      </ChartCard>
      <ChartCard
        title="Without thresholds"
        caption="The default [1, 2, 3, 4] scale saturates: every open day is level 4."
      >
        <CalendarHeatmap {...args} thresholds={undefined} legendLabels={undefined} />
      </ChartCard>
    </div>
  );
}

export const ThresholdsAndLevelColors: Story = {
  name: "🎚️ Thresholds & Level Colors",
  args: {
    data: revenue2025,
    thresholds: [1000, 2000, 3000, 4000],
    levelColors: ["rgba(148, 163, 184, 0.2)", "#FDE68A", "#FBBF24", "#F59E0B", "#B45309"],
    legendLabels: { less: "$0", more: "$4k+" },
    valueLabel: "Revenue",
    formatTooltipLabel: (value: number) => usd.format(value),
  },
  render: (args: any) => <RevenueCalendars {...args} />,
  parameters: {
    docs: {
      description: {
        story: `
Revenue runs into the thousands, so the GitHub scale (4+ = darkest) would paint every open day the same. Custom
\`thresholds\` spread the values across all five levels: closed days are level 0, weekdays sit around levels 1-2,
weekends at 3 and the Nov-Dec holiday season at 4.

**Color options (highest precedence first):**
- **\`levelStyles[i].color\`**: recolor a single level.
- **\`levelColors\`**: five exact colors, level 0 → 4.
- **\`customPalette\`**: a ramp of any length; five stops are sampled from it, endpoints included.
- **Theme**: the ThemeProvider's chart palette.
        `,
      },
      source: {
        code: `
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

<CalendarHeatmap
  data={dailyRevenue}
  thresholds={[1000, 2000, 3000, 4000]}
  levelColors={["rgba(148, 163, 184, 0.2)", "#FDE68A", "#FBBF24", "#F59E0B", "#B45309"]}
  legendLabels={{ less: "$0", more: "$4k+" }}
  valueLabel="Revenue"
  formatTooltipLabel={(value) => usd.format(value)}
  onClick={(date, value) => console.log(date, value)}
/>
`,
      },
    },
  },
};

export const LevelPatterns: Story = {
  name: "♿ Level Patterns",
  args: {
    levelColors: GREEN_LEVELS,
    data: commits2025,
    levelStyles: [
      null,
      { pattern: "diagonal" },
      { pattern: "dots" },
      { pattern: "cross" },
      { pattern: "horizontal" },
    ],
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <ChartCard
        title="Pattern-Coded Levels"
        caption="Each active level adds a distinct tile, so the scale survives colorblindness and low-contrast screens."
      >
        <CalendarHeatmap {...args} />
      </ChartCard>
      <ChartCard
        title="Grayscale for Print"
        caption="Gray levelColors plus patterns with explicit patternColor: legible on a black-and-white printer."
      >
        <CalendarHeatmap
          {...args}
          levelColors={["rgba(148, 163, 184, 0.2)", "#D4D4D8", "#A1A1AA", "#52525B", "#27272A"]}
          levelStyles={[
            null,
            { pattern: "vertical", patternColor: "#18181B" },
            { pattern: "horizontal", patternColor: "#18181B" },
            { pattern: "diagonal", patternColor: "#FAFAFA" },
            { pattern: "cross", patternColor: "#FAFAFA" },
          ]}
        />
      </ChartCard>
      <ChartCard
        title="Flag One Level"
        caption="thresholds={[1, 2, 3, 6]} and a red level 4: crunch days (6+ commits) stand out."
      >
        <CalendarHeatmap
          {...args}
          thresholds={[1, 2, 3, 6]}
          levelStyles={[null, null, null, null, { color: "#E11D48" }]}
        />
      </ChartCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
\`levelStyles\` is indexed by level (0 = empty … 4 = most active); use \`null\` to leave a level alone.

**Available patterns:** \`diagonal\`, \`dots\`, \`cross\`, \`horizontal\`, \`vertical\`. Each pattern is drawn over the
level's color in \`patternColor\` (the theme foreground by default), and the legend swatches show the same tiles.
        `,
      },
      source: {
        code: `
<CalendarHeatmap
  data={dailyCommits}
  levelStyles={[
    null, // level 0 keeps the plain empty shade
    { pattern: "diagonal" },
    { pattern: "dots" },
    { pattern: "cross" },
    { pattern: "horizontal" },
  ]}
/>

// Recolor a single level
<CalendarHeatmap data={dailyCommits} levelStyles={[null, null, null, null, { color: "#E11D48" }]} />
`,
      },
    },
  },
};

export const LayoutAndSizing: Story = {
  name: "📐 Layout & Sizing",
  args: {
    levelColors: GREEN_LEVELS,
    data: commits2025,
    range: ["2025-01-01", "2025-04-30"],
  },
  render: (args: any) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", width: "784px" }}>
      <ChartCard width={380} title="Fluid (default)" caption="Square cells sized from the width.">
        <CalendarHeatmap {...args} layout="fluid" />
      </ChartCard>
      <ChartCard
        width={380}
        title="Fill"
        caption={<code>layout="fill" height=&#123;220&#125;</code>}
      >
        <CalendarHeatmap {...args} layout="fill" height={220} />
      </ChartCard>
      <ChartCard
        width={380}
        title="Fixed Bin Size"
        caption={<code>binSize=&#123;10&#125; gap=&#123;1&#125;</code>}
      >
        <CalendarHeatmap {...args} binSize={10} gap={1} />
      </ChartCard>
      <ChartCard width={380} title="Wide Gap" caption={<code>gap=&#123;6&#125;</code>}>
        <CalendarHeatmap {...args} gap={6} />
      </ChartCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Sizing modes:**
- **\`fluid\`** (default): square cells sized from the container width; the chart height follows.
- **\`fill\`**: cells stretch to fill both the width and a fixed \`height\`, so they become rectangles.
- **\`binSize\`**: a fixed cell slot in px that ignores the container (the drawn square is \`binSize - gap\`).
- **\`gap\`**: space between cells in px (default 3).
        `,
      },
      source: {
        code: `
<CalendarHeatmap data={dailyCommits} layout="fluid" />
<CalendarHeatmap data={dailyCommits} layout="fill" height={220} />
<CalendarHeatmap data={dailyCommits} binSize={10} gap={1} />
<CalendarHeatmap data={dailyCommits} gap={6} />
`,
      },
    },
  },
};

/** FY runs Apr → Mar and is named by its ending year: Apr 2025 opens FY26 Q1. */
const fiscalQuarterLabel = (quarter: number, year: number) => {
  const fiscalQuarter = ((quarter + 2) % 4) + 1;
  const fiscalYear = quarter >= 2 ? year + 1 : year;
  return `FY${String(fiscalYear).slice(2)} Q${fiscalQuarter}`;
};

export const ColumnSeparators: Story = {
  name: "🧱 Column Separators",
  args: {
    levelColors: GREEN_LEVELS,
    data: commits2025,
    columnSeparators: { groupBy: "quarter", showLabels: true, spacing: 8 },
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <ChartCard title="Quarters" caption="A labelled 8px gutter at each quarter start.">
        <CalendarHeatmap {...args} />
      </ChartCard>
      <ChartCard
        title="Every 4 Weeks"
        caption="Dashed hairlines marking four-week sprints, no gutter."
      >
        <CalendarHeatmap
          {...args}
          columnSeparators={{ groupBy: { every: 4 }, dashed: true, stroke: "#94A3B8" }}
        />
      </ChartCard>
      <ChartCard
        title="Fiscal Quarters"
        caption="An Apr - Mar fiscal year with a custom labelFormat."
      >
        <CalendarHeatmap
          {...args}
          data={twoYearsOfCommits}
          range={["2025-04-01", "2026-03-31"]}
          columnSeparators={{
            groupBy: "quarter",
            showLabels: true,
            spacing: 8,
            labelFormat: fiscalQuarterLabel,
          }}
        />
      </ChartCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Options:**
- **\`groupBy: "quarter"\`**: a rule at each Jan / Apr / Jul / Oct start; **\`groupBy: { every: N }\`**: a rule before every Nth week column.
- **\`spacing\`**: opens a gutter at each rule (default 0 keeps a hairline that doesn't move the grid).
- **\`stroke\`** / **\`dashed\`**: rule styling (defaults to the theme border color, solid).
- **\`showLabels\`** / **\`labelFormat\`**: quarter labels above each group (quarter mode only), default \`Q1 2025\`.
        `,
      },
      source: {
        code: `
<CalendarHeatmap
  data={dailyCommits}
  columnSeparators={{ groupBy: "quarter", showLabels: true, spacing: 8 }}
/>

<CalendarHeatmap
  data={dailyCommits}
  columnSeparators={{ groupBy: { every: 4 }, dashed: true, stroke: "#94A3B8" }}
/>

// Fiscal year Apr → Mar
<CalendarHeatmap
  data={dailyCommits}
  range={["2025-04-01", "2026-03-31"]}
  columnSeparators={{
    groupBy: "quarter",
    showLabels: true,
    labelFormat: (q, year) => \`FY\${String(q >= 2 ? year + 1 : year).slice(2)} Q\${((q + 2) % 4) + 1}\`,
  }}
/>
`,
      },
    },
  },
};

export const LegendAndAxisOptions: Story = {
  name: "🏷️ Legend & Axis Options",
  args: {
    levelColors: GREEN_LEVELS,
    data: commits2025,
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <ChartCard
        title="Gradient Legend"
        caption='legendVariant="gradient" with custom legendLabels.'
      >
        <CalendarHeatmap
          {...args}
          legendVariant="gradient"
          legendLabels={{ less: "No commits", more: "4+ commits" }}
        />
      </ChartCard>
      <ChartCard
        title="Monday Start, Weekends Dimmed"
        caption='weekStartDay={1}, weekdayTickFilter="all", weekdayLabelFormat="initial", rowOpacity on Sat / Sun.'
      >
        <CalendarHeatmap
          {...args}
          weekStartDay={1}
          weekdayTickFilter="all"
          weekdayLabelFormat="initial"
          rowOpacity={[1, 1, 1, 1, 1, 0.4, 0.4]}
        />
      </ChartCard>
      <div style={{ display: "flex", gap: "24px" }}>
        <ChartCard width={368} title="Minimal Widget" caption="No legend, no month labels.">
          <CalendarHeatmap
            {...args}
            range={["2025-10-01", "2025-12-31"]}
            legendVariant="none"
            showMonthLabels={false}
          />
        </ChartCard>
        <ChartCard
          width={368}
          title="Ghost Cells Shown"
          caption="hideGhostCells={false}: padding days drawn faded."
        >
          <CalendarHeatmap {...args} range={["2025-10-01", "2025-12-31"]} hideGhostCells={false} />
        </ChartCard>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Legend:** \`legendVariant\` is \`swatches\` (default), \`gradient\` or \`none\`; \`legendLabels\` renames the ends.

**Axes:**
- **\`weekStartDay\`**: the weekday in the top row (0 = Sunday … 6 = Saturday).
- **\`weekdayTickFilter\`**: label \`odd\` rows (default), \`even\` rows or \`all\` of them.
- **\`weekdayLabelFormat\`**: \`full\` (\`Mon\`) or \`initial\` (\`M\`).
- **\`showMonthLabels\`**: hide the month row for compact widgets.

**Cells:** \`hideGhostCells={false}\` draws the padding days before and after the window; \`rowOpacity\` dims rows by index.
        `,
      },
      source: {
        code: `
<CalendarHeatmap data={dailyCommits} legendVariant="gradient" legendLabels={{ less: "No commits", more: "4+ commits" }} />

<CalendarHeatmap
  data={dailyCommits}
  weekStartDay={1}
  weekdayTickFilter="all"
  weekdayLabelFormat="initial"
  rowOpacity={[1, 1, 1, 1, 1, 0.4, 0.4]}
/>

<CalendarHeatmap data={dailyCommits} range={["2025-10-01", "2025-12-31"]} legendVariant="none" showMonthLabels={false} />
`,
      },
    },
  },
};

export const SparseAndEmptyData: Story = {
  name: "🌱 Sparse & Empty Data",
  args: {
    levelColors: GREEN_LEVELS,
    data: productionReleases,
    range: YEAR_2025,
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <ChartCard
        title="Production Releases"
        caption={`${productionReleases.length} entries for the whole year; Dec 16 has two entries that sum to 3.`}
      >
        <CalendarHeatmap {...args} />
      </ChartCard>
      <ChartCard
        title="A Quiet Year"
        caption="365 days, every value 0: the grid renders entirely at level 0."
      >
        <CalendarHeatmap {...args} data={quietYear} range={undefined} />
      </ChartCard>
      <ChartCard title="No Data" caption="data={[]}">
        <CalendarHeatmap {...args} data={[]} />
      </ChartCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
- **Sparse**: pass only the days that happened. Pair it with a fixed \`range\`; without one the window would shrink to
  the first and last release.
- **All zero**: every day maps to level 0, so the grid still shows the full year.
- **Empty array**: the chart shows its "No data available" state instead of a grid.
        `,
      },
      source: {
        code: `
const releases = [
  { date: "2025-01-14", value: 1 },
  { date: "2025-02-04", value: 2 },
  // ...
  { date: "2025-12-16", value: 1 },
  { date: "2025-12-16", value: 2 }, // same day → summed to 3
];

<CalendarHeatmap data={releases} range={["2025-01-01", "2025-12-31"]} />
`,
      },
    },
  },
};
