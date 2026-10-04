import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChartPalette } from "../../Charts/utils/paletteUtils";
import { defaultDarkTheme, defaultLightTheme } from "../defaultTheme";
import { ThemeProvider, useTheme } from "../ThemeProvider";
import type { ChartColorPalette, Theme } from "../types";
import { CHART_PALETTE_KEYS } from "../types";
import { createTheme, KNOWN_THEME_KEYS } from "../utils";

// Regression tests for the types-vs-runtime drift where every `*ChartPalette`
// key (valid per the Theme type) was rejected as "unknown key" by both
// validators because the allow-list only contained Object.keys(defaultLightTheme).
// See https://github.com/thesysdev/openui/issues/714

// `Required` forces this literal to cover every declared palette key, so a new
// key added to ChartColorPalette fails compilation here until it is tested.
const allChartPalettes: Required<ChartColorPalette> = {
  defaultChartPalette: ["#101010", "#202020", "#303030"],
  barChartPalette: ["#111111", "#222222", "#333333"],
  lineChartPalette: ["#414141", "#525252", "#636363"],
  areaChartPalette: ["#747474", "#858585", "#969696"],
  pieChartPalette: ["#a7a7a7", "#b8b8b8", "#c9c9c9"],
  radarChartPalette: ["#dadada", "#ebebeb", "#fcfcfc"],
  radialChartPalette: ["#0d0d0d", "#1e1e1e", "#2f2f2f"],
  horizontalBarChartPalette: ["#404040", "#515151", "#626262"],
};

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("theme validator allow-list", () => {
  it("covers every declared chart palette key", () => {
    const missing = CHART_PALETTE_KEYS.filter((key) => !KNOWN_THEME_KEYS.has(key));
    expect(missing).toEqual([]);
  });

  it("covers every key of the default themes", () => {
    const missingLight = Object.keys(defaultLightTheme).filter((k) => !KNOWN_THEME_KEYS.has(k));
    const missingDark = Object.keys(defaultDarkTheme).filter((k) => !KNOWN_THEME_KEYS.has(k));
    expect(missingLight).toEqual([]);
    expect(missingDark).toEqual([]);
  });
});

describe("createTheme", () => {
  it("does not warn for any declared chart palette key", () => {
    createTheme({ ...allChartPalettes });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("still warns with a suggestion for a genuine typo", () => {
    createTheme({ defaultChartPalete: ["#ffffff"] } as unknown as Theme);
    expect(warnSpy).toHaveBeenCalledWith(
      '[OpenUI] Unknown theme key "defaultChartPalete". Did you mean "defaultChartPalette"?',
    );
  });
});

describe("ThemeProvider prop validation", () => {
  it("does not warn for chart palette keys on lightTheme or darkTheme", () => {
    renderToString(
      <ThemeProvider
        mode="dark"
        lightTheme={{ ...allChartPalettes }}
        darkTheme={{ ...allChartPalettes }}
      >
        <span />
      </ThemeProvider>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('still warns "unknown key" for keys not on the Theme type', () => {
    renderToString(
      <ThemeProvider lightTheme={{ bogusThemeKey: "red" } as unknown as Theme}>
        <span />
      </ThemeProvider>,
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[OpenUI] lightTheme contains unknown key "bogusThemeKey". It will be ignored. Use createTheme() for typo detection with suggestions.',
    );
  });
});

describe("chart palette flow (theme -> useTheme -> useChartPalette)", () => {
  it("delivers user palettes to charts and falls back to defaultChartPalette", () => {
    const defaultPalette = ["#57c8d6", "#ff6a2b", "#aabbcc"];
    const barPalette = ["#111111", "#222222", "#333333"];

    let themeFromContext: Theme | undefined;
    let barColors: string[] = [];
    let lineColors: string[] = [];

    const Probe = () => {
      const { theme } = useTheme();
      themeFromContext = theme;
      // Exactly what BarChart does.
      barColors = useChartPalette({
        themePaletteName: "barChartPalette",
        dataLength: 2,
      });
      // lineChartPalette is not set -> must fall back to defaultChartPalette.
      lineColors = useChartPalette({
        themePaletteName: "lineChartPalette",
        dataLength: 2,
      });
      return null;
    };

    renderToString(
      <ThemeProvider
        mode="dark"
        darkTheme={createTheme({
          defaultChartPalette: defaultPalette,
          barChartPalette: barPalette,
        })}
      >
        <Probe />
      </ThemeProvider>,
    );

    expect(themeFromContext?.defaultChartPalette).toEqual(defaultPalette);
    expect(themeFromContext?.barChartPalette).toEqual(barPalette);
    expect(barColors.length).toBe(2);
    expect(barColors.every((color) => barPalette.includes(color))).toBe(true);
    expect(lineColors.length).toBe(2);
    expect(lineColors.every((color) => defaultPalette.includes(color))).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
