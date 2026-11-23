import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { LiveArtifactRenderer } from "../../CloudArtifact/ArtifactRenderer";
import { DataSourcesPanel } from "../DataSourcesPanel";
import type { DataSourcesPanelProps, DataSourcesSelection } from "../types";
import {
  components,
  dashboardLibrary,
  dashboardProgram,
  describeSource,
  interpreter,
  queries,
  runCall,
  scriptInputs,
  sourcesFor,
} from "./fixtures";

/**
 * Where a dashboard's data comes from. With nothing selected it lists every source; a selected
 * number, chart or table shows its source, query and data. In a live artifact with
 * `enableProvenance` it is the `Provenance` slot's default panel.
 */
const meta: Meta<typeof DataSourcesPanel> = {
  title: "Components/DataSourcesPanel",
  component: DataSourcesPanel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ height: 760, display: "flex", justifyContent: "flex-end" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof DataSourcesPanel>;

/** The panel with its selection kept in state, so "Also used by" and Back work. */
function Interactive(props: Partial<DataSourcesPanelProps> & { initial?: DataSourcesSelection }) {
  const [selection, setSelection] = useState<DataSourcesSelection | null>(props.initial ?? null);
  return (
    <DataSourcesPanel
      queries={queries}
      components={components}
      describeSource={describeSource}
      scriptInputs={scriptInputs}
      runCall={runCall}
      {...props}
      selection={selection}
      sources={selection ? (sourcesFor[selection.id] ?? null) : null}
      onSelect={(id) => setSelection({ id })}
      onClearSelection={() => setSelection(null)}
      onClose={() => setSelection(null)}
    />
  );
}

/** Nothing selected: every source in the dashboard, searchable. */
export const SourceList: Story = { render: () => <Interactive /> };

/** A number: its source is the heading, then its query, result and other uses. */
export const NumberPicked: Story = {
  render: () => <Interactive initial={{ id: "revenue", prop: "value", value: "$184,920" }} />,
};

/** A chart or table: its source opens with a preview of the data. */
export const ChartPicked: Story = { render: () => <Interactive initial={{ id: "daily" }} /> };

/** A request rather than SQL, named by the app (GA4). */
export const RequestSource: Story = { render: () => <Interactive initial={{ id: "channels" }} /> };

/** A script: the calls it made, each opening its own data. */
export const ScriptSource: Story = { render: () => <Interactive initial={{ id: "target" }} /> };

/** Computed in the program, from no data source: its formula. */
export const Computed: Story = {
  render: () => <Interactive initial={{ id: "margin", prop: "value", value: "38.6%" }} />,
};

/** Read from two sources: both listed. */
export const SeveralSources: Story = {
  render: () => (
    <Interactive
      components={[
        ...components,
        {
          id: "both",
          label: "Revenue per session",
          typeName: "Kpi",
          queries: ["revenueQ", "channelsQ"],
        },
      ]}
      initial={{ id: "both", prop: undefined, value: "$3.84" }}
    />
  ),
};

/** Without `describeSource`: plain glyphs and the tools' own names. */
export const WithoutAppDescriptions: Story = {
  render: () => (
    <Interactive
      describeSource={undefined}
      scriptInputs={undefined}
      runCall={undefined}
      initial={{ id: "daily" }}
    />
  ),
};

/**
 * In a live artifact: turn on Sources in the bar to frame what can be traced, hover for its
 * source, click to see it. With Sources off, clicking a number offers "See source".
 */
export const LiveDashboard: StoryObj = {
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column" }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <LiveArtifactRenderer
      id="demo-retail"
      content={dashboardProgram}
      library={dashboardLibrary}
      interpreter={interpreter}
      preview={false}
      enableProvenance
    >
      <LiveArtifactRenderer.Chrome>
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 48,
              padding: "0 12px 0 20px",
              borderBottom: "1px solid var(--openui-border-default)",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--openui-text-neutral-primary)",
            }}
          >
            <span style={{ flex: 1 }}>Retail overview</span>
            <LiveArtifactRenderer.ChromeLoader />
            <LiveArtifactRenderer.ProvenanceToggle />
          </div>
          <LiveArtifactRenderer.Content>
            <LiveArtifactRenderer.Loading />
            <LiveArtifactRenderer.Error />
            <LiveArtifactRenderer.Provenance
              describeSource={describeSource}
              scriptInputs={scriptInputs}
              runCall={runCall}
            />
          </LiveArtifactRenderer.Content>
        </div>
      </LiveArtifactRenderer.Chrome>
    </LiveArtifactRenderer>
  ),
};
