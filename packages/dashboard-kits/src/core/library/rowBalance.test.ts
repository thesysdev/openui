// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { releaseDetachedRoots, watchKitRoots, watchedKitRoots } from "./rowBalance";

/** jsdom has no layout: a ResizeObserver the test drives by hand. */
class FakeResizeObserver {
  static last: FakeResizeObserver | null = null;
  readonly targets = new Set<Element>();
  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.last = this;
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
  }
  fire(...targets: Element[]) {
    this.callback(
      targets.map((target) => ({ target }) as ResizeObserverEntry),
      this as unknown as ResizeObserver,
    );
  }
}

let frames: FrameRequestCallback[] = [];
const runFrames = () => {
  const due = frames;
  frames = [];
  for (const cb of due) cb(0);
};
/** Lets queued MutationObserver callbacks run. */
const mutationsSettle = () => new Promise((resolve) => setTimeout(resolve, 0));

function rect(top: number, bottom: number): DOMRect {
  return {
    top,
    bottom,
    height: bottom - top,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
  } as DOMRect;
}

/** A card whose box ends at `bottom` and whose content ends at `contentBottom`. */
function card(bottom: number, contentBottom: number) {
  const el = document.createElement("div");
  el.className = "c1-shell-card";
  el.getBoundingClientRect = () => rect(0, bottom);
  const wrap = document.createElement("div");
  wrap.className = "c1-shell-card__content-wrap";
  wrap.getBoundingClientRect = () => rect(0, contentBottom);
  const block = document.createElement("div");
  block.getBoundingClientRect = () => rect(0, contentBottom);
  wrap.append(block);
  el.append(wrap);
  return el;
}

/** A `.kit-theme` root holding one row of two cards, 600px tall. */
function dashboard(shortContent: number) {
  const root = document.createElement("div");
  root.className = "kit-theme";
  const row = document.createElement("div");
  row.className = "c1-card-row";
  row.append(card(600, 580), card(600, shortContent));
  root.append(row);
  document.body.append(root);
  return { root, row };
}

beforeEach(() => {
  frames = [];
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  document.body.innerHTML = "";
  releaseDetachedRoots();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("row balancer", () => {
  it("observes kit roots, never the document body", () => {
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    const { root } = dashboard(500);
    watchKitRoots();
    expect(observe.mock.calls.map(([target]) => target)).toEqual([root]);
    expect(watchedKitRoots()).toEqual([root]);
  });

  it("ignores DOM changes outside the kit roots", async () => {
    dashboard(500);
    watchKitRoots();
    runFrames();
    document.body.append(document.createElement("div"));
    await mutationsSettle();
    expect(frames).toHaveLength(0);
  });

  it("rescans when a root's own content changes", async () => {
    const { row } = dashboard(500);
    watchKitRoots();
    runFrames();
    const added = card(600, 100);
    row.append(added);
    await mutationsSettle();
    expect(frames).toHaveLength(1);
    runFrames();
    expect(FakeResizeObserver.last!.targets.has(added)).toBe(true);
    expect(row.classList.contains("kit-row--stacked")).toBe(true);
  });

  it("watches each outermost root once", () => {
    const { root } = dashboard(500);
    const nested = document.createElement("div");
    nested.className = "kit-theme";
    root.append(nested);
    watchKitRoots();
    watchKitRoots();
    expect(watchedKitRoots()).toEqual([root]);
  });

  it("stacks a row when a card would sit over a large blank", () => {
    const { row } = dashboard(100);
    watchKitRoots();
    runFrames();
    expect(row.classList.contains("kit-row--stacked")).toBe(true);
  });

  it("leaves a row whose cards are close in height", () => {
    const { row } = dashboard(500);
    watchKitRoots();
    runFrames();
    expect(row.classList.contains("kit-row--stacked")).toBe(false);
  });

  it("lets a root go when it leaves the document, and stops with none left", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const first = dashboard(500).root;
    const second = dashboard(500).root;
    watchKitRoots();
    runFrames();
    expect(watchedKitRoots()).toEqual([first, second]);

    // The resize observer sees a removed root shrink to nothing.
    first.remove();
    FakeResizeObserver.last!.fire(first);
    runFrames();
    expect(watchedKitRoots()).toEqual([second]);
    expect(remove).not.toHaveBeenCalledWith("resize", expect.any(Function));

    // A kit component unmounting with its dashboard releases it too.
    second.remove();
    releaseDetachedRoots();
    expect(watchedKitRoots()).toEqual([]);
    expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
  });
});
