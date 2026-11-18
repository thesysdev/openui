// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// https://github.com/thesysdev/openui/issues/819

const streaming = vi.hoisted(() => ({ value: false }));
vi.mock("@openuidev/react-lang", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@openuidev/react-lang")>()),
  useIsStreaming: () => streaming.value,
}));

const { TabsRenderer } = await import("../index");

type Tab = { value: string; trigger: string; content: string[] };

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (tabs: Tab[], isStreaming: boolean) => {
  streaming.value = isStreaming;
  const props = { items: tabs.map((props) => ({ props })) };
  act(() => {
    root.render(
      <TabsRenderer
        props={props as never}
        renderNode={(content) => (content as string[]).join(" ")}
        {...({} as never)}
      />,
    );
  });
};

const selectedTab = () =>
  container.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim();

const threeTabs: Tab[] = [
  { value: "overview", trigger: "Overview", content: ["First tab"] },
  { value: "details", trigger: "Details", content: ["Second tab"] },
  { value: "history", trigger: "History", content: ["Third tab"] },
];

describe("Tabs selection", () => {
  it("selects the first tab when the whole program renders at once", () => {
    render(threeTabs, false);
    expect(selectedTab()).toBe("Overview");
  });

  it("selects the first tab when a stream delivers every tab in one chunk", () => {
    render(threeTabs, true);
    expect(selectedTab()).toBe("Overview");
  });

  it("follows the tab the model is writing into while streaming", () => {
    render(threeTabs.slice(0, 2), true);
    expect(selectedTab()).toBe("Overview");

    render(threeTabs, true);
    expect(selectedTab()).toBe("History");
  });

  it("stays put when another tab's content grows after streaming, e.g. a Query resolving", () => {
    render(threeTabs, false);
    render(
      threeTabs.map((tab) =>
        tab.value === "details" ? { ...tab, content: [...tab.content, "Alpha"] } : tab,
      ),
      false,
    );
    expect(selectedTab()).toBe("Overview");
  });
});
