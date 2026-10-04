import type { Meta, StoryObj } from "@storybook/react";
import { Monitor, TabletSmartphone } from "lucide-react";
import { useState } from "react";
import { BarChart, BarChartProps } from "../..";
import { Card } from "../../../Card";

// 📊 ALL DATA VARIATIONS - For easy switching in stories
const dataVariations = {
  default: [
    {
      month: "January 2024 - First Month of the Year",
      desktop: 150,
      mobile: 90,
      tablet: 120,
      laptop: 180,
    },
    {
      month: "February 2024 - Second Month of the Year",
      desktop: 280,
      mobile: 180,
      tablet: 140,
      laptop: 160,
    },
    {
      month: "March 2024 - Third Month of the Year",
      desktop: 220,
      mobile: 140,
      tablet: 160,
      laptop: 180,
    },
    {
      month: "April 2024 - Fourth Month of the Year",
      desktop: 180,
      mobile: 160,
      tablet: 180,
      laptop: 200,
    },
    {
      month: "May 2024 - Fifth Month of the Year",
      desktop: 250,
      mobile: 120,
      tablet: 140,
      laptop: 160,
    },
    {
      month: "June 2024 - Sixth Month of the Year",
      desktop: 300,
      mobile: 180,
      tablet: 160,
      laptop: 180,
    },
    {
      month: "July 2024 - Seventh Month of the Year",
      desktop: 350,
      mobile: 220,
      tablet: 180,
      laptop: 200,
    },
    {
      month: "August 2024 - Eighth Month of the Year",
      desktop: 400,
      mobile: 240,
      tablet: 200,
      laptop: 220,
    },
    {
      month: "September 2024 - Ninth Month of the Year",
      desktop: 450,
      mobile: 260,
      tablet: 220,
      laptop: 240,
    },
    {
      month: "October 2024 - Tenth Month of the Year",
      desktop: 500,
      mobile: 280,
      tablet: 240,
      laptop: 260,
    },
    {
      month: "November 2024 - Eleventh Month of the Year",
      desktop: 550,
      mobile: 300,
      tablet: 260,
      laptop: 280,
    },
    {
      month: "December 2024 - Twelfth Month of the Year",
      desktop: 600,
      mobile: 320,
      tablet: 280,
      laptop: 300,
    },
  ],
  small: [
    { month: "Jan", desktop: 150, mobile: 90 },
    { month: "Feb", desktop: 280, mobile: 180 },
    { month: "Mar", desktop: 220, mobile: 140 },
  ],
  large: [
    {
      month: "Jan 2022",
      desktop: 150,
      mobile: 90,
      tablet: 120,
      laptop: 180,
      tv: 50,
      watch: 30,
      smartwatch: 20,
    },
    {
      month: "Feb 2022",
      desktop: 280,
      mobile: 180,
      tablet: 140,
      laptop: 160,
      tv: 70,
      watch: 40,
      smartwatch: 30,
    },
    {
      month: "Mar 2022",
      desktop: 220,
      mobile: 140,
      tablet: 160,
      laptop: 180,
      tv: 60,
      watch: 35,
      smartwatch: 25,
    },
    {
      month: "Apr 2022",
      desktop: 180,
      mobile: 160,
      tablet: 180,
      laptop: 200,
      tv: 80,
      watch: 45,
      smartwatch: 35,
    },
    {
      month: "May 2022",
      desktop: 250,
      mobile: 120,
      tablet: 140,
      laptop: 160,
      tv: 55,
      watch: 25,
      smartwatch: 20,
    },
    {
      month: "Jun 2022",
      desktop: 300,
      mobile: 180,
      tablet: 160,
      laptop: 180,
      tv: 75,
      watch: 50,
      smartwatch: 30,
    },
    {
      month: "Jul 2022",
      desktop: 350,
      mobile: 220,
      tablet: 180,
      laptop: 200,
      tv: 85,
      watch: 55,
      smartwatch: 35,
    },
    {
      month: "Aug 2022",
      desktop: 400,
      mobile: 240,
      tablet: 200,
      laptop: 220,
      tv: 90,
      watch: 60,
      smartwatch: 40,
    },
    {
      month: "Sep 2022",
      desktop: 450,
      mobile: 260,
      tablet: 220,
      laptop: 240,
      tv: 95,
      watch: 65,
      smartwatch: 45,
    },
    {
      month: "Oct 2022",
      desktop: 500,
      mobile: 280,
      tablet: 240,
      laptop: 260,
      tv: 100,
      watch: 70,
      smartwatch: 50,
    },
    {
      month: "Nov 2022",
      desktop: 550,
      mobile: 300,
      tablet: 260,
      laptop: 280,
      tv: 105,
      watch: 75,
      smartwatch: 55,
    },
    {
      month: "Dec 2022",
      desktop: 600,
      mobile: 320,
      tablet: 280,
      laptop: 300,
      tv: 110,
      watch: 80,
      smartwatch: 60,
    },
    {
      month: "Jan 2023",
      desktop: 650,
      mobile: 340,
      tablet: 300,
      laptop: 320,
      tv: 115,
      watch: 85,
      smartwatch: 65,
    },
    {
      month: "Feb 2023",
      desktop: 700,
      mobile: 360,
      tablet: 320,
      laptop: 340,
      tv: 120,
      watch: 90,
      smartwatch: 70,
    },
    {
      month: "Mar 2023",
      desktop: 750,
      mobile: 380,
      tablet: 340,
      laptop: 360,
      tv: 125,
      watch: 95,
      smartwatch: 75,
    },
    {
      month: "Apr 2023",
      desktop: 800,
      mobile: 400,
      tablet: 360,
      laptop: 380,
      tv: 130,
      watch: 100,
      smartwatch: 80,
    },
    {
      month: "May 2023",
      desktop: 850,
      mobile: 420,
      tablet: 380,
      laptop: 400,
      tv: 135,
      watch: 105,
      smartwatch: 85,
    },
    {
      month: "Jun 2023",
      desktop: 900,
      mobile: 440,
      tablet: 400,
      laptop: 420,
      tv: 140,
      watch: 110,
      smartwatch: 90,
    },
  ],
  simple: [
    { quarter: "Q1", revenue: 1200, profit: 800 },
    { quarter: "Q2", revenue: 1500, profit: 950 },
    { quarter: "Q3", revenue: 1800, profit: 1100 },
    { quarter: "Q4", revenue: 2000, profit: 1300 },
  ],
  edge: [{ period: "Current", sales: 500, target: 600 }],
  numbers: [
    { category: "Small", valueA: 5, valueB: 12, valueC: 8 },
    { category: "Medium", valueA: 150, valueB: 180, valueC: 120 },
    { category: "Large", valueA: 2500, valueB: 3200, valueC: 2800 },
    { category: "XLarge", valueA: 45000, valueB: 52000, valueC: 48000 },
  ],
  weekly: [
    { week: "W1", visits: 120, conversions: 15, sales: 1200 },
    { week: "W2", visits: 150, conversions: 22, sales: 1800 },
    { week: "W3", visits: 180, conversions: 28, sales: 2100 },
    { week: "W4", visits: 200, conversions: 35, sales: 2500 },
    { week: "W5", visits: 160, conversions: 18, sales: 1600 },
    { week: "W6", visits: 190, conversions: 32, sales: 2300 },
    { week: "W7", visits: 220, conversions: 40, sales: 2800 },
    { week: "W8", visits: 240, conversions: 45, sales: 3200 },
    { week: "W9", visits: 210, conversions: 38, sales: 2700 },
    { week: "W10", visits: 230, conversions: 42, sales: 3000 },
    { week: "W11", visits: 250, conversions: 48, sales: 3400 },
    { week: "W12", visits: 270, conversions: 52, sales: 3800 },
    { week: "W13", visits: 260, conversions: 50, sales: 3600 },
    { week: "W14", visits: 280, conversions: 55, sales: 4000 },
    { week: "W15", visits: 300, conversions: 60, sales: 4300 },
    { week: "W16", visits: 290, conversions: 58, sales: 4100 },
  ],
  bigNumbers: [
    { company: "Apple", revenue: 394328000000, profit: 99803000000, marketCap: 3500000000000 }, // 394B, 99B, 3.5T
    { company: "Microsoft", revenue: 211915000000, profit: 83383000000, marketCap: 2800000000000 }, // 211B, 83B, 2.8T
    { company: "Alphabet", revenue: 307394000000, profit: 76033000000, marketCap: 2100000000000 }, // 307B, 76B, 2.1T
    { company: "Amazon", revenue: 574785000000, profit: 33364000000, marketCap: 1600000000000 }, // 574B, 33B, 1.6T
    { company: "Tesla", revenue: 96773000000, profit: 15000000000, marketCap: 800000000000 }, // 96B, 15B, 800B
    { company: "Meta", revenue: 134902000000, profit: 39370000000, marketCap: 900000000000 }, // 134B, 39B, 900B
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
  singleGroup: [
    { month: "January 1st - January 31st, 2024 (Winter Quarter)", sales: 150 },
    { month: "February 1st - February 28th, 2024 (Winter Quarter)", sales: 280 },
    { month: "March 1st - March 31st, 2024 (Spring Quarter)", sales: 220 },
    { month: "April 1st - April 30th, 2024 (Spring Quarter)", sales: 180 },
    { month: "May 1st - May 31st, 2024 (Spring Quarter)", sales: 250 },
    { month: "June 1st - June 30th, 2024 (Summer Quarter)", sales: 300 },
    { month: "July 1st - July 31st, 2024 (Summer Quarter)", sales: 350 },
    { month: "August 1st - August 31st, 2024 (Summer Quarter)", sales: 400 },
  ],
  positiveNegative: [
    { month: "January", profit: -4000000, loss: -2000000, netWorth: 2000000 },
    { month: "February", profit: 3000000, loss: -4000000, netWorth: -1000000 },
    { month: "March", profit: -1000000, loss: -1500000, netWorth: -2500000 },
    { month: "April", profit: 5000000, loss: -2500000, netWorth: 2500000 },
    { month: "May", profit: -2000000, loss: -3000000, netWorth: -5000000 },
    { month: "June", profit: 1000000, loss: -500000, netWorth: 500000 },
  ],
};

// Category key mappings for different datasets
const categoryKeys = {
  default: "month",
  small: "month",
  large: "month",
  simple: "quarter",
  edge: "period",
  numbers: "category",
  weekly: "week",
  bigNumbers: "company",
  expandCollapseMarketing: "channel",
  singleGroup: "month",
  positiveNegative: "month",
};

// 🔥 ACTIVE DATA - For backward compatibility
const barChartData = dataVariations.default;

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
} as const;

/**
 * # ScrollableBarChart Component Documentation
 *
 * The BarChart is a versatile component for comparing values across different categories.
 * It's highly effective for:
 *
 * - **Category Comparison**: Easily compare metrics like sales, users, or revenue across different groups.
 * - **Ranking**: Show the highest and lowest performing items in a dataset.
 * - **Data Over Time**: Visualize changes across discrete time intervals (e.g., monthly sales).
 *
 * ## Key Features
 *
 * ### Layout Variants
 * - **Grouped**: Compare sub-categories side-by-side within a primary category.
 * - **Stacked**: Show how sub-categories contribute to a total value for each primary category.
 *
 * ### Interactive & Responsive
 * - **Horizontal Scrolling**: Automatically enables scrolling when the number of bars exceeds the container width.
 * - **Interactive Legend**: Toggle data series on and off. Handles overflow with a "Show More" button.
 * - **Hover Tooltips**: Provides detailed data on hover for better user engagement.
 * - **Responsive Design**: Adjusts gracefully to the size of its container.
 *
 * ### Customization
 * - **Colors**: Uses the ThemeProvider's chart palette, or custom colors with `customPalette`.
 * - **Bar Styling**: Customize the corner radius of the bars.
 * - **Axis and Grid Control**: Toggle visibility of axes and grid lines.
 */
const meta: Meta<BarChartProps<typeof barChartData>> = {
  title: "Components/Charts/ScrollableBarChart",
  component: BarChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { ScrollableBarChart } from '@openuidev/react-ui';

const monthlyData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
];

// Basic implementation
<ScrollableBarChart
  data={monthlyData}
  categoryKey="month"
/>

// With custom colors
<ScrollableBarChart
  data={monthlyData}
  categoryKey="month"
  customPalette={["#FF6B6B", "#4ECDC4", "#45B7D1"]}
/>
\`\`\`

## Data Structure Requirements

Your data should be an array of objects. Each object must contain:
- A **category field** (string or number): Used for the X-axis labels (e.g., months, quarters).
- One or more **data series fields** (number): These are the values that will be plotted as bars. The key of the field is used as the series name in the legend and tooltip.

\`\`\`tsx
const salesData = [
  { region: "North", sales: 5400, marketing: 1200 },
  { region: "South", sales: 8200, marketing: 1500 },
  { region: "East", sales: 7100, marketing: 1300 },
];
\`\`\`

## Performance Considerations
- **Data Volume**: The chart uses virtualization for the X-axis, but performance can still be impacted by an extremely large number of data points (e.g., 1000+).
- **Responsiveness**: The chart adapts to its container, but ensure that bar widths and gaps are readable on very small screens.
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
- A category identifier (string/number) for the X-axis.
- One or more numeric values for the Y-axis bars.
`,
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        category: "📊 Data Configuration",
      },
    },
    categoryKey: {
      description:
        "**Required.** The key in your data object that represents the category for the X-axis (e.g., 'month', 'department').",
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
      description:
        "Defines how multiple data series are displayed: `grouped` (side-by-side) or `stacked` (on top of each other).",
      control: "radio",
      options: ["grouped", "stacked"],
      table: {
        defaultValue: { summary: "grouped" },
        category: "🎨 Visual Styling",
      },
    },
    barRadius: {
      description: "Sets the corner radius for the top of each bar, creating a rounded look.",
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
      description: "Enables or disables the initial loading animation for the bars.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
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
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Comprehensive Data Explorer
 *
 * This story serves as a comprehensive test suite for the BarChart component.
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
    data: barChartData,
    categoryKey: "month",
    variant: "grouped",
    barRadius: 4,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    // height: 500,
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
              📅 Default (12 months)
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
              🌐 Large (18 months)
            </button>
            <button
              onClick={() => setSelectedDataType("weekly")}
              style={selectedDataType === "weekly" ? activeButtonStyle : buttonStyle}
            >
              📈 Weekly (16 weeks)
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
              onClick={() => setSelectedDataType("numbers")}
              style={selectedDataType === "numbers" ? activeButtonStyle : buttonStyle}
            >
              🔢 Number Ranges
            </button>
            <button
              onClick={() => setSelectedDataType("singleGroup")}
              style={selectedDataType === "singleGroup" ? activeButtonStyle : buttonStyle}
            >
              🏢 Single Group
            </button>
            <button
              onClick={() => setSelectedDataType("expandCollapseMarketing")}
              style={
                selectedDataType === "expandCollapseMarketing" ? activeButtonStyle : buttonStyle
              }
            >
              🔄 Marketing Channels
            </button>
            <button
              onClick={() => setSelectedDataType("positiveNegative")}
              style={selectedDataType === "positiveNegative" ? activeButtonStyle : buttonStyle}
            >
              📈 Positive & Negative
            </button>
          </div>
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
            <strong>Current:</strong> {selectedDataType} | <strong>Items:</strong>{" "}
            {currentData.length} | <strong>Category:</strong> {currentCategoryKey}
          </div>
        </div>
        <Card style={{ width: "700px" }}>
          <BarChart {...args} data={currentData} categoryKey={currentCategoryKey} />
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use the buttons above the chart to quickly switch between different data variations and test the scrolling functionality. Active button is highlighted in blue.",
      },
    },
  },
};

/**
 * ## Small Dataset (No Scroll)
 *
 * This story demonstrates the BarChart's appearance with a small dataset.
 * When the number of bars fits within the container width, horizontal scrolling is disabled.
 */
export const SmallDataStory: Story = {
  name: "📱 Small Data (No Scroll)",
  args: {
    data: dataVariations.small as any,
    categoryKey: "month" as any,
    variant: "grouped",
    barRadius: 2,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px" }}>
      <BarChart {...args} />
    </Card>
  ),
};

/**
 * ## Large Dataset (With Scrolling)
 *
 * This story showcases the chart's horizontal scrolling capability.
 * When the total width of the bars exceeds the container's width, users can scroll to view all data points.
 */
export const LargeDataStory: Story = {
  name: "🌐 Large Data (Scrolling)",
  args: {
    data: dataVariations.large as any,
    categoryKey: "month" as any,
    variant: "grouped",
    barRadius: 2,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px" }}>
      <BarChart {...args} />
    </Card>
  ),
};

/**
 * ## Weekly Data (Many Categories)
 *
 * Similar to the large dataset, this story tests the chart with a high number of categories,
 * which should trigger horizontal scrolling.
 */
export const WeeklyDataStory: Story = {
  name: "📈 Weekly Data (Many Categories)",
  args: {
    data: dataVariations.weekly as any,
    categoryKey: "week" as any,
    variant: "grouped",
    barRadius: 2,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px" }}>
      <BarChart {...args} />
    </Card>
  ),
};

/**
 * ## Big Numbers
 *
 * This story tests the chart's ability to handle and format very large numbers,
 * such as billions and trillions, on the Y-axis. The axis labels should be formatted
 * with appropriate suffixes (e.g., "B" for billion, "T" for trillion).
 */
export const BigNumbersStory: Story = {
  name: "💰 Big Numbers (Billions/Trillions)",
  args: {
    data: dataVariations.bigNumbers as any,
    categoryKey: "company" as any,
    variant: "grouped",
    barRadius: 2,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px" }}>
      <BarChart {...args} />
    </Card>
  ),
};

/**
 * ## Edge Case (Single Data Point)
 *
 * This story demonstrates how the chart renders with only a single data point.
 * It's a useful test to ensure that the layout and axes behave correctly in minimal-data scenarios.
 */
export const EdgeCaseStory: Story = {
  name: "🎯 Edge Case (Single Data Point)",
  args: {
    data: dataVariations.edge as any,
    categoryKey: "period" as any,
    variant: "grouped",
    barRadius: 2,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px" }}>
      <BarChart {...args} />
    </Card>
  ),
};

/**
 * ## Number Ranges (Scale Testing)
 *
 * This story tests the Y-axis scaling with data points of vastly different magnitudes.
 * The chart should automatically adjust its scale to accommodate all values appropriately.
 */
export const NumberRangesStory: Story = {
  name: "🔢 Number Ranges (Scale Testing)",
  args: {
    data: dataVariations.numbers as any,
    categoryKey: "category" as any,
    variant: "grouped",
    barRadius: 2,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px" }}>
      <BarChart {...args} />
    </Card>
  ),
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
    variant: "grouped",
    barRadius: 4,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <BarChart {...args} />
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
    customPalette: [
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
    ],
    variant: "grouped",
    barRadius: 4,
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
        <BarChart {...args} />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates how to use the `customPalette` prop to provide your own color scheme for the chart. When `customPalette` is provided, it overrides the ThemeProvider\'s chart palette and uses your specified colors instead.\n\n**Key Features:**\n- 🎨 **Custom Colors**: Override the default chart colors with your own palette\n- 📊 **Consistent Distribution**: Colors are distributed evenly across data series\n- 🎯 **Brand Matching**: Perfect for matching your application\'s brand colors\n\n**Usage:**\n```tsx\n<BarChart\n  data={data}\n  categoryKey="month"\n  customPalette={["#FF6B6B", "#4ECDC4", "#45B7D1"]}\n/>\n```',
      },
    },
  },
};

/**
 * ## Responsive Behavior Demo
 *
 * This story demonstrates the responsive capabilities of the BarChart. Drag the handles
 * on the container to resize it and observe how the chart adapts.
 *
 * **Responsive Features:**
 * - **Bar Sizing**: Bar widths and gaps adjust to the container size.
 * - **Layout Adaptation**: Chart elements are repositioned to fit the available space.
 * - **Legend Behavior**: The legend may wrap or show expand/collapse buttons as needed.
 */
export const ResponsiveBehaviorDemo: Story = {
  name: "📱 Responsive Behavior Demo",
  args: {
    data: dataVariations.default as any,
    categoryKey: "month" as any,
    variant: "grouped",
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
            <strong>🎯 Try This:</strong> Resize the container to see how the bar widths and layout
            adjustments.
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
          <BarChart {...args} />

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
