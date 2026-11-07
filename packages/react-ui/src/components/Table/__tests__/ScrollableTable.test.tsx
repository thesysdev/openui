// @vitest-environment jsdom
import { act } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollableTable, TableBody, TableCell, TableRow } from "../Table";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class CountingResizeObserver {
  static created = 0;
  constructor() {
    CountingResizeObserver.created += 1;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const rows = (count: number) => (
  <ScrollableTable>
    <TableBody>
      {Array.from({ length: count }, (_, i) => (
        <TableRow key={i}>
          <TableCell>{`row ${i + 1}`}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </ScrollableTable>
);

describe("ScrollableTable", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    CountingResizeObserver.created = 0;
    vi.stubGlobal("ResizeObserver", CountingResizeObserver);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("measures once per mount while streamed rows arrive", () => {
    // A streamed table re-renders with new children on every chunk, and a
    // stream catching up after a long render lands as one burst of sync
    // commits. Re-measuring per render set state inside each passive-effect
    // flush and tripped React's "Maximum update depth exceeded".
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    act(() => root.render(rows(1)));
    act(() => {
      for (let count = 2; count <= 80; count++) flushSync(() => root.render(rows(count)));
    });

    expect(container.querySelectorAll("tbody tr")).toHaveLength(80);
    expect(CountingResizeObserver.created).toBe(1);
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("Maximum update depth");
    consoleError.mockRestore();
  });
});
