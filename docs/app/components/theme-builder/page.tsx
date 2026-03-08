"use client";

import { useAppTheme } from "@components/components/AppThemeProvider/AppThemeProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@openuidev/react-ui";
import {
  ThemeProvider,
  swatch,
  withAlpha,
  type BrandSwatchName,
  type NeutralSwatchName,
  type Theme,
} from "@openuidev/react-ui/ThemeProvider";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import styles from "./page.module.css";

const RealBlocksCanvas = dynamic(
  () => import("@components/components/ThemeBuilder/realBlocksCanvas"),
  { ssr: false },
);

type ScaleOption = "compact" | "default" | "comfortable";
type RadiusScaleOption = "none" | "small" | "default" | "large" | "full";
type FontOption =
  | "google-sans"
  | "inter"
  | "roboto"
  | "poppins"
  | "lato"
  | "montserrat"
  | "nunito"
  | "playfair-display"
  | "merriweather"
  | "source-sans-3"
  | "dm-sans";

const BASE_COLOR_OPTIONS: Array<{ value: NeutralSwatchName; label: string }> = [
  { value: "neutral", label: "Neutral" },
  { value: "slate", label: "Slate" },
  { value: "gray", label: "Gray" },
  { value: "zinc", label: "Zinc" },
  { value: "stone", label: "Stone" },
];

const ACCENT_COLOR_OPTIONS: Array<{ value: BrandSwatchName; label: string }> = [
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "pink", label: "Pink" },
  { value: "teal", label: "Teal" },
  { value: "cyan", label: "Cyan" },
  { value: "emerald", label: "Emerald" },
  { value: "violet", label: "Violet" },
  { value: "neutral", label: "Neutral" },
];

const SCALE_OPTIONS: Array<{ value: ScaleOption; label: string }> = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "comfortable", label: "Comfortable" },
];

const RADIUS_SCALE_OPTIONS: Array<{ value: RadiusScaleOption; label: string }> = [
  { value: "none", label: "None" },
  { value: "small", label: "Small" },
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
  { value: "full", label: "Full" },
];

const FONT_OPTIONS: Array<{ value: FontOption; label: string; family: string }> = [
  {
    value: "google-sans",
    label: "Google Sans",
    family: '"Google Sans Text", "Google Sans", sans-serif',
  },
  { value: "inter", label: "Inter", family: 'var(--font-inter), "Inter", sans-serif' },
  { value: "roboto", label: "Roboto", family: 'var(--font-roboto), "Roboto", sans-serif' },
  { value: "poppins", label: "Poppins", family: 'var(--font-poppins), "Poppins", sans-serif' },
  { value: "lato", label: "Lato", family: 'var(--font-lato), "Lato", sans-serif' },
  {
    value: "montserrat",
    label: "Montserrat",
    family: 'var(--font-montserrat), "Montserrat", sans-serif',
  },
  { value: "nunito", label: "Nunito", family: 'var(--font-nunito), "Nunito", sans-serif' },
  {
    value: "playfair-display",
    label: "Playfair Display",
    family: 'var(--font-playfair-display), "Playfair Display", serif',
  },
  {
    value: "merriweather",
    label: "Merriweather",
    family: 'var(--font-merriweather), "Merriweather", serif',
  },
  {
    value: "source-sans-3",
    label: "Source Sans 3",
    family: 'var(--font-source-sans-3), "Source Sans 3", sans-serif',
  },
  { value: "dm-sans", label: "DM Sans", family: 'var(--font-dm-sans), "DM Sans", sans-serif' },
];

const SPACING_SCALE_MULTIPLIER: Record<ScaleOption, number> = {
  compact: 0.85,
  default: 1,
  comfortable: 1.2,
};

const RADIUS_PRESET_BASE: Record<RadiusScaleOption, number> = {
  none: 0,
  small: 1,
  default: 2,
  large: 2.5,
  full: 3.25,
};

const getBrandBaseShade = (brandSwatch: BrandSwatchName): 600 | 1000 =>
  brandSwatch === "neutral" ||
  brandSwatch === "slate" ||
  brandSwatch === "gray" ||
  brandSwatch === "zinc" ||
  brandSwatch === "stone"
    ? 1000
    : 600;

const toPx = (value: number): string => {
  if (value === 0) {
    return "0";
  }
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}px`;
};

const CODE_FONT_FAMILY = '"SFMono-Regular", Menlo, monospace';

const buildTypographyOverrides = (fontFamily: string): Partial<Theme> => ({
  fontBody: fontFamily,
  fontHeading: fontFamily,
  fontLabel: fontFamily,
  fontNumbers: fontFamily,
  fontCode: CODE_FONT_FAMILY,

  textBodyXs: `400 12px/1.5 ${fontFamily}`,
  textBodyXsHeavy: `500 12px/1.5 ${fontFamily}`,
  textBodySm: `400 14px/1.5 ${fontFamily}`,
  textBodySmHeavy: `500 14px/1.5 ${fontFamily}`,
  textBodyDefault: `400 16px/1.5 ${fontFamily}`,
  textBodyDefaultHeavy: `500 16px/1.5 ${fontFamily}`,
  textBodyLg: `400 18px/1.5 ${fontFamily}`,
  textBodyLgHeavy: `500 18px/1.5 ${fontFamily}`,

  textHeadingXs: `600 16px/1.25 ${fontFamily}`,
  textHeadingSm: `600 18px/1.25 ${fontFamily}`,
  textHeadingMd: `600 24px/1.1 ${fontFamily}`,
  textHeadingLg: `600 28px/1.1 ${fontFamily}`,
  textHeadingXl: `700 32px/1.1 ${fontFamily}`,

  textLabelXs: `400 12px/1.25 ${fontFamily}`,
  textLabelXsHeavy: `500 12px/1.25 ${fontFamily}`,
  textLabelSm: `400 14px/1.25 ${fontFamily}`,
  textLabelSmHeavy: `500 14px/1.25 ${fontFamily}`,
  textLabelDefault: `400 16px/1.25 ${fontFamily}`,
  textLabelDefaultHeavy: `500 16px/1.25 ${fontFamily}`,
  textLabelLg: `400 18px/1.25 ${fontFamily}`,
  textLabelLgHeavy: `500 18px/1.25 ${fontFamily}`,

  textNumbersXs: `400 12px/1.5 ${fontFamily}`,
  textNumbersXsHeavy: `500 12px/1.5 ${fontFamily}`,
  textNumbersSm: `400 14px/1.5 ${fontFamily}`,
  textNumbersSmHeavy: `500 14px/1.5 ${fontFamily}`,
  textNumbersDefault: `400 16px/1.5 ${fontFamily}`,
  textNumbersDefaultHeavy: `500 16px/1.5 ${fontFamily}`,
  textNumbersLg: `400 18px/1.5 ${fontFamily}`,
  textNumbersLgHeavy: `500 18px/1.5 ${fontFamily}`,

  textCodeSm: `400 12px/1.5 ${CODE_FONT_FAMILY}`,
  textCodeSmHeavy: `700 12px/1.5 ${CODE_FONT_FAMILY}`,
  textCodeDefault: `400 14px/1.5 ${CODE_FONT_FAMILY}`,
  textCodeDefaultHeavy: `700 14px/1.5 ${CODE_FONT_FAMILY}`,
});

function buildThemeOverrides({
  mode,
  baseColor,
  accentColor,
  fontFamily,
  spacingScale,
  radiusScale,
}: {
  mode: "light" | "dark";
  baseColor: NeutralSwatchName;
  accentColor: BrandSwatchName;
  fontFamily: string;
  spacingScale: ScaleOption;
  radiusScale: RadiusScaleOption;
}): Theme {
  const isDark = mode === "dark";
  const overlayBase = isDark ? swatch(baseColor, 25) : swatch(baseColor, 1000);
  const neutralPrimary = isDark ? swatch(baseColor, 50) : swatch(baseColor, 1000);

  const accentSolid =
    accentColor === "neutral"
      ? isDark
        ? swatch(baseColor, 25)
        : swatch(baseColor, 1000)
      : swatch(accentColor, getBrandBaseShade(accentColor));

  const accentText =
    accentColor === "neutral"
      ? isDark
        ? swatch(baseColor, 1000)
        : swatch(baseColor, 25)
      : swatch(baseColor, 25);

  const spacingBase = 2 * SPACING_SCALE_MULTIPLIER[spacingScale];
  const radiusBase = RADIUS_PRESET_BASE[radiusScale];

  return {
    background: isDark ? swatch(baseColor, 950) : swatch(baseColor, 100),
    foreground: isDark ? swatch(baseColor, 900) : swatch(baseColor, 25),
    popoverBackground: isDark ? swatch(baseColor, 900) : swatch(baseColor, 25),
    sunkLight: withAlpha(overlayBase, 0.02),
    sunk: withAlpha(overlayBase, 0.04),
    elevated: withAlpha(overlayBase, 0.08),
    overlay: isDark ? withAlpha("oklch(0 0 0 / 1)", 0.6) : withAlpha("oklch(0 0 0 / 1)", 0.4),
    highlightSubtle: withAlpha(overlayBase, 0.02),
    highlight: withAlpha(overlayBase, 0.04),
    highlightStrong: withAlpha(overlayBase, 0.08),
    textNeutralPrimary: neutralPrimary,
    textNeutralSecondary: withAlpha(neutralPrimary, 0.6),
    textNeutralTertiary: withAlpha(neutralPrimary, 0.35),
    textBrand: accentSolid,
    textAccentPrimary: accentText,
    textAccentSecondary: withAlpha(accentText, 0.6),
    borderDefault: withAlpha(overlayBase, isDark ? 0.14 : 0.08),
    borderInteractive: withAlpha(overlayBase, isDark ? 0.22 : 0.14),
    borderInteractiveEmphasis: withAlpha(overlayBase, isDark ? 0.4 : 0.28),
    borderAccent: withAlpha(accentSolid, isDark ? 0.35 : 0.16),
    borderAccentEmphasis: withAlpha(accentSolid, isDark ? 0.5 : 0.32),
    interactiveAccentDefault: accentSolid,
    interactiveAccentHover: withAlpha(accentSolid, 0.82),
    interactiveAccentPressed: accentSolid,
    interactiveAccentDisabled: withAlpha(accentSolid, 0.45),
    ...buildTypographyOverrides(fontFamily),
    space000: toPx(0),
    space3xs: toPx(spacingBase * 1),
    space2xs: toPx(spacingBase * 2),
    spaceXs: toPx(spacingBase * 3),
    spaceS: toPx(spacingBase * 4),
    spaceSM: toPx(spacingBase * 5),
    spaceM: toPx(spacingBase * 6),
    spaceML: toPx(spacingBase * 8),
    spaceL: toPx(spacingBase * 9),
    spaceXl: toPx(spacingBase * 12),
    space2xl: toPx(spacingBase * 18),
    space3xl: toPx(spacingBase * 24),
    radiusNone: toPx(0),
    radius3xs: toPx(radiusBase * 0.5),
    radius2xs: toPx(radiusBase * 1),
    radiusXs: toPx(radiusBase * 2),
    radiusS: toPx(radiusBase * 3),
    radiusM: toPx(radiusBase * 4),
    radiusL: toPx(radiusBase * 5),
    radiusXl: toPx(radiusBase * 6),
    radius2xl: toPx(radiusBase * 7),
    radius3xl: toPx(radiusBase * 8),
    radius4xl: toPx(radiusBase * 10),
    radius5xl: toPx(radiusBase * 12),
    radius6xl: toPx(radiusBase * 14),
    radius7xl: toPx(radiusBase * 16),
    radius8xl: toPx(radiusBase * 20),
    radius9xl: toPx(radiusBase * 24),
    radiusFull: "9999px",
  };
}

export default function ThemeBuilderPage() {
  const { mode } = useAppTheme();
  const [baseColor, setBaseColor] = useState<NeutralSwatchName>("neutral");
  const [accentColor, setAccentColor] = useState<BrandSwatchName>("blue");
  const [fontFamily, setFontFamily] = useState<FontOption>("inter");
  const [radiusScale, setRadiusScale] = useState<RadiusScaleOption>("default");
  const [spacingScale, setSpacingScale] = useState<ScaleOption>("default");

  const themeOverrides = useMemo(
    () =>
      buildThemeOverrides({
        mode,
        baseColor,
        accentColor,
        fontFamily:
          FONT_OPTIONS.find((option) => option.value === fontFamily)?.family ??
          FONT_OPTIONS[0].family,
        spacingScale,
        radiusScale,
      }),
    [mode, baseColor, accentColor, fontFamily, spacingScale, radiusScale],
  );

  return (
    <main className={styles.page}>
      <section className={styles.builderShell}>
        <ThemeProvider mode={mode} theme={themeOverrides} cssSelector={`.${styles.previewScope}`}>
          <div className={`${styles.previewPane} ${styles.previewScope}`}>
            <RealBlocksCanvas />
          </div>
        </ThemeProvider>

        <aside className={styles.controlsPane}>
          <div className={styles.controlsHeader}>
            <h2 className={styles.controlsTitle}>Theme</h2>
            <p className={styles.controlsDescription}>Changes apply only to the left overview.</p>
          </div>

          <div className={styles.controlsGroup}>
            <label className={styles.controlLabel}>Base color</label>
            <Select
              value={baseColor}
              onValueChange={(value) => setBaseColor(value as NeutralSwatchName)}
            >
              <SelectTrigger size="md" style={{ width: "100%" }}>
                <SelectValue placeholder="Choose base color" />
              </SelectTrigger>
              <SelectContent>
                {BASE_COLOR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} showTick={false}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={styles.controlsGroup}>
            <label className={styles.controlLabel}>Accent</label>
            <Select
              value={accentColor}
              onValueChange={(value) => setAccentColor(value as BrandSwatchName)}
            >
              <SelectTrigger size="md" style={{ width: "100%" }}>
                <SelectValue placeholder="Choose accent color" />
              </SelectTrigger>
              <SelectContent>
                {ACCENT_COLOR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} showTick={false}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={styles.controlsGroup}>
            <label className={styles.controlLabel}>Font</label>
            <Select
              value={fontFamily}
              onValueChange={(value) => setFontFamily(value as FontOption)}
            >
              <SelectTrigger size="md" style={{ width: "100%" }}>
                <SelectValue placeholder="Choose font" />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} showTick={false}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={styles.controlsGroup}>
            <label className={styles.controlLabel}>Radius</label>
            <Select
              value={radiusScale}
              onValueChange={(value) => setRadiusScale(value as RadiusScaleOption)}
            >
              <SelectTrigger size="md" style={{ width: "100%" }}>
                <SelectValue placeholder="Choose radius scale" />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_SCALE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} showTick={false}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={styles.controlsGroup}>
            <label className={styles.controlLabel}>Spacing</label>
            <Select
              value={spacingScale}
              onValueChange={(value) => setSpacingScale(value as ScaleOption)}
            >
              <SelectTrigger size="md" style={{ width: "100%" }}>
                <SelectValue placeholder="Choose spacing scale" />
              </SelectTrigger>
              <SelectContent>
                {SCALE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} showTick={false}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </aside>
      </section>
    </main>
  );
}
