import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { D3ScatterChart } from "../D3ScatterChart";
import type { D3ScatterChartData, D3ScatterChartProps } from "../types";

const performanceData: D3ScatterChartData = [
  {
    name: "Team A",
    data: [
      { x: 10, y: 30 },
      { x: 20, y: 45 },
      { x: 35, y: 65 },
      { x: 50, y: 55 },
      { x: 65, y: 80 },
      { x: 80, y: 72 },
      { x: 90, y: 88 },
    ],
  },
  {
    name: "Team B",
    data: [
      { x: 15, y: 55 },
      { x: 25, y: 40 },
      { x: 40, y: 70 },
      { x: 55, y: 48 },
      { x: 70, y: 62 },
      { x: 85, y: 90 },
    ],
  },
  {
    name: "Team C",
    data: [
      { x: 12, y: 20 },
      { x: 28, y: 35 },
      { x: 42, y: 50 },
      { x: 58, y: 42 },
      { x: 72, y: 58 },
      { x: 88, y: 68 },
      { x: 95, y: 75 },
    ],
  },
];

const singleDataset: D3ScatterChartData = [
  {
    name: "Measurements",
    data: [
      { x: 1, y: 2.5 },
      { x: 2, y: 4.1 },
      { x: 3, y: 3.8 },
      { x: 4, y: 6.2 },
      { x: 5, y: 5.9 },
      { x: 6, y: 7.4 },
      { x: 7, y: 8.1 },
      { x: 8, y: 7.8 },
      { x: 9, y: 9.5 },
      { x: 10, y: 10.2 },
    ],
  },
];

const meta: Meta<D3ScatterChartProps> = {
  title: "Components/ChartsV2/D3ScatterChart",
  component: D3ScatterChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "!dev"],
  argTypes: {
    theme: {
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
    },
    grid: { control: "boolean" },
    verticalGrid: { control: "boolean" },
    legend: { control: "boolean" },
    showYAxis: { control: "boolean" },
    isAnimationActive: { control: "boolean" },
    dotRadius: { control: { type: "range", min: 1, max: 10, step: 1 } },
  },
} satisfies Meta<typeof D3ScatterChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DataExplorer: Story = {
  name: "Data Explorer",
  args: {
    data: performanceData,
    theme: "ocean",
    grid: true,
    verticalGrid: true,
    legend: true,
    showYAxis: true,
    isAnimationActive: true,
    dotRadius: 4,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <D3ScatterChart {...args} />
    </Card>
  ),
};

export const MultipleDatasets: Story = {
  name: "Multiple Datasets",
  render: () => (
    <Card style={{ width: "600px", padding: "16px" }}>
      <D3ScatterChart data={performanceData} theme="spectrum" />
    </Card>
  ),
};

export const SingleDataset: Story = {
  name: "Single Dataset",
  render: () => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <D3ScatterChart data={singleDataset} theme="emerald" />
    </Card>
  ),
};

export const ThemeShowcase: Story = {
  name: "Theme Showcase",
  render: () => {
    const themes = ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"] as const;
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          width: "900px",
        }}
      >
        {themes.map((t) => (
          <div key={t}>
            <h4 style={{ textAlign: "center", marginBottom: "8px", textTransform: "capitalize" }}>
              {t}
            </h4>
            <Card style={{ padding: "12px" }}>
              <D3ScatterChart data={performanceData} theme={t} legend={false} />
            </Card>
          </div>
        ))}
      </div>
    );
  },
};

export const GridOptions: Story = {
  name: "Grid Options",
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "16px",
        width: "700px",
      }}
    >
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Both Grids</h4>
        <Card style={{ padding: "12px" }}>
          <D3ScatterChart
            data={performanceData}
            theme="ocean"
            grid={true}
            verticalGrid={true}
            legend={false}
          />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Horizontal Only</h4>
        <Card style={{ padding: "12px" }}>
          <D3ScatterChart
            data={performanceData}
            theme="ocean"
            grid={true}
            verticalGrid={false}
            legend={false}
          />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Vertical Only</h4>
        <Card style={{ padding: "12px" }}>
          <D3ScatterChart
            data={performanceData}
            theme="ocean"
            grid={false}
            verticalGrid={true}
            legend={false}
          />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>No Grid</h4>
        <Card style={{ padding: "12px" }}>
          <D3ScatterChart
            data={performanceData}
            theme="ocean"
            grid={false}
            verticalGrid={false}
            legend={false}
          />
        </Card>
      </div>
    </div>
  ),
};

export const AxisLabels: Story = {
  name: "Axis Labels",
  render: () => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <D3ScatterChart
        data={performanceData}
        theme="orchid"
        xAxisLabel="Time (seconds)"
        yAxisLabel="Score"
      />
    </Card>
  ),
};

export const FixedDimensions: Story = {
  name: "Fixed Dimensions",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;400&#125; height=&#123;300&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3ScatterChart
            data={performanceData}
            theme="ocean"
            width={400}
            height={300}
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;600&#125; height=&#123;400&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3ScatterChart
            data={performanceData}
            theme="sunset"
            width={600}
            height={400}
          />
        </Card>
      </div>
    </div>
  ),
};
