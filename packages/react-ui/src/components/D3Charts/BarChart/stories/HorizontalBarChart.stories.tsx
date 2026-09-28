// Copy of Charts/HorizontalBarChart/stories/HorizontalBarChart.stories.tsx with only the chart import and the title changed:
// the same args and renders, rendering the D3Charts chart via
// ../../stories/rechartsStoryAdapters.
import type { Meta, StoryObj } from "@storybook/react";
import { Monitor, TabletSmartphone } from "lucide-react";
import { useState } from "react";
import { Card } from "../../../Card";
import { HorizontalBarChart, HorizontalBarChartProps } from "../../stories/rechartsStoryAdapters";

// 📊 ALL DATA VARIATIONS - For easy switching in stories
const dataVariations = {
  default: [
    {
      category: "A",
      desktop: 150,
      mobile: 90,
      tablet: 120,
      laptop: 180,
    },
    {
      category: "B",
      desktop: 280,
      mobile: 180,
      tablet: 140,
      laptop: 160,
    },
    {
      category: "C",
      desktop: 220,
      mobile: 140,
      tablet: 160,
      laptop: 180,
    },
    {
      category: "D",
      desktop: 180,
      mobile: 160,
      tablet: 180,
      laptop: 200,
    },
    {
      category: "E",
      desktop: 250,
      mobile: 120,
      tablet: 140,
      laptop: 160,
    },
  ],
  small: [
    { category: "Q1", desktop: 150, mobile: 90 },
    { category: "Q2", desktop: 280, mobile: 180 },
    { category: "Q3", desktop: 220, mobile: 140 },
  ],
  large: [
    {
      category: "North America",
      revenue: 150000,
      expenses: 90000,
      profit: 60000,
      marketing: 30000,
      operations: 40000,
    },
    {
      category: "Europe",
      revenue: 280000,
      expenses: 180000,
      profit: 100000,
      marketing: 50000,
      operations: 70000,
    },
    {
      category: "Asia Pacific",
      revenue: 220000,
      expenses: 140000,
      profit: 80000,
      marketing: 40000,
      operations: 60000,
    },
    {
      category: "Latin America",
      revenue: 180000,
      expenses: 160000,
      profit: 20000,
      marketing: 35000,
      operations: 55000,
    },
    {
      category: "Middle East",
      revenue: 250000,
      expenses: 120000,
      profit: 130000,
      marketing: 45000,
      operations: 65000,
    },
    {
      category: "Africa",
      revenue: 120000,
      expenses: 80000,
      profit: 40000,
      marketing: 25000,
      operations: 35000,
    },
    {
      category: "Oceania",
      revenue: 95000,
      expenses: 65000,
      profit: 30000,
      marketing: 20000,
      operations: 25000,
    },
    {
      category: "Southeast Asia",
      revenue: 180000,
      expenses: 110000,
      profit: 70000,
      marketing: 35000,
      operations: 50000,
    },
    {
      category: "Eastern Europe",
      revenue: 140000,
      expenses: 95000,
      profit: 45000,
      marketing: 28000,
      operations: 42000,
    },
    {
      category: "Scandinavia",
      revenue: 160000,
      expenses: 100000,
      profit: 60000,
      marketing: 32000,
      operations: 48000,
    },
  ],
  simple: [
    { department: "Sales", performance: 1200 },
    { department: "Marketing", performance: 950 },
    { department: "Engineering", performance: 1100 },
    { department: "Support", performance: 800 },
  ],
  edge: [{ period: "Current Quarter", sales: 500, target: 600 }],
  bigNumbers: [
    { company: "Apple Inc.", revenue: 394328000000, profit: 99803000000 },
    { company: "Microsoft Corp.", revenue: 211915000000, profit: 83383000000 },
    { company: "Alphabet Inc.", revenue: 307394000000, profit: 76033000000 },
    { company: "Amazon.com Inc.", revenue: 574785000000, profit: 33364000000 },
  ],
  expandCollapseChannels: [
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
  mixedPositiveNegative: [
    { category: "Product A", profit: 100, loss: -50, net: 50 },
    { category: "Product B", profit: 150, loss: -200, net: -50 },
    { category: "Product C", profit: 200, loss: -100, net: 100 },
    { category: "Product D", profit: -80, loss: -120, net: -200 },
    { category: "Product E", profit: 300, loss: -150, net: 150 },
  ],
  singleGroup: [
    { region: "North America (USA, Canada, Mexico)", sales: 150000 },
    { region: "Europe (UK, Germany, France, Italy)", sales: 280000 },
    { region: "Asia Pacific (Japan, Australia, South Korea)", sales: 220000 },
    { region: "Latin America (Brazil, Argentina, Chile)", sales: 180000 },
    { region: "Middle East (UAE, Saudi Arabia, Israel)", sales: 250000 },
  ],
};

// Category key mappings for different datasets
const categoryKeys = {
  default: "category",
  small: "category",
  large: "category",
  simple: "department",
  edge: "period",
  bigNumbers: "company",
  expandCollapseChannels: "channel",
  mixedPositiveNegative: "category",
  singleGroup: "region",
};

// 🔥 ACTIVE DATA - For backward compatibility
const horizontalBarChartData = dataVariations.default;

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
} as const;

/**
 * # HorizontalBarChart Component Documentation
 *
 * The HorizontalBarChart is a versatile component for comparing values across different categories in a horizontal layout.
 * It's highly effective for:
 *
 * - **Category Comparison**: Easily compare metrics like sales, performance, or revenue across different groups.
 * - **Ranking**: Show the highest and lowest performing items with a clear visual hierarchy.
 * - **Data with Long Labels**: Perfect for datasets with lengthy category names that don't fit well in vertical layouts.
 *
 * ## Key Features
 *
 * ### Layout Variants
 * - **Grouped**: Compare sub-categories side-by-side within a primary category.
 * - **Stacked**: Show how sub-categories contribute to a total value for each primary category.
 *
 * ### Interactive & Responsive
 * - **Vertical Scrolling**: Automatically enables scrolling when the number of bars exceeds the container height.
 * - **Interactive Legend**: Toggle data series on and off. Handles overflow with a "Show More" button.
 * - **Hover Tooltips**: Provides detailed data on hover for better user engagement.
 * - **Responsive Design**: Adjusts gracefully to the size of its container.
 *
 * ### Customization
 * - **Theming**: Six built-in color palettes, or use custom colors with `customPalette`.
 * - **Bar Styling**: Customize the corner radius of the bars.
 * - **Axis and Grid Control**: Toggle visibility of axes and grid lines.
 */
const meta: Meta<HorizontalBarChartProps<typeof horizontalBarChartData>> = {
  title: "Components/D3Charts/HorizontalBarChart",
  component: HorizontalBarChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { HorizontalBarChart } from '@openuidev/react-ui/Charts/HorizontalBarChart';

const salesData = [
  { region: "North America", sales: 150000, profit: 45000 },
  { region: "Europe", sales: 280000, profit: 68000 },
  { region: "Asia Pacific", sales: 220000, profit: 52000 },
];

// Basic implementation
<HorizontalBarChart
  data={salesData}
  categoryKey="region"
  theme="ocean"
/>

// With custom colors
<HorizontalBarChart
  data={salesData}
  categoryKey="region"
  customPalette={["#FF6B6B", "#4ECDC4", "#45B7D1"]}
/>
\`\`\`

## Data Structure Requirements

Your data should be an array of objects. Each object must contain:
- A **category field** (string or number): Used for the Y-axis labels (e.g., regions, departments).
- One or more **data series fields** (number): These are the values that will be plotted as bars. The key of the field is used as the series name in the legend and tooltip.

\`\`\`tsx
const performanceData = [
  { department: "Sales", performance: 5400, target: 6000 },
  { department: "Marketing", performance: 8200, target: 7500 },
  { department: "Engineering", performance: 7100, target: 7000 },
];
\`\`\`

## Performance Considerations
- **Data Volume**: The chart uses virtualization for vertical scrolling, but performance can still be impacted by an extremely large number of data points (e.g., 1000+).
- **Responsiveness**: The chart adapts to its container, but ensure that bar heights and gaps are readable on very small screens.
- **Animation**: Can be disabled via \`isAnimationActive={false}\` for better performance with large datasets.
`,
      },
    },
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    data: {
      description: `
**Required.** An array of data objects representing your dataset. Each object should contain:
- A category identifier (string/number) for the Y-axis.
- One or more numeric values for the X-axis bars.
`,
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        category: "📊 Data Configuration",
      },
    },
    categoryKey: {
      description:
        "**Required.** The key in your data object that represents the category for the Y-axis (e.g., 'region', 'department').",
      control: false,
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    theme: {
      description:
        "Specifies the color palette for the chart's bars, tooltips, and legend. Ignored when customPalette is provided.",
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
      description:
        "Defines how multiple data series are displayed: `grouped` (side-by-side) or `stacked` (on top of each other).",
      control: "radio",
      options: ["grouped", "stacked"],
      table: {
        defaultValue: { summary: "grouped" },
        category: "🎨 Visual Styling",
      },
    },
    radius: {
      description: "Sets the corner radius for the bars, creating a rounded look.",
      control: { type: "number", min: 0, max: 20 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "4" },
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
    legend: {
      description: "Toggles the visibility of the chart legend.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    showXAxis: {
      description: "Toggles the visibility of the X-axis line and labels.",
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
      description: "Enables or disables the initial loading animation for the bars.",
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
  },
} satisfies Meta<typeof HorizontalBarChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * ## Comprehensive Data Explorer
 *
 * This story serves as a comprehensive test suite for the HorizontalBarChart component.
 * Use the buttons to switch between various datasets designed to test edge cases in:
 *
 * - **Data Volume**: Scenarios with few, many, or a single data point.
 * - **Data Formatting**: Handling of large numbers and different value ranges.
 * - **Legend Overflow**: A dataset with many series to test legend expand/collapse functionality.
 *
 * It's an excellent tool for developers to see how the chart behaves under different conditions.
 */
export const DataExplorer: Story = {
  name: "🎛️ Comprehensive Data Explorer",
  args: {
    data: horizontalBarChartData,
    categoryKey: "category",
    theme: "ocean",
    variant: "grouped",
    radius: 4,
    grid: true,
    isAnimationActive: false,
    showXAxis: true,
    legend: true,
    height: 400,
    width: 600,
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
            width: "700px",
          }}
        >
          <strong>💡 Quick Data Switch:</strong>
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            <button
              onClick={() => setSelectedDataType("default")}
              style={selectedDataType === "default" ? activeButtonStyle : buttonStyle}
            >
              📊 Default (5 categories)
            </button>
            <button
              onClick={() => setSelectedDataType("small")}
              style={selectedDataType === "small" ? activeButtonStyle : buttonStyle}
            >
              📱 Small (3 items)
            </button>
            <button
              onClick={() => setSelectedDataType("large")}
              style={selectedDataType === "large" ? activeButtonStyle : buttonStyle}
            >
              🌐 Large (10 regions)
            </button>
            <button
              onClick={() => setSelectedDataType("simple")}
              style={selectedDataType === "simple" ? activeButtonStyle : buttonStyle}
            >
              🏢 Simple (4 departments)
            </button>
            <button
              onClick={() => setSelectedDataType("bigNumbers")}
              style={selectedDataType === "bigNumbers" ? activeButtonStyle : buttonStyle}
            >
              💰 Big Numbers
            </button>
            <button
              onClick={() => setSelectedDataType("edge")}
              style={selectedDataType === "edge" ? activeButtonStyle : buttonStyle}
            >
              🎯 Single Item
            </button>
            <button
              onClick={() => setSelectedDataType("singleGroup")}
              style={selectedDataType === "singleGroup" ? activeButtonStyle : buttonStyle}
            >
              🌍 Single Group
            </button>
            <button
              onClick={() => setSelectedDataType("mixedPositiveNegative")}
              style={selectedDataType === "mixedPositiveNegative" ? activeButtonStyle : buttonStyle}
            >
              📈 Mixed +/-
            </button>
            <button
              onClick={() => setSelectedDataType("expandCollapseChannels")}
              style={
                selectedDataType === "expandCollapseChannels" ? activeButtonStyle : buttonStyle
              }
            >
              🔄 Marketing Channels
            </button>
          </div>
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
            <strong>Current:</strong> {selectedDataType} | <strong>Items:</strong>{" "}
            {currentData.length} | <strong>Category:</strong> {currentCategoryKey}
          </div>
        </div>
        <Card style={{ width: "700px" }}>
          <HorizontalBarChart {...args} data={currentData} categoryKey={currentCategoryKey} />
        </Card>
      </div>
    );
  },
};

// Basic stories using the new data structure
export const Default: Story = {
  args: {
    data: dataVariations.default,
    categoryKey: "category",
    theme: "ocean",
    variant: "grouped",
    height: 400,
    width: 600,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <HorizontalBarChart {...args} />
    </Card>
  ),
};

export const Stacked: Story = {
  args: {
    data: dataVariations.default,
    categoryKey: "category",
    theme: "ocean",
    variant: "stacked",
    height: 400,
    width: 600,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <HorizontalBarChart {...args} />
    </Card>
  ),
};

export const WithAnimations: Story = {
  args: {
    data: dataVariations.default,
    categoryKey: "category",
    theme: "ocean",
    variant: "grouped",
    isAnimationActive: true,
    height: 400,
    width: 600,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <HorizontalBarChart {...args} />
    </Card>
  ),
};

export const CustomPalette: Story = {
  args: {
    data: dataVariations.default,
    categoryKey: "category",
    customPalette: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57"],
    variant: "grouped",
    height: 400,
    width: 600,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <HorizontalBarChart {...args} />
    </Card>
  ),
};

export const CustomPaletteVibrant: Story = {
  name: "🎨 Custom Palette - Vibrant",
  args: {
    data: dataVariations.default,
    categoryKey: "category",
    customPalette: ["#FF1744", "#00E676", "#2979FF", "#FF9100", "#9C27B0"],
    variant: "grouped",
    height: 400,
    width: 600,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <HorizontalBarChart {...args} />
    </Card>
  ),
};

export const BigNumbers: Story = {
  args: {
    data: dataVariations.bigNumbers,
    categoryKey: "company",
    theme: "vivid",
    variant: "grouped",
    height: 400,
    width: 600,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <HorizontalBarChart {...args} />
    </Card>
  ),
};

export const LargeDataset: Story = {
  args: {
    data: dataVariations.large,
    categoryKey: "category",
    theme: "emerald",
    variant: "grouped",
    height: 400,
    width: 600,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <HorizontalBarChart {...args} />
    </Card>
  ),
};

export const MixedPositiveNegative: Story = {
  name: "📈 Mixed Positive and Negative",
  args: {
    data: dataVariations.mixedPositiveNegative,
    categoryKey: "category",
    theme: "spectrum",
    variant: "grouped",
    height: 400,
    width: 600,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <HorizontalBarChart {...args} />
    </Card>
  ),
};

export const WithIcons: Story = {
  args: {
    data: dataVariations.default,
    categoryKey: "category",
    theme: "ocean",
    variant: "grouped",
    height: 400,
    width: 600,
    icons: {
      desktop: Monitor,
      mobile: TabletSmartphone,
    },
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <HorizontalBarChart {...args} />
    </Card>
  ),
};
