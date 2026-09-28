// Copy of Charts/LineChartCondensed/stories/lineChartCondensed.stories.tsx with only the chart import and the title changed:
// the same args and renders, rendering the D3Charts chart via
// ../../stories/rechartsStoryAdapters.
import type { Meta, StoryObj } from "@storybook/react";
import {
  Calendar,
  Globe,
  Laptop,
  Monitor,
  Smartphone,
  TabletSmartphone,
  Tv,
  Watch,
} from "lucide-react";
import { useState } from "react";
import { Card } from "../../../Card";
import { LineChartCondensed, LineChartCondensedProps } from "../../stories/rechartsStoryAdapters";

// 🔥 COMPREHENSIVE DATA VARIATIONS - Designed to test various scenarios
const dataVariations = {
  default: [
    { month: "January", desktop: 150, mobile: 90, tablet: 120 },
    { month: "February", desktop: 280, mobile: 180, tablet: 140 },
    { month: "March", desktop: 220, mobile: 140, tablet: 160 },
    { month: "April", desktop: 180, mobile: 160, tablet: 180 },
    { month: "May", desktop: 250, mobile: 120, tablet: 140 },
    { month: "June", desktop: 300, mobile: 180, tablet: 160 },
    { month: "July", desktop: 350, mobile: 220, tablet: 180 },
    { month: "August", desktop: 400, mobile: 240, tablet: 200 },
    { month: "September", desktop: 450, mobile: 260, tablet: 220 },
    { month: "October", desktop: 500, mobile: 280, tablet: 240 },
    { month: "November", desktop: 550, mobile: 300, tablet: 260 },
    { month: "December", desktop: 600, mobile: 320, tablet: 280 },
  ],
  // 🏷️ BIG LABELS - Testing angled tick labels
  bigLabels: [
    {
      category: "Very Long Category Name That Should Be Truncated",
      sales: 150,
      revenue: 90,
      profit: 120,
    },
    {
      category: "Another Extremely Long Label That Causes Collisions",
      sales: 280,
      revenue: 180,
      profit: 140,
    },
    {
      category: "Super Duper Long Category Name That Tests Truncation",
      sales: 220,
      revenue: 140,
      profit: 160,
    },
    {
      category: "Incredibly Long Text That Should Trigger Collision Detection",
      sales: 180,
      revenue: 160,
      profit: 180,
    },
    {
      category: "Maximum Length Category Name That Tests All Edge Cases",
      sales: 250,
      revenue: 120,
      profit: 140,
    },
    {
      category: "Extra Long Business Category Name With Many Words",
      sales: 300,
      revenue: 180,
      profit: 160,
    },
    {
      category: "Comprehensive Long Label For Testing Horizontal Offset",
      sales: 350,
      revenue: 220,
      profit: 180,
    },
    {
      category: "Extended Category Name That Pushes Truncation Limits",
      sales: 400,
      revenue: 240,
      profit: 200,
    },
  ],
  // 📅 DENSE TIMELINE - Many items with medium-length labels
  denseTimeline: [
    { period: "Q1 2022 Jan-Mar", visitors: 120, conversions: 15, revenue: 1200 },
    { period: "Q1 2022 Apr-Jun", visitors: 150, conversions: 22, revenue: 1800 },
    { period: "Q2 2022 Jul-Sep", visitors: 180, conversions: 28, revenue: 2100 },
    { period: "Q2 2022 Oct-Dec", visitors: 200, conversions: 35, revenue: 2500 },
    { period: "Q3 2023 Jan-Mar", visitors: 160, conversions: 18, revenue: 1600 },
    { period: "Q3 2023 Apr-Jun", visitors: 190, conversions: 32, revenue: 2300 },
    { period: "Q4 2023 Jul-Sep", visitors: 220, conversions: 40, revenue: 2800 },
    { period: "Q4 2023 Oct-Dec", visitors: 240, conversions: 45, revenue: 3200 },
    { period: "Q1 2024 Jan-Mar", visitors: 210, conversions: 38, revenue: 2700 },
    { period: "Q1 2024 Apr-Jun", visitors: 230, conversions: 42, revenue: 3000 },
    { period: "Q2 2024 Jul-Sep", visitors: 250, conversions: 48, revenue: 3400 },
    { period: "Q2 2024 Oct-Dec", visitors: 270, conversions: 52, revenue: 3800 },
    { period: "Q3 2024 Jan-Mar", visitors: 260, conversions: 50, revenue: 3600 },
    { period: "Q3 2024 Apr-Jun", visitors: 280, conversions: 55, revenue: 4000 },
    { period: "Q4 2024 Jul-Sep", visitors: 300, conversions: 60, revenue: 4300 },
    { period: "Q4 2024 Oct-Dec", visitors: 290, conversions: 58, revenue: 4100 },
  ],
  // 🏢 COMPANY NAMES - Real-world long business names
  companyNames: [
    { company: "Apple Inc.", revenue: 394328000000, profit: 99803000000, marketCap: 3500000000000 },
    {
      company: "Microsoft Corporation",
      revenue: 211915000000,
      profit: 83383000000,
      marketCap: 2800000000000,
    },
    {
      company: "Alphabet Inc. (Google)",
      revenue: 307394000000,
      profit: 76033000000,
      marketCap: 2100000000000,
    },
    {
      company: "Amazon.com Inc.",
      revenue: 574785000000,
      profit: 33364000000,
      marketCap: 1600000000000,
    },
    {
      company: "Tesla Motors Inc.",
      revenue: 96773000000,
      profit: 15000000000,
      marketCap: 800000000000,
    },
    {
      company: "Meta Platforms Inc.",
      revenue: 134902000000,
      profit: 39370000000,
      marketCap: 900000000000,
    },
    {
      company: "NVIDIA Corporation",
      revenue: 60922000000,
      profit: 29760000000,
      marketCap: 1800000000000,
    },
    {
      company: "Berkshire Hathaway Inc.",
      revenue: 364482000000,
      profit: 96223000000,
      marketCap: 780000000000,
    },
  ],
  // 🌍 COUNTRY NAMES - Geographic labels with varying lengths
  countryData: [
    { country: "United States of America", population: 331900000, gdp: 26900000000000 },
    { country: "People's Republic of China", population: 1412000000, gdp: 17700000000000 },
    { country: "Federal Republic of Germany", population: 83200000, gdp: 4300000000000 },
    { country: "United Kingdom of Great Britain", population: 67500000, gdp: 3100000000000 },
    { country: "French Republic", population: 68000000, gdp: 2900000000000 },
    { country: "Republic of India", population: 1380000000, gdp: 3700000000000 },
    { country: "Federative Republic of Brazil", population: 215000000, gdp: 2100000000000 },
    { country: "Russian Federation", population: 146000000, gdp: 1800000000000 },
  ],
  // 📈 FINANCIAL QUARTERS - Testing medium-density scenarios
  financialQuarters: [
    { quarter: "Q1 FY2022", revenue: 1200000, expenses: 800000, profit: 400000 },
    { quarter: "Q2 FY2022", revenue: 1500000, expenses: 950000, profit: 550000 },
    { quarter: "Q3 FY2022", revenue: 1800000, expenses: 1100000, profit: 700000 },
    { quarter: "Q4 FY2022", revenue: 2000000, expenses: 1300000, profit: 700000 },
    { quarter: "Q1 FY2023", revenue: 2200000, expenses: 1400000, profit: 800000 },
    { quarter: "Q2 FY2023", revenue: 2500000, expenses: 1600000, profit: 900000 },
    { quarter: "Q3 FY2023", revenue: 2800000, expenses: 1800000, profit: 1000000 },
    { quarter: "Q4 FY2023", revenue: 3000000, expenses: 1900000, profit: 1100000 },
  ],
  // 🔤 MIXED LENGTHS - Testing various label length scenarios
  mixedLengths: [
    { item: "A", valueA: 100, valueB: 80 },
    { item: "Short", valueA: 150, valueB: 120 },
    { item: "Medium Length Item", valueA: 200, valueB: 160 },
    { item: "Very Long Item Name That Tests Truncation", valueA: 250, valueB: 200 },
    { item: "B", valueA: 180, valueB: 140 },
    { item: "Another Really Long Category Name", valueA: 220, valueB: 180 },
    { item: "XL", valueA: 190, valueB: 150 },
  ],
  // 🎯 EDGE CASES - Extreme scenarios
  edgeCases: [
    {
      name: "SinglePointDataSetForTestingEdgeCasesInCollisionDetectionAndLabelTruncationFunctionality",
      value: 500,
    },
    {
      name: "SecondExtremelyLongDataPointNameThatShouldDefinitelyTriggerTruncationMechanisms",
      value: 600,
    },
  ],
  // 📱 MINIMAL - Small dataset for baseline testing
  minimal: [
    { category: "Mobile Devices", users: 150, sessions: 90 },
    { category: "Desktop Computers", users: 280, sessions: 180 },
    { category: "Tablet Devices", users: 220, sessions: 140 },
  ],
};

// Category key mappings for different datasets
const categoryKeys = {
  default: "month",
  bigLabels: "category",
  denseTimeline: "period",
  companyNames: "company",
  countryData: "country",
  financialQuarters: "quarter",
  mixedLengths: "item",
  edgeCases: "name",
  minimal: "category",
};

// 🔥 ACTIVE DATA - For backward compatibility
const lineChartCondensedData = dataVariations.default;

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
  tablet: Calendar,
  sales: Globe,
  revenue: Smartphone,
  profit: Laptop,
  visitors: Tv,
  conversions: Watch,
  users: Monitor,
  sessions: TabletSmartphone,
  expenses: Calendar,
  marketCap: Globe,
  population: Monitor,
  gdp: Smartphone,
  valueA: Monitor,
  valueB: TabletSmartphone,
  value: Calendar,
} as const;

/**
 * # LineChart Component Documentation
 *
 * The LineChart is a compact chart designed for space-constrained layouts
 * like dashboards and sidebars. It's ideal for:
 *
 * - **Compact Dashboards**: Showing multiple trends in limited space
 * - **Sidebar Analytics**: Quick trend visualization without taking up too much room
 * - **Dense Data Display**: Efficiently showing many data points in a small area
 *
 * ## Key Features
 *
 * ### Space-Efficient Design
 * - **Compact Height**: Default 200px height for tight layouts
 * - **Minimal Legend**: Legend is compact and doesn't take up vertical space
 * - **Adjustable Tick Variants**: Choose between horizontal or angled labels for better space usage
 *
 * ### Flexible Label Handling
 * - **Single Line Ticks**: Horizontal labels with automatic collision detection
 * - **Angled Ticks**: Optimal rotation angle for longer labels that need more space
 * - **Smart Angle Calculation**: Automatically calculates optimal rotation based on label width
 *
 * ### Interactive & Responsive
 * - **Hover Tooltips**: Standard tooltip showing all data series
 * - **Responsive Design**: Adapts fluidly to its container's size
 * - **Line Customization**: Control line thickness with strokeWidth prop
 *
 * ### Customization
 * - **Theming**: Comes with six pre-built color palettes
 * - **Line Styles**: Supports `linear`, `natural` (smooth), and `step` interpolation
 * - **Styling Options**: Control grid visibility, axes, stroke width, and more
 */
const meta: Meta<LineChartCondensedProps<typeof lineChartCondensedData>> = {
  title: "Components/D3Charts/LineChart",
  component: LineChartCondensed,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { LineChart } from '@openuidev/react-ui';

const trafficData = [
  { date: "2023-01-01", visits: 2200 },
  { date: "2023-01-02", visits: 2500 },
  { date: "2023-01-03", visits: 2300 },
];

// Basic implementation
<LineChart
  data={trafficData}
  categoryKey="date"
  theme="ocean"
  height={200}
/>
\`\`\`

## Data Structure Requirements

Your data should be an array of objects. Each object must contain:
- A **category field** (string or number): This will be used for the X-axis labels (e.g., dates, names, etc.).
- One or more **data series fields** (number): These are the values that will be plotted on the Y-axis.

\`\`\`tsx
const salesData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
];
\`\`\`

## Key Differences from LineChart

- **Compact**: Designed for smaller spaces with a default height of 200px
- **No Interactive Legend**: Legend is simplified and non-interactive
- **Tick Variants**: Supports both horizontal (singleLine) and angled labels
- **Performance**: Optimized for quick rendering in dashboards
- **Stroke Width Control**: Customize line thickness with strokeWidth prop

## Performance Considerations
- **Data Density**: For very large datasets, consider disabling animations
- **Responsiveness**: The chart is fully responsive, but test label visibility on small screens
- **Animation**: Controlled via \`isAnimationActive={false}\`
`,
      },
    },
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    data: {
      description: `
**Required.** An array of data objects for the line chart. Each object should contain:
- A category identifier (string/number) for the X-axis.
- One or more numeric values for the Y-axis.
`,
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        category: "📊 Data Configuration",
      },
    },
    categoryKey: {
      description:
        "**Required.** The key in your data object that represents the category for the X-axis.",
      control: false,
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    theme: {
      description:
        "Specifies the color palette for the chart's lines and tooltips. Ignored when customPalette is provided.",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "🎨 Visual Styling",
      },
    },
    customPalette: {
      description:
        "Custom array of colors to use instead of the theme palette. Overrides the theme prop when provided.",
      control: "object",
      table: {
        type: { summary: "string[]" },
        category: "🎨 Visual Styling",
      },
    },
    variant: {
      description: "Determines the line interpolation method, affecting the shape of the curves.",
      control: "radio",
      options: ["linear", "natural", "step"],
      table: {
        defaultValue: { summary: "natural" },
        category: "🎨 Visual Styling",
      },
    },
    tickVariant: {
      description:
        "X-axis tick label style. Choose between 'singleLine' (horizontal) or 'angled' (rotated at optimal angle).",
      control: "radio",
      options: ["singleLine", "angled"],
      table: {
        defaultValue: { summary: "singleLine" },
        category: "🎨 Visual Styling",
      },
    },
    strokeWidth: {
      description: "Line thickness in pixels. Controls the width of the line strokes.",
      control: { type: "number", min: 1, max: 10, step: 0.5 },
      table: {
        defaultValue: { summary: "2" },
        category: "🎨 Visual Styling",
      },
    },
    icons: {
      description:
        "An object mapping data series keys to React components to be used as icons in the legend.",
      control: false,
      table: {
        type: { summary: "Record<string, React.ReactNode>" },
        category: "🎨 Visual Styling",
      },
    },
    grid: {
      description: "Toggles the visibility of the background grid lines.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    showYAxis: {
      description: "Toggles the visibility of the Y-axis line and labels.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    xAxisLabel: {
      description: "A label to display below the X-axis.",
      control: "text",
      table: {
        type: { summary: "React.ReactNode" },
        category: "📱 Display Options",
      },
    },
    yAxisLabel: {
      description: "A label to display beside the Y-axis.",
      control: "text",
      table: {
        type: { summary: "React.ReactNode" },
        category: "📱 Display Options",
      },
    },
    isAnimationActive: {
      description: "Enables or disables the initial loading animation for the lines.",
      control: "boolean",
      table: {
        defaultValue: { summary: "false" },
        category: "🎬 Animation & Interaction",
      },
    },
    height: {
      description: "Sets a fixed height for the chart container in pixels.",
      control: "number",
      table: {
        defaultValue: { summary: "200" },
        type: { summary: "number" },
        category: "Layout & Sizing",
      },
    },
    width: {
      description: "Sets a fixed width for the chart container in pixels.",
      control: "number",
      table: {
        type: { summary: "number" },
        category: "Layout & Sizing",
      },
    },
    className: {
      description: "Custom CSS class to apply to the chart's container.",
      control: "text",
      table: {
        type: { summary: "string" },
        category: "Layout & Sizing",
      },
    },
  },
} satisfies Meta<typeof LineChartCondensed>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Comprehensive Data Explorer
 *
 * This story serves as a comprehensive test suite for the LineChartCondensed component.
 * Use the buttons to switch between various datasets designed to test edge cases in:
 *
 * - **Label Handling**: Datasets with long, dense, or overlapping labels.
 * - **Data Density**: Scenarios with few or many data points.
 * - **Tick Variants**: Toggle between horizontal and angled label orientations.
 *
 * It's an excellent tool for developers to see how the chart behaves under different conditions.
 */
export const DataExplorer: Story = {
  name: "🎛️ Comprehensive Data Explorer",
  args: {
    data: lineChartCondensedData,
    categoryKey: "month",
    theme: "ocean",
    variant: "natural",
    tickVariant: "singleLine",
    strokeWidth: 2,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    xAxisLabel: "Time Period",
    yAxisLabel: "Values",
    height: 200,
  },
  render: (args: any) => {
    const [selectedDataType, setSelectedDataType] =
      useState<keyof typeof dataVariations>("default");
    const [tickVariant, setTickVariant] = useState<"singleLine" | "angled">("singleLine");

    const currentData = dataVariations[selectedDataType];
    const currentCategoryKey = categoryKeys[selectedDataType];

    const buttonStyle = {
      margin: "2px",
      padding: "6px 12px",
      fontSize: "12px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      cursor: "pointer",
      background: "#fff",
      fontFamily: "monospace",
    };

    const activeButtonStyle = {
      ...buttonStyle,
      background: "#007acc",
      color: "white",
      border: "1px solid #007acc",
    };

    return (
      <div>
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            width: "600px",
          }}
        >
          <strong>🏷️ Dataset Selection:</strong>
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            <button
              onClick={() => setSelectedDataType("default")}
              style={selectedDataType === "default" ? activeButtonStyle : buttonStyle}
            >
              📅 Default (12 months)
            </button>
            <button
              onClick={() => setSelectedDataType("bigLabels")}
              style={selectedDataType === "bigLabels" ? activeButtonStyle : buttonStyle}
            >
              🏷️ Big Labels
            </button>
            <button
              onClick={() => setSelectedDataType("denseTimeline")}
              style={selectedDataType === "denseTimeline" ? activeButtonStyle : buttonStyle}
            >
              📅 Dense Timeline (16)
            </button>
            <button
              onClick={() => setSelectedDataType("companyNames")}
              style={selectedDataType === "companyNames" ? activeButtonStyle : buttonStyle}
            >
              🏢 Company Names
            </button>
            <button
              onClick={() => setSelectedDataType("countryData")}
              style={selectedDataType === "countryData" ? activeButtonStyle : buttonStyle}
            >
              🌍 Country Names
            </button>
            <button
              onClick={() => setSelectedDataType("financialQuarters")}
              style={selectedDataType === "financialQuarters" ? activeButtonStyle : buttonStyle}
            >
              📈 Financial Quarters
            </button>
            <button
              onClick={() => setSelectedDataType("mixedLengths")}
              style={selectedDataType === "mixedLengths" ? activeButtonStyle : buttonStyle}
            >
              🔤 Mixed Lengths
            </button>
            <button
              onClick={() => setSelectedDataType("edgeCases")}
              style={selectedDataType === "edgeCases" ? activeButtonStyle : buttonStyle}
            >
              🎯 Edge Cases
            </button>
            <button
              onClick={() => setSelectedDataType("minimal")}
              style={selectedDataType === "minimal" ? activeButtonStyle : buttonStyle}
            >
              📱 Minimal (3 items)
            </button>
          </div>
          <div style={{ marginTop: "12px" }}>
            <strong>📐 Tick Variant:</strong>
            <div style={{ marginTop: "8px", display: "flex", gap: "4px" }}>
              <button
                onClick={() => setTickVariant("singleLine")}
                style={tickVariant === "singleLine" ? activeButtonStyle : buttonStyle}
              >
                Horizontal Labels
              </button>
              <button
                onClick={() => setTickVariant("angled")}
                style={tickVariant === "angled" ? activeButtonStyle : buttonStyle}
              >
                Angled Labels
              </button>
            </div>
          </div>
          <div
            style={{ marginTop: "12px", fontSize: "12px", color: "#666", fontFamily: "monospace" }}
          >
            <div>
              <strong>Current Dataset:</strong> {selectedDataType}
            </div>
            <div>
              <strong>Items:</strong> {currentData.length} | <strong>Category Key:</strong>{" "}
              {currentCategoryKey} | <strong>Tick:</strong> {tickVariant}
            </div>
          </div>
        </div>
        <Card style={{ width: "600px" }}>
          <LineChartCondensed
            {...args}
            data={currentData}
            categoryKey={currentCategoryKey}
            tickVariant={tickVariant}
          />
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "**🎛️ Interactive Explorer:** This story allows you to explore different datasets and tick variants interactively. Use the buttons to switch between:\n\n**Datasets:**\n- **Default**: Standard 12-month data\n- **Big Labels**: Extremely long category names\n- **Dense Timeline**: Many items with medium-length labels\n- **Company Names**: Real-world business names\n- **Country Names**: Geographic labels\n- **Financial Quarters**: Quarterly financial data\n- **Mixed Lengths**: Combination of short and long labels\n- **Edge Cases**: Extreme scenarios\n- **Minimal**: Baseline with 3 items\n\n**Tick Variants:**\n- **Horizontal Labels**: Standard single-line labels with collision detection\n- **Angled Labels**: Rotated labels for better space utilization",
      },
    },
  },
};

/**
 * ## Large Dataset with Sidebar Tooltip
 *
 * This story demonstrates the sidebar tooltip feature that appears when you have
 * more than 10 data series. Click on any point in the chart to see the sidebar
 * tooltip in action. This provides a better UX for viewing many data series at once.
 */
export const LargeDatasetWithSidebarTooltip: Story = {
  name: "🎯 Large Dataset (>10 Series) - Sidebar Tooltip",
  args: {
    data: [
      {
        month: "Jan",
        line1: 120,
        line2: 150,
        line3: 180,
        line4: 200,
        line5: 160,
        line6: 190,
        line7: 220,
        line8: 240,
        line9: 210,
        line10: 230,
        line11: 250,
        line12: 270,
        line13: 260,
        line14: 280,
        line15: 300,
      },
      {
        month: "Feb",
        line1: 140,
        line2: 170,
        line3: 200,
        line4: 220,
        line5: 180,
        line6: 210,
        line7: 240,
        line8: 260,
        line9: 230,
        line10: 250,
        line11: 270,
        line12: 290,
        line13: 280,
        line14: 300,
        line15: 320,
      },
      {
        month: "Mar",
        line1: 160,
        line2: 190,
        line3: 220,
        line4: 240,
        line5: 200,
        line6: 230,
        line7: 260,
        line8: 280,
        line9: 250,
        line10: 270,
        line11: 290,
        line12: 310,
        line13: 300,
        line14: 320,
        line15: 340,
      },
      {
        month: "Apr",
        line1: 180,
        line2: 210,
        line3: 240,
        line4: 260,
        line5: 220,
        line6: 250,
        line7: 280,
        line8: 300,
        line9: 270,
        line10: 290,
        line11: 310,
        line12: 330,
        line13: 320,
        line14: 340,
        line15: 360,
      },
      {
        month: "May",
        line1: 200,
        line2: 230,
        line3: 260,
        line4: 280,
        line5: 240,
        line6: 270,
        line7: 300,
        line8: 320,
        line9: 290,
        line10: 310,
        line11: 330,
        line12: 350,
        line13: 340,
        line14: 360,
        line15: 380,
      },
      {
        month: "Jun",
        line1: 220,
        line2: 250,
        line3: 280,
        line4: 300,
        line5: 260,
        line6: 290,
        line7: 320,
        line8: 340,
        line9: 310,
        line10: 330,
        line11: 350,
        line12: 370,
        line13: 360,
        line14: 380,
        line15: 400,
      },
      {
        month: "Jul",
        line1: 240,
        line2: 270,
        line3: 300,
        line4: 320,
        line5: 280,
        line6: 310,
        line7: 340,
        line8: 360,
        line9: 330,
        line10: 350,
        line11: 370,
        line12: 390,
        line13: 380,
        line14: 400,
        line15: 420,
      },
      {
        month: "Aug",
        line1: 260,
        line2: 290,
        line3: 320,
        line4: 340,
        line5: 300,
        line6: 330,
        line7: 360,
        line8: 380,
        line9: 350,
        line10: 370,
        line11: 390,
        line12: 410,
        line13: 400,
        line14: 420,
        line15: 440,
      },
      {
        month: "Sep",
        line1: 280,
        line2: 310,
        line3: 340,
        line4: 360,
        line5: 320,
        line6: 350,
        line7: 380,
        line8: 400,
        line9: 370,
        line10: 390,
        line11: 410,
        line12: 430,
        line13: 420,
        line14: 440,
        line15: 460,
      },
      {
        month: "Oct",
        line1: 300,
        line2: 330,
        line3: 360,
        line4: 380,
        line5: 340,
        line6: 370,
        line7: 400,
        line8: 420,
        line9: 390,
        line10: 410,
        line11: 430,
        line12: 450,
        line13: 440,
        line14: 460,
        line15: 480,
      },
      {
        month: "Nov",
        line1: 320,
        line2: 350,
        line3: 380,
        line4: 400,
        line5: 360,
        line6: 390,
        line7: 420,
        line8: 440,
        line9: 410,
        line10: 430,
        line11: 450,
        line12: 470,
        line13: 460,
        line14: 480,
        line15: 500,
      },
      {
        month: "Dec",
        line1: 340,
        line2: 370,
        line3: 400,
        line4: 420,
        line5: 380,
        line6: 410,
        line7: 440,
        line8: 460,
        line9: 430,
        line10: 450,
        line11: 470,
        line12: 490,
        line13: 480,
        line14: 500,
        line15: 520,
      },
    ] as any,
    categoryKey: "month" as any,
    theme: "ocean",
    variant: "natural",
    tickVariant: "singleLine",
    strokeWidth: 2,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    xAxisLabel: "Months",
    yAxisLabel: "Performance Metrics",
    height: 300,
  },
  render: (args: any) => (
    <div>
      <div
        style={{
          marginBottom: "16px",
          padding: "16px",
          background: "#e3f2fd",
          borderRadius: "8px",
          border: "2px solid #2196f3",
          maxWidth: "700px",
        }}
      >
        <div style={{ fontSize: "14px", marginBottom: "8px" }}>
          <strong>🎯 Sidebar Tooltip Demo</strong>
        </div>
        <div style={{ fontSize: "13px", color: "#1565c0", lineHeight: "1.6" }}>
          This chart has <strong>15 data series</strong> (more than 10). <br />
          <strong>✨ Click on any point</strong> in the chart to open the sidebar tooltip on the
          right side.
          <br />
          The sidebar provides a scrollable list of all series values at that point, making it easy
          to view large datasets.
          <br />
          <em>
            💡 Try hovering first (shows inline tooltip), then click to see the sidebar version!
          </em>
        </div>
      </div>
      <Card style={{ width: "700px" }}>
        <LineChartCondensed {...args} />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "**🎯 Large Dataset Handling:** When your chart has more than 10 data series, the inline tooltip becomes too crowded. This story demonstrates the sidebar tooltip feature:\n\n**Features:**\n- **15 data series** to showcase the sidebar tooltip\n- **Click interaction:** Click any point to open the sidebar\n- **Scrollable view:** All series values in an organized, scrollable list\n- **Better UX:** Cleaner way to view many data points simultaneously\n- **Color-coded:** Each series maintains its color for easy identification\n\n**Usage:**\n1. Hover over the chart to see the inline tooltip (works for smaller datasets)\n2. Click on any data point to open the sidebar tooltip\n3. Scroll through all 15 series values\n4. Click outside or on the X button to close the sidebar",
      },
    },
  },
};

/**
 * ## Big Labels
 *
 * This story demonstrates the chart's ability to handle very long category labels.
 * The angled tick variant is particularly useful here for preventing label overlap.
 */
export const BigLabelsStory: Story = {
  name: "🏷️ Big Labels (Angled Ticks)",
  args: {
    data: dataVariations.bigLabels as any,
    categoryKey: "category" as any,
    theme: "emerald",
    variant: "natural",
    tickVariant: "angled",
    strokeWidth: 2,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 250,
  },
  render: (args: any) => (
    <Card style={{ width: "700px" }}>
      <LineChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests the chart with extremely long category names. The angled tick variant automatically rotates labels at an optimal angle to prevent overlapping and maximize readability.",
      },
    },
  },
};

/**
 * ## Dense Timeline
 *
 * Tests how the chart handles many data points with medium-length period labels.
 * The angled tick variant helps display more labels without collision.
 */
export const DenseTimelineStory: Story = {
  name: "📅 Dense Timeline (Many Periods)",
  args: {
    data: dataVariations.denseTimeline as any,
    categoryKey: "period" as any,
    theme: "sunset",
    variant: "natural",
    tickVariant: "angled",
    strokeWidth: 2,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 250,
  },
  render: (args: any) => (
    <Card style={{ width: "700px" }}>
      <LineChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests how the chart handles many data points (16 periods) with medium-length labels. The angled tick variant provides better label visibility compared to horizontal labels.",
      },
    },
  },
};

/**
 * ## Company Names
 *
 * This story tests the chart with real-world company names that have varying lengths.
 * It demonstrates how the chart handles business data with naturally occurring long labels.
 */
export const CompanyNamesStory: Story = {
  name: "🏢 Company Names (Real-world Labels)",
  args: {
    data: dataVariations.companyNames as any,
    categoryKey: "company" as any,
    theme: "vivid",
    variant: "natural",
    tickVariant: "angled",
    strokeWidth: 2,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 250,
  },
  render: (args: any) => (
    <Card style={{ width: "700px" }}>
      <LineChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests with real-world company names that have varying lengths. Demonstrates how the chart handles business data with naturally occurring long labels.",
      },
    },
  },
};

/**
 * ## Country Names
 *
 * This story tests the chart with official country names, which are often long.
 * It shows how geographic data is handled by the angled tick system.
 */
export const CountryDataStory: Story = {
  name: "🌍 Country Names (Geographic Labels)",
  args: {
    data: dataVariations.countryData as any,
    categoryKey: "country" as any,
    theme: "orchid",
    variant: "natural",
    tickVariant: "angled",
    strokeWidth: 2,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 250,
  },
  render: (args: any) => (
    <Card style={{ width: "700px" }}>
      <LineChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests with official country names that include full formal names. Shows how geographic data with naturally long names is handled.",
      },
    },
  },
};

/**
 * ## Mixed Lengths
 *
 * This story tests the chart's ability to handle a mix of very short and very long labels
 * within the same dataset, demonstrating its adaptive behavior.
 */
export const MixedLengthsStory: Story = {
  name: "🔤 Mixed Lengths (Varied Label Sizes)",
  args: {
    data: dataVariations.mixedLengths as any,
    categoryKey: "item" as any,
    theme: "spectrum",
    variant: "linear",
    tickVariant: "singleLine",
    strokeWidth: 2,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "500px" }}>
      <LineChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests the chart's ability to handle a mix of very short and very long labels within the same dataset.",
      },
    },
  },
};

/**
 * ## Edge Cases
 *
 * This story tests extreme edge cases with exceptionally long labels and minimal data points.
 */
export const EdgeCasesStory: Story = {
  name: "🎯 Edge Cases (Extreme Scenarios)",
  args: {
    data: dataVariations.edgeCases as any,
    categoryKey: "name" as any,
    theme: "ocean",
    variant: "step",
    tickVariant: "angled",
    strokeWidth: 2,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 250,
  },
  render: (args: any) => (
    <Card style={{ width: "500px" }}>
      <LineChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests extreme edge cases with exceptionally long labels and minimal data points. Pushes the label handling system to its limits.",
      },
    },
  },
};

/**
 * ## Minimal Data
 *
 * A baseline test with a small dataset and standard-length labels. This serves as a control
 * case to compare against the more complex label scenarios.
 */
export const MinimalDataStory: Story = {
  name: "📱 Minimal Data (Baseline)",
  args: {
    data: dataVariations.minimal as any,
    categoryKey: "category" as any,
    theme: "emerald",
    variant: "natural",
    tickVariant: "singleLine",
    strokeWidth: 2,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "400px" }}>
      <LineChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Baseline test with minimal data and standard-length labels. Provides a control case to compare against complex scenarios.",
      },
    },
  },
};

/**
 * ## Custom Palette
 *
 * This story demonstrates how to use the customPalette prop to provide your own color scheme
 * for the chart. This is useful when you need to match your brand colors.
 */
export const CustomPaletteStory: Story = {
  name: "🎨 Custom Palette",
  args: {
    data: dataVariations.default as any,
    categoryKey: "month" as any,
    theme: "ocean", // This will be overridden by customPalette
    variant: "natural",
    tickVariant: "singleLine",
    strokeWidth: 2,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    xAxisLabel: "Month",
    yAxisLabel: "Traffic",
    customPalette: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
    height: 200,
  },
  render: (args: any) => (
    <div>
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          background: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e9ecef",
          width: "600px",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>🎨 Custom Color Palette</h4>
        <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#666" }}>
          This chart uses a custom color palette instead of the default theme colors.
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {args.customPalette?.map((color: string, index: number) => (
            <div
              key={index}
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
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "2px",
                  backgroundColor: color,
                  border: "1px solid #ccc",
                }}
              />
              <span style={{ fontFamily: "monospace" }}>{color}</span>
            </div>
          ))}
        </div>
      </div>
      <Card style={{ width: "600px" }}>
        <LineChartCondensed {...args} />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates how to use the `customPalette` prop to provide your own color scheme. When `customPalette` is provided, it overrides the `theme` prop.\n\n**Usage:**\n```tsx\n<LineChartCondensed\n  data={data}\n  categoryKey="month"\n  customPalette={["#FF6B6B", "#4ECDC4", "#45B7D1"]}\n/>\n```',
      },
    },
  },
};

/**
 * ## Stroke Width Comparison
 *
 * Compare different line thickness options to find the right visual weight for your data.
 */
export const StrokeWidthComparison: Story = {
  name: "📏 Stroke Width Comparison",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Card style={{ width: "700px", padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
            Thin Lines (1px)
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>Subtle, minimal visual weight</div>
        </div>
        <LineChartCondensed
          data={dataVariations.default as any}
          categoryKey="month"
          theme="ocean"
          strokeWidth={1}
          height={180}
        />
      </Card>
      <Card style={{ width: "700px", padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
            Default Lines (2px)
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>Balanced, standard weight</div>
        </div>
        <LineChartCondensed
          data={dataVariations.default as any}
          categoryKey="month"
          theme="emerald"
          strokeWidth={2}
          height={180}
        />
      </Card>
      <Card style={{ width: "700px", padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
            Thick Lines (4px)
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>Bold, high emphasis</div>
        </div>
        <LineChartCondensed
          data={dataVariations.default as any}
          categoryKey="month"
          theme="sunset"
          strokeWidth={4}
          height={180}
        />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "**Side-by-side comparison** of stroke widths:\n\n- **1px**: Thin, subtle lines perfect for dense data or multiple overlapping series\n- **2px**: Default weight, balanced for most use cases\n- **4px**: Thick, bold lines for high emphasis or presentations\n\n**When to use each:**\n- Use **1px** for many overlapping series or subtle trends\n- Use **2px** (default) for general purpose visualization\n- Use **4px** for presentations or when emphasizing specific trends",
      },
    },
  },
};

/**
 * ## Tick Variant Comparison
 *
 * Side-by-side comparison of single-line (horizontal) and angled tick variants.
 * This helps you choose the right variant for your data.
 */
export const TickVariantComparison: Story = {
  name: "📐 Tick Variant Comparison",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Card style={{ width: "700px", padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
            Single Line Variant (Horizontal)
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Standard horizontal labels. Recharts automatically hides overlapping labels.
          </div>
        </div>
        <LineChartCondensed
          data={dataVariations.bigLabels as any}
          categoryKey="category"
          tickVariant="singleLine"
          theme="ocean"
          strokeWidth={2}
          height={200}
        />
      </Card>
      <Card style={{ width: "700px", padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
            Angled Variant (Rotated)
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Automatically rotates labels at an optimal angle. Shows more labels without collision.
          </div>
        </div>
        <LineChartCondensed
          data={dataVariations.bigLabels as any}
          categoryKey="category"
          tickVariant="angled"
          theme="emerald"
          strokeWidth={2}
          height={260}
        />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "**Side-by-side comparison** of tick variants:\n\n- **Single Line**: Standard horizontal labels with automatic collision detection. Recharts hides overlapping labels.\n- **Angled**: Rotates labels at an optimal angle calculated based on label width and available space. Shows more labels without collision.\n\n**When to use each:**\n- Use **singleLine** for short labels or when you have few data points\n- Use **angled** for long labels or many data points where horizontal labels would overlap",
      },
    },
  },
};

/**
 * ## Responsive Behavior Demo
 *
 * This story demonstrates the responsive capabilities of the LineChartCondensed.
 * Drag the handles on the container to resize it and observe how the chart adapts.
 */
export const ResponsiveBehaviorDemo: Story = {
  name: "📱 Responsive Behavior Demo",
  args: {
    data: dataVariations.bigLabels as any,
    categoryKey: "category" as any,
    theme: "sunset",
    variant: "natural",
    tickVariant: "angled",
    strokeWidth: 2,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 250,
  },
  render: (args: any) => {
    const [dimensions, setDimensions] = useState<{ width: number }>({
      width: 700,
    });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: string) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startWidth = dimensions.width;

      const doDrag = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        let newWidth = startWidth;

        if (handle.includes("e")) newWidth = startWidth + dx;
        if (handle.includes("w")) newWidth = startWidth - dx;

        setDimensions({
          width: Math.max(300, newWidth),
        });
      };

      const stopDrag = () => {
        document.removeEventListener("mousemove", doDrag);
        document.removeEventListener("mouseup", stopDrag);
      };

      document.addEventListener("mousemove", doDrag);
      document.addEventListener("mouseup", stopDrag);
    };

    const handleStyle: React.CSSProperties = {
      position: "absolute",
      background: "#3b82f6",
      opacity: 0.6,
      zIndex: 10,
      transition: "opacity 0.2s ease",
    };

    return (
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
            Responsive Behavior Demonstration
          </h3>
          <p style={{ margin: "0 0 12px 0", color: "#666", fontSize: "14px" }}>
            Drag the left or right edges of the container to see how the chart adapts
          </p>
          <div
            style={{
              padding: "12px",
              backgroundColor: "#e3f2fd",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#1565c0",
            }}
          >
            <strong>🎯 Try This:</strong> Resize the container to see how angled labels adapt to
            available space.
          </div>
        </div>

        <Card
          style={{
            position: "relative",
            width: `${dimensions.width}px`,
            border: "2px dashed #9ca3af",
            padding: "20px",
            boxSizing: "border-box",
            overflow: "hidden",
            cursor: "default",
          }}
        >
          <LineChartCondensed {...args} />

          {/* Resize Handles */}
          <div
            style={{ ...handleStyle, top: 0, bottom: 0, left: -2, width: 12, cursor: "ew-resize" }}
            onMouseDown={(e) => handleMouseDown(e, "w")}
          />
          <div
            style={{ ...handleStyle, top: 0, bottom: 0, right: -2, width: 12, cursor: "ew-resize" }}
            onMouseDown={(e) => handleMouseDown(e, "e")}
          />

          {/* Dimension Display */}
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              background: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontFamily: "monospace",
              fontWeight: "500",
            }}
          >
            {dimensions.width}px
          </div>
        </Card>
      </div>
    );
  },
};
