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
import { ScatterChart, ScatterChartProps } from "../..";
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

// Sample scatter chart datasets
const dataVariations = {
  default: [
    {
      name: "A school",
      data: [
        { x: 100, y: 200, z: 200 },
        { x: 120, y: 100, z: 260 },
        { x: 170, y: 300, z: 400 },
        { x: 140, y: 250, z: 280 },
        { x: 150, y: 400, z: 500 },
        { x: 110, y: 280, z: 200 },
      ],
    },
    {
      name: "B school",
      data: [
        { x: 200, y: 180, z: 240 },
        { x: 180, y: 350, z: 220 },
        { x: 160, y: 320, z: 250 },
        { x: 190, y: 150, z: 210 },
      ],
    },
  ],
  correlation: [
    {
      name: "Revenue",
      data: [
        { x: 1000, y: 1200 },
        { x: 1200, y: 1400 },
        { x: 1700, y: 2100 },
        { x: 1400, y: 1800 },
        { x: 1500, y: 1950 },
        { x: 1100, y: 1300 },
        { x: 2000, y: 2500 },
        { x: 1800, y: 2200 },
        { x: 1600, y: 1850 },
        { x: 1900, y: 2350 },
        { x: 1300, y: 1600 },
        { x: 2200, y: 2800 },
      ],
    },
    {
      name: "Profit",
      data: [
        { x: 1000, y: 200 },
        { x: 1200, y: 280 },
        { x: 1700, y: 420 },
        { x: 1400, y: 350 },
        { x: 1500, y: 380 },
        { x: 1100, y: 240 },
        { x: 2000, y: 500 },
        { x: 1800, y: 450 },
        { x: 1600, y: 390 },
        { x: 1900, y: 470 },
        { x: 1300, y: 320 },
        { x: 2200, y: 580 },
      ],
    },
  ],
  multipleDatasets: [
    {
      name: "Desktop",
      data: [
        { x: 1, y: 4 },
        { x: 2, y: 2 },
        { x: 3, y: 7 },
        { x: 4, y: 5 },
        { x: 5, y: 8 },
        { x: 6, y: 3 },
        { x: 7, y: 9 },
        { x: 8, y: 6 },
        { x: 9, y: 10 },
        { x: 10, y: 1 },
      ],
    },
    {
      name: "Mobile",
      data: [
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 4 },
        { x: 4, y: 7 },
        { x: 5, y: 6 },
        { x: 6, y: 8 },
        { x: 7, y: 5 },
        { x: 8, y: 9 },
        { x: 9, y: 7 },
        { x: 10, y: 8 },
      ],
    },
    {
      name: "Tablet",
      data: [
        { x: 1, y: 2 },
        { x: 2, y: 6 },
        { x: 3, y: 3 },
        { x: 4, y: 4 },
        { x: 5, y: 7 },
        { x: 6, y: 5 },
        { x: 7, y: 6 },
        { x: 8, y: 8 },
        { x: 9, y: 4 },
        { x: 10, y: 9 },
      ],
    },
  ],
  performance: [
    {
      name: "Performance",
      data: [
        { x: 30, y: 1200 },
        { x: 35, y: 1500 },
        { x: 40, y: 1800 },
        { x: 45, y: 2100 },
        { x: 50, y: 2400 },
        { x: 55, y: 2700 },
        { x: 60, y: 3000 },
        { x: 25, y: 900 },
        { x: 65, y: 3300 },
        { x: 70, y: 3600 },
      ],
    },
    {
      name: "Efficiency",
      data: [
        { x: 30, y: 1100 },
        { x: 35, y: 1350 },
        { x: 40, y: 1650 },
        { x: 45, y: 1950 },
        { x: 50, y: 2200 },
        { x: 55, y: 2500 },
        { x: 60, y: 2850 },
        { x: 25, y: 800 },
        { x: 65, y: 3150 },
        { x: 70, y: 3450 },
      ],
    },
  ],
  comprehensive: [
    {
      name: "North America Sales",
      data: [
        { x: 1200, y: 8500, z: 120 },
        { x: 1350, y: 9200, z: 140 },
        { x: 1100, y: 7800, z: 95 },
        { x: 1450, y: 10200, z: 160 },
        { x: 1250, y: 8900, z: 130 },
        { x: 1600, y: 11500, z: 180 },
        { x: 1050, y: 7600, z: 85 },
        { x: 1700, y: 12800, z: 200 },
        { x: 1300, y: 9100, z: 135 },
        { x: 1500, y: 10800, z: 170 },
        { x: 1150, y: 8200, z: 110 },
        { x: 1750, y: 13200, z: 210 },
        { x: 1400, y: 9800, z: 150 },
        { x: 1650, y: 12100, z: 190 },
        { x: 1220, y: 8700, z: 125 },
        { x: 1800, y: 13800, z: 220 },
        { x: 1180, y: 8100, z: 105 },
        { x: 1550, y: 11100, z: 175 },
        { x: 1280, y: 9000, z: 128 },
        { x: 1620, y: 11800, z: 185 },
        { x: 1120, y: 7900, z: 100 },
        { x: 1720, y: 13000, z: 205 },
        { x: 1380, y: 9500, z: 145 },
        { x: 1680, y: 12500, z: 195 },
        { x: 1240, y: 8800, z: 120 },
      ],
    },
    {
      name: "Europe Sales",
      data: [
        { x: 980, y: 7200, z: 88 },
        { x: 1150, y: 8400, z: 115 },
        { x: 1020, y: 7500, z: 95 },
        { x: 1280, y: 9200, z: 140 },
        { x: 1080, y: 7800, z: 105 },
        { x: 1420, y: 10100, z: 165 },
        { x: 950, y: 6900, z: 80 },
        { x: 1520, y: 11200, z: 185 },
        { x: 1120, y: 8200, z: 120 },
        { x: 1380, y: 9800, z: 155 },
        { x: 1050, y: 7600, z: 100 },
        { x: 1580, y: 11800, z: 195 },
        { x: 1180, y: 8600, z: 130 },
        { x: 1480, y: 10700, z: 175 },
        { x: 1000, y: 7300, z: 90 },
        { x: 1620, y: 12200, z: 205 },
        { x: 1060, y: 7700, z: 102 },
        { x: 1320, y: 9400, z: 145 },
        { x: 1100, y: 8000, z: 115 },
        { x: 1450, y: 10400, z: 170 },
        { x: 970, y: 7100, z: 85 },
        { x: 1550, y: 11500, z: 190 },
        { x: 1140, y: 8300, z: 125 },
        { x: 1680, y: 12600, z: 200 },
        { x: 1040, y: 7500, z: 98 },
      ],
    },
    {
      name: "Asia Pacific Sales",
      data: [
        { x: 1800, y: 15200, z: 280 },
        { x: 1950, y: 16800, z: 320 },
        { x: 1650, y: 13800, z: 240 },
        { x: 2100, y: 18200, z: 360 },
        { x: 1750, y: 14800, z: 260 },
        { x: 2250, y: 19500, z: 400 },
        { x: 1600, y: 13200, z: 220 },
        { x: 2350, y: 20200, z: 420 },
        { x: 1900, y: 16200, z: 300 },
        { x: 2150, y: 18500, z: 380 },
        { x: 1700, y: 14200, z: 250 },
        { x: 2400, y: 20800, z: 440 },
        { x: 2000, y: 17200, z: 340 },
        { x: 2200, y: 18800, z: 390 },
        { x: 1820, y: 15500, z: 290 },
        { x: 2450, y: 21200, z: 460 },
        { x: 1720, y: 14500, z: 255 },
        { x: 2050, y: 17500, z: 350 },
        { x: 1870, y: 15800, z: 295 },
        { x: 2300, y: 19800, z: 410 },
        { x: 1780, y: 15000, z: 275 },
        { x: 2500, y: 21800, z: 480 },
        { x: 1920, y: 16400, z: 310 },
        { x: 2070, y: 17700, z: 355 },
        { x: 1830, y: 15600, z: 285 },
      ],
    },
    {
      name: "Latin America Sales",
      data: [
        { x: 650, y: 4200, z: 55 },
        { x: 780, y: 5100, z: 75 },
        { x: 720, y: 4800, z: 65 },
        { x: 850, y: 5800, z: 90 },
        { x: 690, y: 4500, z: 60 },
        { x: 920, y: 6300, z: 105 },
        { x: 620, y: 4000, z: 50 },
        { x: 980, y: 6800, z: 120 },
        { x: 750, y: 5000, z: 70 },
        { x: 880, y: 6000, z: 95 },
        { x: 670, y: 4400, z: 58 },
        { x: 1020, y: 7100, z: 130 },
        { x: 730, y: 4900, z: 68 },
        { x: 950, y: 6500, z: 110 },
        { x: 640, y: 4100, z: 52 },
        { x: 1100, y: 7500, z: 150 },
        { x: 700, y: 4700, z: 62 },
        { x: 860, y: 5900, z: 92 },
        { x: 680, y: 4600, z: 56 },
        { x: 930, y: 6400, z: 108 },
        { x: 610, y: 3900, z: 48 },
        { x: 1050, y: 7200, z: 140 },
        { x: 740, y: 4950, z: 69 },
        { x: 970, y: 6650, z: 118 },
        { x: 660, y: 4300, z: 54 },
      ],
    },
    {
      name: "Middle East & Africa",
      data: [
        { x: 450, y: 2800, z: 35 },
        { x: 580, y: 3700, z: 55 },
        { x: 520, y: 3300, z: 45 },
        { x: 680, y: 4400, z: 70 },
        { x: 490, y: 3100, z: 40 },
        { x: 750, y: 4900, z: 85 },
        { x: 420, y: 2600, z: 30 },
        { x: 820, y: 5500, z: 100 },
        { x: 560, y: 3600, z: 52 },
        { x: 710, y: 4700, z: 78 },
        { x: 470, y: 2900, z: 38 },
        { x: 880, y: 5900, z: 115 },
        { x: 530, y: 3400, z: 48 },
        { x: 780, y: 5200, z: 92 },
        { x: 440, y: 2700, z: 32 },
        { x: 920, y: 6200, z: 125 },
        { x: 500, y: 3200, z: 42 },
        { x: 650, y: 4100, z: 65 },
        { x: 480, y: 3000, z: 39 },
        { x: 730, y: 4800, z: 80 },
        { x: 410, y: 2500, z: 28 },
        { x: 850, y: 5700, z: 105 },
        { x: 540, y: 3500, z: 50 },
        { x: 800, y: 5400, z: 95 },
        { x: 460, y: 2850, z: 36 },
      ],
    },
    {
      name: "Small Business",
      data: [
        { x: 200, y: 1200, z: 15 },
        { x: 280, y: 1600, z: 22 },
        { x: 240, y: 1400, z: 18 },
        { x: 320, y: 1900, z: 28 },
        { x: 220, y: 1300, z: 16 },
        { x: 360, y: 2200, z: 35 },
        { x: 180, y: 1100, z: 12 },
        { x: 400, y: 2500, z: 45 },
        { x: 260, y: 1500, z: 20 },
        { x: 340, y: 2100, z: 32 },
        { x: 210, y: 1250, z: 15 },
        { x: 380, y: 2400, z: 40 },
        { x: 250, y: 1450, z: 19 },
        { x: 370, y: 2300, z: 38 },
        { x: 190, y: 1150, z: 13 },
        { x: 420, y: 2700, z: 50 },
        { x: 230, y: 1350, z: 17 },
        { x: 290, y: 1700, z: 24 },
        { x: 205, y: 1220, z: 15 },
        { x: 350, y: 2150, z: 34 },
        { x: 170, y: 1050, z: 11 },
        { x: 390, y: 2450, z: 42 },
        { x: 245, y: 1420, z: 18 },
        { x: 375, y: 2350, z: 39 },
        { x: 195, y: 1180, z: 14 },
      ],
    },
    {
      name: "Enterprise Clients",
      data: [
        { x: 2500, y: 35000, z: 800 },
        { x: 2800, y: 38000, z: 900 },
        { x: 2200, y: 32000, z: 700 },
        { x: 3100, y: 42000, z: 1000 },
        { x: 2650, y: 36500, z: 850 },
        { x: 3400, y: 46000, z: 1200 },
        { x: 2100, y: 30000, z: 650 },
        { x: 3600, y: 48000, z: 1300 },
        { x: 2750, y: 37500, z: 875 },
        { x: 2950, y: 40000, z: 950 },
        { x: 2350, y: 33500, z: 750 },
        { x: 3750, y: 50000, z: 1400 },
        { x: 2900, y: 39500, z: 925 },
        { x: 3250, y: 44000, z: 1100 },
        { x: 2550, y: 35500, z: 825 },
        { x: 3850, y: 52000, z: 1500 },
        { x: 2400, y: 34000, z: 775 },
        { x: 3050, y: 41000, z: 975 },
        { x: 2700, y: 37000, z: 860 },
        { x: 3300, y: 45000, z: 1150 },
        { x: 2250, y: 31500, z: 675 },
        { x: 3500, y: 47000, z: 1250 },
        { x: 2850, y: 38500, z: 910 },
        { x: 3200, y: 43000, z: 1050 },
        { x: 2600, y: 36000, z: 835 },
      ],
    },
    {
      name: "Government Contracts",
      data: [
        { x: 1800, y: 25000, z: 600 },
        { x: 2100, y: 28000, z: 700 },
        { x: 1650, y: 23000, z: 550 },
        { x: 2400, y: 32000, z: 800 },
        { x: 1950, y: 26500, z: 650 },
        { x: 2700, y: 36000, z: 900 },
        { x: 1500, y: 21000, z: 500 },
        { x: 2850, y: 38000, z: 950 },
        { x: 2250, y: 30000, z: 750 },
        { x: 2550, y: 34000, z: 850 },
        { x: 1750, y: 24000, z: 575 },
        { x: 3000, y: 40000, z: 1000 },
        { x: 2150, y: 29000, z: 725 },
        { x: 2600, y: 35000, z: 875 },
        { x: 1850, y: 25500, z: 625 },
        { x: 3100, y: 41000, z: 1025 },
        { x: 1700, y: 23500, z: 525 },
        { x: 2300, y: 30500, z: 775 },
        { x: 2000, y: 27500, z: 675 },
        { x: 2750, y: 37000, z: 925 },
        { x: 1600, y: 22500, z: 525 },
        { x: 2900, y: 39000, z: 975 },
        { x: 2200, y: 29500, z: 740 },
        { x: 2650, y: 35500, z: 890 },
        { x: 1900, y: 26000, z: 640 },
      ],
    },
  ],
};

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
  tablet: Calendar,
  series1: Globe,
  series2: Smartphone,
  revenue: Laptop,
  profit: Tv,
  performance: Watch,
  efficiency: Monitor,
} as const;

/**
 * # ScatterChart Component Documentation
 *
 * The ScatterChart component is designed for visualizing relationships between two continuous variables.
 * It's ideal for:
 *
 * - **Correlation Analysis**: Identifying relationships between variables.
 * - **Distribution Analysis**: Understanding data point clustering and outliers.
 * - **Comparative Analysis**: Comparing multiple datasets on the same coordinate system.
 *
 * ## Key Features
 *
 * ### Interactive & Responsive
 * - **Interactive Tooltips**: Hover over points to see detailed data values.
 * - **Multiple Datasets**: Support for multiple data series with different colors.
 * - **Responsive Design**: Adapts to any container size.
 *
 * ### Customization
 * - **Colors**: Uses the ThemeProvider's chart palette, or custom colors with `customPalette`.
 * - **Axis Configuration**: Customizable axis labels.
 */
const meta: Meta<ScatterChartProps> = {
  title: "Components/Charts/ScatterChart",
  component: ScatterChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { ScatterChart } from '@openuidev/react-ui/Charts/ScatterChart';

const scatterData = [
  { x: 100, y: 200, category: "A" },
  { x: 120, y: 100, category: "B" },
  { x: 170, y: 300, category: "A" },
];

// Basic implementation
<ScatterChart
  data={scatterData}
/>

// With custom axis labels
<ScatterChart
  data={scatterData}
  xAxisLabel="Temperature (°C)"
  yAxisLabel="Sales ($)"
/>
\`\`\`

## Data Structure Requirements

Your data should be an array of objects. Each object must contain:
- **x coordinate** (number): The X-axis value for the point.
- **y coordinate** (number): The Y-axis value for the point.
- One or more **series fields**: Additional fields that define different datasets/series.

\`\`\`tsx
const scatterData = [
  { x: 10, y: 20, dataset1: 1, dataset2: 1 },
  { x: 15, y: 25, dataset1: 1, dataset2: 1 },
  { x: 20, y: 30, dataset1: 1, dataset2: 1 },
];
\`\`\`
`,
      },
    },
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    data: {
      description: `
**Required.** An array of data objects for the scatter chart. Each object should contain:
- x coordinate (number) for the X-axis.
- y coordinate (number) for the Y-axis.
- One or more series identifiers.
`,
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
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
    isAnimationActive: {
      description: "Enables or disables the initial loading animation.",
      control: "boolean",
      table: {
        defaultValue: { summary: "false" },
        category: "🎬 Animation & Interaction",
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
} satisfies Meta<typeof ScatterChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Basic Scatter Chart
 *
 * This demonstrates a basic scatter chart with default settings.
 * Perfect for showing simple correlations between two variables.
 */
export const BasicScatter: Story = {
  name: "📈 Basic Scatter Chart",
  args: {
    data: dataVariations.default,
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
    width: 700,
    height: 400,
  },
  render: (args: any) => <ScatterChart {...args} />,
};

/**
 * ## Correlation Analysis
 *
 * This example shows how to use the scatter chart for correlation analysis.
 * Notice how the points follow a general upward trend, indicating positive correlation.
 */
export const CorrelationAnalysis: Story = {
  name: "📊 Correlation Analysis",
  args: {
    data: dataVariations.correlation,
    grid: true,
    legend: true,
    isAnimationActive: true,
    xAxisLabel: "Marketing Spend",
    yAxisLabel: "Sales Revenue",
  },
  render: (args: any) => (
    <Card style={{ width: "700px" }}>
      <ScatterChart {...args} />
    </Card>
  ),
};

/**
 * ## Data Explorer
 *
 * Interactive tool for exploring different scatter chart datasets.
 * Use the buttons to switch between various data scenarios.
 */
export const DataExplorer: Story = {
  name: "🎛️ Data Explorer",
  args: {
    data: dataVariations.default as never,
    grid: true,
    legend: true,
    isAnimationActive: true,
  },
  render: (args: any) => {
    const [selectedDataType, setSelectedDataType] =
      useState<keyof typeof dataVariations>("default");

    const currentData = dataVariations[selectedDataType];

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
          <strong>📈 Scatter Chart Test Suite:</strong>
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            <button
              onClick={() => setSelectedDataType("default")}
              style={selectedDataType === "default" ? activeButtonStyle : buttonStyle}
            >
              📊 Default
            </button>
            <button
              onClick={() => setSelectedDataType("correlation")}
              style={selectedDataType === "correlation" ? activeButtonStyle : buttonStyle}
            >
              📈 Correlation
            </button>
            <button
              onClick={() => setSelectedDataType("multipleDatasets")}
              style={selectedDataType === "multipleDatasets" ? activeButtonStyle : buttonStyle}
            >
              🎯 Multiple Datasets
            </button>
            <button
              onClick={() => setSelectedDataType("performance")}
              style={selectedDataType === "performance" ? activeButtonStyle : buttonStyle}
            >
              ⚡ Performance
            </button>
            <button
              onClick={() => setSelectedDataType("comprehensive")}
              style={selectedDataType === "comprehensive" ? activeButtonStyle : buttonStyle}
            >
              🌍 Comprehensive
            </button>
          </div>
        </div>
        <Card style={{ width: "600px" }}>
          <ScatterChart {...args} data={currentData} height={"600px"} />
        </Card>
      </div>
    );
  },
};
