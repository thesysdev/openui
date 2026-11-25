import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LiveArtifactRenderer } from "../../CloudArtifact/ArtifactRenderer";
import {
  createPreviewStore,
  createSourcesStore,
  ProvenanceContext,
  useArtifactProvenance,
  type ProvenanceContextValue,
} from "../../CloudArtifact/contexts";
import { Provenance, RegionProvider } from "../../CloudArtifact/slots";
import { SourcesProvider } from "../../CloudArtifact/SourcesDialog";
import type { DataSourcesPanelProps, DataSourcesSelection } from "../types";
import {
  dashboardLibrary,
  dashboardProgram,
  describeSource,
  interpreter,
  sources,
} from "./fixtures";

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
  /** Plays the dialog, sheet, toggle and hover card transitions at a fifth of their speed. */
  slowMotion?: boolean;
}

const withSlowMotion: Decorator<MotionArgs> = (Story, context) => (
  <>
    <SlowMotion rate={context.args.slowMotion ? 0.2 : 1} />
    <Story />
  </>
);

// ── The Sources dialog on the sample sources, without a live dashboard ──

interface DialogStoryProps extends Pick<DataSourcesPanelProps, "describeSource"> {
  /** What was picked: a component, or one of its props. None: the list of every query. */
  initial?: DataSourcesSelection;
  /** Your own contents, as `Provenance` children. */
  children?: ReactNode;
}

/**
 * The real Sources dialog, fed the sample sources as if the renderer were inspecting. Closing it
 * leaves an "Open Sources" button to open it again on the same pick.
 */
function DialogStory({ initial, describeSource: describe, children }: DialogStoryProps) {
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const [picked, setPicked] = useState<DataSourcesSelection | null>(initial ?? null);
  const [isOpen, setOpen] = useState(true);
  const [sourcesStore] = useState(() => {
    const store = createSourcesStore();
    store.set(sources);
    return store;
  });
  const [previewStore] = useState(createPreviewStore);
  const provenance = useMemo<ProvenanceContextValue | null>(
    () =>
      trigger && {
        isInspecting: true,
        // A second Escape leaves inspect mode, which here only closes the dialog.
        setInspecting: (on) => !on && setOpen(false),
        selection: picked && { ...picked, element: trigger },
        clearSelection: () => setPicked(null),
        isOpen,
        openList: () => {
          setPicked(null);
          setOpen(true);
        },
        closeDialog: () => setOpen(false),
        sourcesStore,
        previewStore,
      },
    [trigger, picked, isOpen, sourcesStore, previewStore],
  );
  return (
    <div style={{ minHeight: "100vh", padding: 24, boxSizing: "border-box" }}>
      <button
        ref={setTrigger}
        type="button"
        onClick={() => {
          setPicked(initial ?? null);
          setOpen(true);
        }}
      >
        Open Sources
      </button>
      {provenance && (
        <ProvenanceContext.Provider value={provenance}>
          <SourcesProvider>
            <RegionProvider region="content">
              <Provenance describeSource={describe}>{children}</Provenance>
            </RegionProvider>
          </SourcesProvider>
        </ProvenanceContext.Provider>
      )}
    </div>
  );
}

/**
 * Where a dashboard's data comes from. In a live artifact with `enableProvenance`, Sources puts
 * the dashboard in inspect mode, and a click on a component opens this dialog on it: a centered
 * 560px dialog, a bottom sheet at 639px and below. Its back arrow leads to the list of every
 * query. Switch light and dark with the toolbar's Theme; turn on `slowMotion` to watch the
 * transitions.
 */
const meta: Meta<DialogStoryProps & MotionArgs> = {
  title: "Components/Sources",
  parameters: { layout: "fullscreen" },
  args: { slowMotion: false },
  argTypes: { slowMotion: { control: "boolean" } },
  decorators: [withSlowMotion],
  render: ({ slowMotion: _slow, ...props }) => (
    <DialogStory describeSource={describeSource} {...props} />
  ),
};
export default meta;

type Story = StoryObj<DialogStoryProps & MotionArgs>;

/** Nothing picked, or All queries: every query in the dashboard, in program order. */
export const List: Story = {};

/** A number: Query (open), Result, and the Formula that picks it from the rows (closed). */
export const NumberPicked: Story = { args: { initial: { id: "revenue", prop: "value" } } };

/** A table or chart: Query, and its Result open. */
export const TablePicked: Story = { args: { initial: { id: "daily" } } };

/** A computed value with no query behind it: only its Formula. */
export const Computed: Story = { args: { initial: { id: "margin", prop: "value" } } };

/** A container: its children's Query and Result rows, each named by its query. */
export const ContainerPicked: Story = { args: { initial: { id: "kpiRow", prop: "children" } } };

/** A script, named by the app: its call as the Query, then its Result. */
export const Script: Story = { args: { initial: { id: "target" } } };

/** The number in the dark theme, carried onto the dialog though it is portaled to `body`. */
export const NumberDark: Story = {
  args: { initial: { id: "revenue", prop: "value" } },
  globals: { mode: "dark" },
};

/** On a phone: the same dialog as a bottom sheet over a dimmed page, every control 44px. */
export const PhoneSheet: Story = {
  args: { initial: { id: "daily" } },
  parameters: { viewport: { defaultViewport: "mobile2" } },
};

/** Written in the program: the Formula is the value as written. */
export const WrittenInProgram: Story = { args: { initial: { id: "goal", prop: "value" } } };

/** Without `describeSource`: plain glyphs, and each tool's own name. */
export const WithoutAppDescriptions: Story = { args: { describeSource: undefined } };

function CustomSources() {
  const { selection, sources } = useArtifactProvenance();
  const component = selection && sources?.components[selection.id];
  const shown = component && selection.prop ? component.props[selection.prop] : component;
  return (
    <div style={{ padding: 16, color: "var(--openui-text-neutral-primary)" }}>
      {shown ? `Reads ${shown.queries.join(", ") || "no queries"}` : "Your own list"}
    </div>
  );
}

/** `Provenance` children: your own contents, inside the dialog under its title, back and close. */
export const CustomContents: Story = {
  args: { initial: { id: "revenue", prop: "value" }, children: <CustomSources /> },
};

// ── In a live artifact ──

/** Turns inspect mode on when the dashboard mounts. */
function StartInspecting() {
  const { setInspecting } = useArtifactProvenance();
  useEffect(() => setInspecting(true), [setInspecting]);
  return null;
}

/**
 * A live dashboard in inspect mode: Sources is pressed, and All queries sits beside it. Hover a
 * number, table or chart for its outline and, after a moment, its hover card; click it to open
 * the dialog. Escape closes the dialog, then leaves inspect mode.
 */
export const LiveDashboard: StoryObj<MotionArgs> = {
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
        <StartInspecting />
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

/** The live dashboard on a phone: no hover; a tap in inspect mode opens the bottom sheet. */
export const LiveDashboardPhone: StoryObj<MotionArgs> = {
  ...LiveDashboard,
  parameters: { viewport: { defaultViewport: "mobile2" } },
};
