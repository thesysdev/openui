// Copy of Charts/MiniBarChart/stories/MiniBarChart.stories.tsx with only the chart import and the title changed:
// the same args and renders, rendering the D3Charts chart via
// ../../stories/rechartsStoryAdapters.
import type { Meta, StoryObj } from "@storybook/react";
import { Monitor } from "lucide-react";
import { Card } from "../../../Card";
import { MiniBarChart, MiniBarChartProps } from "../../stories/rechartsStoryAdapters";

// Simple array of numbers for 1D bar chart
const simpleBarChartData = [
  1, 1893456, 3456789, 2987654, 1765432, 4321098, 3789012, 2654321, 4123567, 3234567, 2876543,
  3987654, 2347891, 1893456, 3456789, 2987654, 1765432, 4321098, 3789012, 2654321, 4123567, 3234567,
  2876543, 3987654, 2347891, 1893456, 3456789, 2987654, 1765432, 4321098, 3789012, 2654321, 4123567,
  3234567, 2876543, 3987654, 2347891, 1893456, 3456789, 2987654, 1765432, 4321098, 3789012, 2654321,
  4123567, 3234567, 2876543, 100000,
];

// Array of objects with value and label
const labeledBarChartData = [
  { value: 2347891, label: "January" },
  { value: 1893456, label: "February" },
  { value: 3456789, label: "March" },
  { value: 2987654, label: "April" },
  { value: 1765432, label: "May" },
  { value: 4321098, label: "June" },
  { value: 3789012, label: "July" },
  { value: 2654321, label: "August" },
  { value: 4123567, label: "September" },
  { value: 3234567, label: "October" },
  { value: 2876543, label: "November" },
  { value: 3987654, label: "December" },
];

const icons = {
  desktop: Monitor,
} as const;

const meta: Meta<MiniBarChartProps> = {
  title: "Components/D3Charts/MiniBarChart",
  component: MiniBarChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { MiniBarChart } from '@openuidev/react-ui/Charts/BarCharts/MiniBarChart';\n```",
      },
    },
  },
  tags: ["!autodocs"],
  argTypes: {
    data: {
      description:
        "An array of numbers or an array of objects with value and optional label. Each entry represents a single bar in the chart.",
      control: false,
      table: {
        type: { summary: "Array<number> | Array<{ value: number; label?: string }>" },
        defaultValue: { summary: "[]" },
        category: "Data",
      },
    },
    theme: {
      description:
        "The color palette theme for the chart. Each theme provides a different set of colors for the bars.",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "Appearance",
      },
    },
    radius: {
      description: "The radius of the rounded corners of the bars",
      control: "number",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "1" },
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
      control: "number",
      table: {
        type: { summary: "number | string" },
        defaultValue: { summary: "160" },
        category: "Appearance",
      },
    },
  },
} satisfies Meta<typeof MiniBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleNumberArray: Story = {
  name: "Simple Number Array",
  args: {
    data: simpleBarChartData,
    theme: "ocean",
    radius: 2,
    isAnimationActive: true,
    size: "100%",
  },
  render: (args: any) => (
    <Card style={{ width: "280px", padding: "20px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
        Monthly Sales Data
      </h3>
      <MiniBarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
const salesData = [2347891, 1893456, 3456789, 2987654, 1765432, 4321098];
        
<MiniBarChart 
  data={salesData}
  theme="ocean"
  radius={2}
  isAnimationActive={true}
  size={200}
/>
`,
      },
    },
  },
};

export const LabeledData: Story = {
  name: "Labeled Data",
  args: {
    data: labeledBarChartData,
    theme: "emerald",
    radius: 1,
    isAnimationActive: true,
    size: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "280px", padding: "20px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>Monthly Revenue</h3>
      <MiniBarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
const revenueData = [
  { value: 2347891, label: "January" },
  { value: 1893456, label: "February" },
  { value: 3456789, label: "March" },
  // ...
];
        
<MiniBarChart 
  data={revenueData}
  theme="emerald"
  radius={1}
  isAnimationActive={true}
  size={200}
/>
`,
      },
    },
  },
};

export const SmallSize: Story = {
  name: "Small Size",
  args: {
    data: [10, 20, 15, 30, 25, 35, 18],
    theme: "sunset",
    radius: 1,
    isAnimationActive: true,
    size: 120,
  },
  render: (args: any) => (
    <Card style={{ width: "200px", padding: "16px" }}>
      <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>Weekly Stats</h4>
      <MiniBarChart {...args} />
    </Card>
  ),
};

export const DifferentThemes: Story = {
  name: "Different Themes",
  render: () => (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      {(["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"] as const).map((theme) => (
        <Card key={theme} style={{ width: "200px", padding: "16px" }}>
          <h4
            style={{
              marginBottom: "12px",
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            {theme} Theme
          </h4>
          <MiniBarChart data={[15, 25, 20, 35, 30, 18, 22]} theme={theme} radius={2} size={160} />
        </Card>
      ))}
    </div>
  ),
};
