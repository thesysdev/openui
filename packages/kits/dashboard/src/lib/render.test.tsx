// @vitest-environment jsdom
import { Renderer } from "@openuidev/react-lang";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openuiDashboardLibrary } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// jsdom has no ResizeObserver, which react-components' table needs.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let container: HTMLDivElement;
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

const render = (program: string) =>
  act(() => root.render(<Renderer response={program} library={openuiDashboardLibrary} />));

const one = (selector: string) => {
  const element = container.querySelector<HTMLElement>(selector);
  expect(element, selector).not.toBeNull();
  return element!;
};

describe("values from the model", () => {
  it("a SmallCard shows a number as its metric", () => {
    render(`root = Dashboard([section])
section = Section([row])
row = CardRow([card])
card = SmallCard("Events", 4500)`);
    expect(one(".openui-dashboard-small-card-metric").textContent).toBe("4500");
  });

  it("a number column aligns right", () => {
    render(`root = Dashboard([section])
section = Section([row])
row = CardRow([card])
card = LargeCard([table])
table = Table([Col("Name", ["Ann"]), Col("Amount", [1200], "number")])`);
    const [nameHead, amountHead] = [...container.querySelectorAll("th")];
    const [nameCell, amountCell] = [...container.querySelectorAll("td")];
    expect(nameHead!.className).toMatch(/-left\b/);
    expect(nameCell!.className).toMatch(/-left\b/);
    expect(amountHead!.className).toMatch(/-right\b/);
    expect(amountCell!.className).toMatch(/-right\b/);
  });
});

describe("FilterSelect", () => {
  const program = `root = Dashboard([section])
section = Section([row], bar)
bar = FilterBar([region])
region = FilterSelect("region", "Region", [{value: "all", label: "All Regions"}, {value: "na", label: "North America"}], "all")
row = CardRow([card])
card = SmallCard("Revenue", "$1.2M")`;

  it("names its trigger from its label", () => {
    render(program);
    const trigger = one(".openui-dashboard-filter-select-trigger");
    const names = trigger
      .getAttribute("aria-labelledby")!
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent?.trim());
    expect(names[0]).toBe("Region");
    expect(names[1]).toContain("All Regions");
  });

  it("closes on Escape and returns focus to its trigger", () => {
    render(program);
    const trigger = one(".openui-dashboard-filter-select-trigger");
    act(() => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });
});
