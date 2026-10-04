import { defaultDarkTheme, defaultLightTheme, type Theme } from "../../../components/ThemeProvider";
import { DASHBOARD_CLASS_PREFIX } from "../classPrefix";

/**
 * Dense dashboard typography (13/14px rather than the default 16px body).
 * Colors, spacing, and radii retain the standard theme defaults. Each font
 * family also supports a scoped CSS custom property override.
 */
const dashboardScaleTokens: Partial<Theme> = {
  // Typography families
  fontBody: `var(--${DASHBOARD_CLASS_PREFIX}-font-body, 'Inter', sans-serif)`,
  fontCode: `var(--${DASHBOARD_CLASS_PREFIX}-font-code, 'SFMono-Regular', Menlo, monospace)`,
  fontHeading: `var(--${DASHBOARD_CLASS_PREFIX}-font-heading, 'Inter', sans-serif)`,
  fontLabel: `var(--${DASHBOARD_CLASS_PREFIX}-font-label, 'Inter', sans-serif)`,
  fontNumbers: `var(--${DASHBOARD_CLASS_PREFIX}-font-numbers, 'Inter', sans-serif)`,

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
  textHeadingLgLetterSpacing: "-0.1px",
  textHeadingXl: "700 32px/1.1 var(--openui-font-heading)",
  textHeadingXlLetterSpacing: "-0.1px",

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
  textCodeSmLetterSpacing: "0",
  textCodeSmHeavy: "700 12px/1.5 var(--openui-font-code)",
  textCodeSmHeavyLetterSpacing: "0",
  textCodeDefault: "400 14px/1.5 var(--openui-font-code)",
  textCodeDefaultLetterSpacing: "0",
  textCodeDefaultHeavy: "700 14px/1.5 var(--openui-font-code)",
  textCodeDefaultHeavyLetterSpacing: "0",
};

export const defaultDashboardLightTheme: Theme = {
  ...defaultLightTheme,
  ...dashboardScaleTokens,
};

export const defaultDashboardDarkTheme: Theme = {
  ...defaultDarkTheme,
  ...dashboardScaleTokens,
};
