// @vitest-environment jsdom
import { configure, screen, within } from "@testing-library/dom";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dashboardLibrary,
  describeSource,
  fullFlowProgram,
  interpreter,
} from "../../SourcesContents/stories/fixtures";
import { LiveArtifactRenderer } from "../ArtifactRenderer";
import { useArtifactProvenance } from "../contexts";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// Every event Testing Library sends goes through React's `act`, as @testing-library/react does.
configure({
  asyncWrapper: async (run) => {
    let result: unknown;
    await act(async () => {
      result = await run();
    });
    return result;
  },
  eventWrapper: (dispatch) => {
    let result: unknown;
    act(() => {
      result = dispatch();
    });
    return result;
  },
});

let container: HTMLElement;
let root: Root;
let user: UserEvent;
let scrolled: Element[];
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  user = userEvent.setup();
  // jsdom scrolls nothing: note what was asked to come into view.
  scrolled = [];
  Element.prototype.scrollIntoView = vi.fn(function (this: Element) {
    scrolled.push(this);
  });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete (Element.prototype as Partial<Element>).scrollIntoView;
});

/** Long enough for the sample queries (300ms) and any exit. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 400)));

const isRevenueQuery = (request: Parameters<typeof interpreter>[0]) =>
  request.name === "postgres_query" && String(request.arguments["sql"]).includes("sum(total)");

async function mount(toolbar?: ReactNode, runQuery = interpreter) {
  const { Chrome, ProvenanceToggle, Content, Provenance } = LiveArtifactRenderer;
  act(() =>
    root.render(
      createElement(LiveArtifactRenderer, {
        id: "demo-full-flow",
        content: fullFlowProgram,
        library: dashboardLibrary,
        interpreter: runQuery,
        preview: false,
        enableProvenance: true,
        children: createElement(
          Chrome,
          null,
          toolbar ?? createElement(ProvenanceToggle),
          createElement(Content, null, createElement(Provenance, { describeSource })),
        ),
      }),
    ),
  );
  await settle();
}

const inspectButton = () => screen.getByRole("button", { name: "Sources" });
const chevron = () => screen.getByRole("button", { name: "All sources" });
const menu = () => screen.getByRole("dialog", { name: /^All sources for / });
const queryMenu = () => screen.queryByRole("dialog", { name: /^All sources for / });
const popover = (label: string) => screen.getByRole("dialog", { name: `Sources for ${label}` });
const dashboard = () => screen.getByRole("heading", { name: "Retail overview" }).parentElement!;
const handle = (name: string) => within(dashboard()).getByRole("button", { name });
/** Each row of the menu's list: its name and its count. */
const rows = () =>
  within(within(menu()).getByRole("list", { name: "Sources" }))
    .getAllByRole("button")
    .map(
      (row) =>
        `${row.querySelector("[data-source-name]")?.textContent} ${row.querySelector("[data-source-count]")?.textContent}`,
    );
const row = (name: string) => within(menu()).getByRole("button", { name: new RegExp(`^${name}`) });

async function openMenu() {
  await user.click(chevron());
  await settle();
  return menu();
}

describe("The Sources split button", () => {
  it("turns inspect mode on and off from its main half, pressed while on", async () => {
    await mount();
    expect(inspectButton().getAttribute("aria-pressed")).toBe("false");
    expect(inspectButton().getAttribute("data-state")).toBe("off");
    await user.click(inspectButton());
    await settle();
    expect(inspectButton().getAttribute("aria-pressed")).toBe("true");
    expect(inspectButton().getAttribute("data-state")).toBe("on");
    expect(queryMenu()).toBeNull();
    await user.click(inspectButton());
    await settle();
    expect(inspectButton().getAttribute("aria-pressed")).toBe("false");
  });

  it("opens and closes the All sources menu from its chevron, expanded while open", async () => {
    await mount();
    expect(chevron().getAttribute("aria-expanded")).toBe("false");
    expect(chevron().getAttribute("aria-haspopup")).toBe("dialog");
    await openMenu();
    expect(chevron().getAttribute("aria-expanded")).toBe("true");
    expect(chevron().getAttribute("data-state")).toBe("open");
    // Opening the menu leaves inspect mode as it was.
    expect(inspectButton().getAttribute("aria-pressed")).toBe("false");
    await user.click(chevron());
    await settle();
    expect(queryMenu()).toBeNull();
    expect(chevron().getAttribute("aria-expanded")).toBe("false");
  });
});

describe("The All sources menu", () => {
  it("lists every query and formula once, with how many items use each", async () => {
    await mount();
    const dialog = await openMenu();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(rows()).toEqual([
      "revenueQ 2 items",
      "costQ 1 item",
      "dailyQ 1 item",
      "signupsQ 1 item",
      "channelsQ 1 item",
      "now 1 item",
      "grossMargin 1 item",
    ]);
    expect(within(dialog).getByText("7 sources")).toBeTruthy();
    // Each row names its tool and table, from describeSource.
    expect(row("signupsQ").textContent).toContain("PostHog · events");
  });

  it("opens a source on its Used by, Query and Result, and goes back to the list", async () => {
    await mount();
    const dialog = await openMenu();
    await user.click(row("revenueQ"));
    await settle();
    expect(within(dialog).getByRole("heading", { name: "revenueQ" })).toBeTruthy();
    expect(within(dialog).getByText("Used by 2")).toBeTruthy();
    const usedBy = within(dialog).getByRole("list", { name: "Used by" });
    expect(
      within(usedBy)
        .getAllByRole("button")
        .map((each) => each.textContent),
    ).toEqual(["Revenue this quarter", "Gross margin"]);
    expect(within(dialog).getByRole("region", { name: "SQL" }).textContent).toContain(
      "FROM orders WHERE status = 'paid'",
    );
    expect(within(dialog).getByText("1 row · 1 field")).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "Back to all sources" }));
    await settle();
    expect(rows()).toHaveLength(7);
    expect(document.activeElement).toBe(row("revenueQ"));
  });

  it("shows the query error instead of empty rows in a Used by item's Result", async () => {
    const message = 'relation "orders" does not exist';
    await mount(undefined, async (request) => {
      if (isRevenueQuery(request)) throw new Error(message);
      return interpreter(request);
    });
    const dialog = await openMenu();
    await user.click(row("revenueQ"));
    await settle();
    await user.click(within(dialog).getByRole("button", { name: "Revenue this quarter" }));
    await settle();
    const opened = popover("Revenue this quarter");
    expect(opened.textContent).toContain(message);
    expect(within(opened).getByRole("alert").textContent).toContain(message);
    expect(opened.textContent).not.toContain("No rows returned.");
    expect(opened.textContent).not.toContain("0 rows · 0 fields");
  });

  it("shows empty rows in the Result when the query succeeds without rows", async () => {
    await mount(undefined, async (request) =>
      isRevenueQuery(request) ? { rows: [] } : interpreter(request),
    );
    const dialog = await openMenu();
    await user.click(row("revenueQ"));
    await settle();
    await user.click(within(dialog).getByRole("button", { name: "Revenue this quarter" }));
    await settle();
    const opened = within(popover("Revenue this quarter"));
    expect(opened.getByText("No rows returned.")).toBeTruthy();
    expect(opened.getByText("0 rows · 0 fields")).toBeTruthy();
    expect(opened.queryByRole("alert")).toBeNull();
  });

  it("shows a formula as Formula, with copy", async () => {
    await mount();
    const dialog = await openMenu();
    await user.click(row("grossMargin"));
    await settle();
    expect(within(dialog).getByRole("region", { name: "Formula" }).textContent).toContain(
      "grossMargin = (@First(revenueQ.rows).revenue",
    );
    await user.click(within(dialog).getByRole("button", { name: "Copy" }));
    expect(within(dialog).getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("moves focus in, and gives it back to the chevron when it closes", async () => {
    await mount();
    const dialog = await openMenu();
    expect(dialog.contains(document.activeElement)).toBe(true);
    for (let step = 0; step < 10; step++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await settle();
    expect(queryMenu()).toBeNull();
    expect(document.activeElement).toBe(chevron());
  });

  it("closes on a click outside", async () => {
    await mount();
    await openMenu();
    await user.click(screen.getByText("Paid orders only, refreshed hourly."));
    await settle();
    expect(queryMenu()).toBeNull();
  });

  it("steps back one Escape at a time: source, list, closed, and leaves inspect mode alone", async () => {
    await mount();
    await user.click(inspectButton());
    await settle();
    // Turning inspect mode on closed nothing; the menu opens over it.
    await openMenu();
    await user.click(row("costQ"));
    await settle();
    await user.keyboard("{Escape}");
    await settle();
    expect(rows()).toHaveLength(7);
    await user.keyboard("{Escape}");
    await settle();
    expect(queryMenu()).toBeNull();
    expect(document.activeElement).toBe(chevron());
    expect(inspectButton().getAttribute("aria-pressed")).toBe("true");
    await user.keyboard("{Escape}");
    await settle();
    expect(inspectButton().getAttribute("aria-pressed")).toBe("false");
  });

  it("opens a Used by item's popover on that source, in view, with inspect mode still off", async () => {
    await mount();
    const dialog = await openMenu();
    await user.click(row("revenueQ"));
    await settle();
    await user.click(within(dialog).getByRole("button", { name: "Gross margin" }));
    await settle();
    expect(queryMenu()).toBeNull();
    const opened = popover("Gross margin");
    expect(screen.getAllByRole("dialog")).toEqual([opened]);
    expect(within(opened).getByRole("heading", { name: "revenueQ" })).toBeTruthy();
    expect(inspectButton().getAttribute("aria-pressed")).toBe("false");
    expect(scrolled).toHaveLength(1);
    expect(scrolled[0]!.textContent).toContain("Gross margin");
    // Its own Esc ladder: back to its list, then closed, and still not inspecting.
    await user.keyboard("{Escape}");
    await settle();
    expect(within(popover("Gross margin")).getByRole("list", { name: "Sources" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(inspectButton().getAttribute("aria-pressed")).toBe("false");
    expect(document.activeElement).toBe(chevron());
  });

  it("opens a Used by item's popover with inspect mode left on", async () => {
    await mount();
    await user.click(inspectButton());
    await settle();
    const dialog = await openMenu();
    await user.click(row("signupsQ"));
    await settle();
    await user.click(within(dialog).getByRole("button", { name: "Weekly signups" }));
    await settle();
    expect(screen.getAllByRole("dialog")).toEqual([popover("Weekly signups")]);
    expect(inspectButton().getAttribute("aria-pressed")).toBe("true");
  });
});

describe("Only one Sources surface at a time", () => {
  it("closes an item's popover when the menu opens", async () => {
    await mount();
    await user.click(inspectButton());
    await settle();
    await user.click(handle("Weekly signups"));
    await settle();
    expect(popover("Weekly signups")).toBeTruthy();
    await openMenu();
    expect(screen.getAllByRole("dialog")).toEqual([menu()]);
  });

  it("closes the menu when inspect mode turns on", async () => {
    await mount();
    await openMenu();
    await user.click(inspectButton());
    await settle();
    expect(queryMenu()).toBeNull();
    expect(inspectButton().getAttribute("aria-pressed")).toBe("true");
  });

  it("closes an item's popover when inspect mode turns off", async () => {
    await mount();
    await user.click(inspectButton());
    await settle();
    await user.click(handle("Daily revenue"));
    await settle();
    await user.click(inspectButton());
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("useArtifactProvenance", () => {
  it("opens the menu from an app's own toolbar, and says which surface is open", async () => {
    function Toolbar() {
      const { openAllSources, isAllSourcesOpen, isPopoverOpen, setInspecting } =
        useArtifactProvenance();
      return createElement(
        "div",
        null,
        createElement("button", { onClick: () => setInspecting(true) }, "Inspect"),
        createElement("button", { onClick: openAllSources }, "Every source"),
        createElement(
          "output",
          null,
          `menu ${isAllSourcesOpen ? "open" : "closed"}, popover ${isPopoverOpen ? "open" : "closed"}`,
        ),
      );
    }
    const { ProvenanceToggle } = LiveArtifactRenderer;
    await mount(createElement(ProvenanceToggle, null, createElement(Toolbar)));
    expect(screen.queryByRole("button", { name: "All sources" })).toBeNull();
    const status = () => container.querySelector("output")!.textContent;
    expect(status()).toBe("menu closed, popover closed");
    await user.click(screen.getByRole("button", { name: "Every source" }));
    await settle();
    expect(rows()).toHaveLength(7);
    expect(status()).toBe("menu open, popover closed");
    await user.click(row("dailyQ"));
    await settle();
    await user.click(within(menu()).getByRole("button", { name: "Daily revenue" }));
    await settle();
    expect(status()).toBe("menu closed, popover open");
  });
});
