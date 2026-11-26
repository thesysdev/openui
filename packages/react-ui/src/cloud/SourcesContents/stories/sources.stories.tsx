import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { expect, fireEvent, userEvent, waitFor, within } from "@storybook/test";
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
  /** Your own contents, as `Provenance` children. */
  children?: ReactNode;
}

/**
 * The sample dashboard, live, with the Sources split button in its bar: the main half turns
 * inspect mode on and off, and the chevron opens the All sources menu under it.
 */
function Dashboard({ describeSource: describe, children }: DashboardProps) {
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

// ── Getting to each state, as a viewer would ──

/** The popover and the menu are portaled to `body`, outside the story's canvas. */
const page = () => within(document.body);

/** Long enough for the sample queries (300ms) and a transition. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 400));

/** An outlined component in the dashboard, by its label. */
async function handle(label: string) {
  const heading = await page().findByRole("heading", { name: "Retail overview" });
  return within(heading.parentElement!).findByRole("button", { name: label });
}

/** Presses the main half of Sources, once the queries' first results are in. */
async function inspect() {
  await settle();
  await userEvent.click(page().getByRole("button", { name: "Sources" }));
  await settle();
}

/** Turns inspect mode on and clicks a component, opening its Sources popover. */
async function openItem(label: string) {
  await inspect();
  // A plain click: inspect mode cancels the press's `pointerdown` so the dashboard can't act on
  // it, and Storybook's `userEvent` then sends no click at all, though a browser does.
  await fireEvent.click(await handle(label));
  return page().findByRole("dialog", { name: `Sources for ${label}` });
}

/** Presses the chevron of Sources, opening the All sources menu. */
async function openMenu() {
  await settle();
  await userEvent.click(page().getByRole("button", { name: "All sources" }));
  return page().findByRole("dialog", { name: /^All sources for / });
}

/** Opens a source from a popover's or the menu's list, and waits for its detail. */
async function openSource(surface: HTMLElement, name: string) {
  await userEvent.click(within(surface).getByRole("button", { name: new RegExp(`^${name}`) }));
  const heading = await within(surface).findByRole("heading", { name });
  await waitFor(() => expect(heading).toBeVisible());
}

// ── The Full flow states ──

/** 1. Idle: the dashboard as people read it, with the Sources split button in its bar. */
export const Idle: Story = {};

/**
 * 2. Inspect: the main half of Sources is pressed, and every number, table and chart that reads
 * a query or a formula has a blue dotted outline. Headings, notes and the KPI row's container
 * have none. Tab moves through the outlined components; Escape leaves inspect mode.
 */
export const Inspect: Story = {
  play: async () => {
    await inspect();
    await expect(page().getByRole("button", { name: "Sources" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};

/** 3. Inspect hover: the outline under the pointer turns solid. No card pops up. */
export const InspectHover: Story = {
  play: async () => {
    await inspect();
    const revenue = await handle("Revenue this quarter");
    await userEvent.hover(revenue);
    await expect(revenue).toHaveAttribute("data-openui-hover");
  },
};

/**
 * 4. Item popover: a click on an outlined component opens its Sources popover beside it, grown
 * out of the Sources chip at its corner, on the list of what it reads. The gross margin reads a
 * formula built from two queries. A click outside, or Escape, closes it.
 */
export const ItemPopover: Story = {
  play: async () => {
    const popover = await openItem("Gross margin");
    await waitFor(() =>
      expect(within(popover).getByRole("list", { name: "Sources" })).toBeVisible(),
    );
  },
};

/**
 * 5. Item source detail: a source opened in the popover shows its Query (here SQL) with a copy
 * button, and its Result. The chip turns into All sources, back to the list.
 */
export const ItemSourceDetail: Story = {
  play: async () => {
    const popover = await openItem("Gross margin");
    await openSource(popover, "revenueQ");
  },
};

/**
 * 6. All sources: the chevron of Sources opens a menu under it listing every query and formula
 * once, with how many items use each. A click outside, its close button or Escape closes it.
 */
export const AllSources: Story = {
  play: async () => {
    const menu = await openMenu();
    await waitFor(() => expect(within(menu).getByRole("list", { name: "Sources" })).toBeVisible());
  },
};

/**
 * 7. Source detail: a source opened in the menu shows the items that read it under Used by, its
 * Query or Formula and its Result. A Used by link opens that item's popover on this source.
 */
export const SourceDetail: Story = {
  play: async () => {
    const menu = await openMenu();
    await openSource(menu, "revenueQ");
    await waitFor(() => expect(within(menu).getByRole("list", { name: "Used by" })).toBeVisible());
  },
};

/**
 * On a phone: Sources turns on the same outlines, and a tap on one opens its sources in a bottom
 * sheet, with the same list, detail and back. The All sources menu opens in the sheet too.
 */
export const LiveDashboardPhone: Story = {
  parameters: { viewport: { defaultViewport: "mobile2" } },
  play: async () => {
    await openItem("Gross margin");
  },
};

// ── Variations ──

/** The All sources menu in the dark theme, carried onto it though it is portaled to `body`. */
export const AllSourcesDark: Story = {
  globals: { mode: "dark" },
  play: async () => {
    await openMenu();
  },
};

/** Without `describeSource`: plain glyphs, and each tool's own name. */
export const WithoutAppDescriptions: Story = {
  args: { describeSource: undefined },
  play: async () => {
    await openMenu();
  },
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
export const CustomContents: Story = {
  args: { children: <CustomSources /> },
  play: async () => {
    await openMenu();
  },
};
