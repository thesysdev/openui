import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { LiveArtifactRenderer } from "../../CloudArtifact/ArtifactRenderer";
import { DataSourcesPanel } from "../DataSourcesPanel";
import type { DataSourcesPanelProps, DataSourcesSelection } from "../types";
import {
  dashboardLibrary,
  dashboardProgram,
  describeSource,
  interpreter,
  sources,
} from "./fixtures";

/**
 * Where a dashboard's data comes from. With nothing selected it lists every query; a selected
 * component or prop shows its Query and Result, or its Formula when it reads no query. In a live artifact with
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

/** The panel with its selection kept in state, so Back works. */
function Interactive(props: Partial<DataSourcesPanelProps> & { initial?: DataSourcesSelection }) {
  const [selection, setSelection] = useState<DataSourcesSelection | null>(props.initial ?? null);
  return (
    <DataSourcesPanel
      sources={sources}
      describeSource={describeSource}
      {...props}
      selection={selection}
      onBack={() => setSelection(null)}
      onClose={() => setSelection(null)}
    />
  );
}

/** Nothing selected: every query in the dashboard, in program order. */
export const EveryQuery: Story = { render: () => <Interactive /> };

/** A number: Query (open) and Result. */
export const NumberPicked: Story = {
  render: () => <Interactive initial={{ id: "revenue", prop: "value" }} />,
};

/** A table or chart: Query, and its Result open. */
export const TablePicked: Story = { render: () => <Interactive initial={{ id: "daily" }} /> };

/** No query behind it: its Formula. */
export const Computed: Story = {
  render: () => <Interactive initial={{ id: "margin", prop: "value" }} />,
};

/** Written in the program: the Formula is the value as written. */
export const WrittenInProgram: Story = {
  render: () => <Interactive initial={{ id: "goal", prop: "value" }} />,
};

/** A container: its children's Query and Result rows, each named by its query. */
export const ContainerPicked: Story = {
  render: () => <Interactive initial={{ id: "kpiRow", prop: "children" }} />,
};

/** A script, named by the app: its call as the Query, then its Result. */
export const ScriptSource: Story = { render: () => <Interactive initial={{ id: "target" }} /> };

/** Without `describeSource`: plain glyphs, and each tool's own name. */
export const WithoutAppDescriptions: Story = {
  render: () => <Interactive describeSource={undefined} />,
};

/**
 * In a live artifact: Sources in the bar opens the panel; click a number or a table to see where
 * its data comes from. With Sources off, clicking a number offers "See source".
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
              minHeight: 44,
              padding: "6px 12px",
              boxSizing: "border-box",
              borderBottom: "1px solid var(--openui-border-default)",
              font: "var(--openui-text-body-default-heavy)",
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
            <LiveArtifactRenderer.Provenance describeSource={describeSource} />
          </LiveArtifactRenderer.Content>
        </div>
      </LiveArtifactRenderer.Chrome>
    </LiveArtifactRenderer>
  ),
};
