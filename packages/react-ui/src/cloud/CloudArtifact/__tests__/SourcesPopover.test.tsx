// @vitest-environment jsdom
import { configure, screen, within } from "@testing-library/dom";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { act, createElement } from "react";
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
import { cutoutPath } from "../SourcesOverlay";

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
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  user = userEvent.setup();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** Long enough for the sample queries (300ms) and any exit. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 400)));

async function mount() {
  const { Chrome, ProvenanceToggle, Content, Provenance } = LiveArtifactRenderer;
  act(() =>
    root.render(
      createElement(LiveArtifactRenderer, {
        id: "demo-full-flow",
        content: fullFlowProgram,
        library: dashboardLibrary,
        interpreter,
        preview: false,
        enableProvenance: true,
        children: createElement(
          Chrome,
          null,
          createElement(ProvenanceToggle),
          createElement(Content, null, createElement(Provenance, { describeSource })),
        ),
      }),
    ),
  );
  await settle();
}

const sourcesToggle = () => screen.getByRole("button", { name: "Sources" });
const dashboard = () => screen.getByRole("heading", { name: "Retail overview" }).parentElement!;
const handle = (name: string) => within(dashboard()).getByRole("button", { name });
const popover = (label: string) => screen.getByRole("dialog", { name: `Sources for ${label}` });
/** The blur over the artifact while a popover is open. */
const overlay = () => document.querySelector<HTMLElement>("[data-openui-sources-overlay]");
/** The sources a popover lists, by the names their rows start with. */
const listed = (dialog: HTMLElement) =>
  within(within(dialog).getByRole("list", { name: "Sources" }))
    .getAllByRole("button")
    .map((row) => row.querySelector("[data-source-name]")?.textContent);

async function inspect() {
  await user.click(sourcesToggle());
  await settle();
}

async function open(label: string) {
  await mount();
  await inspect();
  await user.click(handle(label));
  await settle();
  return popover(label);
}

describe("The Sources popover", () => {
  it("opens on a click, on the list of the picked component's sources", async () => {
    const dialog = await open("Gross margin");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    // Its formula first, then the queries the formula reads.
    expect(listed(dialog)).toEqual(["grossMargin", "revenueQ", "costQ"]);
    // No other dialog: the old Sources dialog no longer opens for an item.
    expect(screen.getAllByRole("dialog")).toEqual([dialog]);
  });

  it("opens on Enter on a focused component, named after it", async () => {
    await mount();
    await inspect();
    act(() => handle("Revenue this quarter").focus());
    await user.keyboard("{Enter}");
    await settle();
    const dialog = popover("Revenue this quarter");
    expect(listed(dialog)).toEqual(["now", "revenueQ"]);
    expect(screen.getAllByRole("dialog")).toEqual([dialog]);
  });

  it("shows the list for a component with a single source, under its label and value", async () => {
    const dialog = await open("Weekly signups");
    expect(listed(dialog)).toEqual(["signupsQ"]);
    expect(within(dialog).getByText(/Weekly signups/).textContent).toBe("Weekly signups · 2,318");
    // Each row names the tool and what it reads, from describeSource.
    expect(within(dialog).getByRole("button", { name: /signupsQ/ }).textContent).toContain(
      "PostHog · events",
    );
  });

  it("names each query's tool and table, and a formula's inputs, in the list", async () => {
    const dialog = await open("Gross margin");
    const row = (name: string) =>
      within(dialog).getByRole("button", { name: new RegExp(`^${name}`) }).textContent;
    expect(row("grossMargin")).toBe("grossMarginFormula · revenueQ, costQ");
    expect(row("revenueQ")).toBe("revenueQPostgres · orders");
    expect(row("costQ")).toBe("costQPostgres · order_items");
  });

  it("opens a query on its Query, labelled with its language, and its Result with counts", async () => {
    const dialog = await open("Revenue this quarter");
    await user.click(within(dialog).getByRole("button", { name: /^revenueQ/ }));
    await settle();
    expect(within(dialog).getByRole("heading", { name: "revenueQ" })).toBeTruthy();
    const sql = within(dialog).getByRole("region", { name: "SQL" });
    expect(sql.textContent).toContain("FROM orders WHERE status = 'paid'");
    const result = within(dialog).getByRole("region", { name: "Result" });
    expect(within(result).getByRole("columnheader", { name: "revenue" })).toBeTruthy();
    expect(within(result).getByRole("cell", { name: "184920" })).toBeTruthy();
    expect(within(dialog).getByText("1 row · 1 field")).toBeTruthy();
  });

  it("labels a HogQL query by its language", async () => {
    const dialog = await open("Weekly signups");
    await user.click(within(dialog).getByRole("button", { name: /^signupsQ/ }));
    await settle();
    expect(within(dialog).getByRole("region", { name: "HogQL" }).textContent).toContain(
      "FROM events",
    );
  });

  it("shows a formula as Formula, with no Result", async () => {
    const dialog = await open("Gross margin");
    await user.click(within(dialog).getByRole("button", { name: /^grossMargin/ }));
    await settle();
    const formula = within(dialog).getByRole("region", { name: "Formula" });
    expect(formula.textContent).toContain("grossMargin = (@First(revenueQ.rows).revenue");
    expect(within(dialog).queryByRole("region", { name: "Result" })).toBeNull();
  });

  it("copies the query and confirms it", async () => {
    const dialog = await open("Revenue this quarter");
    await user.click(within(dialog).getByRole("button", { name: /^revenueQ/ }));
    await settle();
    await user.click(within(dialog).getByRole("button", { name: "Copy" }));
    expect(within(dialog).getByRole("button", { name: "Copied" })).toBeTruthy();
    expect(await navigator.clipboard.readText()).toContain("SELECT sum(total) AS revenue");
    expect(within(dialog).getByRole("status").textContent).toBe("Copied to clipboard");
  });

  it("makes the chip the way back in a source, and the way out on the list", async () => {
    const dialog = await open("Revenue this quarter");
    expect(within(dialog).getByRole("button", { name: "Close Sources" }).textContent).toBe(
      "Sources",
    );
    await user.click(within(dialog).getByRole("button", { name: /^revenueQ/ }));
    await settle();
    const back = within(dialog).getByRole("button", { name: "Back to all sources" });
    expect(back.textContent).toBe("All sources");
    await user.click(back);
    await settle();
    expect(listed(dialog)).toEqual(["now", "revenueQ"]);
    // Back on the list, focus is on the source it came from.
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: /^revenueQ/ }));
    await user.click(within(dialog).getByRole("button", { name: "Close Sources" }));
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(handle("Revenue this quarter"));
    expect(sourcesToggle().getAttribute("aria-pressed")).toBe("true");
  });

  it("steps back one Escape at a time: source, list, closed, then inspect mode off", async () => {
    const dialog = await open("Gross margin");
    await user.click(within(dialog).getByRole("button", { name: /^costQ/ }));
    await settle();
    expect(within(dialog).getByRole("heading", { name: "costQ" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await settle();
    expect(listed(popover("Gross margin"))).toEqual(["grossMargin", "revenueQ", "costQ"]);
    await user.keyboard("{Escape}");
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(handle("Gross margin"));
    expect(sourcesToggle().getAttribute("aria-pressed")).toBe("true");
    await user.keyboard("{Escape}");
    await settle();
    expect(sourcesToggle().getAttribute("aria-pressed")).toBe("false");
    expect(document.activeElement).toBe(sourcesToggle());
  });

  it("moves focus in and keeps it inside while open", async () => {
    const dialog = await open("Gross margin");
    expect(dialog.contains(document.activeElement)).toBe(true);
    for (let step = 0; step < 8; step++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let step = 0; step < 8; step++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("closes on a click on the blur, still inspecting, and gives focus back to the component", async () => {
    await open("Daily revenue");
    await user.click(overlay()!);
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(sourcesToggle().getAttribute("aria-pressed")).toBe("true");
    expect(document.activeElement).toBe(handle("Daily revenue"));
  });

  it("blurs the artifact behind it while open, and the blur goes with it", async () => {
    const dialog = await open("Weekly signups");
    const blur = overlay();
    expect(blur).not.toBeNull();
    expect(blur!.getAttribute("data-state")).toBe("open");
    // Decoration only: nothing in it for a screen reader, and it sits under the popover.
    expect(blur!.getAttribute("aria-hidden")).toBe("true");
    expect(blur!.compareDocumentPosition(dialog) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.keyboard("{Escape}");
    await settle();
    expect(overlay()).toBeNull();
  });

  it("plays its exit before it unmounts", async () => {
    await open("Weekly signups");
    await user.keyboard("{Escape}");
    // Closed but still there, inert and hidden, with its blur, until its exit ends.
    const closed = document.querySelector<HTMLElement>("[data-openui-sources-popover]");
    expect(closed?.getAttribute("data-state")).toBe("closed");
    expect(closed?.getAttribute("aria-hidden")).toBe("true");
    expect(closed?.hasAttribute("inert")).toBe(true);
    expect(overlay()?.getAttribute("data-state")).toBe("closed");
    expect(screen.queryByRole("dialog")).toBeNull();
    // A child's animation ending is not the exit.
    act(() => {
      closed!.querySelector("header")!.dispatchEvent(new Event("animationend", { bubbles: true }));
    });
    expect(document.querySelector("[data-openui-sources-popover]")).toBe(closed);
    act(() => {
      closed!.dispatchEvent(new Event("animationend", { bubbles: true }));
    });
    expect(document.querySelector("[data-openui-sources-popover]")).toBeNull();
    expect(overlay()).toBeNull();
  });

  it("keeps the closed component's outline solid until another is hovered", async () => {
    await open("Weekly signups");
    await user.keyboard("{Escape}");
    await settle();
    const signups = handle("Weekly signups");
    expect(signups.hasAttribute("data-openui-selected")).toBe(true);
    await user.hover(handle("Revenue this quarter"));
    expect(signups.hasAttribute("data-openui-selected")).toBe(false);
  });

  it("moves to another component picked while one is open", async () => {
    await open("Daily revenue");
    await user.click(handle("Weekly signups"));
    await settle();
    expect(screen.getAllByRole("dialog")).toEqual([popover("Weekly signups")]);
  });

  it("closes, and gives focus to the Sources toggle, when inspect mode ends", async () => {
    await open("Daily revenue");
    await user.click(sourcesToggle());
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(sourcesToggle());
  });

  it("lets your own Provenance contents replace the list", async () => {
    function Mine() {
      const { selection } = useArtifactProvenance();
      return createElement("p", null, `Picked ${selection?.id ?? "nothing"}`);
    }
    const { Chrome, ProvenanceToggle, Content, Provenance } = LiveArtifactRenderer;
    act(() =>
      root.render(
        createElement(LiveArtifactRenderer, {
          id: "demo-full-flow",
          content: fullFlowProgram,
          library: dashboardLibrary,
          interpreter,
          preview: false,
          enableProvenance: true,
          children: createElement(
            Chrome,
            null,
            createElement(ProvenanceToggle),
            createElement(Content, null, createElement(Provenance, null, createElement(Mine))),
          ),
        }),
      ),
    );
    await settle();
    await inspect();
    await user.click(handle("Weekly signups"));
    await settle();
    const dialog = popover("Weekly signups");
    expect(within(dialog).getByText("Picked signups")).toBeTruthy();
    expect(within(dialog).queryByRole("list", { name: "Sources" })).toBeNull();
  });
});

describe("The blur's cut-out", () => {
  afterEach(() => vi.restoreAllMocks());

  type Box = { x: number; y: number; width: number; height: number };
  const place = (element: Element, box: () => Box) =>
    vi
      .spyOn(element, "getBoundingClientRect")
      .mockImplementation(() => DOMRect.fromRect(box()) as DOMRect);

  /** Opens a component's popover with the artifact's content and the component at these boxes. */
  async function openAt(label: string, content: Box, component: () => Box) {
    await mount();
    await inspect();
    place(container.querySelector(".openui-artifact-content")!, () => content);
    const element = handle(label);
    place(element, component);
    await user.click(element);
    await settle();
    return overlay()!;
  }

  it("covers the artifact's content and leaves the component's box clear", async () => {
    const blur = await openAt("Daily revenue", { x: 20, y: 60, width: 800, height: 600 }, () => ({
      x: 40,
      y: 100,
      width: 200,
      height: 80,
    }));
    expect(blur.style.left).toBe("20px");
    expect(blur.style.top).toBe("60px");
    expect(blur.style.width).toBe("800px");
    expect(blur.style.height).toBe("600px");
    // In the overlay's own coordinates, 8px clear of the box (its outline sits 4 to 6px out).
    expect(blur.style.getPropertyValue("clip-path")).toBe(
      cutoutPath({ width: 800, height: 600 }, { x: 12, y: 32, width: 216, height: 96 }),
    );
  });

  it("follows the component when the content scrolls and when the window resizes", async () => {
    let box = { x: 40, y: 100, width: 200, height: 80 };
    const blur = await openAt("Daily revenue", { x: 0, y: 0, width: 800, height: 600 }, () => box);
    box = { x: 40, y: 20, width: 200, height: 80 };
    act(() => {
      container.querySelector(".openui-artifact-content")!.dispatchEvent(new Event("scroll"));
    });
    await settle();
    expect(blur.style.getPropertyValue("clip-path")).toBe(
      cutoutPath({ width: 800, height: 600 }, { x: 32, y: 12, width: 216, height: 96 }),
    );
    box = { x: 10, y: 20, width: 120, height: 80 };
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    await settle();
    expect(blur.style.getPropertyValue("clip-path")).toBe(
      cutoutPath({ width: 800, height: 600 }, { x: 2, y: 12, width: 136, height: 96 }),
    );
  });

  it("keeps the cut-out inside the artifact when the component is partly scrolled out", async () => {
    const blur = await openAt("Daily revenue", { x: 0, y: 100, width: 800, height: 600 }, () => ({
      x: 40,
      y: 60,
      width: 200,
      height: 80,
    }));
    // The box runs above the content's top edge: the cut-out stops at it.
    expect(blur.style.getPropertyValue("clip-path")).toBe(
      cutoutPath({ width: 800, height: 600 }, { x: 32, y: 0, width: 216, height: 48 }),
    );
  });
});

describe("cutoutPath", () => {
  it("draws the whole box, then the rounded hole, filled even-odd", () => {
    expect(cutoutPath({ width: 100, height: 50 }, { x: 10, y: 10, width: 40, height: 30 })).toBe(
      'path(evenodd, "M0 0H100V50H0Z' +
        "M22 10H38A12 12 0 0 1 50 22V28A12 12 0 0 1 38 40H22A12 12 0 0 1 10 28V22A12 12 0 0 1 22 10Z" +
        '")',
    );
  });

  it("rounds a small hole by at most half its side, and leaves out an empty one", () => {
    expect(cutoutPath({ width: 100, height: 50 }, { x: 0, y: 0, width: 10, height: 8 })).toBe(
      'path(evenodd, "M0 0H100V50H0Z' +
        "M4 0H6A4 4 0 0 1 10 4V4A4 4 0 0 1 6 8H4A4 4 0 0 1 0 4V4A4 4 0 0 1 4 0Z" +
        '")',
    );
    expect(cutoutPath({ width: 100, height: 50 }, { x: 0, y: 0, width: 0, height: 8 })).toBe(
      'path(evenodd, "M0 0H100V50H0Z")',
    );
  });
});

describe("The Sources popover's placement", () => {
  const VIEWPORT = { width: 1024, height: 768 };
  const SIZE = { width: 440, height: 300 };
  beforeEach(() => {
    for (const element of [document.documentElement, document.body]) {
      vi.spyOn(element, "clientWidth", "get").mockReturnValue(VIEWPORT.width);
      vi.spyOn(element, "clientHeight", "get").mockReturnValue(VIEWPORT.height);
    }
    // jsdom lays nothing out: the popover takes the design's size.
    const sized = (dimension: "width" | "height") =>
      function (this: HTMLElement) {
        return this.getAttribute("role") === "dialog" ? SIZE[dimension] : 0;
      };
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(sized("width"));
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(sized("height"));
  });
  afterEach(() => vi.restoreAllMocks());

  /** Opens a component's popover with its outlined element at `box`, in viewport px. */
  async function openAt(
    label: string,
    box: { x: number; y: number; width: number; height: number },
  ) {
    await mount();
    await inspect();
    const element = handle(label);
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      DOMRect.fromRect({ ...box }) as DOMRect,
    );
    await user.click(element);
    await settle();
    const { left, top } = popover(label).style;
    return { left: parseFloat(left), top: parseFloat(top) };
  }

  const inside = ({ left, top }: { left: number; top: number }) => {
    expect(left).toBeGreaterThanOrEqual(0);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(left + SIZE.width).toBeLessThanOrEqual(VIEWPORT.width);
    expect(top + SIZE.height).toBeLessThanOrEqual(VIEWPORT.height);
  };

  it("opens above the component's top-left corner when there's room", async () => {
    const at = await openAt("Daily revenue", { x: 40, y: 400, width: 600, height: 200 });
    expect(at).toEqual({ left: 40, top: 400 - 8 - SIZE.height });
  });

  it("stays inside the viewport near its right edge", async () => {
    const at = await openAt("Weekly signups", { x: 900, y: 500, width: 80, height: 24 });
    inside(at);
    // Right-aligned to the component, still above it.
    expect(at).toEqual({ left: 980 - SIZE.width, top: 500 - 8 - SIZE.height });
  });

  it("stays inside the viewport near its top edge", async () => {
    const at = await openAt("Revenue this quarter", { x: 40, y: 20, width: 80, height: 24 });
    inside(at);
    expect(at).toEqual({ left: 40, top: 20 + 24 + 8 });
  });

  it("stays inside the viewport in its top-right corner", async () => {
    inside(await openAt("Weekly signups", { x: 900, y: 10, width: 80, height: 24 }));
  });

  describe("with CSS anchor positioning", () => {
    beforeEach(() => {
      vi.stubGlobal("CSS", { supports: () => true, escape: (value: string) => value });
    });
    afterEach(() => vi.unstubAllGlobals());

    it("anchors itself to the outlined element, and lets go when it closes", async () => {
      await mount();
      await inspect();
      const element = handle("Weekly signups");
      element.style.setProperty("anchor-name", "--mine");
      await user.click(element);
      await settle();
      const name = element.style.getPropertyValue("anchor-name");
      expect(name).toMatch(/^--openui-sources-popover-[\w-]+$/);
      const dialog = popover("Weekly signups");
      expect(dialog.style.getPropertyValue("position-anchor")).toBe(name);
      expect(dialog.style.top).toBe("");
      await user.keyboard("{Escape}");
      await settle();
      expect(element.style.getPropertyValue("anchor-name")).toBe("--mine");
    });
  });
});
