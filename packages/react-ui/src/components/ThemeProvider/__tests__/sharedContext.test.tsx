import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// The package ships the ThemeProvider module in several bundles (root,
// genui-lib, each component subpath; ESM and CJS). Two module instances stand
// in for two bundles here: a provider from one must reach hooks from the other.
async function freshCopy() {
  vi.resetModules();
  return import("../ThemeProvider");
}

describe("ThemeContext across bundled copies", () => {
  it("is one context object however many copies load", async () => {
    const a = await freshCopy();
    const b = await freshCopy();
    expect(a).not.toBe(b);
    expect(a.ThemeContext).toBe(b.ThemeContext);
  });

  it("themes a hook from one copy under a provider from another", async () => {
    const a = await freshCopy();
    const b = await freshCopy();
    function Probe() {
      const { theme, mode } = b.useTheme();
      return <span>{`${mode}:${theme.defaultChartPalette?.join(",")}`}</span>;
    }
    const html = renderToString(
      <a.ThemeProvider mode="dark" darkTheme={{ defaultChartPalette: ["#111111", "#222222"] }}>
        <Probe />
      </a.ThemeProvider>,
    );
    expect(html).toContain("dark:#111111,#222222");
  });
});
