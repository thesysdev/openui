import { ThemeProvider as ReactComponentsThemeProvider } from "@openuidev/react-components";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useChartPalette } from "../../Charts/utils/paletteUtils";
import { ThemeProvider, useTheme } from "../ThemeProvider";

describe("theme provider shared with @openuidev/react-components", () => {
  it("is the same component as the react-components ThemeProvider", () => {
    expect(ThemeProvider).toBe(ReactComponentsThemeProvider);
  });

  it("themes react-ui components from a react-components ThemeProvider", () => {
    const barPalette = ["#111111", "#222222", "#333333"];
    let mode: string | undefined;
    let portalThemeClassName: string | undefined;
    let barColors: string[] = [];

    const Probe = () => {
      ({ mode, portalThemeClassName } = useTheme());
      // Exactly what BarChart does.
      barColors = useChartPalette({ themePaletteName: "barChartPalette", dataLength: 2 });
      return null;
    };

    renderToString(
      <ReactComponentsThemeProvider mode="dark" darkTheme={{ barChartPalette: barPalette }}>
        <Probe />
      </ReactComponentsThemeProvider>,
    );

    expect(mode).toBe("dark");
    expect(portalThemeClassName).toMatch(/^openui-theme-portal-/);
    expect(barColors).toEqual(["#111111", "#333333"]);
  });
});
