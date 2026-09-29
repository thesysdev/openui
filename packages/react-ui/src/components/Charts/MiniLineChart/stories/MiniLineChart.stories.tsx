import type { Meta, StoryObj } from "@storybook/react";
import { MiniLineChart } from "../..";
import { Card } from "../../../Card";

// Simple array of numbers for 1D line chart
const simpleLineChartData = [
  12, 45, 78, 32, 67, 89, 23, 56, 91, 34, 76, 28, 85, 42, 19, 63, 87, 31, 74, 58, 92, 26, 49, 83,
  37, 50, 1,
];

// Array of objects with value and label
const labeledLineChartData = [
  { value: 150, label: "January" },
  { value: 280, label: "February" },
  { value: 220, label: "March" },
  { value: 180, label: "April" },
  { value: 250, label: "May" },
  { value: 300, label: "June" },
  { value: 320, label: "July" },
  { value: 280, label: "August" },
  { value: 310, label: "September" },
  { value: 290, label: "October" },
  { value: 340, label: "November" },
  { value: 360, label: "December" },
];

const meta: Meta<typeof MiniLineChart> = {
  title: "Components/Charts/MiniLineChart",
  component: MiniLineChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { MiniLineChart } from '@openuidev/react-ui/Charts/LineCharts/MiniLineChart';\n```\n\nA responsive mini line chart component that accepts 1D data (numbers or objects with value/label) with automatic data filtering for space-constrained containers. Features smooth line interpolation and customizable styling.",
      },
    },
  },
  tags: ["!autodocs"],
  argTypes: {
    data: {
      description:
        "An array of numbers or an array of objects with value and optional label. Each entry represents a single point in the line chart.",
      control: false,
      table: {
        type: { summary: "Array<number> | Array<{ value: number; label?: string }>" },
        defaultValue: { summary: "[]" },
        category: "Data",
      },
    },
    variant: {
      description:
        "The interpolation method used to create the line curves. 'linear' creates straight lines between points, 'natural' creates smooth curves, and 'step' creates a stepped line.",
      control: "radio",
      options: ["linear", "natural", "step"],
      table: {
        defaultValue: { summary: "natural" },
        category: "Appearance",
      },
    },
    strokeWidth: {
      description: "The width of the line stroke",
      control: "number",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "2" },
        category: "Appearance",
      },
    },
    isAnimationActive: {
      description: "Whether to animate the chart when it first renders",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    size: {
      description: "The width and height of the chart",
      control: "text",
      table: {
        type: { summary: "number | string" },
        defaultValue: { summary: "100%" },
        category: "Appearance",
      },
    },
    lineColor: {
      description: "Custom color for the line stroke",
      control: "color",
      table: {
        type: { summary: "string" },
        category: "Appearance",
      },
    },
  },
} satisfies Meta<typeof MiniLineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleNumberArray: Story = {
  name: "Simple Number Array",
  args: {
    data: simpleLineChartData,
    variant: "natural",
    strokeWidth: 2,
    isAnimationActive: true,
    size: "100%",
  },
  render: (args: any) => (
    <Card style={{ width: "280px", padding: "20px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>Daily Activity</h3>
      <MiniLineChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
const activityData = [12, 45, 78, 32, 67, 89, 23, 56, 91, 34];

<MiniLineChart 
  data={activityData}
  variant="natural"
  strokeWidth={2}
  isAnimationActive={true}
  size="100%"
/>
`,
      },
    },
  },
};

export const LabeledData: Story = {
  name: "Labeled Data",
  args: {
    data: labeledLineChartData,
    variant: "natural",
    strokeWidth: 2,
    isAnimationActive: true,
    size: "100%",
  },
  render: (args: any) => (
    <Card style={{ width: "320px", padding: "20px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>Monthly Revenue</h3>
      <MiniLineChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
const revenueData = [
  { value: 150, label: "January" },
  { value: 280, label: "February" },
  { value: 220, label: "March" },
  // ...
];

<MiniLineChart 
  data={revenueData}
  variant="natural"
  strokeWidth={2}
  size="100%"
/>
`,
      },
    },
  },
};
