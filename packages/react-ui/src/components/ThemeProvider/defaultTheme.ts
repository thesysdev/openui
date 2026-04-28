import { black, BrandSwatchName, NeutralSwatchName, swatch, white, withAlpha } from "./swatches";
import { ColorTheme, EffectTheme, LayoutTheme, Theme, TypographyTheme } from "./types";

type ThemeMode = "light" | "dark";

type ThemeSwatchSelectors = {
  neutralSwatch: NeutralSwatchName;
  brandSwatch: BrandSwatchName;
};

const LIGHT_SWATCHES: ThemeSwatchSelectors = {
  neutralSwatch: "neutral",
  brandSwatch: "neutral",
};

const DARK_SWATCHES: ThemeSwatchSelectors = {
  neutralSwatch: "neutral",
  brandSwatch: "neutral",
};

const SEMANTIC_SWATCHES = {
  info: "blue",
  success: "green",
  alert: "yellow",
  danger: "red",
  purple: "purple",
  pink: "pink",
} as const;

const getBrandBaseShade = (brandSwatch: BrandSwatchName): 600 | 1000 =>
  brandSwatch === "neutral" ||
  brandSwatch === "slate" ||
  brandSwatch === "gray" ||
  brandSwatch === "zinc" ||
  brandSwatch === "stone"
    ? 1000
    : 600;

const AA_LARGE_CONTRAST_THRESHOLD = 3;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const parseOklch = (value: string): { l: number; c: number; h: number } | null => {
  const match = value.match(
    /^oklch\(\s*([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)(?:\s*\/\s*[+-]?\d*\.?\d+)?\s*\)$/i,
  );
  if (!match) {
    return null;
  }

  return {
    l: Number(match[1]),
    c: Number(match[2]),
    h: Number(match[3]),
  };
};

const relativeLuminanceFromOklch = (oklchValue: string): number => {
  const parsed = parseOklch(oklchValue);
  if (!parsed) {
    return 0;
  }

  const hRadians = (parsed.h * Math.PI) / 180;
  const a = parsed.c * Math.cos(hRadians);
  const b = parsed.c * Math.sin(hRadians);

  const lPrime = parsed.l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = parsed.l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = parsed.l - 0.0894841775 * a - 1.291485548 * b;

  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;

  const rLinear = clamp01(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const gLinear = clamp01(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bLinear = clamp01(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

const contrastRatio = (foreground: string, background: string): number => {
  const luminance1 = relativeLuminanceFromOklch(foreground);
  const luminance2 = relativeLuminanceFromOklch(background);
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
};

const pickAccentTextFromNeutral = ({
  neutralSwatch,
  accentBackground,
}: {
  neutralSwatch: NeutralSwatchName;
  accentBackground: string;
}): string => {
  const neutral25 = swatch(neutralSwatch, 25);
  const neutral1000 = swatch(neutralSwatch, 1000);

  const ratio25 = contrastRatio(neutral25, accentBackground);
  const ratio1000 = contrastRatio(neutral1000, accentBackground);

  const pass25 = ratio25 >= AA_LARGE_CONTRAST_THRESHOLD;
  const pass1000 = ratio1000 >= AA_LARGE_CONTRAST_THRESHOLD;

  if (pass25 && pass1000) {
    return neutral25;
  }
  if (pass25) {
    return neutral25;
  }
  if (pass1000) {
    return neutral1000;
  }
  return neutral25;
};

const createColorTheme = ({
  mode,
  neutralSwatch,
  brandSwatch,
}: ThemeSwatchSelectors & { mode: ThemeMode }) => {
  const isDark = mode === "dark";
  const neutral = neutralSwatch;
  const brandBase = getBrandBaseShade(brandSwatch);
  const brandSolid =
    brandSwatch === "neutral"
      ? isDark
        ? swatch(neutral, 25)
        : swatch(neutral, 1000)
      : swatch(brandSwatch, brandBase);

  const overlayBase = isDark ? swatch(neutral, 25) : swatch(neutral, 1000);
  const neutralPrimary = isDark ? swatch(neutral, 50) : swatch(neutral, 1000);
  const neutralSecondary = withAlpha(neutralPrimary, 0.5);
  const neutralTertiary = withAlpha(neutralPrimary, 0.2);

  const accentText =
    brandSwatch === "neutral"
      ? isDark
        ? swatch(neutral, 1000)
        : swatch(neutral, 25)
      : pickAccentTextFromNeutral({
          neutralSwatch: neutral,
          accentBackground: brandSolid,
        });
  const accentTextSecondary = withAlpha(accentText, 0.5);
  const accentTextTertiary = withAlpha(accentText, 0.2);

  const infoSwatch = SEMANTIC_SWATCHES.info;
  const successSwatch = SEMANTIC_SWATCHES.success;
  const alertSwatch = SEMANTIC_SWATCHES.alert;
  const dangerSwatch = SEMANTIC_SWATCHES.danger;
  const purpleSwatch = SEMANTIC_SWATCHES.purple;
  const pinkSwatch = SEMANTIC_SWATCHES.pink;

  const colorTheme: ColorTheme = {
    // Surface
    background: isDark ? swatch(neutral, 950) : swatch(neutral, 100),
    foreground: isDark ? swatch(neutral, 900) : swatch(neutral, 25),
    popoverBackground: isDark ? swatch(neutral, 900) : swatch(neutral, 25),
    sunkLight: withAlpha(overlayBase, 0.02),
    sunk: withAlpha(overlayBase, 0.04),
    sunkDeep: withAlpha(overlayBase, 0.08),
    elevatedLight: withAlpha(overlayBase, 0.04),
    elevated: withAlpha(overlayBase, 0.08),
    elevatedStrong: withAlpha(overlayBase, 0.16),
    elevatedIntense: withAlpha(overlayBase, 0.32),
    overlay: isDark ? withAlpha(black, 0.6) : withAlpha(black, 0.4),
    highlightSubtle: withAlpha(overlayBase, 0.02),
    highlight: withAlpha(overlayBase, 0.04),
    highlightStrong: withAlpha(overlayBase, 0.08),
    highlightIntense: withAlpha(overlayBase, isDark ? 0.3 : 0.32),
    invertedBackground: isDark ? swatch(neutral, 25) : swatch(neutral, 1000),
    infoBackground: withAlpha(swatch(infoSwatch, 500), 0.12),
    successBackground: withAlpha(swatch(successSwatch, 600), 0.12),
    alertBackground: withAlpha(swatch(alertSwatch, 500), 0.16),
    dangerBackground: withAlpha(swatch(dangerSwatch, 600), 0.12),
    purpleBackground: withAlpha(swatch(purpleSwatch, 500), 0.12),
    pinkBackground: withAlpha(swatch(pinkSwatch, 600), 0.12),

    // Text / Neutral
    textNeutralPrimary: neutralPrimary,
    textNeutralSecondary: neutralSecondary,
    textNeutralTertiary: neutralTertiary,
    textNeutralLink: neutralPrimary,

    // Text / Brand
    textBrand: brandSolid,
    textWhite: white,
    textBlack: black,

    // Text / Accent
    textAccentPrimary: accentText,
    textAccentSecondary: accentTextSecondary,
    textAccentTertiary: accentTextTertiary,

    // Text / Success
    textSuccessPrimary: isDark ? swatch(successSwatch, 300) : swatch(successSwatch, 800),
    textSuccessInverted: swatch(successSwatch, 100),

    // Text / Alert
    textAlertPrimary: isDark ? swatch(alertSwatch, 300) : swatch(alertSwatch, 800),
    textAlertInverted: swatch(alertSwatch, 100),

    // Text / Danger
    textDangerPrimary: isDark ? swatch(dangerSwatch, 300) : swatch(dangerSwatch, 700),
    textDangerSecondary: isDark ? swatch(dangerSwatch, 200) : swatch(dangerSwatch, 400),
    textDangerTertiary: isDark ? swatch(dangerSwatch, 100) : swatch(dangerSwatch, 300),

    // Text / Danger / Inverted
    textDangerInvertedPrimary: swatch(dangerSwatch, 25),
    textDangerInvertedSecondary: withAlpha(swatch(dangerSwatch, 25), 0.5),
    textDangerInvertedTertiary: withAlpha(swatch(dangerSwatch, 25), 0.3),

    // Text / Info
    textInfoPrimary: isDark ? swatch(infoSwatch, 300) : swatch(infoSwatch, 800),
    textInfoInverted: swatch(infoSwatch, 100),

    // Text / Pink
    textPinkPrimary: isDark ? swatch(pinkSwatch, 300) : swatch(pinkSwatch, 800),
    textPinkInverted: swatch(pinkSwatch, 100),

    // Text / Purple
    textPurplePrimary: isDark ? swatch(purpleSwatch, 300) : swatch(purpleSwatch, 800),
    textPurpleInverted: swatch(purpleSwatch, 100),

    // Interactive / Brand
    interactiveAccentDefault: brandSolid,
    interactiveAccentHover: withAlpha(brandSolid, 0.8),
    interactiveAccentDisabled: withAlpha(brandSolid, 0.4),
    interactiveAccentPressed: brandSolid,

    // Interactive / Destructive
    interactiveDestructiveDefault: withAlpha(swatch(dangerSwatch, 600), 0.02),
    interactiveDestructiveHover: withAlpha(swatch(dangerSwatch, 600), 0.08),
    interactiveDestructiveDisabled: withAlpha(swatch(dangerSwatch, 600), 0.02),
    interactiveDestructivePressed: withAlpha(swatch(dangerSwatch, 600), 0.1),

    // Interactive / Destructive / Accent
    interactiveDestructiveAccentDefault: swatch(dangerSwatch, 600),
    interactiveDestructiveAccentHover: swatch(dangerSwatch, 500),
    interactiveDestructiveAccentPressed: swatch(dangerSwatch, 700),
    interactiveDestructiveAccentDisabled: withAlpha(swatch(dangerSwatch, 600), 0.4),

    // Chat
    chatUserResponseBg: withAlpha(brandSolid, 0.08),
    chatUserResponseText: neutralPrimary,

    // Border
    borderDefault: withAlpha(overlayBase, isDark ? 0.06 : 0.06),
    borderInteractive: withAlpha(overlayBase, isDark ? 0.12 : 0.12),
    borderInteractiveEmphasis: withAlpha(overlayBase, isDark ? 0.4 : 0.3),
    borderInteractiveSelected: isDark ? swatch(neutral, 50) : swatch(neutral, 1000),
    borderAccent: withAlpha(brandSolid, isDark ? 0.2 : 0.08),
    borderAccentEmphasis: withAlpha(brandSolid, isDark ? 0.4 : 0.3),
    borderInfo: withAlpha(swatch(infoSwatch, 500), 0.08),
    borderInfoEmphasis: swatch(infoSwatch, 600),
    borderAlert: withAlpha(swatch(alertSwatch, 400), 0.08),
    borderAlertEmphasis: swatch(alertSwatch, 600),
    borderSuccess: withAlpha(swatch(successSwatch, 600), 0.08),
    borderSuccessEmphasis: swatch(successSwatch, 600),
    borderDanger: withAlpha(swatch(dangerSwatch, 600), 0.08),
    borderDangerEmphasis: swatch(dangerSwatch, 600),
  };

  return colorTheme;
};

// ---------------------------------------------------------------------------
// Light/Dark color theme from selected swatch layers.
// ---------------------------------------------------------------------------
const lightColorTheme = createColorTheme({ mode: "light", ...LIGHT_SWATCHES });
const darkColorTheme = createColorTheme({ mode: "dark", ...DARK_SWATCHES });

// ---------------------------------------------------------------------------
// Layout – resolved from spacing.css + border-radius.css (same light/dark)
// ---------------------------------------------------------------------------
const SPACE_BASE = 2;
const RADIUS_BASE = 2;

const toPx = (base: number, multiplier: number): string => {
  const value = base * multiplier;
  if (value === 0) {
    return "0";
  }
  return `${value}px`;
};

const layoutTheme: LayoutTheme = {
  space000: toPx(SPACE_BASE, 0),
  space3xs: toPx(SPACE_BASE, 1),
  space2xs: toPx(SPACE_BASE, 2),
  spaceXs: toPx(SPACE_BASE, 3),
  spaceS: toPx(SPACE_BASE, 4),
  spaceSM: toPx(SPACE_BASE, 5),
  spaceM: toPx(SPACE_BASE, 6),
  spaceML: toPx(SPACE_BASE, 8),
  spaceL: toPx(SPACE_BASE, 9),
  spaceXl: toPx(SPACE_BASE, 12),
  space2xl: toPx(SPACE_BASE, 18),
  space3xl: toPx(SPACE_BASE, 24),

  radiusNone: toPx(RADIUS_BASE, 0),
  radius3xs: toPx(RADIUS_BASE, 0.5),
  radius2xs: toPx(RADIUS_BASE, 1),
  radiusXs: toPx(RADIUS_BASE, 2),
  radiusS: toPx(RADIUS_BASE, 3),
  radiusM: toPx(RADIUS_BASE, 4),
  radiusL: toPx(RADIUS_BASE, 5),
  radiusXl: toPx(RADIUS_BASE, 6),
  radius2xl: toPx(RADIUS_BASE, 7),
  radius3xl: toPx(RADIUS_BASE, 8),
  radius4xl: toPx(RADIUS_BASE, 10),
  radius5xl: toPx(RADIUS_BASE, 12),
  radius6xl: toPx(RADIUS_BASE, 14),
  radius7xl: toPx(RADIUS_BASE, 16),
  radius8xl: toPx(RADIUS_BASE, 20),
  radius9xl: toPx(RADIUS_BASE, 24),
  radiusFull: "9999px",
};

// ---------------------------------------------------------------------------
// Typography – resolved from typography.css
// ---------------------------------------------------------------------------

const FONT_BODY = '"Inter", sans-serif';
const FONT_CODE = '"SFMono-Regular", Menlo, monospace';
const FONT_HEADING = '"Inter", sans-serif';
const FONT_LABEL = '"Inter", sans-serif';
const FONT_NUMBERS = '"Inter", sans-serif';

const typographyTheme: TypographyTheme = {
  fontBody: FONT_BODY,
  fontCode: FONT_CODE,
  fontHeading: FONT_HEADING,
  fontLabel: FONT_LABEL,
  fontNumbers: FONT_NUMBERS,

  fontSize2xs: "10px",
  fontSizeXs: "12px",
  fontSizeSm: "14px",
  fontSizeMd: "16px",
  fontSizeLg: "18px",
  fontSizeXl: "20px",
  fontSize2xl: "24px",
  fontSize3xl: "28px",
  fontSize4xl: "32px",
  fontSize5xl: "36px",

  fontWeightRegular: "400",
  fontWeightMedium: "500",
  fontWeightBold: "600",
  fontWeightHeavy: "700",

  lineHeightBody: "1.5",
  lineHeightHeading: "1.25",
  lineHeightHeadingLarge: "1.1",
  lineHeightLabel: "1.25",
  lineHeightCode: "1.5",

  letterSpacingNormal: "0",
  letterSpacingTight: "-0.1px",
  letterSpacingTighter: "-0.2px",

  // Body
  textBodyXs: `400 12px/1.5 ${FONT_BODY}`,
  textBodyXsLetterSpacing: "0",
  textBodyXsHeavy: `500 12px/1.5 ${FONT_BODY}`,
  textBodyXsHeavyLetterSpacing: "0",
  textBodySm: `400 14px/1.5 ${FONT_BODY}`,
  textBodySmLetterSpacing: "0",
  textBodySmHeavy: `500 14px/1.5 ${FONT_BODY}`,
  textBodySmHeavyLetterSpacing: "0",
  textBodyDefault: `400 16px/1.5 ${FONT_BODY}`,
  textBodyDefaultLetterSpacing: "0",
  textBodyDefaultHeavy: `500 16px/1.5 ${FONT_BODY}`,
  textBodyDefaultHeavyLetterSpacing: "0",
  textBodyLg: `400 18px/1.5 ${FONT_BODY}`,
  textBodyLgLetterSpacing: "0",
  textBodyLgHeavy: `500 18px/1.5 ${FONT_BODY}`,
  textBodyLgHeavyLetterSpacing: "0",

  // Heading
  textHeadingXs: `600 16px/1.25 ${FONT_HEADING}`,
  textHeadingXsLetterSpacing: "0",
  textHeadingSm: `600 18px/1.25 ${FONT_HEADING}`,
  textHeadingSmLetterSpacing: "0",
  textHeadingMd: `600 24px/1.1 ${FONT_HEADING}`,
  textHeadingMdLetterSpacing: "0",
  textHeadingLg: `600 28px/1.1 ${FONT_HEADING}`,
  textHeadingLgLetterSpacing: "-0.1px",
  textHeadingXl: `700 32px/1.1 ${FONT_HEADING}`,
  textHeadingXlLetterSpacing: "-0.1px",

  // Label
  textLabelXs: `400 12px/1.25 ${FONT_LABEL}`,
  textLabelXsLetterSpacing: "0",
  textLabelXsHeavy: `500 12px/1.25 ${FONT_LABEL}`,
  textLabelXsHeavyLetterSpacing: "0",
  textLabelSm: `400 14px/1.25 ${FONT_LABEL}`,
  textLabelSmLetterSpacing: "0",
  textLabelSmHeavy: `500 14px/1.25 ${FONT_LABEL}`,
  textLabelSmHeavyLetterSpacing: "0",
  textLabelDefault: `400 16px/1.25 ${FONT_LABEL}`,
  textLabelDefaultLetterSpacing: "0",
  textLabelDefaultHeavy: `500 16px/1.25 ${FONT_LABEL}`,
  textLabelDefaultHeavyLetterSpacing: "0",
  textLabelLg: `400 18px/1.25 ${FONT_LABEL}`,
  textLabelLgLetterSpacing: "0",
  textLabelLgHeavy: `500 18px/1.25 ${FONT_LABEL}`,
  textLabelLgHeavyLetterSpacing: "0",

  // Numbers
  textNumbersXs: `400 12px/1.5 ${FONT_NUMBERS}`,
  textNumbersXsLetterSpacing: "0",
  textNumbersXsHeavy: `500 12px/1.5 ${FONT_NUMBERS}`,
  textNumbersXsHeavyLetterSpacing: "0",
  textNumbersSm: `400 14px/1.5 ${FONT_NUMBERS}`,
  textNumbersSmLetterSpacing: "0",
  textNumbersSmHeavy: `500 14px/1.5 ${FONT_NUMBERS}`,
  textNumbersSmHeavyLetterSpacing: "0",
  textNumbersDefault: `400 16px/1.5 ${FONT_NUMBERS}`,
  textNumbersDefaultLetterSpacing: "0",
  textNumbersDefaultHeavy: `500 16px/1.5 ${FONT_NUMBERS}`,
  textNumbersDefaultHeavyLetterSpacing: "0",
  textNumbersLg: `400 18px/1.5 ${FONT_NUMBERS}`,
  textNumbersLgLetterSpacing: "0",
  textNumbersLgHeavy: `500 18px/1.5 ${FONT_NUMBERS}`,
  textNumbersLgHeavyLetterSpacing: "0",
  textNumbersHeadingSm: `600 18px/1.25 ${FONT_NUMBERS}`,
  textNumbersHeadingSmLetterSpacing: "0",
  textNumbersHeadingMd: `600 24px/1.1 ${FONT_NUMBERS}`,
  textNumbersHeadingMdLetterSpacing: "0",
  textNumbersHeadingLg: `600 28px/1.1 ${FONT_NUMBERS}`,
  textNumbersHeadingLgLetterSpacing: "0",
  textNumbersHeadingXl: `600 32px/1.1 ${FONT_NUMBERS}`,
  textNumbersHeadingXlLetterSpacing: "0",

  // Code
  textCodeSm: `400 12px/1.5 ${FONT_CODE}`,
  textCodeSmLetterSpacing: "0",
  textCodeSmHeavy: `700 12px/1.5 ${FONT_CODE}`,
  textCodeSmHeavyLetterSpacing: "0",
  textCodeDefault: `400 14px/1.5 ${FONT_CODE}`,
  textCodeDefaultLetterSpacing: "0",
  textCodeDefaultHeavy: `700 14px/1.5 ${FONT_CODE}`,
  textCodeDefaultHeavyLetterSpacing: "0",
};

// ---------------------------------------------------------------------------
// Effects – resolved from shadows.css (light values)
// ---------------------------------------------------------------------------
const lightEffectTheme: EffectTheme = {
  shadow0: "none",
  shadowS: "0 1px 3px -2px oklch(0 0 0 / 0.02), 0 2px 5px -2px oklch(0 0 0 / 0.04)",
  shadowM: "0 4px 6px -2px oklch(0 0 0 / 0.025), 0 2px 2px -2px oklch(0 0 0 / 0.05)",
  shadowL: "0 4px 4px -2px oklch(0 0 0 / 0.05), 0 4px 8px -2px oklch(0 0 0 / 0.04)",
  shadowXl: "0 8px 16px -4px oklch(0 0 0 / 0.08), 0 16px 32px -6px oklch(0 0 0 / 0.12)",
  shadow2xl: "0 12px 24px -6px oklch(0 0 0 / 0.12), 0 24px 48px -8px oklch(0 0 0 / 0.16)",
  shadow3xl: "0 16px 32px -8px oklch(0 0 0 / 0.16), 0 32px 64px -12px oklch(0 0 0 / 0.22)",
};

// ---------------------------------------------------------------------------
// Effects – resolved from shadows.css (dark values)
// ---------------------------------------------------------------------------
const darkEffectTheme: EffectTheme = {
  shadow0: "none",
  shadowS: "0 1px 3px -2px oklch(0 0 0 / 0.06), 0 2px 5px -2px oklch(0 0 0 / 0.10)",
  shadowM: "0 4px 6px -2px oklch(0 0 0 / 0.08), 0 2px 2px -2px oklch(0 0 0 / 0.12)",
  shadowL: "0 4px 4px -2px oklch(0 0 0 / 0.12), 0 4px 8px -2px oklch(0 0 0 / 0.10)",
  shadowXl: "0 8px 16px -4px oklch(0 0 0 / 0.16), 0 16px 32px -6px oklch(0 0 0 / 0.20)",
  shadow2xl: "0 12px 24px -6px oklch(0 0 0 / 0.20), 0 24px 48px -8px oklch(0 0 0 / 0.24)",
  shadow3xl: "0 16px 32px -8px oklch(0 0 0 / 0.24), 0 32px 64px -12px oklch(0 0 0 / 0.28)",
};

// ---------------------------------------------------------------------------
// Exported default themes
// ---------------------------------------------------------------------------
/**
 * The built-in light theme. Combines the neutral-swatch light color palette,
 * shared layout and typography tokens, and light-mode shadow values.
 *
 * Used as the base when `ThemeProvider` is rendered with `mode="light"`.
 */
export const defaultLightTheme: Theme = Object.freeze({
  ...lightColorTheme,
  ...layoutTheme,
  ...typographyTheme,
  ...lightEffectTheme,
});

/**
 * The built-in dark theme. Uses the neutral-swatch dark color palette with
 * inverted surface lightness, higher shadow opacity, and shared layout /
 * typography tokens.
 *
 * Used as the base when `ThemeProvider` is rendered with `mode="dark"`.
 */
export const defaultDarkTheme: Theme = Object.freeze({
  ...darkColorTheme,
  ...layoutTheme,
  ...typographyTheme,
  ...darkEffectTheme,
});
