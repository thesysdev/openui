import { type Theme } from "@openuidev/react-components";
/**
 * Only the tokens the dashboard changes: the typography, retuned for dense cards (13/14px rather
 * than openui's 16px). `ThemeProvider` merges these over its own default theme, so colours, spacing
 * and radii come from there and keep following the light or dark mode.
 *
 * The five family tokens keep their `--openui-dashboard-font-*` escape hatch so a consumer can
 * swap a typeface with plain CSS, without reaching for the `lightTheme`/`darkTheme` props.
 */
const dashboardScaleTokens: Partial<Theme> = {
  // Typography families
  fontBody: `var(--openui-dashboard-font-body, 'Inter', sans-serif)`,
  fontCode: `var(--openui-dashboard-font-code, 'SFMono-Regular', Menlo, monospace)`,
  fontHeading: `var(--openui-dashboard-font-heading, 'Inter', sans-serif)`,
  fontLabel: `var(--openui-dashboard-font-label, 'Inter', sans-serif)`,
  fontNumbers: `var(--openui-dashboard-font-numbers, 'Inter', sans-serif)`,

  // Typography base scale
  fontSize2xs: "9px",
  fontSizeXs: "11px",
  fontSizeSm: "13px",
  fontSizeMd: "14px",
  fontSizeLg: "16px",
  fontSizeXl: "18px",
  fontSize2xl: "20px",
  fontSize3xl: "24px",
  fontSize4xl: "28px",
  fontSize5xl: "32px",
  fontWeightMedium: "500",
  letterSpacingNormal: "0",

  // Body typography
  textBodyXs: "400 11px/1.5 var(--openui-font-body)",
  textBodyXsLetterSpacing: "0",
  textBodyXsHeavy: "500 11px/1.5 var(--openui-font-body)",
  textBodyXsHeavyLetterSpacing: "0",
  textBodySm: "400 13px/1.5 var(--openui-font-body)",
  textBodySmLetterSpacing: "0",
  textBodySmHeavy: "500 13px/1.5 var(--openui-font-body)",
  textBodySmHeavyLetterSpacing: "0",
  textBodyDefault: "400 14px/1.5 var(--openui-font-body)",
  textBodyDefaultLetterSpacing: "0",
  textBodyDefaultHeavy: "500 14px/1.5 var(--openui-font-body)",
  textBodyDefaultHeavyLetterSpacing: "0",
  textBodyLg: "400 16px/1.5 var(--openui-font-body)",
  textBodyLgLetterSpacing: "0",
  textBodyLgHeavy: "500 16px/1.5 var(--openui-font-body)",
  textBodyLgHeavyLetterSpacing: "0",

  // Heading typography
  textHeadingXs: "600 14px/1.25 var(--openui-font-heading)",
  textHeadingXsLetterSpacing: "0",
  textHeadingSm: "600 18px/1.25 var(--openui-font-heading)",
  textHeadingSmLetterSpacing: "0",
  textHeadingMd: "600 24px/1.1 var(--openui-font-heading)",
  textHeadingMdLetterSpacing: "0",
  textHeadingLg: "600 28px/1.1 var(--openui-font-heading)",
  textHeadingXl: "700 32px/1.1 var(--openui-font-heading)",

  // Label typography
  textLabelXs: "400 11px/1.25 var(--openui-font-label)",
  textLabelXsLetterSpacing: "0",
  textLabelXsHeavy: "500 11px/1.25 var(--openui-font-label)",
  textLabelXsHeavyLetterSpacing: "0",
  textLabelSm: "400 13px/1.25 var(--openui-font-label)",
  textLabelSmLetterSpacing: "0",
  textLabelSmHeavy: "500 13px/1.25 var(--openui-font-label)",
  textLabelSmHeavyLetterSpacing: "0",
  textLabelDefault: "400 14px/1.25 var(--openui-font-label)",
  textLabelDefaultLetterSpacing: "0",
  textLabelDefaultHeavy: "500 14px/1.25 var(--openui-font-label)",
  textLabelDefaultHeavyLetterSpacing: "0",
  textLabelLg: "400 16px/1.25 var(--openui-font-label)",
  textLabelLgLetterSpacing: "0",
  textLabelLgHeavy: "500 16px/1.25 var(--openui-font-label)",
  textLabelLgHeavyLetterSpacing: "0",

  // Number typography
  textNumbersXs: "400 11px/1.5 var(--openui-font-numbers)",
  textNumbersXsLetterSpacing: "0",
  textNumbersXsHeavy: "500 11px/1.5 var(--openui-font-numbers)",
  textNumbersXsHeavyLetterSpacing: "0",
  textNumbersSm: "400 13px/1.5 var(--openui-font-numbers)",
  textNumbersSmLetterSpacing: "0",
  textNumbersSmHeavy: "500 13px/1.5 var(--openui-font-numbers)",
  textNumbersSmHeavyLetterSpacing: "0",
  textNumbersDefault: "400 14px/1.5 var(--openui-font-numbers)",
  textNumbersDefaultLetterSpacing: "0",
  textNumbersDefaultHeavy: "500 14px/1.5 var(--openui-font-numbers)",
  textNumbersDefaultHeavyLetterSpacing: "0",
  textNumbersLg: "400 16px/1.5 var(--openui-font-numbers)",
  textNumbersLgLetterSpacing: "0",
  textNumbersLgHeavy: "500 16px/1.5 var(--openui-font-numbers)",
  textNumbersLgHeavyLetterSpacing: "0",
  textNumbersHeadingSm: "500 18px/1.25 var(--openui-font-numbers)",
  textNumbersHeadingSmLetterSpacing: "0",
  textNumbersHeadingMd: "500 24px/1.1 var(--openui-font-numbers)",
  textNumbersHeadingMdLetterSpacing: "0",
  textNumbersHeadingLg: "600 28px/1.1 var(--openui-font-numbers)",
  textNumbersHeadingLgLetterSpacing: "0",
  textNumbersHeadingXl: "600 32px/1.1 var(--openui-font-numbers)",
  textNumbersHeadingXlLetterSpacing: "0",

  // Code typography
  textCodeSm: "400 12px/1.5 var(--openui-font-code)",
  textCodeSmHeavy: "700 12px/1.5 var(--openui-font-code)",
  textCodeDefault: "400 14px/1.5 var(--openui-font-code)",
  textCodeDefaultHeavy: "700 14px/1.5 var(--openui-font-code)",
};

export const defaultDashboardLightTheme: Theme = dashboardScaleTokens;

export const defaultDashboardDarkTheme: Theme = dashboardScaleTokens;
