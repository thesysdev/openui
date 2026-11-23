// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  dashboardLibrary,
  dashboardProgram,
  interpreter,
} from "../../DataSourcesPanel/stories/fixtures";
import { LiveArtifactRenderer } from "../ArtifactRenderer";

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
const panel = () => container.querySelector(".openui-data-sources-panel")!;
const slot = () => container.querySelector(".openui-data-sources-slot")!;
const toggle = () =>
  container.querySelector<HTMLButtonElement>(".openui-artifact-provenance-toggle")!;
const valueOf = (title: string) =>
  [...container.querySelectorAll("[data-openui-prop='value']")].find((el) =>
    el.closest("[data-openui-source]:not([data-openui-prop])")?.textContent?.includes(title),
  ) as HTMLElement;

async function mount(enableProvenance = true) {
  act(() =>
    root.render(
      createElement(LiveArtifactRenderer, {
        id: "demo-retail",
        content: dashboardProgram,
        library: dashboardLibrary,
        interpreter,
        preview: false,
        enableProvenance,
        children: createElement(LiveArtifactRenderer.Chrome),
      }),
    ),
  );
  await settle();
}

describe("Sources in a live artifact", () => {
  it("docks a closed panel beside the content, opened by the Sources toggle", async () => {
    await mount();
    expect(toggle().textContent).toBe("Sources");
    expect(slot().getAttribute("data-open")).toBe("false");
    expect(slot().hasAttribute("inert")).toBe(true);
    act(() => toggle().click());
    await settle();
    expect(slot().getAttribute("data-open")).toBe("true");
    expect(slot().hasAttribute("inert")).toBe(false);
    const names = [...panel().querySelectorAll(".openui-data-sources-panel__list-label")].map(
      (el) => el.textContent,
    );
    expect(names).toEqual([
      "Revenue this quarter",
      "Daily revenue",
      "Weekly signups",
      // No describeSource here: a request keeps its statement's name, a script too.
      "Channels",
      "Target",
    ]);
  });

  it("shows a clicked number's source, value and query", async () => {
    await mount();
    act(() => toggle().click());
    await settle();
    act(() => valueOf("Revenue this quarter").click());
    await settle();
    expect(panel().querySelector("h2")?.textContent).toBe("Revenue this quarter");
    expect(panel().querySelector(".openui-data-sources-panel__focus-value")?.textContent).toBe(
      "184,920",
    );
    expect(panel().textContent).toContain("SQL");
  });

  it("offers See source when a number is clicked with Sources closed", async () => {
    await mount();
    act(() => valueOf("Weekly signups").click());
    const chip = container.querySelector<HTMLButtonElement>(".openui-data-sources-chip button");
    expect(chip?.textContent).toBe("See source");
    act(() => chip!.click());
    await settle();
    expect(slot().getAttribute("data-open")).toBe("true");
    expect(panel().querySelector("h2")?.textContent).toBe("Weekly signups");
  });

  it("adds nothing without enableProvenance", async () => {
    await mount(false);
    expect(container.querySelector(".openui-data-sources-workspace")).toBeNull();
    expect(container.querySelector(".openui-artifact-provenance-toggle")).toBeNull();
  });
});
