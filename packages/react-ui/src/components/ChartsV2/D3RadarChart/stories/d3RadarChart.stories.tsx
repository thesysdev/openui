import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { D3RadarChart } from "../D3RadarChart";
import type { D3RadarChartProps } from "../types";

const playerData = [
  { attribute: "Speed", playerA: 75, playerB: 60, playerC: 85 },
  { attribute: "Power", playerA: 80, playerB: 72, playerC: 78 },
  { attribute: "Defense", playerA: 65, playerB: 88, playerC: 70 },
  { attribute: "Stamina", playerA: 90, playerB: 75, playerC: 82 },
  { attribute: "Technique", playerA: 70, playerB: 85, playerC: 68 },
  { attribute: "Agility", playerA: 88, playerB: 65, playerC: 90 },
];

const singleSeriesData = [
  { skill: "HTML", level: 90 },
  { skill: "CSS", level: 85 },
  { skill: "JavaScript", level: 78 },
  { skill: "TypeScript", level: 72 },
  { skill: "React", level: 88 },
  { skill: "Node.js", level: 65 },
  { skill: "SQL", level: 60 },
  { skill: "DevOps", level: 45 },
];

const manySeriesData = [
  { metric: "A", s1: 80, s2: 65, s3: 72, s4: 90, s5: 55 },
  { metric: "B", s1: 70, s2: 85, s3: 60, s4: 75, s5: 88 },
  { metric: "C", s1: 90, s2: 50, s3: 82, s4: 68, s5: 72 },
  { metric: "D", s1: 65, s2: 78, s3: 90, s4: 55, s5: 80 },
  { metric: "E", s1: 75, s2: 70, s3: 68, s4: 85, s5: 62 },
];

const meta: Meta<D3RadarChartProps<typeof playerData>> = {
  title: "Components/ChartsV2/D3RadarChart",
  component: D3RadarChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "!dev"],
  argTypes: {
    theme: {
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
    },
    gridShape: {
      control: "radio",
      options: ["polygon", "circle"],
    },
    gridLevels: { control: { type: "range", min: 2, max: 10, step: 1 } },
    grid: { control: "boolean" },
    legend: { control: "boolean" },
    isAnimationActive: { control: "boolean" },
    showDots: { control: "boolean" },
    dotRadius: { control: { type: "range", min: 1, max: 10, step: 1 } },
    fillOpacity: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
  },
} satisfies Meta<typeof D3RadarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DataExplorer: Story = {
  name: "Data Explorer",
  args: {
    data: playerData,
    categoryKey: "attribute",
    theme: "ocean",
    gridShape: "polygon",
    gridLevels: 5,
    grid: true,
    legend: true,
    isAnimationActive: true,
    showDots: true,
    dotRadius: 4,
    fillOpacity: 0.15,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <D3RadarChart {...args} />
    </Card>
  ),
};

export const GridShapes: Story = {
  name: "Grid Shapes",
  render: () => (
    <div style={{ display: "flex", gap: "24px" }}>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Polygon Grid</h4>
        <Card style={{ width: "350px", padding: "16px" }}>
          <D3RadarChart
            data={playerData}
            categoryKey="attribute"
            theme="ocean"
            gridShape="polygon"
          />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Circle Grid</h4>
        <Card style={{ width: "350px", padding: "16px" }}>
          <D3RadarChart
            data={playerData}
            categoryKey="attribute"
            theme="ocean"
            gridShape="circle"
          />
        </Card>
      </div>
    </div>
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
              <D3RadarChart
                data={playerData}
                categoryKey="attribute"
                theme={t}
                legend={false}
              />
            </Card>
          </div>
        ))}
      </div>
    );
  },
};

export const SingleSeries: Story = {
  name: "Single Series",
  render: () => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <D3RadarChart
        data={singleSeriesData}
        categoryKey="skill"
        theme="emerald"
        fillOpacity={0.25}
      />
    </Card>
  ),
};

export const ManySeries: Story = {
  name: "Many Series",
  render: () => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <D3RadarChart
        data={manySeriesData}
        categoryKey="metric"
        theme="spectrum"
        fillOpacity={0.1}
      />
    </Card>
  ),
};

export const FillOpacity: Story = {
  name: "Fill Opacity Comparison",
  render: () => (
    <div style={{ display: "flex", gap: "24px" }}>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>opacity: 0.05</h4>
        <Card style={{ width: "300px", padding: "16px" }}>
          <D3RadarChart
            data={playerData}
            categoryKey="attribute"
            theme="orchid"
            fillOpacity={0.05}
            legend={false}
          />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>opacity: 0.3</h4>
        <Card style={{ width: "300px", padding: "16px" }}>
          <D3RadarChart
            data={playerData}
            categoryKey="attribute"
            theme="orchid"
            fillOpacity={0.3}
            legend={false}
          />
        </Card>
      </div>
    </div>
  ),
};

export const FixedDimensions: Story = {
  name: "Fixed Dimensions",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;300&#125; height=&#123;300&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3RadarChart
            data={playerData}
            categoryKey="attribute"
            theme="ocean"
            width={300}
            height={300}
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;500&#125; height=&#123;500&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3RadarChart
            data={playerData}
            categoryKey="attribute"
            theme="sunset"
            width={500}
            height={500}
            gridShape="circle"
          />
        </Card>
      </div>
    </div>
  ),
};
