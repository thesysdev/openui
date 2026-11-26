import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { useEffect, type ReactNode } from "react";
import { LiveArtifactRenderer } from "../../CloudArtifact/ArtifactRenderer";
import { useArtifactProvenance } from "../../CloudArtifact/contexts";
import type { DataSourcesContentsProps } from "../types";
import { dashboardLibrary, describeSource, fullFlowProgram, interpreter } from "./fixtures";

// ── Slowed motion, for reviewing the transitions ──

/** Plays every CSS transition and animation on the page at `rate` of its speed while mounted. */
function SlowMotion({ rate }: { rate: number }) {
  useEffect(() => {
    if (rate === 1) return;
    const slow = () => {
      for (const animation of document.getAnimations()) {
        if (animation.playbackRate !== rate) animation.playbackRate = rate;
      }
    };
    document.addEventListener("transitionrun", slow, true);
    document.addEventListener("animationstart", slow, true);
    return () => {
      document.removeEventListener("transitionrun", slow, true);
      document.removeEventListener("animationstart", slow, true);
    };
  }, [rate]);
  return null;
}

interface MotionArgs {
  /** Plays the popover, menu, split button and outline transitions at a fifth of their speed. */
  slowMotion?: boolean;
}

const withSlowMotion: Decorator<MotionArgs> = (Story, context) => (
  <>
    <SlowMotion rate={context.args.slowMotion ? 0.2 : 1} />
    <Story />
  </>
);

// ── A live dashboard ──

interface DashboardProps extends Pick<DataSourcesContentsProps, "describeSource"> {
  /** What is open when it mounts: inspect mode, or the All sources menu. */
  start?: "inspect" | "menu";
  /** Your own contents, as `Provenance` children. */
  children?: ReactNode;
}

/** Turns inspect mode on, or opens the All sources menu, once the dashboard has mounted. */
function Start({ start }: { start: DashboardProps["start"] }) {
  const { setInspecting, openAllSources } = useArtifactProvenance();
  useEffect(() => {
    // After the queries' first results, so the menu lists what the dashboard renders.
    const timer = setTimeout(() => {
      if (start === "inspect") setInspecting(true);
      if (start === "menu") openAllSources();
    }, 400);
    return () => clearTimeout(timer);
  }, [start, setInspecting, openAllSources]);
  return null;
}

/**
 * The sample dashboard, live, with the Sources split button in its bar: the main half turns
 * inspect mode on and off, and the chevron opens the All sources menu under it.
 */
function Dashboard({ start, describeSource: describe, children }: DashboardProps) {
  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column" }}>
      <LiveArtifactRenderer
        id="demo-full-flow"
        content={fullFlowProgram}
        library={dashboardLibrary}
        interpreter={interpreter}
        preview={false}
        enableProvenance
      >
        <LiveArtifactRenderer.Chrome>
          <Start start={start} />
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
              <LiveArtifactRenderer.Provenance describeSource={describe}>
                {children}
              </LiveArtifactRenderer.Provenance>
            </LiveArtifactRenderer.Content>
          </div>
        </LiveArtifactRenderer.Chrome>
      </LiveArtifactRenderer>
    </div>
  );
}

/**
 * Where a dashboard's data comes from. In a live artifact with `enableProvenance`, the Sources
 * split button's main half puts the dashboard in inspect mode, where a click on an outlined
 * component opens its Sources popover beside it; its chevron opens the All sources menu. Switch
 * light and dark with the toolbar's Theme; turn on `slowMotion` to watch the transitions.
 */
const meta: Meta<DashboardProps & MotionArgs> = {
  title: "Components/Sources",
  parameters: { layout: "fullscreen" },
  args: { slowMotion: false, describeSource },
  argTypes: { slowMotion: { control: "boolean" } },
  decorators: [withSlowMotion],
  render: ({ slowMotion: _slow, ...props }) => <Dashboard {...props} />,
};
export default meta;

type Story = StoryObj<DashboardProps & MotionArgs>;

/**
 * The All sources menu: every query and formula once, with how many items use each. A source
 * opens its Used by, Query or Formula and Result; a Used by link opens that item's popover.
 * Escape steps back from a source to the list, then closes it.
 */
export const AllSources: Story = { args: { start: "menu" } };

/** The menu in the dark theme, carried onto it though it is portaled to `body`. */
export const AllSourcesDark: Story = { args: { start: "menu" }, globals: { mode: "dark" } };

/** Without `describeSource`: plain glyphs, and each tool's own name. */
export const WithoutAppDescriptions: Story = {
  args: { start: "menu", describeSource: undefined },
};

function CustomSources() {
  const { sources } = useArtifactProvenance();
  return (
    <div style={{ padding: 16, color: "var(--openui-text-neutral-primary)" }}>
      Your own list of {Object.keys(sources?.queries ?? {}).length} queries
    </div>
  );
}

/** `Provenance` children: your own contents, inside the menu or popover under its header. */
export const CustomContents: Story = { args: { start: "menu", children: <CustomSources /> } };

/**
 * Inspect mode: Sources is pressed. Every number, table and chart that reads a query has a dotted
 * outline, which turns solid under the pointer; click one, or Tab to it and press Enter, to open
 * its Sources popover beside it. Escape steps back: from a source to the list, closes the
 * popover, then leaves inspect mode.
 */
export const LiveDashboard: Story = { args: { start: "inspect" } };

/** The live dashboard on a phone: no hover; a tap on an outlined item opens its popover. */
export const LiveDashboardPhone: Story = {
  ...LiveDashboard,
  parameters: { viewport: { defaultViewport: "mobile2" } },
};
