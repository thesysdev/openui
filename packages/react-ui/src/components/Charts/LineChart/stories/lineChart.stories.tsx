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
import { LineChart, LineChartProps } from "../..";
import { Card } from "../../../Card";

const customColorPalette = [
  "#0A0E60",
  "#14197B",
  "#272DA6",
  "#383FC9",
  "#444CE7",
  "#5F67F4",
  "#7884FF",
  "#97A9FF",
  "#B4C6FF",
  "#CBD7FF",
];

// 🔥 COMPREHENSIVE DATA VARIATIONS - Designed to test label collision scenarios
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
  // 🏷️ BIG LABELS - Testing collision detection and truncation
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
    { country: "United States of America", population: 331900000, gdp: 17700000000000 },
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
  // 🔄 EXPAND/COLLAPSE - Marketing channels dataset for legend overflow testing
  expandCollapseMarketing: [
    {
      channel: "Website Traffic and Organic Search Results",
      impressions: 120000,
      clicks: 15000,
      conversions: 1200,
      cost: 8500,
      revenue: 24000,
      roi: 182,
      ctr: 12.5,
      cpc: 0.57,
      cpa: 7.08,
      reach: 95000,
      engagement: 8200,
      shares: 420,
      saves: 180,
      comments: 650,
      videoViews: 0,
    },
    {
      channel: "Social Media Engagement and Brand Awareness",
      impressions: 85000,
      clicks: 12000,
      conversions: 950,
      cost: 6200,
      revenue: 19000,
      roi: 206,
      ctr: 14.1,
      cpc: 0.52,
      cpa: 6.53,
      reach: 72000,
      engagement: 15400,
      shares: 890,
      saves: 340,
      comments: 1200,
      videoViews: 28000,
    },
    {
      channel: "Email Marketing Campaign Performance",
      impressions: 45000,
      clicks: 8500,
      conversions: 800,
      cost: 2100,
      revenue: 16000,
      roi: 562,
      ctr: 18.9,
      cpc: 0.25,
      cpa: 2.63,
      reach: 42000,
      engagement: 6800,
      shares: 120,
      saves: 85,
      comments: 240,
      videoViews: 0,
    },
    {
      channel: "Paid Advertising and PPC Campaign ROI",
      impressions: 95000,
      clicks: 18000,
      conversions: 1500,
      cost: 12500,
      revenue: 30000,
      roi: 140,
      ctr: 18.9,
      cpc: 0.69,
      cpa: 8.33,
      reach: 88000,
      engagement: 12600,
      shares: 320,
      saves: 150,
      comments: 480,
      videoViews: 5200,
    },
    {
      channel: "Content Marketing and Blog Performance",
      impressions: 60000,
      clicks: 9500,
      conversions: 750,
      cost: 4800,
      revenue: 15000,
      roi: 213,
      ctr: 15.8,
      cpc: 0.51,
      cpa: 6.4,
      reach: 55000,
      engagement: 7800,
      shares: 680,
      saves: 420,
      comments: 950,
      videoViews: 12000,
    },
    {
      channel: "Mobile Application Downloads and Usage",
      impressions: 70000,
      clicks: 11000,
      conversions: 1100,
      cost: 5500,
      revenue: 22000,
      roi: 300,
      ctr: 15.7,
      cpc: 0.5,
      cpa: 5.0,
      reach: 65000,
      engagement: 9200,
      shares: 180,
      saves: 95,
      comments: 320,
      videoViews: 8500,
    },
    {
      channel: "Customer Support Response Time and Quality",
      impressions: 35000,
      clicks: 5500,
      conversions: 450,
      cost: 2800,
      revenue: 9000,
      roi: 221,
      ctr: 15.7,
      cpc: 0.51,
      cpa: 6.22,
      reach: 32000,
      engagement: 4200,
      shares: 45,
      saves: 25,
      comments: 180,
      videoViews: 0,
    },
    {
      channel: "Sales Funnel Conversion and Lead Generation",
      impressions: 110000,
      clicks: 22000,
      conversions: 1800,
      cost: 15000,
      revenue: 36000,
      roi: 140,
      ctr: 20.0,
      cpc: 0.68,
      cpa: 8.33,
      reach: 98000,
      engagement: 18500,
      shares: 420,
      saves: 280,
      comments: 750,
      videoViews: 3200,
    },
    {
      channel: "User Retention and Churn Rate Analysis",
      impressions: 80000,
      clicks: 14000,
      conversions: 1200,
      cost: 7200,
      revenue: 24000,
      roi: 233,
      ctr: 17.5,
      cpc: 0.51,
      cpa: 6.0,
      reach: 75000,
      engagement: 11200,
      shares: 280,
      saves: 150,
      comments: 420,
      videoViews: 6800,
    },
    {
      channel: "Product Feature Usage and Performance Metrics",
      impressions: 65000,
      clicks: 10500,
      conversions: 900,
      cost: 5200,
      revenue: 18000,
      roi: 246,
      ctr: 16.2,
      cpc: 0.5,
      cpa: 5.78,
      reach: 58000,
      engagement: 8500,
      shares: 320,
      saves: 180,
      comments: 650,
      videoViews: 4200,
    },
    {
      channel: "Market Research and Competitive Analysis",
      impressions: 40000,
      clicks: 6500,
      conversions: 500,
      cost: 3200,
      revenue: 10000,
      roi: 213,
      ctr: 16.3,
      cpc: 0.49,
      cpa: 6.4,
      reach: 36000,
      engagement: 5200,
      shares: 95,
      saves: 65,
      comments: 220,
      videoViews: 1800,
    },
    {
      channel: "Brand Sentiment and Public Relations Impact",
      impressions: 55000,
      clicks: 8000,
      conversions: 650,
      cost: 4100,
      revenue: 13000,
      roi: 217,
      ctr: 14.5,
      cpc: 0.51,
      cpa: 6.31,
      reach: 48000,
      engagement: 6800,
      shares: 520,
      saves: 280,
      comments: 950,
      videoViews: 15000,
    },
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
  expandCollapseMarketing: "channel",
};

// 🔥 ACTIVE DATA - For backward compatibility
const lineChartV2Data = dataVariations.default;

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
} as const;

/**
 * # ScrollableLineChart Component Documentation
 *
 * The LineChart component is a powerful and flexible tool for visualizing trends over time or comparing continuous data.
 * It's ideal for:
 *
 * - **Time-Series Analysis**: Tracking metrics over days, months, or years.
 * - **Comparative Analysis**: Comparing the performance of multiple data series.
 * - **Trend Identification**: Spotting upward or downward trends, and patterns in datasets.
 *
 * ## Key Features
 *
 * ### Advanced Label Handling
 * - **Collision Detection**: Automatically detects and prevents overlapping X-axis labels.
 * - **Intelligent Truncation**: Truncates long labels with an ellipsis (...) to keep the chart clean.
 * - **Horizontal Offset**: Ensures truncated labels remain horizontally centered for readability.
 *
 * ### Interactive & Responsive
 * - **Interactive Legend**: Allows toggling data series visibility and adapts with a "Show More" feature for many items.
 * - **Hover Tooltips**: Provides detailed data points on hover for enhanced user interaction.
 * - **Responsive Design**: Fluidly adjusts to any container size, from small widgets to large dashboards.
 *
 * ### Customization
 * - **Colors**: Uses the ThemeProvider's chart palette, or custom colors with `customPalette`.
 * - **Line Styles**: Supports `linear`, `natural` (smooth), and `step` variants.
 * - **Styling Options**: Control grid visibility, axes, and more.
 */
const meta: Meta<LineChartProps<typeof lineChartV2Data>> = {
  title: "Components/Charts/ScrollableLineChart",
  component: LineChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { ScrollableLineChart } from '@openuidev/react-ui';

const timeSeriesData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
];

// Basic implementation
<ScrollableLineChart
  data={timeSeriesData}
  categoryKey="month"
/>

// With custom colors
<ScrollableLineChart
  data={timeSeriesData}
  categoryKey="month"
  customPalette={["#FF6B6B", "#4ECDC4", "#45B7D1"]}
/>
\`\`\`

## Data Structure Requirements

Your data should be an array of objects. Each object must contain:
- A **category field** (string or number): This will be used for the X-axis labels (e.g., dates, names, etc.).
- One or more **data series fields** (number): These are the values that will be plotted on the Y-axis. The key of the field will be used as the series name in the legend and tooltip.

\`\`\`tsx
const salesData = [
  { date: "2023-01-01", productA: 4000, productB: 2400 },
  { date: "2023-02-01", productA: 3000, productB: 1398 },
  { date: "2023-03-01", productA: 2000, productB: 9800 },
];
\`\`\`

## Performance Considerations
- **Data Density**: While the chart can handle many data points, performance may degrade with thousands of points, especially with animations enabled.
- **Responsiveness**: The chart is fully responsive, but consider the visual clarity of labels on very small screens.
- **Animation**: Can be disabled via \`isAnimationActive={false}\` for performance-critical applications.
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

**Best Practices:**
- Ensure consistent data structure across all objects.
- For time-series data, ensure items are sorted chronologically.
`,
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        category: "📊 Data Configuration",
      },
    },
    categoryKey: {
      description:
        "**Required.** The key in your data object that represents the category for the X-axis (e.g., 'date', 'month').",
      control: false,
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    customPalette: {
      description: "Custom array of colors to use instead of the ThemeProvider's chart palette.",
      control: "object",
      table: {
        type: { summary: "string[]" },
        category: "🎨 Visual Styling",
      },
    },
    variant: {
      description: "Determines the line interpolation method, affecting the shape of the lines.",
      control: "radio",
      options: ["linear", "natural", "step"],
      table: {
        defaultValue: { summary: "natural" },
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
    legend: {
      description: "Toggles the visibility of the chart legend.",
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
    isAnimationActive: {
      description: "Enables or disables the initial loading animation for the lines.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "🎬 Animation & Interaction",
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
    className: {
      description: "Custom CSS class to apply to the chart's container.",
      control: "text",
      table: {
        type: { summary: "string" },
        category: "Layout & Sizing",
      },
    },
    height: {
      description: "Sets the height of the chart container.",
      control: "number",
      table: {
        type: { summary: "number" },
        category: "Layout & Sizing",
      },
    },
    width: {
      description: "Sets the width of the chart container.",
      control: "number",
      table: {
        type: { summary: "number" },
        category: "Layout & Sizing",
      },
    },
  },
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Comprehensive Data Explorer
 *
 * This story serves as a comprehensive test suite for the LineChart component.
 * Use the buttons to switch between various datasets designed to test edge cases in:
 *
 * - **Label Collision**: Datasets with long, dense, or overlapping labels.
 * - **Data Density**: Scenarios with few or many data points.
 * - **Legend Overflow**: A dataset with many series to test legend expand/collapse functionality.
 *
 * It's an excellent tool for developers to see how the chart behaves under different conditions.
 */
export const DataExplorer: Story = {
  name: "🎛️ Comprehensive Data Explorer",
  args: {
    data: lineChartV2Data,
    categoryKey: "month",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => {
    const [selectedDataType, setSelectedDataType] =
      useState<keyof typeof dataVariations>("default");

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
          <strong>📈 Line Chart Test Suite:</strong>
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
              📅 Dense Timeline (16 periods)
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
              📱 Minimal
            </button>
            <button
              onClick={() => setSelectedDataType("expandCollapseMarketing")}
              style={
                selectedDataType === "expandCollapseMarketing" ? activeButtonStyle : buttonStyle
              }
            >
              🔄 Marketing Channels
            </button>
          </div>
        </div>
        <Card style={{ width: "600px" }}>
          <LineChart {...args} data={currentData} categoryKey={currentCategoryKey} />
        </Card>
      </div>
    );
  },
};

/**
 * ## Big Labels
 *
 * This story demonstrates the chart's ability to handle very long category labels.
 * The chart's intelligent truncation and collision detection should be visible here.
 * X-axis labels that are too long to fit will be gracefully truncated with an ellipsis.
 */
export const BigLabelsStory: Story = {
  name: "🏷️ Big Labels",
  args: {
    data: dataVariations.bigLabels as any,
    categoryKey: "category" as any,
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <LineChart {...args} />
    </Card>
  ),
};

/**
 * ## Dense Timeline
 *
 * Tests how the chart handles many data points with medium-length period labels.
 * The chart should enable horizontal scrolling and apply intelligent label truncation.
 * This scenario is common in financial or analytical dashboards where many time periods are displayed.
 */
export const DenseTimelineStory: Story = {
  name: "📅 Dense Timeline (Many Periods)",
  args: {
    data: dataVariations.denseTimeline as any,
    categoryKey: "period" as any,
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px" }}>
      <LineChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests how the chart handles many data points with medium-length period labels. The chart should enable horizontal scrolling and apply intelligent label truncation.",
      },
    },
  },
};

/**
 * ## Line Variants
 *
 * Compares the three available line variants:
 * - **Linear**: Straight lines connecting data points.
 * - **Natural**: Smooth curves for a softer, organic look.
 * - **Step**: Stepped lines, useful for showing discrete changes.
 */
export const VariantComparisonStory: Story = {
  name: "📐 Line Variants",
  args: {
    data: dataVariations.minimal as any,
    categoryKey: "category" as any,
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>Linear Variant</h4>
        <Card style={{ width: "500px" }}>
          <LineChart {...args} variant="linear" />
        </Card>
      </div>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
          Natural Variant (Smooth Curves)
        </h4>
        <Card style={{ width: "500px" }}>
          <LineChart {...args} variant="natural" />
        </Card>
      </div>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>Step Variant</h4>
        <Card style={{ width: "500px" }}>
          <LineChart {...args} variant="step" />
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Compares the three available line variants: linear (straight lines), natural (smooth curves), and step (stepped lines).",
      },
    },
  },
};

/**
 * ## Custom Palette
 *
 * This story demonstrates how to use the customPalette prop to provide your own color scheme
 * for the chart. This is useful when you need to match your brand colors or create
 * specific visual themes.
 */
export const CustomPaletteStory: Story = {
  name: "🎨 Custom Palette",
  args: {
    data: dataVariations.default as any,
    categoryKey: "month" as any,
    customPalette: customColorPalette,
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
    xAxisLabel: "Month",
    yAxisLabel: "Traffic",
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
        <LineChart {...args} />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates how to use the `customPalette` prop to provide your own color scheme for the chart. When `customPalette` is provided, it overrides the ThemeProvider\'s chart palette and uses your specified colors instead.\n\n**Key Features:**\n- 🎨 **Custom Colors**: Override the default chart colors with your own palette\n- 📊 **Consistent Distribution**: Colors are distributed evenly across data series\n- 🎯 **Brand Matching**: Perfect for matching your application\'s brand colors\n\n**Usage:**\n```tsx\n<LineChart\n  data={data}\n  categoryKey="month"\n  customPalette={["#FF6B6B", "#4ECDC4", "#45B7D1"]}\n/>\n```',
      },
    },
  },
};

/**
 * ## Legend Expand/Collapse
 *
 * Tests the legend's expand/collapse functionality with a large number of data series.
 * The legend should automatically show a "Show More" button when items overflow,
 * allowing users to toggle between a collapsed and expanded view.
 */
export const ExpandCollapseMarketingStory: Story = {
  name: "🔄 Legend Expand/Collapse",
  args: {
    data: dataVariations.expandCollapseMarketing as any,
    categoryKey: "channel" as any,
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <LineChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests the legend expand/collapse functionality with 12 marketing channels that have long descriptive names. The legend should automatically show a 'Show More' button when items overflow the container width, allowing users to toggle between collapsed and expanded states.",
      },
    },
  },
};

/**
 * ## Responsive Behavior Demo
 *
 * This story demonstrates the responsive capabilities of the LineChart. Drag the handles
 * on the container to resize it and observe how the chart adapts.
 *
 * **Responsive Features:**
 * - **Label Truncation**: More aggressive truncation on smaller container widths.
 * - **Layout Adaptation**: Chart elements adjust to fit the available space.
 * - **Legend Behavior**: The legend may wrap or show expand/collapse buttons as needed.
 */
export const ResponsiveBehaviorDemo: Story = {
  name: "📱 Responsive Behavior Demo",
  args: {
    data: dataVariations.bigLabels as any,
    categoryKey: "category" as any,
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: false,
    showYAxis: true,
  },
  render: (args: any) => {
    const [dimensions, setDimensions] = useState<{ width: number; height: number | string }>({
      width: 700,
      height: "auto",
    });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: string) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = dimensions.width;
      const startHeight = (e.currentTarget.parentElement as HTMLElement).offsetHeight;

      const doDrag = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newWidth = startWidth;
        let newHeight = startHeight;

        if (handle.includes("e")) newWidth = startWidth + dx;
        if (handle.includes("w")) newWidth = startWidth - dx;
        if (handle.includes("s")) newHeight = startHeight + dy;
        if (handle.includes("n")) newHeight = startHeight - dy;

        setDimensions({
          width: Math.max(300, newWidth),
          height: "auto",
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
            Drag the edges or corners of the container below to see how the chart adapts
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
            <strong>🎯 Try This:</strong> Resize the container to see automatic label truncation and
            layout adjustments.
          </div>
        </div>

        <Card
          style={{
            position: "relative",
            width: `${dimensions.width}px`,
            height:
              typeof dimensions.height === "number" ? `${dimensions.height}px` : dimensions.height,
            border: "2px dashed #9ca3af",
            padding: "20px",
            boxSizing: "border-box",
            overflow: "hidden",
            cursor: "default",
          }}
        >
          <LineChart {...args} />

          {/* Resize Handles */}
          <div
            style={{ ...handleStyle, top: -2, left: 0, right: 0, height: 12, cursor: "ns-resize" }}
            onMouseDown={(e) => handleMouseDown(e, "n")}
          />
          <div
            style={{
              ...handleStyle,
              bottom: -2,
              left: 0,
              right: 0,
              height: 12,
              cursor: "ns-resize",
            }}
            onMouseDown={(e) => handleMouseDown(e, "s")}
          />
          <div
            style={{ ...handleStyle, top: 0, bottom: 0, left: -2, width: 12, cursor: "ew-resize" }}
            onMouseDown={(e) => handleMouseDown(e, "w")}
          />
          <div
            style={{ ...handleStyle, top: 0, bottom: 0, right: -2, width: 12, cursor: "ew-resize" }}
            onMouseDown={(e) => handleMouseDown(e, "e")}
          />

          {/* Corner Handles */}
          <div
            style={{
              ...handleStyle,
              top: -2,
              left: -2,
              width: 20,
              height: 20,
              cursor: "nwse-resize",
              borderRadius: "2px",
            }}
            onMouseDown={(e) => handleMouseDown(e, "nw")}
          />
          <div
            style={{
              ...handleStyle,
              top: -2,
              right: -2,
              width: 20,
              height: 20,
              cursor: "nesw-resize",
              borderRadius: "2px",
            }}
            onMouseDown={(e) => handleMouseDown(e, "ne")}
          />
          <div
            style={{
              ...handleStyle,
              bottom: -2,
              right: -2,
              width: 20,
              height: 20,
              cursor: "nwse-resize",
              borderRadius: "2px",
            }}
            onMouseDown={(e) => handleMouseDown(e, "se")}
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
            {dimensions.width}px ×{" "}
            {typeof dimensions.height === "number" ? `${dimensions.height}px` : "auto"}
          </div>
        </Card>
      </div>
    );
  },
};
