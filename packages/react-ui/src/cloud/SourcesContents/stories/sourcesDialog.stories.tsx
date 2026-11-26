import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LiveArtifactRenderer } from "../../CloudArtifact/ArtifactRenderer";
import {
  createSourcesStore,
  ProvenanceContext,
  useArtifactProvenance,
  type ProvenanceContextValue,
} from "../../CloudArtifact/contexts";
import { Provenance, RegionProvider } from "../../CloudArtifact/slots";
import { SourcesProvider } from "../../CloudArtifact/SourcesDialog";
import type { DataSourcesContentsProps } from "../types";
import {
  dashboardLibrary,
  describeSource,
  fullFlowProgram,
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
  /** Plays the dialog, sheet, toggle and outline transitions at a fifth of their speed. */
  slowMotion?: boolean;
}

const withSlowMotion: Decorator<MotionArgs> = (Story, context) => (
  <>
    <SlowMotion rate={context.args.slowMotion ? 0.2 : 1} />
    <Story />
  </>
);

// ── The Sources dialog on the sample sources, without a live dashboard ──

interface DialogStoryProps extends Pick<DataSourcesContentsProps, "describeSource"> {
  /** Your own contents, as `Provenance` children. */
  children?: ReactNode;
}

/**
 * The real Sources dialog of every query, fed the sample sources as if the renderer were
 * inspecting. Closing it leaves an "Open Sources" button to open it again. (An item's sources open
 * in its popover: see the live dashboards below.)
 */
function DialogStory({ describeSource: describe, children }: DialogStoryProps) {
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const [isOpen, setOpen] = useState(true);
  const [sourcesStore] = useState(() => {
    const store = createSourcesStore();
    store.set(sources);
    return store;
  });
  const provenance = useMemo<ProvenanceContextValue | null>(
    () =>
      trigger && {
        isInspecting: true,
        // A second Escape leaves inspect mode, which here only closes the dialog.
        setInspecting: (on) => !on && setOpen(false),
        selection: null,
        clearSelection: () => {},
        isSourcesOpen: isOpen,
        openList: () => setOpen(true),
        internal: {
          sourcesStore,
          closeDialog: () => setOpen(false),
          // No toggle here: the "Open Sources" button stands in for it.
          focusToggle: () => trigger.focus(),
          popover: null,
          setPopoverSource: () => {},
          closePopover: () => {},
        },
      },
    [trigger, isOpen, sourcesStore],
  );
  return (
    <div style={{ minHeight: "100vh", padding: 24, boxSizing: "border-box" }}>
      <button ref={setTrigger} type="button" onClick={() => setOpen(true)}>
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

/** The list in the dark theme, carried onto the dialog though it is portaled to `body`. */
export const ListDark: Story = { globals: { mode: "dark" } };

/** On a phone: the same dialog as a bottom sheet over a dimmed page, every control 44px. */
export const PhoneSheet: Story = {
  parameters: { viewport: { defaultViewport: "mobile2" } },
};

/** Without `describeSource`: plain glyphs, and each tool's own name. */
export const WithoutAppDescriptions: Story = { args: { describeSource: undefined } };

function CustomSources() {
  const { sources } = useArtifactProvenance();
  return (
    <div style={{ padding: 16, color: "var(--openui-text-neutral-primary)" }}>
      Your own list of {Object.keys(sources?.queries ?? {}).length} queries
    </div>
  );
}

/** `Provenance` children: your own contents, inside the dialog under its title and close. */
export const CustomContents: Story = { args: { children: <CustomSources /> } };

// ── In a live artifact ──

/** Turns inspect mode on when the dashboard mounts. */
function StartInspecting() {
  const { setInspecting } = useArtifactProvenance();
  useEffect(() => setInspecting(true), [setInspecting]);
  return null;
}

/**
 * A live dashboard in inspect mode: Sources is pressed, and All queries sits beside it. Every
 * number, table and chart that reads a query has a dotted outline, which turns solid under the
 * pointer; click one, or Tab to it and press Enter, to open its Sources popover beside it. Escape
 * steps back: from a source to the list, closes the popover, then leaves inspect mode.
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
      id="demo-full-flow"
      content={fullFlowProgram}
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

/** The live dashboard on a phone: no hover; a tap on an outlined item opens its popover. */
export const LiveDashboardPhone: StoryObj<MotionArgs> = {
  ...LiveDashboard,
  parameters: { viewport: { defaultViewport: "mobile2" } },
};
