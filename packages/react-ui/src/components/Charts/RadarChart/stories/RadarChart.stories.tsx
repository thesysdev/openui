import type { Meta, StoryObj } from "@storybook/react";
import { Shield, Star, Target } from "lucide-react";
import { useState } from "react";
import { RadarChart, RadarChartProps } from "../..";
import { Card } from "../../../Card";

// 📊 COMPREHENSIVE DATA VARIATIONS - Designed to test various radar chart scenarios
const dataVariations = {
  default: [
    { skill: "JavaScript", beginner: 3, intermediate: 7, advanced: 9 },
    { skill: "React", beginner: 4, intermediate: 8, advanced: 8 },
    { skill: "TypeScript", beginner: 2, intermediate: 6, advanced: 9 },
    { skill: "Node.js", beginner: 3, intermediate: 7, advanced: 7 },
    { skill: "CSS", beginner: 5, intermediate: 8, advanced: 6 },
    { skill: "Git", beginner: 4, intermediate: 6, advanced: 8 },
  ],
  performance: [
    { metric: "Speed", team_a: 85, team_b: 92, team_c: 78 },
    { metric: "Quality", team_a: 90, team_b: 88, team_c: 95 },
    { metric: "Efficiency", team_a: 78, team_b: 85, team_c: 82 },
    { metric: "Innovation", team_a: 92, team_b: 75, team_c: 88 },
    { metric: "Collaboration", team_a: 88, team_b: 94, team_c: 85 },
    { metric: "Reliability", team_a: 95, team_b: 87, team_c: 90 },
  ],
  businessMetrics: [
    { department: "Sales", q1: 85, q2: 92, q3: 78, q4: 95 },
    { department: "Marketing", q1: 78, q2: 85, q3: 90, q4: 88 },
    { department: "Support", q1: 92, q2: 88, q3: 85, q4: 90 },
    { department: "Product", q1: 88, q2: 90, q3: 92, q4: 85 },
    { department: "Engineering", q1: 90, q2: 85, q3: 88, q4: 92 },
  ],
  gameStats: [
    { attribute: "Strength", player1: 95, player2: 78, player3: 85 },
    { attribute: "Speed", player1: 82, player2: 95, player3: 88 },
    { attribute: "Intelligence", player1: 88, player2: 85, player3: 92 },
    { attribute: "Defense", player1: 90, player2: 82, player3: 78 },
    { attribute: "Magic", player1: 75, player2: 92, player3: 88 },
    { attribute: "Luck", player1: 85, player2: 88, player3: 90 },
  ],
  productFeatures: [
    { feature: "Usability", current: 8, competitor_a: 7, competitor_b: 9 },
    { feature: "Performance", current: 9, competitor_a: 8, competitor_b: 7 },
    { feature: "Design", current: 8, competitor_a: 9, competitor_b: 8 },
    { feature: "Features", current: 7, competitor_a: 8, competitor_b: 9 },
    { feature: "Price", current: 9, competitor_a: 6, competitor_b: 8 },
    { feature: "Support", current: 8, competitor_a: 7, competitor_b: 6 },
  ],
  minimal: [
    { category: "Category A", value1: 8, value2: 6 },
    { category: "Category B", value1: 7, value2: 9 },
    { category: "Category C", value1: 9, value2: 7 },
  ],
  singleMetric: [
    { dimension: "North", score: 85 },
    { dimension: "South", score: 72 },
    { dimension: "East", score: 90 },
    { dimension: "West", score: 78 },
    { dimension: "Center", score: 88 },
  ],
  manyDimensions: [
    { aspect: "UX Design and User Experience", mobile: 8, web: 9, desktop: 7, tablet: 8 },
    { aspect: "Performance and Optimization", mobile: 9, web: 8, desktop: 9, tablet: 8 },
    { aspect: "Accessibility and Inclusivity", mobile: 7, web: 8, desktop: 9, tablet: 7 },
    { aspect: "Security and Compliance", mobile: 8, web: 9, desktop: 8, tablet: 8 },
    { aspect: "Scalability and Performance", mobile: 7, web: 9, desktop: 8, tablet: 7 },
    { aspect: "Maintenance and Support", mobile: 8, web: 7, desktop: 8, tablet: 8 },
    { aspect: "Testing and Quality Assurance", mobile: 9, web: 8, desktop: 7, tablet: 8 },
    { aspect: "Documentation and Support", mobile: 6, web: 8, desktop: 9, tablet: 7 },
  ],
};

// Map data variations to their category keys
const categoryKeys = {
  default: "skill",
  performance: "metric",
  businessMetrics: "department",
  gameStats: "attribute",
  productFeatures: "feature",
  minimal: "category",
  singleMetric: "dimension",
  manyDimensions: "aspect",
} as const;

// Default data for the main story
const radarChartData = dataVariations.default;

const meta: Meta<RadarChartProps<typeof radarChartData>> = {
  title: "Components/Charts/RadarChart",
  component: RadarChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { RadarChart } from '@openuidev/react-ui/Charts/RadarChart';

// Basic implementation
<RadarChart
  data={yourData}
  categoryKey="category"
  variant="line"
/>

// With custom colors
<RadarChart
  data={yourData}
  categoryKey="category"
  customPalette={["#FF6B6B", "#4ECDC4", "#45B7D1"]}
  variant="line"
/>
\`\`\`

## Data Structure Requirements

Your data should be an array of objects where each object contains:
- A **category field** (string): Used for the radar's axes (e.g., 'skill', 'metric').
- One or more **value fields** (number): Each numeric key represents a data series to be plotted.

\`\`\`tsx
const exampleData = [
  { skill: "JavaScript", team_a: 90, team_b: 75 },
  { skill: "React", team_a: 85, team_b: 95 },
  { skill: "Node.js", team_a: 80, team_b: 70 },
];
\`\`\`

## Key Features

- **Multiple Data Series**: Compare several datasets on the same chart.
- **Two Visual Variants**: Choose between 'line' and 'area' styles.
- **Customizable Appearance**: Control colors and area opacity.
- **Custom Color Palettes**: Use the ThemeProvider's chart palette or provide your own custom colors.
- **Interactive Legend**: Toggle visibility of data series.
- **Icon Support**: Add custom icons to legend items for better visual identification.
- **Animation**: Smooth animations for loading and data transitions.
`,
      },
    },
  },
  tags: ["dev", "autodocs"],
  argTypes: {
    data: {
      description: `
**Required.** An array of data objects. Each object represents a point on the radar axes and should contain:
- A category identifier (string).
- One or more numeric values, where each key represents a data series.

**Best Practices:**
- Use 3-8 axes (categories) for optimal readability.
- Keep data series count low (2-4) to avoid clutter.
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
**Required.** The key in your data objects that corresponds to the radar axis labels.

**Examples:**
- "skill" for a skills assessment chart.
- "metric" for a performance comparison chart.
`,
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
      description: `
**Chart Style Variant:**

- **line**: Displays only the outlines of the data series. Best for comparing multiple series without obstruction.
- **area**: Fills the area covered by each data series. Good for showing the magnitude of values.
`,
      control: "radio",
      options: ["line", "area"],
      table: {
        defaultValue: { summary: "line" },
        category: "🎨 Visual Styling",
      },
    },
    grid: {
      description: `
**Grid Visibility.** Toggles the display of the background polar grid.

**When to use:**
- To help estimate values along the axes.
- For a more technical, data-driven look.
`,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    legend: {
      description: `
**Legend Visibility.** Controls whether the legend is displayed.

**When to disable:**
- When charting a single data series.
- For minimal, clean dashboard widgets.
`,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    areaOpacity: {
      description: `
**Area Fill Opacity.** Controls the transparency of the filled areas when \`variant\` is 'area'.

**Tip:** Use lower opacity (e.g., 0.2-0.5) when displaying multiple overlapping area series.
`,
      control: { type: "range", min: 0, max: 1, step: 0.1 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0.5" },
        category: "🎨 Visual Styling",
      },
    },
    icons: {
      description: `
An object mapping data keys to React components to display as icons in the legend.

**Example:**
\`\`\`jsx
import { Shield, Target } from 'lucide-react';

const icons = {
  team_a: Shield,
  team_b: Target,
};
\`\`\`
`,
      control: false,
      table: {
        type: { summary: "Record<string, React.ComponentType>" },
        defaultValue: { summary: "{}" },
        category: "🎨 Visual Styling",
      },
    },
    isAnimationActive: {
      description: `
**Animation Control.** Enables or disables chart animations on load and update.

**Performance note:** Disable for highly complex charts or in performance-critical applications.
`,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "🎬 Animation & Interaction",
      },
    },
    height: {
      description: "The height of the chart.",
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
  },
} satisfies Meta<typeof RadarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultConfiguration: Story = {
  name: "📊 Default Configuration",
  args: {
    data: dataVariations.performance,
    categoryKey: "metric",
    variant: "line",
    grid: true,
    legend: true,
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", height: "auto", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
          Team Performance Analysis
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Comparing key performance indicators across three teams.
        </p>
      </div>
      <RadarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
This is the recommended starting configuration for most use cases. The chart displays multiple data series in a clear, professional manner.

**Configuration Details:**
- **Data**: Team performance metrics.
- **Variant**: 'line' for clear comparison between series.
- **Colors**: The ThemeProvider's chart palette.
- **Legend**: Enabled to identify data series.
- **Animations**: Enabled for smooth interactions.
        `,
      },
    },
  },
};

export const SkillsAssessment: Story = {
  name: "📚 Skills Assessment",
  args: {
    data: dataVariations.default,
    categoryKey: "skill",
    variant: "area",
    grid: true,
    legend: true,
    areaOpacity: 0.4,
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", height: "auto", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
          Developer Skill Levels
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Visualizing proficiency across different programming skills for various experience levels.
        </p>
      </div>
      <RadarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This example uses the 'area' variant to represent different skill levels. The transparency allows for easy comparison of overlapping areas, providing a clear view of strengths and weaknesses across different roles.",
      },
    },
  },
};

export const TeamPerformance: Story = {
  name: "🏆 Team Performance with Icons",
  args: {
    data: dataVariations.performance,
    categoryKey: "metric",
    variant: "line",
    grid: true,
    legend: true,
    isAnimationActive: true,
    icons: {
      team_a: Shield,
      team_b: Target,
      team_c: Star,
    },
  },
  render: (args: any) => (
    <Card style={{ width: "500px", height: "auto", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
          Team Performance Comparison
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Utilizing custom icons to distinguish teams in the legend for improved clarity.
        </p>
      </div>
      <RadarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This chart demonstrates how to enhance the legend with custom icons. It's an effective way to visually associate data series with specific entities, like teams or products.",
      },
    },
  },
};

export const BusinessMetrics: Story = {
  name: "📈 Quarterly Business Metrics",
  args: {
    data: dataVariations.businessMetrics,
    categoryKey: "department",
    variant: "area",
    grid: true,
    legend: true,
    areaOpacity: 0.4,
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", height: "auto", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
          Quarterly Performance Review
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Tracking key business metrics across departments over four quarters.
        </p>
      </div>
      <RadarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A comprehensive view of business performance, this example showcases how the 'area' variant can effectively display multiple overlapping datasets to reveal trends and patterns over time.",
      },
    },
  },
};

export const InteractivePlayground: Story = {
  name: "🧪 Interactive Playground",
  args: {
    variant: "line",
    grid: true,
    legend: true,
    areaOpacity: 0.5,
    isAnimationActive: true,
  },
  render: (args: any) => {
    const [selectedDataType, setSelectedDataType] =
      useState<keyof typeof dataVariations>("default");

    const currentData = dataVariations[selectedDataType];
    const currentCategoryKey = categoryKeys[selectedDataType];

    const buttonStyle: React.CSSProperties = {
      margin: "2px",
      padding: "6px 12px",
      fontSize: "12px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      cursor: "pointer",
      background: "#fff",
      color: "#333",
      fontFamily: "monospace",
      transition: "all 0.2s",
    };

    const activeButtonStyle: React.CSSProperties = {
      ...buttonStyle,
      background: "#3b82f6",
      color: "white",
      border: "1px solid #3b82f6",
      fontWeight: 600,
    };

    return (
      <div style={{ width: "700px" }}>
        <Card style={{ padding: "20px", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
            🕸️ Radar Chart Test Suite
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {(Object.keys(dataVariations) as Array<keyof typeof dataVariations>).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedDataType(key)}
                style={selectedDataType === key ? activeButtonStyle : buttonStyle}
              >
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
              </button>
            ))}
          </div>
          <div style={{ marginTop: "12px", fontSize: "12px", color: "#666" }}>
            <strong>Current Dataset:</strong> {selectedDataType} | <strong>Axes:</strong>{" "}
            {currentData.length} | <strong>Category Key:</strong> {currentCategoryKey}
          </div>
        </Card>
        <Card
          style={{
            height: "400px",
            padding: "24px",
            resize: "both",
            overflow: "hidden",
            minWidth: "400px",
            minHeight: "400px",
          }}
        >
          <RadarChart {...args} data={currentData} categoryKey={currentCategoryKey} />
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Use the buttons to switch between different datasets and explore how the RadarChart adapts.
You can also use the Storybook controls to change variant and other properties in real-time.
This playground is designed for testing various configurations and edge cases.
`,
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
    data: dataVariations.productFeatures,
    categoryKey: "metric",
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
    variant: "area",
    grid: true,
    legend: true,
    isAnimationActive: true,
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
          This radar chart uses a custom color palette instead of the default theme colors.
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
      <Card style={{ width: "500px", height: "auto", padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
            Team Performance with Custom Colors
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Using custom brand colors to match your application's design system.
          </p>
        </div>
        <RadarChart {...args} />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates how to use the `customPalette` prop to provide your own color scheme for the radar chart. When `customPalette` is provided, it overrides the ThemeProvider\'s chart palette and uses your specified colors instead.\n\n**Key Features:**\n- 🎨 **Custom Colors**: Override the default chart colors with your own palette\n- 📊 **Consistent Distribution**: Colors are distributed evenly across data series\n- 🎯 **Brand Matching**: Perfect for matching your application\'s brand colors\n\n**Usage:**\n```tsx\n<RadarChart\n  data={data}\n  categoryKey="metric"\n  customPalette={["#FF6B6B", "#4ECDC4", "#45B7D1"]}\n/>\n```',
      },
    },
  },
};
