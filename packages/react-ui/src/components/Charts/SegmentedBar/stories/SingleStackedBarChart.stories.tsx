import type { Meta, StoryObj } from "@storybook/react";
import { SingleStackedBar, SingleStackedBarProps } from "../..";
import { Card } from "../../../Card";

const meta: Meta<SingleStackedBarProps<any>> = {
  title: "Components/Charts/SingleStackedBar",
  component: SingleStackedBar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
// Note: While the component is named 'ProgressBar', it's presented here as a 'SingleStackedBar'
// to emphasize its use for showing proportional data, much like a pie chart.
## Installation and Basic Usage

\`\`\`tsx
import { SingleStackedBar } from '@openuidev/react-ui/Charts/SingleStackedBar';

// Basic implementation
<SingleStackedBar
  data={[
    { category: 'A', value: 25 },
    { category: 'B', value: 30 },
    { category: 'C', value: 20 }
  ]}
  categoryKey="category"
  dataKey="value"
  legend={true}
/>
\`\`\`

## Data Structure Requirements

The data should be an array of objects with consistent property names. Use \`categoryKey\` to specify which property contains the segment labels, and \`dataKey\` to specify which property contains the numeric values.

\`\`\`tsx
// Example data structure
const data = [
  { category: 'Desktop', value: 45 },
  { category: 'Mobile', value: 35 },
  { category: 'Tablet', value: 20 }
];

// Component usage
<SingleStackedBar
  data={data}
  categoryKey="category"
  dataKey="value"
/>
\`\`\`

## Key Features

- **Segmented Display**: Visualize the composition of a whole.
- **Colors**: Uses the ThemeProvider's chart palette, or custom colors with \`customPalette\`.
- **Animation**: Smoothly animates the bar segments.
- **Legend Support**: Optional legend with category names and colors.
- **Responsive**: Adapts to the width of its container.
`,
      },
    },
  },
  tags: ["dev", "autodocs"],
  argTypes: {
    data: {
      description: `
**Required.** An array of objects where each object contains category and value information.
The component extracts values using the specified \`dataKey\` and calculates proportional widths.

**Example:** \`[{ category: 'A', value: 20 }, { category: 'B', value: 30 }, { category: 'C', value: 15 }]\`
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
**Required.** The property name in each data object that contains the segment labels/categories.
This value will be displayed in tooltips and used for accessibility.

**Example:** \`'category'\` or \`'name'\`
`,
      control: "text",
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    dataKey: {
      description: `
**Required.** The property name in each data object that contains the numeric values.
These values determine the proportional width of each segment.

**Example:** \`'value'\` or \`'count'\` or \`'percentage'\`
`,
      control: "text",
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    isAnimationActive: {
      description: `
**Animation Control.** Enables or disables the segment width animation.
`,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "🎬 Animation & Interaction",
      },
    },
    legend: {
      description: `
**Legend Display.** Shows or hides the legend below the single stacked bar chart.
The legend displays category names with their corresponding colors.
`,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "📊 Data Configuration",
      },
    },
    legendVariant: {
      description: `
**Legend Variant.** Choose between default (inline) and stacked (vertical) legend.
Stacked legend appears at the bottom and shows values as percentages.
`,
      control: "radio",
      options: ["default", "stacked"],
      table: {
        type: { summary: '"default" | "stacked"' },
        defaultValue: { summary: "default" },
        category: "📱 Display Options",
      },
    },
  },
} satisfies Meta<typeof SingleStackedBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = {
  default: [
    { category: "A", value: 25 },
    { category: "B", value: 30 },
    { category: "C", value: 20 },
  ],
  many: [
    { category: "Item 1", value: 10 },
    { category: "Item 2", value: 8 },
    { category: "Item 3", value: 12 },
    { category: "Item 4", value: 5 },
    { category: "Item 5", value: 15 },
    { category: "Item 6", value: 7 },
    { category: "Item 7", value: 13 },
    { category: "Item 8", value: 10 },
  ],
  full: [
    { category: "Q1", value: 25 },
    { category: "Q2", value: 25 },
    { category: "Q3", value: 25 },
    { category: "Q4", value: 25 },
  ],
};

export const DefaultConfiguration: Story = {
  name: "📊 Default Configuration",
  args: {
    data: sampleData.default,
    categoryKey: "category",
    dataKey: "value",
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
          Category Breakdown
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Visualizing the breakdown of a dataset into its constituent parts.
        </p>
      </div>
      <SingleStackedBar {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This is the standard appearance of the Single Stacked Bar. It shows multiple segments, each with a color from the chart palette, representing the proportional breakdown of a whole.",
      },
    },
  },
};

export const ManySegments: Story = {
  name: "🧩 Many Segments",
  args: {
    data: sampleData.many,
    categoryKey: "category",
    dataKey: "value",
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
          Resource Distribution
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          The component gracefully handles numerous small segments.
        </p>
      </div>
      <SingleStackedBar {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The Single Stacked Bar can display many segments. The colors will cycle through the chart palette if the number of segments exceeds the number of available colors.",
      },
    },
  },
};

export const FullComposition: Story = {
  name: "✅ Full Composition",
  args: {
    data: sampleData.full,
    categoryKey: "category",
    dataKey: "value",
    isAnimationActive: false,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
          Complete Data Set
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Displaying a bar where segments add up to 100%.
        </p>
      </div>
      <SingleStackedBar {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This example shows a bar where the segments add up to 100%. The segments collectively fill the entire width of the container, representing the full composition of the data.",
      },
    },
  },
};

export const WithLegend: Story = {
  name: "📊 With Legend",
  args: {
    data: sampleData.default,
    categoryKey: "category",
    dataKey: "value",
    isAnimationActive: true,
    legend: true,
    legendVariant: "default",
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
          Category Breakdown with Legend
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Visualizing the breakdown with a legend that shows category names and colors. The legend
          automatically expands when there are many items.
        </p>
      </div>
      <SingleStackedBar {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This example demonstrates the SingleStackedBar with legend enabled. The legend displays below the chart and shows the category names with their corresponding colors. For larger datasets, the legend will show a 'Show More' button to expand and see all items.",
      },
    },
  },
};

export const LegendWithManyItems: Story = {
  name: "🧩 Legend with Many Items",
  args: {
    data: sampleData.many,
    categoryKey: "category",
    dataKey: "value",
    isAnimationActive: true,
    legend: true,
    legendVariant: "default",
  },
  render: (args: any) => (
    <Card style={{ width: "600px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
          Resource Distribution with Legend
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          The component handles many segments gracefully with the legend showing category names and
          values. The legend automatically manages overflow with expand/collapse functionality.
        </p>
      </div>
      <SingleStackedBar {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This example shows how the SingleStackedBar handles many segments with legend enabled. The legend automatically shows a 'Show More' button when items don't fit in the available space, providing a clean way to manage large datasets.",
      },
    },
  },
};

export const StackedLegendVariant: Story = {
  name: "📚 Stacked Legend (Bottom)",
  args: {
    data: sampleData.many,
    categoryKey: "category",
    dataKey: "value",
    isAnimationActive: true,
    legend: true,
    legendVariant: "stacked",
  },
  render: (args: any) => (
    <Card style={{ width: "650px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
          Stacked Legend at Bottom
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Displays a vertical legend beneath the bar with percentage values and overflow handling.
        </p>
      </div>
      <SingleStackedBar {...args} />
    </Card>
  ),
};
