// @vitest-environment jsdom
import { configure, screen, within } from "@testing-library/dom";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  dashboardLibrary,
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

/** Long enough for the sample queries (300ms) and any dialog transition. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 400)));

async function mount() {
  act(() =>
    root.render(
      createElement(LiveArtifactRenderer, {
        id: "demo-full-flow",
        content: fullFlowProgram,
        library: dashboardLibrary,
        interpreter,
        preview: false,
        enableProvenance: true,
        children: createElement(LiveArtifactRenderer.Chrome),
      }),
    ),
  );
  await settle();
}

const sourcesToggle = () => screen.getByRole("button", { name: "Sources" });
const dashboard = () => screen.getByRole("heading", { name: "Retail overview" }).parentElement!;
/** The keyboard handles inspect mode gives each data-bound component, by name. */
const handles = () => within(dashboard()).queryAllByRole("button");
const handle = (name: string) => within(dashboard()).getByRole("button", { name });
/** What inspect mode outlines. */
const outlined = () => [...dashboard().querySelectorAll<HTMLElement>("[data-openui-bound]")];

async function inspect() {
  await user.click(sourcesToggle());
  await settle();
}

describe("Inspect mode", () => {
  it("outlines exactly the data-bound components, each a handle named by its label", async () => {
    await mount();
    expect(handles()).toEqual([]);
    expect(outlined()).toEqual([]);
    await inspect();
    expect(handles().map((each) => each.getAttribute("aria-label"))).toEqual([
      "Revenue this quarter",
      "Weekly signups",
      "Gross margin",
      "Sessions by channel",
      "Daily revenue",
    ]);
    expect(outlined()).toEqual(handles());
    // A KPI is outlined on its value, the element of the prop that reads the query.
    expect(handle("Revenue this quarter").textContent).toBe("184,920");
    // Not the heading, the note, the group around the KPIs, or the KPI with a literal value.
    for (const text of ["Retail overview", "Paid orders only, refreshed hourly.", "This quarter"]) {
      expect(screen.getByText(text).closest("[data-openui-bound]")).toBeNull();
    }
    expect(screen.getByText("250,000").closest("[data-openui-bound]")).toBeNull();
  });

  it("picks nothing on a click on a heading, a container, a label or a literal value", async () => {
    await mount();
    await inspect();
    for (const text of [
      "Retail overview",
      "Paid orders only, refreshed hourly.",
      "This quarter",
      "Revenue this quarter",
      "250,000",
    ]) {
      await user.click(screen.getByText(text));
      await settle();
      expect(screen.queryByRole("dialog")).toBeNull();
    }
    expect(sourcesToggle().getAttribute("aria-pressed")).toBe("true");
  });

  it("opens its Sources popover on a click on an outlined component", async () => {
    await mount();
    await inspect();
    await user.click(handle("Daily revenue"));
    await settle();
    expect(screen.getByRole("dialog", { name: "Sources for Daily revenue" })).toBeTruthy();
  });

  it("turns the outline under the pointer solid, and only an outlined one", async () => {
    await mount();
    await inspect();
    await user.hover(screen.getByText("Retail overview"));
    expect(dashboard().querySelector("[data-openui-hover]")).toBeNull();
    await user.hover(within(handle("Daily revenue")).getByText("2026-11-12"));
    expect(dashboard().querySelector("[data-openui-hover]")).toBe(handle("Daily revenue"));
    await user.hover(screen.getByText("This quarter"));
    expect(dashboard().querySelector("[data-openui-hover]")).toBeNull();
  });

  it("lets Tab reach each data-bound component in order, and Enter pick it", async () => {
    await mount();
    await inspect();
    const reached: string[] = [];
    for (let step = 0; step < 5; step++) {
      await user.tab();
      reached.push(document.activeElement?.getAttribute("aria-label") ?? "");
    }
    expect(reached).toEqual([
      "Revenue this quarter",
      "Weekly signups",
      "Gross margin",
      "Sessions by channel",
      "Daily revenue",
    ]);
    await user.keyboard("{Enter}");
    await settle();
    expect(screen.getByRole("dialog", { name: "Sources for Daily revenue" })).toBeTruthy();
  });

  it("picks the focused component on Space too", async () => {
    await mount();
    await inspect();
    act(() => handle("Weekly signups").focus());
    await user.keyboard(" ");
    await settle();
    expect(screen.getByRole("dialog", { name: "Sources for Weekly signups" })).toBeTruthy();
  });

  it("takes the handles out of the tab order when inspect mode ends", async () => {
    await mount();
    await inspect();
    await inspect();
    expect(handles()).toEqual([]);
    expect(outlined()).toEqual([]);
    // From the Sources toggle, the last stop before the dashboard, Tab leaves the page.
    expect(document.activeElement).toBe(sourcesToggle());
    await user.tab();
    expect(document.activeElement).toBe(document.body);
  });

  it("leaves the tab order of an outlined element with a tabindex of its own to the dashboard", async () => {
    await mount();
    const value = screen.getByText("2,318");
    value.setAttribute("tabindex", "-1");
    await inspect();
    expect(value.getAttribute("tabindex")).toBe("-1");
    expect(value.closest("[data-openui-bound]")).toBe(value);
    await inspect();
    expect(value.getAttribute("tabindex")).toBe("-1");
    expect(value.hasAttribute("data-openui-bound")).toBe(false);
  });

  it("turns inspect mode off on Escape with nothing open", async () => {
    await mount();
    await inspect();
    act(() => handle("Revenue this quarter").focus());
    await user.keyboard("{Escape}");
    await settle();
    expect(sourcesToggle().getAttribute("aria-pressed")).toBe("false");
    expect(document.activeElement).toBe(sourcesToggle());
  });

  it("leaves an Escape to the dashboard's own list", async () => {
    await mount();
    await inspect();
    // A listbox the dashboard renders, as a select's menu would.
    const list = document.createElement("div");
    list.setAttribute("role", "listbox");
    list.tabIndex = 0;
    dashboard().appendChild(list);
    act(() => list.focus());
    await user.keyboard("{Escape}");
    await settle();
    expect(sourcesToggle().getAttribute("aria-pressed")).toBe("true");
  });

  it("shows no card on hover or on focus", async () => {
    await mount();
    await inspect();
    await user.hover(handle("Revenue this quarter"));
    await settle();
    expect(screen.queryByRole("tooltip")).toBeNull();
    act(() => handle("Weekly signups").focus());
    await settle();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
