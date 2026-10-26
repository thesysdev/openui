// @vitest-environment jsdom
import { act, createElement } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { installDom, mount } from "../../test/testDom";
import { DefinitionTip } from "../DefinitionTip";
import { clampToWindow, placeBeside } from "./KitLayer";

beforeAll(() => installDom());
afterEach(() => vi.useRealTimers());

function rect(left: number, top: number, width: number, height: number) {
  return { left, top, width, height, right: left + width, bottom: top + height } as DOMRect;
}

describe("placeBeside", () => {
  it("goes below the element when there is room", () => {
    expect(placeBeside(rect(100, 100, 80, 20), 200, 60)).toEqual({ top: 126, left: 100 });
  });

  it("goes above the element near the bottom of the window", () => {
    const at = placeBeside(rect(100, window.innerHeight - 30, 80, 20), 200, 60);
    expect(at.top).toBe(window.innerHeight - 30 - 6 - 60);
  });

  it("stays inside the window at its right edge", () => {
    const at = placeBeside(rect(window.innerWidth - 40, 100, 30, 20), 200, 60);
    expect(at.left).toBe(window.innerWidth - 8 - 200);
  });
});

describe("clampToWindow", () => {
  it("pulls a point-anchored popup back inside the window", () => {
    expect(clampToWindow(-20, window.innerHeight + 50, 100, 80)).toEqual({
      x: 8,
      y: window.innerHeight - 8 - 80,
    });
  });
});

describe("DefinitionTip", () => {
  it("draws on document.body, outside the card that would clip it, once hovered", () => {
    vi.useFakeTimers();
    function Card() {
      return createElement(
        "div",
        { className: "kit-theme", "data-mode": "dark", style: { overflow: "hidden" } },
        createElement(
          "span",
          { className: "kit-def-host" },
          createElement("span", { "aria-describedby": "def-orders" }, "Orders"),
          createElement(DefinitionTip, {
            id: "def-orders",
            definition: { formula: "Orders placed", window: "Selected period" },
          }),
        ),
      );
    }
    const { container, unmount } = mount(Card, {});
    const tip = document.getElementById("def-orders")!;
    expect(container.contains(tip)).toBe(false);
    expect(tip.closest(".kit-layer")?.getAttribute("data-mode")).toBe("dark");
    expect(tip.hasAttribute("data-open")).toBe(false);

    const host = container.querySelector(".kit-def-host")!;
    act(() => {
      host.dispatchEvent(new MouseEvent("mouseenter"));
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(tip.hasAttribute("data-open")).toBe(true);

    act(() => {
      host.dispatchEvent(new MouseEvent("mouseleave"));
    });
    expect(tip.hasAttribute("data-open")).toBe(false);
    unmount();
  });
});
