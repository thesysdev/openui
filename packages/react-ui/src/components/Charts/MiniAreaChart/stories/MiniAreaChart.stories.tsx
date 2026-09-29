import type { Meta, StoryObj } from "@storybook/react";
import { MiniAreaChart } from "../..";
import { Card } from "../../../Card";

// Simple array of numbers for 1D area chart
const simpleAreaChartData = [
  12, 45, 78, 32, 67, 89, 23, 56, 91, 34, 76, 28, 85, 42, 19, 63, 87, 31, 74, 58, 92, 26, 49, 83,
  37, 50,
];

// Array of objects with value and label
const labeledAreaChartData = [
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
  // { value: 360, label: "December" },
  // { value: 360, label: "December" },
];

const meta: Meta<typeof MiniAreaChart> = {
  title: "Components/Charts/MiniAreaChart",
  component: MiniAreaChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { MiniAreaChart } from '@openuidev/react-ui/Charts/AreaCharts/MiniAreaChart';\n```\n\nA responsive mini area chart component that accepts 1D data (numbers or objects with value/label) with automatic data filtering for space-constrained containers. Features linear gradient fills from color to transparent.",
      },
    },
  },
  tags: ["!autodocs"],
  argTypes: {
    data: {
      description:
        "An array of numbers or an array of objects with value and optional label. Each entry represents a single point in the area chart.",
      control: false,
      table: {
        type: { summary: "Array<number> | Array<{ value: number; label?: string }>" },
        defaultValue: { summary: "[]" },
        category: "Data",
      },
    },
    variant: {
      description:
        "The interpolation method used to create the area curves. 'linear' creates straight lines between points, 'natural' creates smooth curves, and 'step' creates a stepped area.",
      control: "radio",
      options: ["linear", "natural", "step"],
      table: {
        defaultValue: { summary: "natural" },
        category: "Appearance",
      },
    },
    opacity: {
      description:
        "The opacity of the filled area beneath the line (0 = fully transparent, 1 = fully opaque). Only used when useGradient is false.",
      control: "number",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0.5" },
        category: "Appearance",
      },
    },
    useGradient: {
      description:
        "Whether to use a linear gradient fill that goes from the area color at the top to transparent at the bottom.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
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
    areaColor: {
      description: "Custom color for the area fill and stroke",
      control: "color",
      table: {
        type: { summary: "string" },
        category: "Appearance",
      },
    },
  },
} satisfies Meta<typeof MiniAreaChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleNumberArray: Story = {
  name: "Simple Number Array (With Gradient)",
  args: {
    data: simpleAreaChartData,
    variant: "natural",
    opacity: 0.5,
    useGradient: true,
    isAnimationActive: true,
    size: "100%",
  },
  render: (args: any) => (
    <Card style={{ width: "280px", padding: "20px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>Daily Activity</h3>
      <MiniAreaChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
const activityData = [12, 45, 78, 32, 67, 89, 23, 56, 91, 34];

<MiniAreaChart 
  data={activityData}
  variant="natural"
  useGradient={true}
  isAnimationActive={true}
  size="100%"
/>
`,
      },
    },
  },
};

export const LabeledData: Story = {
  name: "Labeled Data (With Gradient)",
  args: {
    data: labeledAreaChartData,
    variant: "natural",
    opacity: 0.6,
    useGradient: true,
    isAnimationActive: true,
    size: "100%",
  },
  render: (args: any) => (
    <Card style={{ width: "320px", padding: "20px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>Monthly Revenue</h3>
      <MiniAreaChart {...args} />
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

<MiniAreaChart 
  data={revenueData}
  variant="natural"
  useGradient={true}
  size="100%"
/>
`,
      },
    },
  },
};

export const WithoutGradient: Story = {
  name: "Solid Fill (Without Gradient)",
  args: {
    data: simpleAreaChartData.slice(0, 15),
    variant: "natural",
    opacity: 0.4,
    useGradient: false,
    isAnimationActive: true,
    size: "100%",
  },
  render: (args: any) => (
    <Card style={{ width: "280px", padding: "20px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>Solid Fill Area</h3>
      <MiniAreaChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
<MiniAreaChart 
  data={data}
  variant="natural"
  opacity={0.4}
  useGradient={false}
  size="100%"
/>
`,
      },
    },
  },
};

export const GradientComparison: Story = {
  name: "Gradient vs Solid Comparison",
  render: () => (
    <div style={{ display: "flex", gap: "20px" }}>
      <Card style={{ width: "250px", padding: "16px" }}>
        <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>
          With Gradient (Default)
        </h4>
        <MiniAreaChart
          data={[20, 45, 35, 80, 60, 90, 45, 70, 85, 30]}
          variant="natural"
          useGradient={true}
          size={200}
        />
      </Card>
      <Card style={{ width: "250px", padding: "16px" }}>
        <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>Solid Fill</h4>
        <MiniAreaChart
          data={[20, 45, 35, 80, 60, 90, 45, 70, 85, 30]}
          variant="natural"
          useGradient={false}
          opacity={0.3}
          size={200}
        />
      </Card>
    </div>
  ),
};

export const ResponsiveData: Story = {
  name: "Responsive Data Filtering",
  args: {
    data: simpleAreaChartData,
    variant: "natural",
    opacity: 0.4,
    useGradient: true,
    isAnimationActive: true,
    size: "100%",
  },
  render: (args: any) => (
    <div style={{ display: "flex", gap: "20px", flexDirection: "column" }}>
      <Card style={{ width: "200px", padding: "16px" }}>
        <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>Small (200px)</h4>
        <MiniAreaChart {...args} />
      </Card>
      <Card style={{ width: "400px", padding: "16px" }}>
        <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>
          Medium (400px)
        </h4>
        <MiniAreaChart {...args} />
      </Card>
      <Card style={{ width: "600px", padding: "16px" }}>
        <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>Large (600px)</h4>
        <MiniAreaChart {...args} />
      </Card>
    </div>
  ),
};

export const DifferentSizes: Story = {
  name: "Different Sizes",
  render: () => (
    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
      <Card style={{ width: "120px", padding: "12px" }}>
        <h4 style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "600" }}>Small</h4>
        <MiniAreaChart data={[15, 25, 20, 35, 30, 18, 22]} size={80} />
      </Card>
      <Card style={{ width: "200px", padding: "16px" }}>
        <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>Medium</h4>
        <MiniAreaChart data={simpleAreaChartData.slice(0, 10)} size={160} />
      </Card>
      <Card style={{ width: "280px", padding: "20px" }}>
        <h4 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>Large</h4>
        <MiniAreaChart data={simpleAreaChartData} size={240} />
      </Card>
    </div>
  ),
};

export const DifferentVariants: Story = {
  name: "Different Variants",
  render: () => (
    <div style={{ display: "flex", gap: "20px" }}>
      {(["linear", "natural", "step"] as const).map((variant) => (
        <Card key={variant} style={{ width: "220px", padding: "16px" }}>
          <h4
            style={{
              marginBottom: "12px",
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            {variant} Variant
          </h4>
          <MiniAreaChart
            data={[15, 35, 25, 45, 30, 50, 28, 42, 38, 29]}
            variant={variant}
            useGradient={true}
            size={180}
          />
        </Card>
      ))}
    </div>
  ),
};

export const CustomColor: Story = {
  name: "Custom Color with Gradient",
  args: {
    data: [20, 45, 28, 80, 99, 43, 67, 23, 89, 56],
    variant: "natural",
    opacity: 0.7,
    areaColor: "#ff6b6b",
    useGradient: true,
    size: 200,
  },
  render: (args: any) => (
    <Card
      style={{
        width: "280px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>Custom Red Area</h3>
      <MiniAreaChart {...args} />
    </Card>
  ),
};
