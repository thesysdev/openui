// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  dashboardLibrary,
  dashboardProgram,
  interpreter,
} from "../../SourcesContents/stories/fixtures";
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
const toggle = () =>
  container.querySelector<HTMLButtonElement>(".openui-artifact-provenance-toggle")!;
const valueOf = (title: string) =>
  [...container.querySelectorAll("[data-openui-prop='value']")].find((el) =>
    el.closest("[data-openui-source]:not([data-openui-prop])")?.textContent?.includes(title),
  ) as HTMLElement;
const button = (name: string) =>
  [...(dialog()?.querySelectorAll("button") ?? [])].find(
    (el) => el.getAttribute("aria-label") === name || el.textContent?.startsWith(name),
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
  it("enters inspect mode from the Sources button, with nothing open yet", async () => {
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

  it("opens a picked item's popover, never this dialog", async () => {
    await mount();
    await inspect();
    await pick(valueOf("Revenue this quarter"));
    expect(document.querySelectorAll("[role=dialog]")).toHaveLength(1);
    expect(dialog()?.getAttribute("aria-label")).toBe("Sources for Revenue this quarter");
    expect(document.querySelector(".openui-data-sources-dialog")).toBeNull();
  });

  it("steps back one Escape at a time: the popover, then inspect mode", async () => {
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

  it("leaves no focus on the picked item once Escape ends inspect mode: the toggle gets it", async () => {
    await mount();
    await inspect();
    await pick(tile("Daily revenue"));
    const picked = container.querySelector<HTMLElement>("[data-openui-selected]")!;
    await escape();
    expect(document.activeElement).toBe(picked);
    await escape();
    expect(artifact().hasAttribute("data-openui-inspecting")).toBe(false);
    expect(picked.hasAttribute("tabindex")).toBe(false);
    expect(document.activeElement).toBe(toggle());
  });

  it("leaves no focus on the picked item when the toggle ends inspect mode", async () => {
    await mount();
    await inspect();
    const revenue = valueOf("Revenue this quarter");
    await pick(revenue);
    await escape();
    expect(document.activeElement).toBe(revenue);
    await inspect();
    expect(revenue.hasAttribute("tabindex")).toBe(false);
    expect(document.activeElement).toBe(toggle());
  });

  it("leaves no focus on the picked item when Escape is pressed twice in a row", async () => {
    await mount();
    await inspect();
    await pick(tile("Daily revenue"));
    const picked = container.querySelector<HTMLElement>("[data-openui-selected]")!;
    const press = () =>
      act(() => {
        (document.activeElement ?? document.body).dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
        );
      });
    // The second one comes while the popover is still leaving.
    press();
    press();
    await settle();
    expect(artifact().hasAttribute("data-openui-inspecting")).toBe(false);
    expect(picked.hasAttribute("tabindex")).toBe(false);
    expect(document.activeElement).toBe(toggle());
  });

  it("lets your own toggle replace the default split button", async () => {
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
    expect(container.querySelector(".openui-artifact-sources-chevron")).toBeNull();
  });

  it("shows your own contents in the item's popover, from Provenance children", async () => {
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
    expect(dialog()?.querySelector(".openui-data-sources-dialog__rows")).toBeNull();
    // Leaving inspect mode closes the popover and clears the selection.
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
