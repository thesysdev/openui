// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dashboardLibrary,
  dashboardProgram,
  describeSource,
  interpreter,
} from "../../DataSourcesPanel/stories/fixtures";
import { LiveArtifactRenderer } from "../ArtifactRenderer";
import { useArtifactProvenance } from "../contexts";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 400)));
const artifact = () => container.querySelector<HTMLElement>(".openui-artifact")!;
/** The open dialog: portaled to `body`, so looked up there. */
const dialog = () => document.querySelector<HTMLElement>("[role=dialog]");
const title = () => dialog()?.querySelector("h2")?.textContent;
/** The picked value, shown beside the title. */
const meta = () => dialog()?.querySelector(".openui-data-sources-dialog__meta")?.textContent;
const toggle = () =>
  container.querySelector<HTMLButtonElement>(".openui-artifact-provenance-toggle")!;
/** The All queries button, by its accessible name. */
const allQueries = () =>
  [...container.querySelectorAll<HTMLButtonElement>("button")].find(
    (el) => el.getAttribute("aria-label") === "All queries",
  );
const valueOf = (title: string) =>
  [...container.querySelectorAll("[data-openui-prop='value']")].find((el) =>
    el.closest("[data-openui-source]:not([data-openui-prop])")?.textContent?.includes(title),
  ) as HTMLElement;
const button = (name: string) =>
  [...(dialog()?.querySelectorAll("button") ?? [])].find(
    (el) => el.getAttribute("aria-label") === name || el.textContent?.startsWith(name),
  );
/** The queries the dialog lists. */
const names = () =>
  [...(dialog()?.querySelectorAll("li") ?? [])].map(
    (el) => el.querySelector(".openui-data-sources-panel__list-label")?.textContent,
  );
const rows = () =>
  [...(dialog()?.querySelectorAll("[aria-expanded]") ?? [])].map(
    (el) =>
      `${el.textContent?.trim()}${el.getAttribute("aria-expanded") === "true" ? " (open)" : ""}`,
  );

async function mount(enableProvenance = true, children?: ReactNode) {
  act(() =>
    root.render(
      createElement(LiveArtifactRenderer, {
        id: "demo-retail",
        content: dashboardProgram,
        library: dashboardLibrary,
        interpreter,
        preview: false,
        enableProvenance,
        children: children ?? createElement(LiveArtifactRenderer.Chrome),
      }),
    ),
  );
  await settle();
}

/** A tile's title: a click on it picks the whole tile. */
const tile = (title: string) =>
  [...container.querySelectorAll<HTMLElement>("div")].find((el) => el.textContent === title)!;

async function escape() {
  act(() => {
    (document.activeElement ?? document.body).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    );
  });
  await settle();
}

async function inspect() {
  act(() => toggle().click());
  await settle();
}

async function pick(element: HTMLElement) {
  act(() => element.click());
  await settle();
}

describe("Sources in a live artifact", () => {
  it("enters inspect mode from the Sources toggle, with no dialog yet", async () => {
    await mount();
    expect(toggle().textContent).toBe("Sources");
    expect(toggle().getAttribute("aria-pressed")).toBe("false");
    expect(artifact().hasAttribute("data-openui-inspecting")).toBe(false);
    await inspect();
    expect(toggle().getAttribute("aria-pressed")).toBe("true");
    expect(artifact().hasAttribute("data-openui-inspecting")).toBe(true);
    expect(dialog()).toBeNull();
  });

  it("marks the toggle on and off with data-state, for your own CSS", async () => {
    await mount();
    expect(toggle().getAttribute("data-state")).toBe("off");
    await inspect();
    expect(toggle().getAttribute("data-state")).toBe("on");
    await inspect();
    expect(toggle().getAttribute("data-state")).toBe("off");
    expect(toggle().getAttribute("aria-pressed")).toBe("false");
  });

  it("shows All queries next to the toggle only while inspecting, and opens the list", async () => {
    await mount();
    expect(allQueries()).toBeUndefined();
    await inspect();
    expect(allQueries()?.classList.contains("openui-artifact-all-queries")).toBe(true);
    // As a real click would, it takes focus first, and gets it back when the dialog closes.
    act(() => {
      allQueries()!.focus();
      allQueries()!.click();
    });
    await settle();
    expect(title()).toBe("Sources");
    expect(names()).toEqual(["revenueQ", "dailyQ", "signupsQ", "channelsQ", "targetQ"]);
    expect(artifact().hasAttribute("data-openui-inspecting")).toBe(true);
    await escape();
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(allQueries());
    await inspect();
    expect(allQueries()).toBeUndefined();
  });

  it("names All queries in a tooltip when it gets focus", async () => {
    await mount();
    await inspect();
    expect(document.querySelector("[role=tooltip]")).toBeNull();
    act(() => allQueries()!.focus());
    await settle();
    expect(document.querySelector("[role=tooltip]")?.textContent).toBe("All queries");
  });

  it("opens a dialog on a picked number: titled by its label and value, on its Query", async () => {
    await mount();
    await inspect();
    await pick(valueOf("Revenue this quarter"));
    expect(title()).toBe("Revenue this quarter");
    expect(meta()).toBe("184,920");
    // No describeSource here: the Query row shows the tool name, not a guess.
    expect(rows()).toEqual(["Querypostgres_query (open)", "Result", "Formula"]);
    expect(dialog()?.querySelector("pre")?.textContent).toContain("FROM orders");
  });

  it("opens a picked table on its Result", async () => {
    await mount();
    await inspect();
    await pick(tile("Daily revenue"));
    expect(title()).toBe("Daily revenue");
    expect(meta()).toBeUndefined();
    expect(rows()).toEqual(["Querypostgres_query", "Result (open)"]);
  });

  it("steps back one Escape at a time: the dialog, then inspect mode", async () => {
    await mount();
    await inspect();
    await pick(valueOf("Revenue this quarter"));
    await escape();
    expect(dialog()).toBeNull();
    expect(toggle().getAttribute("aria-pressed")).toBe("true");
    await escape();
    expect(toggle().getAttribute("aria-pressed")).toBe("false");
    expect(artifact().hasAttribute("data-openui-inspecting")).toBe(false);
  });

  it("closes on a click on the dim background, still inspecting", async () => {
    await mount();
    await inspect();
    await pick(valueOf("Revenue this quarter"));
    const overlay = document.querySelector<HTMLElement>(".openui-data-sources-dialog__overlay")!;
    act(() => {
      overlay.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
      overlay.click();
    });
    await settle();
    expect(dialog()).toBeNull();
    expect(artifact().hasAttribute("data-openui-inspecting")).toBe(true);
  });

  it("gives focus back to the picked item, which stays outlined until another is hovered", async () => {
    await mount();
    await inspect();
    const revenue = valueOf("Revenue this quarter");
    await pick(revenue);
    act(() => dialog()!.querySelector<HTMLButtonElement>("[aria-label=Close]")!.click());
    await settle();
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(revenue);
    expect(revenue.hasAttribute("data-openui-selected")).toBe(true);
    act(() => {
      valueOf("Weekly signups").dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(revenue.hasAttribute("data-openui-selected")).toBe(false);
  });

  it("leaves the page clickable while it closes: a click right away picks the next item", async () => {
    await mount();
    await inspect();
    await pick(valueOf("Revenue this quarter"));
    act(() => dialog()!.querySelector<HTMLButtonElement>("[aria-label=Close]")!.click());
    // Still leaving: its exit plays on, but it no longer takes the pointer.
    const leaving = document.querySelector<HTMLElement>(".openui-data-sources-dialog")!;
    const overlay = document.querySelector<HTMLElement>(".openui-data-sources-dialog__overlay")!;
    expect(leaving.getAttribute("data-state")).toBe("closed");
    expect(getComputedStyle(leaving).pointerEvents).toBe("none");
    expect(getComputedStyle(overlay).pointerEvents).toBe("none");
    expect(document.body.style.pointerEvents).not.toBe("none");
    await pick(valueOf("Weekly signups"));
    expect(dialog()?.getAttribute("data-state")).toBe("open");
    expect(title()).toBe("Weekly signups");
  });

  it("gives focus back only once the page is no longer hidden from screen readers", async () => {
    await mount();
    await inspect();
    const revenue = valueOf("Revenue this quarter");
    await pick(revenue);
    let hiddenWhenFocused: boolean | undefined;
    revenue.addEventListener("focus", () => {
      hiddenWhenFocused = revenue.closest("[aria-hidden=true]") !== null;
    });
    act(() => dialog()!.querySelector<HTMLButtonElement>("[aria-label=Close]")!.click());
    await settle();
    expect(document.activeElement).toBe(revenue);
    expect(hiddenWhenFocused).toBe(false);
  });

  it("goes back to the list of every query, still inspecting, and opens one from it", async () => {
    await mount();
    await inspect();
    await pick(valueOf("Revenue this quarter"));
    act(() => button("Back to all queries")!.click());
    await settle();
    expect(title()).toBe("Sources");
    expect(names()).toEqual(["revenueQ", "dailyQ", "signupsQ", "channelsQ", "targetQ"]);
    expect(artifact().hasAttribute("data-openui-inspecting")).toBe(true);
    act(() => button("signupsQ")!.click());
    await settle();
    expect(title()).toBe("signupsQ");
    expect(meta()).toBeUndefined();
    expect(rows()).toEqual(["Queryposthog_query (open)", "Result"]);
    act(() => button("Back to all queries")!.click());
    await settle();
    expect(title()).toBe("Sources");
  });

  it("lets your own toggle open the list and see that it's open", async () => {
    function AllQueries() {
      const { isOpen, openList } = useArtifactProvenance();
      return createElement("button", { onClick: openList }, isOpen ? "Open" : "All queries");
    }
    await mount(true, [
      createElement(
        LiveArtifactRenderer.Chrome,
        { key: "chrome" },
        createElement(LiveArtifactRenderer.ProvenanceToggle, null, createElement(AllQueries)),
        createElement(LiveArtifactRenderer.Content),
      ),
    ]);
    act(() =>
      [...container.querySelectorAll("button")]
        .find((el) => el.textContent === "All queries")!
        .click(),
    );
    await settle();
    expect(title()).toBe("Sources");
    expect(names()).toHaveLength(5);
    expect(container.textContent).toContain("Open");
  });

  it("lets your own toggle replace the default one and its All queries button", async () => {
    function Mine() {
      const { isInspecting, setInspecting } = useArtifactProvenance();
      return createElement(
        "button",
        { className: "mine", "aria-pressed": isInspecting, onClick: () => setInspecting(true) },
        "Inspect",
      );
    }
    await mount(true, [
      createElement(
        LiveArtifactRenderer.Chrome,
        { key: "chrome" },
        createElement(LiveArtifactRenderer.ProvenanceToggle, null, createElement(Mine)),
        createElement(LiveArtifactRenderer.Content),
      ),
    ]);
    act(() => container.querySelector<HTMLButtonElement>(".mine")!.click());
    await settle();
    expect(artifact().hasAttribute("data-openui-inspecting")).toBe(true);
    expect(container.querySelector(".mine")?.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector(".openui-artifact-provenance-toggle")).toBeNull();
    expect(allQueries()).toBeUndefined();
  });

  it("shows your own contents in the dialog, from Provenance children", async () => {
    function Mine() {
      const { selection, setInspecting } = useArtifactProvenance();
      return createElement(
        "p",
        { className: "mine" },
        `Picked ${selection?.id ?? "nothing"}`,
        createElement("button", { onClick: () => setInspecting(false) }, "Stop"),
      );
    }
    await mount(true, [
      createElement(
        LiveArtifactRenderer.Chrome,
        { key: "chrome" },
        createElement(LiveArtifactRenderer.ProvenanceToggle),
        createElement(
          LiveArtifactRenderer.Content,
          null,
          createElement(LiveArtifactRenderer.Provenance, null, createElement(Mine)),
        ),
      ),
    ]);
    expect(document.querySelector(".mine")).toBeNull();
    await inspect();
    await pick(valueOf("Revenue this quarter"));
    expect(dialog()?.querySelector(".mine")?.textContent).toBe("Picked revenueStop");
    expect(dialog()?.querySelector(".openui-data-sources-panel__rows")).toBeNull();
    // Leaving inspect mode closes the dialog and clears the selection.
    act(() => button("Stop")!.click());
    await settle();
    expect(dialog()).toBeNull();
    expect(container.querySelector("[data-openui-selected]")).toBeNull();
    expect(toggle().getAttribute("aria-pressed")).toBe("false");
  });

  it("does nothing on a click outside inspect mode", async () => {
    await mount();
    await pick(valueOf("Weekly signups"));
    expect(dialog()).toBeNull();
    expect(container.querySelector("[data-openui-selected]")).toBeNull();
  });

  it("adds nothing without enableProvenance", async () => {
    await mount(false);
    expect(container.querySelector(".openui-artifact-provenance-toggle")).toBeNull();
    expect(artifact().hasAttribute("data-openui-inspecting")).toBe(false);
    await pick(valueOf("Weekly signups"));
    expect(dialog()).toBeNull();
    expect(document.querySelector(".openui-data-sources-dialog__overlay")).toBeNull();
  });
});

/** The hover card: portaled to `body`. */
const card = () => document.querySelector<HTMLElement>("[role=tooltip]");
function hover(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  });
}
/** Moves the pointer off the dashboard. */
function leave() {
  act(() => {
    artifact().dispatchEvent(
      new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }),
    );
  });
}
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("The hover card in inspect mode", () => {
  beforeEach(async () => {
    await mount(true, [
      createElement(
        LiveArtifactRenderer.Chrome,
        { key: "chrome" },
        createElement(LiveArtifactRenderer.ProvenanceToggle),
        createElement(
          LiveArtifactRenderer.Content,
          null,
          createElement(LiveArtifactRenderer.Provenance, { describeSource }),
        ),
      ),
    ]);
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("shows a number's source after a 300ms rest, not before", async () => {
    act(() => toggle().click());
    hover(valueOf("Revenue this quarter"));
    await wait(299);
    expect(card()).toBeNull();
    await wait(1);
    expect(card()?.textContent).toContain("Postgres · SQL");
    expect(card()?.textContent).toContain("revenueQ");
    expect(card()?.textContent).toContain("SELECT sum(total) AS revenue FROM orders");
    // One value: the card shows it.
    expect(card()?.textContent).toContain("1 row · revenue 184920");
  });

  it("shows the next card at once while one shows or just closed, and leaves at once", async () => {
    act(() => toggle().click());
    hover(valueOf("Revenue this quarter"));
    await wait(300);
    hover(tile("Daily revenue"));
    expect(card()?.textContent).toContain("dailyQ");
    expect(card()?.textContent).toContain("7 rows · 3 fields");
    leave();
    expect(card()).toBeNull();
    await wait(399);
    hover(valueOf("Weekly signups"));
    expect(card()?.textContent).toContain("PostHog · HogQL");
    leave();
    await wait(400);
    hover(valueOf("Revenue this quarter"));
    expect(card()).toBeNull();
    await wait(300);
    expect(card()?.textContent).toContain("revenueQ");
  });

  it("lists a container's first three queries, then how many more", async () => {
    act(() => toggle().click());
    const board = valueOf("Revenue this quarter").closest(
      "[data-openui-source]:not([data-openui-prop])",
    )!.parentElement!;
    hover(board);
    await wait(300);
    const listed = [...(card()?.querySelectorAll("li") ?? [])].map((el) => el.textContent);
    expect(listed).toEqual(["revenueQPostgres", "signupsQPostHog", "channelsQGA4"]);
    expect(card()?.textContent).toContain("5 queries");
    expect(card()?.textContent).toContain("+2 more");
  });

  it("names a value read from no query by its label, with its formula", async () => {
    act(() => toggle().click());
    hover(valueOf("Gross margin"));
    await wait(300);
    expect(card()?.querySelector(".openui-data-sources-hover-card__name")?.textContent).toBe(
      "Gross margin",
    );
    expect(card()?.textContent).toContain("value: 0.386");
  });

  it("shows a card on keyboard focus, described by it, and hides it on blur", async () => {
    act(() => toggle().click());
    // A focusable tile, as a dashboard's own links and controls are.
    const revenue = valueOf("Revenue this quarter");
    revenue.tabIndex = 0;
    act(() => revenue.focus());
    await wait(300);
    expect(card()?.textContent).toContain("revenueQ");
    expect(revenue.getAttribute("aria-describedby")).toBe(card()!.id);
    expect(getComputedStyle(card()!).pointerEvents).toBe("none");
    act(() => revenue.blur());
    expect(card()).toBeNull();
    expect(revenue.hasAttribute("aria-describedby")).toBe(false);
  });

  it("shows no card outside inspect mode, and none once it ends", async () => {
    hover(valueOf("Revenue this quarter"));
    await wait(1000);
    expect(card()).toBeNull();
    act(() => toggle().click());
    hover(valueOf("Weekly signups"));
    await wait(300);
    expect(card()).not.toBeNull();
    act(() => toggle().click());
    expect(card()).toBeNull();
  });

  it("closes the card when the dialog opens, and doesn't bring it back when it closes", async () => {
    act(() => toggle().click());
    const revenue = valueOf("Revenue this quarter");
    hover(revenue);
    await wait(300);
    expect(card()).not.toBeNull();
    act(() => revenue.click());
    expect(dialog()).not.toBeNull();
    expect(card()).toBeNull();
    act(() => dialog()!.querySelector<HTMLButtonElement>("[aria-label=Close]")!.click());
    await wait(1000);
    expect(card()).toBeNull();
  });

  it("shows no card on a touch screen", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query }));
    try {
      act(() => toggle().click());
      hover(valueOf("Revenue this quarter"));
      await wait(1000);
      expect(card()).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
