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

/** A phone: the viewport is below 640px, and nothing hovers. */
function phoneViewport() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(max-width: 639px)",
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

let container: HTMLElement;
let root: Root;
let user: UserEvent;
beforeEach(() => {
  phoneViewport();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  user = userEvent.setup();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  delete (Element.prototype as Partial<Element>).scrollIntoView;
});

/** Long enough for the sample queries (300ms) and the sheet's exit. */
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

const inspectButton = () => screen.getByRole("button", { name: "Sources" });
const chevron = () => screen.getByRole("button", { name: "All sources" });
const dashboard = () => screen.getByRole("heading", { name: "Retail overview" }).parentElement!;
const handle = (name: string) => within(dashboard()).getByRole("button", { name });
const sheet = (label: string) => screen.getByRole("dialog", { name: `Sources for ${label}` });
const menuSheet = () => screen.getByRole("dialog", { name: /^All sources for / });
/** The dim backdrop behind an open sheet. */
const backdrop = () => document.querySelector<HTMLElement>("[data-openui-sources-sheet-backdrop]");
const listed = (dialog: HTMLElement) =>
  within(within(dialog).getByRole("list", { name: "Sources" }))
    .getAllByRole("button")
    .map((row) => row.querySelector("[data-source-name]")?.textContent);

async function pick(label: string) {
  await mount();
  await user.click(inspectButton());
  await settle();
  await user.click(handle(label));
  await settle();
  return sheet(label);
}

describe("Sources on a phone", () => {
  it("opens a picked component's sources in a bottom sheet, on its list", async () => {
    const dialog = await pick("Gross margin");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.hasAttribute("data-openui-sources-sheet")).toBe(true);
    expect(backdrop()).not.toBeNull();
    expect(listed(dialog)).toEqual(["grossMargin", "revenueQ", "costQ"]);
    expect(screen.getAllByRole("dialog")).toEqual([dialog]);
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("goes from a source to its detail and back, as on desktop", async () => {
    const dialog = await pick("Revenue this quarter");
    await user.click(within(dialog).getByRole("button", { name: /^revenueQ/ }));
    await settle();
    expect(within(dialog).getByRole("heading", { name: "revenueQ" })).toBeTruthy();
    expect(within(dialog).getByRole("region", { name: "SQL" }).textContent).toContain(
      "FROM orders WHERE status = 'paid'",
    );
    expect(within(dialog).getByText("1 row · 1 field")).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "Back to all sources" }));
    await settle();
    expect(listed(dialog)).toEqual(["now", "revenueQ"]);
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: /^revenueQ/ }));
  });

  it("steps back one Escape at a time, and gives focus back to the component", async () => {
    const dialog = await pick("Gross margin");
    await user.click(within(dialog).getByRole("button", { name: /^costQ/ }));
    await settle();
    await user.keyboard("{Escape}");
    await settle();
    expect(listed(sheet("Gross margin"))).toEqual(["grossMargin", "revenueQ", "costQ"]);
    await user.keyboard("{Escape}");
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(backdrop()).toBeNull();
    expect(document.activeElement).toBe(handle("Gross margin"));
    expect(inspectButton().getAttribute("aria-pressed")).toBe("true");
    await user.keyboard("{Escape}");
    await settle();
    expect(inspectButton().getAttribute("aria-pressed")).toBe("false");
  });

  it("closes from its close control, from a source too, and gives focus back", async () => {
    const dialog = await pick("Weekly signups");
    await user.click(within(dialog).getByRole("button", { name: /^signupsQ/ }));
    await settle();
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(handle("Weekly signups"));
    expect(inspectButton().getAttribute("aria-pressed")).toBe("true");
  });

  it("closes on a tap on its backdrop", async () => {
    await pick("Daily revenue");
    await user.click(backdrop()!);
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(handle("Daily revenue"));
  });

  it("keeps focus inside while open", async () => {
    const dialog = await pick("Gross margin");
    for (let step = 0; step < 8; step++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });
});

describe("All sources on a phone", () => {
  async function openMenu() {
    await mount();
    await user.click(chevron());
    await settle();
    return menuSheet();
  }
  const row = (dialog: HTMLElement, name: string) =>
    within(dialog).getByRole("button", { name: new RegExp(`^${name}`) });

  it("opens from the chevron in a bottom sheet, and gives focus back to it on close", async () => {
    const dialog = await openMenu();
    expect(dialog.hasAttribute("data-openui-sources-sheet")).toBe(true);
    expect(backdrop()).not.toBeNull();
    expect(within(dialog).getByRole("list", { name: "Sources" })).toBeTruthy();
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(backdrop()).toBeNull();
    expect(document.activeElement).toBe(chevron());
  });

  it("goes to a source and back, and steps back one Escape at a time", async () => {
    const dialog = await openMenu();
    await user.click(row(dialog, "costQ"));
    await settle();
    expect(within(dialog).getByRole("heading", { name: "costQ" })).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "Back to all sources" }));
    await settle();
    expect(document.activeElement).toBe(row(dialog, "costQ"));
    await user.click(row(dialog, "costQ"));
    await settle();
    await user.keyboard("{Escape}");
    await settle();
    expect(within(menuSheet()).getByRole("list", { name: "Sources" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(chevron());
  });

  it("closes on a tap on its backdrop", async () => {
    await openMenu();
    await user.click(backdrop()!);
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens a Used by item's sheet on that source, and gives focus back to the chevron", async () => {
    const dialog = await openMenu();
    await user.click(row(dialog, "revenueQ"));
    await settle();
    await user.click(within(dialog).getByRole("button", { name: "Gross margin" }));
    await settle();
    const opened = sheet("Gross margin");
    expect(screen.getAllByRole("dialog")).toEqual([opened]);
    expect(opened.hasAttribute("data-openui-sources-sheet")).toBe(true);
    expect(within(opened).getByRole("heading", { name: "revenueQ" })).toBeTruthy();
    expect(inspectButton().getAttribute("aria-pressed")).toBe("false");
    await user.click(within(opened).getByRole("button", { name: "Back to all sources" }));
    await settle();
    expect(within(opened).getByRole("list", { name: "Sources" })).toBeTruthy();
    await user.click(within(opened).getByRole("button", { name: "Close" }));
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(chevron());
  });
});
