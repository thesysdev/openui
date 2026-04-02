/** The active color scheme — determines which set of default tokens is used. */
export type ThemeMode = "light" | "dark";

/**
 * Optional color arrays used by chart components.
 * Each palette overrides the default for its specific chart type.
 */
export interface ChartColorPalette {
  defaultChartPalette?: string[];
  barChartPalette?: string[];
  lineChartPalette?: string[];
  areaChartPalette?: string[];
  pieChartPalette?: string[];
  radarChartPalette?: string[];
  radialChartPalette?: string[];
  horizontalBarChartPalette?: string[];
}

/**
 * Color-related design tokens: surfaces, text, interactive states, borders,
 * and chat UI colors. All values are `oklch()` strings.
 *
 * Derived from `defaultTheme.ts` via the swatch system; every property is
 * optional so consumers can override individual tokens.
 */
export interface ColorTheme extends ChartColorPalette {
  // Surface colors
  background?: string;
  foreground?: string;
  popoverBackground?: string;
  sunkLight?: string;
  sunk?: string;
  sunkDeep?: string;
  elevatedLight?: string;
  elevated?: string;
  elevatedStrong?: string;
  elevatedIntense?: string;
  overlay?: string;
  highlightSubtle?: string;
  highlight?: string;
  highlightStrong?: string;
  highlightIntense?: string;
  invertedBackground?: string;
  infoBackground?: string;
  successBackground?: string;
  alertBackground?: string;
  dangerBackground?: string;
  purpleBackground?: string;
  pinkBackground?: string;

  // Text / Neutral
  textNeutralPrimary?: string;
  textNeutralSecondary?: string;
  textNeutralTertiary?: string;
  textNeutralLink?: string;

  // Text / Brand
  textBrand?: string;
  textWhite?: string;
  textBlack?: string;

  // Text / Accent
  textAccentPrimary?: string;
  textAccentSecondary?: string;
  textAccentTertiary?: string;

  // Text / Success
  textSuccessPrimary?: string;
  textSuccessInverted?: string;

  // Text / Alert
  textAlertPrimary?: string;
  textAlertInverted?: string;

  // Text / Danger
  textDangerPrimary?: string;
  textDangerSecondary?: string;
  textDangerTertiary?: string;

  // Text / Danger / Inverted
  textDangerInvertedPrimary?: string;
  textDangerInvertedSecondary?: string;
  textDangerInvertedTertiary?: string;

  // Text / Info
  textInfoPrimary?: string;
  textInfoInverted?: string;

  // Text / Pink
  textPinkPrimary?: string;
  textPinkInverted?: string;

  // Text / Purple
  textPurplePrimary?: string;
  textPurpleInverted?: string;

  // Interactive / Brand
  interactiveAccentDefault?: string;
  interactiveAccentHover?: string;
  interactiveAccentDisabled?: string;
  interactiveAccentPressed?: string;

  // Interactive / Destructive
  interactiveDestructiveDefault?: string;
  interactiveDestructiveHover?: string;
  interactiveDestructiveDisabled?: string;
  interactiveDestructivePressed?: string;

  // Interactive / Destructive / Accent
  interactiveDestructiveAccentDefault?: string;
  interactiveDestructiveAccentHover?: string;
  interactiveDestructiveAccentPressed?: string;
  interactiveDestructiveAccentDisabled?: string;

  // Border
  borderDefault?: string;
  borderInteractive?: string;
  borderInteractiveEmphasis?: string;
  borderInteractiveSelected?: string;
  borderAccent?: string;
  borderAccentEmphasis?: string;
  borderAccentSelected?: string;
  borderInfo?: string;
  borderInfoEmphasis?: string;
  borderAlert?: string;
  borderAlertEmphasis?: string;
  borderSuccess?: string;
  borderSuccessEmphasis?: string;
  borderDanger?: string;
  borderDangerEmphasis?: string;

  // Chat colors
  chatUserResponseBg?: string;
  chatUserResponseText?: string;
}

/**
 * Layout tokens: spacing scale and border-radius scale.
 * Values are pixel strings (e.g. `"12px"`, `"9999px"`).
 */
export interface LayoutTheme {
  // Spacing
  space000?: string;
  space3xs?: string;
  space2xs?: string;
  spaceXs?: string;
  spaceS?: string;
  spaceSM?: string;
  spaceM?: string;
  spaceML?: string;
  spaceL?: string;
  spaceXl?: string;
  space2xl?: string;
  space3xl?: string;

  // Border radius
  radiusNone?: string;
  radius3xs?: string;
  radius2xs?: string;
  radiusXs?: string;
  radiusS?: string;
  radiusM?: string;
  radiusL?: string;
  radiusXl?: string;
  radius2xl?: string;
  radius3xl?: string;
  radius4xl?: string;
  radius5xl?: string;
  radius6xl?: string;
  radius7xl?: string;
  radius8xl?: string;
  radius9xl?: string;
  radiusFull?: string;
}

/**
 * Typography tokens: font families, sizes, weights, line heights, letter
 * spacing, and compound shorthand `font:` values for every text style.
 */
export interface TypographyTheme {
  // Font families
  fontBody?: string;
  fontCode?: string;
  fontHeading?: string;
  fontLabel?: string;
  fontNumbers?: string;

  // Font sizes
  fontSize2xs?: string;
  fontSizeXs?: string;
  fontSizeSm?: string;
  fontSizeMd?: string;
  fontSizeLg?: string;
  fontSizeXl?: string;
  fontSize2xl?: string;
  fontSize3xl?: string;
  fontSize4xl?: string;
  fontSize5xl?: string;

  // Font weights
  fontWeightRegular?: string;
  fontWeightMedium?: string;
  fontWeightBold?: string;
  fontWeightHeavy?: string;

  // Line heights
  lineHeightBody?: string;
  lineHeightHeading?: string;
  lineHeightHeadingLarge?: string;
  lineHeightLabel?: string;
  lineHeightCode?: string;

  // Letter spacing
  letterSpacingNormal?: string;
  letterSpacingTight?: string;
  letterSpacingTighter?: string;

  // Compound typography: body
  textBodyXs?: string;
  textBodyXsLetterSpacing?: string;
  textBodyXsHeavy?: string;
  textBodyXsHeavyLetterSpacing?: string;
  textBodySm?: string;
  textBodySmLetterSpacing?: string;
  textBodySmHeavy?: string;
  textBodySmHeavyLetterSpacing?: string;
  textBodyDefault?: string;
  textBodyDefaultLetterSpacing?: string;
  textBodyDefaultHeavy?: string;
  textBodyDefaultHeavyLetterSpacing?: string;
  textBodyLg?: string;
  textBodyLgLetterSpacing?: string;
  textBodyLgHeavy?: string;
  textBodyLgHeavyLetterSpacing?: string;

  // Compound typography: heading
  textHeadingXs?: string;
  textHeadingXsLetterSpacing?: string;
  textHeadingSm?: string;
  textHeadingSmLetterSpacing?: string;
  textHeadingMd?: string;
  textHeadingMdLetterSpacing?: string;
  textHeadingLg?: string;
  textHeadingLgLetterSpacing?: string;
  textHeadingXl?: string;
  textHeadingXlLetterSpacing?: string;

  // Compound typography: label
  textLabel2xs?: string;
  textLabel2xsLetterSpacing?: string;
  textLabel2xsHeavy?: string;
  textLabel2xsHeavyLetterSpacing?: string;
  textLabelXs?: string;
  textLabelXsLetterSpacing?: string;
  textLabelXsHeavy?: string;
  textLabelXsHeavyLetterSpacing?: string;
  textLabelSm?: string;
  textLabelSmLetterSpacing?: string;
  textLabelSmHeavy?: string;
  textLabelSmHeavyLetterSpacing?: string;
  textLabelDefault?: string;
  textLabelDefaultLetterSpacing?: string;
  textLabelDefaultHeavy?: string;
  textLabelDefaultHeavyLetterSpacing?: string;
  textLabelLg?: string;
  textLabelLgLetterSpacing?: string;
  textLabelLgHeavy?: string;
  textLabelLgHeavyLetterSpacing?: string;

  // Compound typography: numbers

  textNumbers2xs?: string;
  textNumbers2xsLetterSpacing?: string;
  textNumbers2xsHeavy?: string;
  textNumbers2xsHeavyLetterSpacing?: string;
  textNumbersXs?: string;
  textNumbersXsLetterSpacing?: string;
  textNumbersXsHeavy?: string;
  textNumbersXsHeavyLetterSpacing?: string;
  textNumbersSm?: string;
  textNumbersSmLetterSpacing?: string;
  textNumbersSmHeavy?: string;
  textNumbersSmHeavyLetterSpacing?: string;
  textNumbersDefault?: string;
  textNumbersDefaultLetterSpacing?: string;
  textNumbersDefaultHeavy?: string;
  textNumbersDefaultHeavyLetterSpacing?: string;
  textNumbersLg?: string;
  textNumbersLgLetterSpacing?: string;
  textNumbersLgHeavy?: string;
  textNumbersLgHeavyLetterSpacing?: string;
  textNumbersHeadingLg?: string;
  textNumbersHeadingLgLetterSpacing?: string;
  textNumbersHeadingMd?: string;
  textNumbersHeadingMdLetterSpacing?: string;

  // Compound typography: code
  textCodeSm?: string;
  textCodeSmLetterSpacing?: string;
  textCodeSmHeavy?: string;
  textCodeSmHeavyLetterSpacing?: string;
  textCodeDefault?: string;
  textCodeDefaultLetterSpacing?: string;
  textCodeDefaultHeavy?: string;
  textCodeDefaultHeavyLetterSpacing?: string;
}

/**
 * Effect tokens: box-shadow values at increasing elevation levels.
 * Light and dark modes use different shadow intensities.
 */
export interface EffectTheme {
  shadow0?: string;
  shadowS?: string;
  shadowM?: string;
  shadowL?: string;
  shadowXl?: string;
  shadow2xl?: string;
  shadow3xl?: string;
}

/**
 * The complete set of design tokens consumed by {@link ThemeProvider}.
 * Combines color, layout, typography, and effect sub-interfaces.
 * Every property is optional — omitted keys use the built-in defaults.
 */
export interface Theme extends ColorTheme, LayoutTheme, TypographyTheme, EffectTheme {}
