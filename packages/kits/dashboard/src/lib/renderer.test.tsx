// @vitest-environment jsdom
import { createParser, Renderer } from "@openuidev/react-lang";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openuiDashboardLibrary as library, openuiDashboardPromptOptions } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no ResizeObserver or matchMedia; the charts and cards only need them to exist.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

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

/** Renders one MediumCard holding `body`, the way a model's dashboard would. */
function renderCard(body: string, extra = "") {
  const program = `root = Dashboard([section])
section = Section([row])
row = CardRow([card])
card = MediumCard([${body}])
${extra}`;
  act(() => root.render(<Renderer response={program} library={library} />));
}

const parse = (program: string) =>
  createParser(library.toJSONSchema(), library.root).parse(program).meta.errors;

describe("Table", () => {
  it("right-aligns number columns", () => {
    renderCard(`Table([Col("Name", ["A"]), Col("Units", [5], "number")])`);

    const [nameHead, unitsHead] = container.querySelectorAll(".openui-table-head");
    const [nameCell, unitsCell] = container.querySelectorAll(".openui-table-cell");
    expect(nameHead?.className).not.toContain("align-right");
    expect(nameCell?.className).not.toContain("align-right");
    expect(unitsHead?.className).toContain("openui-table-head--align-right");
    expect(unitsCell?.className).toContain("openui-table-cell--align-right");
  });
});

describe("trends", () => {
  it("shows the sign once when a down trend has a negative value", () => {
    renderCard(`MetricIndicator("$1.2M", "Revenue", {direction: "down", value: -3})`);

    const trend = container.querySelector(".openui-metric-indicator-trend");
    expect(trend?.textContent).toBe("-3%");
  });

  it("shows the sign once on a SmallCard trend", () => {
    const program = `root = Dashboard([section])
section = Section([row])
row = CardRow([SmallCard("Churn", "2.4%", {direction: "down", value: -0.3})])`;
    act(() => root.render(<Renderer response={program} library={library} />));

    expect(container.querySelector(".openui-dashboard-small-card-trend")?.textContent).toBe(
      "-0.3%",
    );
  });
});

describe("TextContent", () => {
  it("applies size by pointing the body token at another size", () => {
    renderCard(`TextContent("Big text", "large-heavy")`);

    const sized = container.querySelector<HTMLElement>("[style*='--openui-text-body-default']");
    expect(sized?.style.getPropertyValue("--openui-text-body-default")).toBe(
      "var(--openui-text-body-lg-heavy)",
    );
    expect(sized?.style.getPropertyValue("--openui-font-variation-regular")).toBe(
      "var(--openui-font-variation-medium)",
    );
  });

  it("leaves default-size text unwrapped", () => {
    renderCard(`TextContent("Plain text")`);

    expect(container.querySelector("[style*='--openui-text-body-default']")).toBeNull();
  });
});

describe("Section and DatePicker labels", () => {
  it("renders a Section title and a DatePicker label", () => {
    const program = `root = Dashboard([section])
section = Section([row], FilterBar([DatePicker("day", "single", null, null, "Day")]), "Sales")
row = CardRow([SmallCard("Health", "87")])`;
    act(() => root.render(<Renderer response={program} library={library} />));

    expect(container.querySelector(".openui-dashboard-section-title")?.textContent).toBe("Sales");
    const field = container.querySelector(".openui-dashboard-date-field");
    expect(field?.querySelector(".openui-dashboard-date-field-label")?.textContent).toBe("Day");
    expect(field?.querySelector(".openui-date-picker")).not.toBeNull();
  });
});

describe("PieChart", () => {
  it("drops the MediumCard stacked legend when legend is false", () => {
    renderCard(`PieChart(["A", "B"], [3, 2])`);
    expect(container.querySelector(".openui-stacked-legend")).not.toBeNull();

    renderCard(`PieChart(["A", "B"], [3, 2], null, null, null, null, null, false)`);
    expect(container.querySelector(".openui-stacked-legend")).toBeNull();
  });
});

describe("actions", () => {
  it("teaches the action syntax in the prompt", () => {
    const prompt = library.prompt(openuiDashboardPromptOptions);
    expect(prompt).toContain("## Action");
    expect(prompt).toContain("Button(label: string, action?: ActionExpression");
    expect(prompt).toContain(
      "IconButton(label: string, icon: string, category?: string, action?: ActionExpression",
    );
  });

  it("accepts an action step", () => {
    expect(
      parse(`root = Dashboard([s])
s = Section([r])
r = CardRow([c])
c = MediumCard([Button("Docs", @OpenUrl("https://openui.com"))])`),
    ).toEqual([]);
  });

  it("sends the label when a string lands in the action slot", () => {
    const actions: unknown[] = [];
    const program = `root = Dashboard([s])
s = Section([r])
r = CardRow([c])
c = MediumCard([Button("Export", "secondary")])`;
    act(() =>
      root.render(
        <Renderer response={program} library={library} onAction={(e) => actions.push(e)} />,
      ),
    );

    const button = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "Export",
    );
    act(() => button!.click());
    expect(actions).toEqual([expect.objectContaining({ humanFriendlyMessage: "Export" })]);
  });
});
