// @vitest-environment jsdom
import { act, createContext, createElement, useContext, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "../library";
import { Renderer } from "../Renderer";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// A host context the component needs; it throws until the host provides it.
const Ready = createContext(false);
const Needy = defineComponent({
  name: "Needy",
  props: z.object({ label: z.string() }),
  description: "Needy",
  component: ({ props }) => {
    if (!useContext(Ready)) throw new Error("not ready");
    return createElement("span", null, props.label);
  },
});
const library = createLibrary({ root: "Needy", components: [Needy] });

// The longest wait between retries (RETRY_MAX_MS in Renderer.tsx).
const RETRY_MAX = 5000;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

it("recovers when a host context it needs becomes available", () => {
  let setReady: (v: boolean) => void = () => {};
  function Host() {
    const [ready, set] = useState(false);
    setReady = set;
    return createElement(
      Ready.Provider,
      { value: ready },
      createElement(Renderer, { response: 'root = Needy("ok")', library }),
    );
  }
  const el = document.createElement("div");
  act(() => createRoot(el).render(createElement(Host)));
  expect(el.textContent).toBe("");
  act(() => setReady(true));
  // At most the first wait between retries.
  act(() => vi.advanceTimersByTime(50));
  expect(el.textContent).toBe("ok");
});

it("still recovers when the host context becomes available after many re-renders", () => {
  let setReady: (v: boolean) => void = () => {};
  let setTick: (v: number) => void = () => {};
  function Host() {
    const [ready, set] = useState(false);
    const [tick, tickSet] = useState(0);
    setReady = set;
    setTick = tickSet;
    return createElement(
      Ready.Provider,
      { value: ready },
      createElement("i", { "data-tick": tick }),
      createElement(Renderer, { response: 'root = Needy("ok")', library }),
    );
  }
  const el = document.createElement("div");
  act(() => createRoot(el).render(createElement(Host)));
  // Parent renders that don't fix anything use up the immediate retry.
  for (let i = 1; i <= 5; i++) act(() => setTick(i));
  expect(el.textContent).toBe("");
  // The host becomes ready mid-wait: retried once the wait is over.
  act(() => setReady(true));
  act(() => vi.advanceTimersByTime(RETRY_MAX));
  expect(el.textContent).toBe("ok");
});

it("recovers after a long run of failed retries", () => {
  let setReady: (v: boolean) => void = () => {};
  let setTick: (v: number) => void = () => {};
  function Host() {
    const [ready, set] = useState(false);
    const [tick, tickSet] = useState(0);
    setReady = set;
    setTick = tickSet;
    return createElement(
      Ready.Provider,
      { value: ready },
      createElement("i", { "data-tick": tick }),
      createElement(Renderer, { response: 'root = Needy("ok")', library }),
    );
  }
  const el = document.createElement("div");
  act(() => createRoot(el).render(createElement(Host)));
  // A minute of failing parent renders, one a second: the wait reaches its cap.
  for (let i = 1; i <= 60; i++) {
    act(() => setTick(i));
    act(() => vi.advanceTimersByTime(1000));
  }
  expect(el.textContent).toBe("");
  act(() => setReady(true));
  act(() => vi.advanceTimersByTime(RETRY_MAX));
  expect(el.textContent).toBe("ok");
});
