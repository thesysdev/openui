// @vitest-environment jsdom
import { act } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { installDom, mount } from "../../core/test/testDom";
import { SegmentFlow } from "./SegmentFlow";

beforeAll(() => installDom());

const props = {
  links: [
    { from: "Loyal", to: "Loyal", value: 50 },
    { from: "Loyal", to: "At risk", value: 10 },
    { from: "At risk", to: "Loyal", value: 8 },
  ],
  order: ["Loyal", "At risk"],
};

function press(el: Element, key: string) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  });
}

describe("SegmentFlow keyboard reading", () => {
  it("is focusable and walks the ribbons into the live readout", () => {
    const view = mount(SegmentFlow, props);
    const frame = view.container.querySelector<HTMLElement>(".kit-flow-frame")!;
    const readout = view.container.querySelector(".kit-flow-readout")!;
    expect(frame.tabIndex).toBe(0);
    expect(frame.getAttribute("aria-label")).toMatch(/arrow keys/);
    expect(readout.closest("[aria-live]")).not.toBeNull();

    act(() => frame.focus());
    press(frame, "ArrowRight");
    const first = readout.textContent;
    expect(first).toMatch(/→ .*: \d+ customers/);
    press(frame, "ArrowRight");
    const second = readout.textContent;
    expect(second).not.toBe(first);
    press(frame, "ArrowLeft");
    expect(readout.textContent).toBe(first);
    // Only the ribbon read out stays lit.
    expect(view.container.querySelectorAll(".kit-flow-ribbon--faded").length).toBe(2);

    press(frame, "Escape");
    expect(readout.textContent).toBe("Hover a segment or a move");
    view.unmount();
  });
});
