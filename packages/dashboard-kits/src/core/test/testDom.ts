// Test-only jsdom harness for the chart components: a fixed layout size (jsdom
// lays nothing out), a ResizeObserver that reports it, and a manual
// requestAnimationFrame queue so a test steps the shared spring ticker frame
// by frame. Import it only from `*.test.tsx` files running under jsdom.

import { act, createElement, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

let frames: FrameRequestCallback[] = [];
let now = 0;

export function installDom(size = { width: 800, height: 300 }): void {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = (cb) => frames.push(cb);
  globalThis.cancelAnimationFrame = () => {};
  globalThis.ResizeObserver = class {
    private readonly cb: ResizeObserverCallback;
    constructor(cb: ResizeObserverCallback) {
      this.cb = cb;
    }
    observe(target: Element) {
      this.cb(
        [{ target, contentRect: size } as unknown as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  };
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => size.width,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => size.height,
  });
  // jsdom has no SVG geometry; the draw-on entrance only needs a length.
  Object.assign(SVGElement.prototype, {
    getTotalLength: () => 100,
    getPointAtLength: () => ({ x: 0, y: 0 }),
  });
}

/** Runs queued animation frames until none is requested (or `max`); returns how many ran. */
export function runFrames(max = 1000): number {
  for (let k = 0; k < max; k++) {
    if (frames.length === 0) return k;
    const due = frames;
    frames = [];
    now += 16;
    for (const cb of due) cb(now);
  }
  return max;
}

export function mount<P extends object>(Component: ComponentType<P>, props: P) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => root.render(createElement(Component, props)));
  return {
    container,
    rerender(next: P) {
      act(() => root.render(createElement(Component, next)));
    },
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}
