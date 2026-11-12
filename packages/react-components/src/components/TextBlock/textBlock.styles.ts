import { css } from "../../styles/css";

export const names = {
  root: "openui-text-block",
  primary: "openui-text-block-primary",
  secondary: "openui-text-block-secondary",
  tertiary: "openui-text-block-tertiary",
  variant: {
    "title-text": "openui-text-block--variant-title-text",
    "number-title-text": "openui-text-block--variant-number-title-text",
    "text-subtext": "openui-text-block--variant-text-subtext",
    "highlight-text-number-subtext": "openui-text-block--variant-highlight-text-number-subtext",
    text: "openui-text-block--variant-text",
    "highlight-text": "openui-text-block--variant-highlight-text",
    number: "openui-text-block--variant-number",
    "highlight-number": "openui-text-block--variant-highlight-number",
  },
  size: {
    xs: "openui-text-block--size-xs",
    sm: "openui-text-block--size-sm",
    md: "openui-text-block--size-md",
    lg: "openui-text-block--size-lg",
  },
  align: {
    left: "openui-text-block--align-left",
    center: "openui-text-block--align-center",
    right: "openui-text-block--align-right",
  },
  type: {
    text: "openui-text-block--type-text",
    number: "openui-text-block--type-number",
    textOnly: "openui-text-block--type-text-only",
  },
  secondaryTone: {
    positive: "openui-text-block-secondary--secondary-tone-positive",
    negative: "openui-text-block-secondary--secondary-tone-negative",
  },
  overflow: {
    wrap: "openui-text-block--overflow-wrap",
    truncate: "openui-text-block--overflow-truncate",
  },
  width: {
    fill: "openui-text-block--width-fill",
  },
} as const;

// Sizes supply typography choices; variants and type select them through private variables.
// Heading shorthands reset font variation to normal, matching the original font declarations.
export const textBlockStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--_openui-text-block-gap, var(--openui-space-3xs, 2px));
    align-items: flex-start;
    text-align: left;
  `,
  primary: css`
    max-width: var(--_openui-text-block-line-max-width, none);
    overflow: var(--_openui-text-block-line-overflow, visible);
    text-overflow: var(--_openui-text-block-line-text-overflow, clip);
    white-space: var(--_openui-text-block-line-white-space, normal);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font: var(--_openui-text-block-primary-font, inherit);
    letter-spacing: var(--_openui-text-block-primary-spacing, inherit);
    font-variation-settings: var(--_openui-text-block-primary-variation, inherit);
  `,
  secondary: css`
    max-width: var(--_openui-text-block-line-max-width, none);
    overflow: var(--_openui-text-block-line-overflow, visible);
    text-overflow: var(--_openui-text-block-line-text-overflow, clip);
    white-space: var(--_openui-text-block-line-white-space, normal);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    &[data-clamped] {
      display: -webkit-box;
      -webkit-line-clamp: var(--_openui-text-block-secondary-max-lines);
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
  secondaryTypography: css`
    font: var(--_openui-text-block-secondary-font, inherit);
    letter-spacing: var(--_openui-text-block-secondary-spacing, inherit);
    font-variation-settings: var(--_openui-text-block-secondary-variation, inherit);
  `,

  tertiary: css`
    display: none;
  `,
  // Keep tone bodies unique: shared Goober hashes can otherwise register before secondary.
  secondaryTone: {
    positive: css`
      /* TextBlock secondary positive tone. */
      color: var(--openui-text-success-primary, oklch(0.448 0.108 151.328 / 1));
    `,
    negative: css`
      /* TextBlock secondary negative tone. */
      color: var(--openui-text-danger-primary, oklch(0.505 0.19 27.518 / 1));
    `,
  },
  size: {
    xs: css`
      --_openui-text-block-selected-plain-subtext-variation: var(
        --_openui-text-block-subtext-variation
      );
      --_openui-text-block-selected-plain-subtext-spacing: var(
        --_openui-text-block-subtext-spacing
      );
      --_openui-text-block-selected-plain-subtext-font: var(--_openui-text-block-subtext-font);
      --_openui-text-block-heading-font: var(
        --openui-text-heading-xs,
        600 16px/1.25 "Inter",
        sans-serif
      );
      --_openui-text-block-heading-spacing: var(--openui-text-heading-xs-letter-spacing, -0.01em);
      --_openui-text-block-heading-variation: normal;
      --_openui-text-block-number-title-font: var(
        --openui-text-numbers-default-heavy,
        560 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-title-spacing: var(
        --openui-text-numbers-default-heavy-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-title-variation: var(--openui-font-variation-medium, "wght" 560);
      --_openui-text-block-body-font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
      --_openui-text-block-body-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
      --_openui-text-block-body-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-heavy-font: var(
        --openui-text-body-sm-heavy,
        560 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-heavy-spacing: var(--openui-text-body-sm-heavy-letter-spacing, -0.01em);
      --_openui-text-block-heavy-variation: var(--openui-font-variation-medium, "wght" 560);
      --_openui-text-block-number-font: var(
        --openui-text-numbers-sm,
        400 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-spacing: var(--openui-text-numbers-sm-letter-spacing, -0.01em);
      --_openui-text-block-number-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-number-heavy-font: var(
        --openui-text-numbers-sm-heavy,
        560 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-heavy-spacing: var(
        --openui-text-numbers-sm-heavy-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-heavy-variation: var(--openui-font-variation-medium, "wght" 560);
      --_openui-text-block-number-only-font: var(
        --openui-text-numbers-sm,
        400 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-only-spacing: var(
        --openui-text-numbers-sm-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-only-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-highlight-number-font: var(
        --openui-text-numbers-sm-heavy,
        560 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-highlight-number-spacing: var(
        --openui-text-numbers-sm-heavy-letter-spacing,
        -0.01em
      );
      --_openui-text-block-highlight-number-variation: var(
        --openui-font-variation-medium,
        "wght" 560
      );
      --_openui-text-block-subtext-font: var(
        --openui-text-body-sm,
        400 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-subtext-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
      --_openui-text-block-subtext-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-number-subtext-font: var(
        --openui-text-numbers-sm,
        400 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-subtext-spacing: var(
        --openui-text-numbers-sm-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-subtext-variation: var(
        --openui-font-variation-regular,
        "wght" 440
      );
      --_openui-text-block-highlight-subtext-font: inherit;
      --_openui-text-block-highlight-subtext-spacing: inherit;
      --_openui-text-block-highlight-subtext-variation: inherit;
      --_openui-text-block-title-gap: 0px;
      --_openui-text-block-highlight-gap: var(--openui-space-3xs, 2px);
    `,
    sm: css`
      --_openui-text-block-selected-plain-subtext-variation: var(
        --_openui-text-block-subtext-variation
      );
      --_openui-text-block-selected-plain-subtext-spacing: var(
        --_openui-text-block-subtext-spacing
      );
      --_openui-text-block-selected-plain-subtext-font: var(--_openui-text-block-subtext-font);
      --_openui-text-block-heading-font: var(
        --openui-text-heading-sm,
        600 18px/1.25 "Inter",
        sans-serif
      );
      --_openui-text-block-heading-spacing: var(--openui-text-heading-sm-letter-spacing, -0.01em);
      --_openui-text-block-heading-variation: normal;
      --_openui-text-block-number-title-font: var(
        --openui-text-numbers-lg-heavy,
        560 18px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-title-spacing: var(
        --openui-text-numbers-lg-heavy-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-title-variation: var(--openui-font-variation-medium, "wght" 560);
      --_openui-text-block-body-font: var(
        --openui-text-body-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-body-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
      --_openui-text-block-body-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-heavy-font: var(
        --openui-text-body-default-heavy,
        560 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-heavy-spacing: var(
        --openui-text-body-default-heavy-letter-spacing,
        -0.01em
      );
      --_openui-text-block-heavy-variation: var(--openui-font-variation-medium, "wght" 560);
      --_openui-text-block-number-font: var(
        --openui-text-numbers-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-spacing: var(
        --openui-text-numbers-default-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-number-heavy-font: var(
        --openui-text-numbers-default-heavy,
        560 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-heavy-spacing: var(
        --openui-text-numbers-default-heavy-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-heavy-variation: var(--openui-font-variation-medium, "wght" 560);
      --_openui-text-block-number-only-font: var(
        --openui-text-numbers-sm,
        400 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-only-spacing: var(
        --openui-text-numbers-sm-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-only-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-highlight-number-font: var(
        --openui-text-numbers-default-heavy,
        560 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-highlight-number-spacing: var(
        --openui-text-numbers-default-heavy-letter-spacing,
        -0.01em
      );
      --_openui-text-block-highlight-number-variation: var(
        --openui-font-variation-medium,
        "wght" 560
      );
      --_openui-text-block-subtext-font: var(
        --openui-text-body-sm,
        400 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-subtext-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
      --_openui-text-block-subtext-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-number-subtext-font: var(
        --openui-text-numbers-sm,
        400 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-subtext-spacing: var(
        --openui-text-numbers-sm-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-subtext-variation: var(
        --openui-font-variation-regular,
        "wght" 440
      );
      --_openui-text-block-highlight-subtext-font: var(
        --openui-text-body-sm,
        400 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-highlight-subtext-spacing: var(
        --openui-text-body-sm-letter-spacing,
        -0.01em
      );
      --_openui-text-block-highlight-subtext-variation: var(
        --openui-font-variation-regular,
        "wght" 440
      );
      --_openui-text-block-title-gap: var(--openui-space-3xs, 2px);
      --_openui-text-block-highlight-gap: 0px;
    `,
    md: css`
      --_openui-text-block-selected-plain-subtext-variation: var(
        --_openui-text-block-selected-text-subtext-variation
      );
      --_openui-text-block-selected-plain-subtext-spacing: var(
        --_openui-text-block-selected-text-subtext-spacing
      );
      --_openui-text-block-selected-plain-subtext-font: var(
        --_openui-text-block-selected-text-subtext-font
      );
      --_openui-text-block-heading-font: var(
        --openui-text-heading-md,
        600 24px/1.1 "Inter",
        sans-serif
      );
      --_openui-text-block-heading-spacing: var(--openui-text-heading-md-letter-spacing, -0.01em);
      --_openui-text-block-heading-variation: normal;
      --_openui-text-block-number-title-font: var(
        --openui-text-numbers-heading-md,
        600 24px/1.1 "Inter",
        sans-serif
      );
      --_openui-text-block-number-title-spacing: var(
        --openui-text-numbers-heading-md-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-title-variation: normal;
      --_openui-text-block-body-font: var(
        --openui-text-body-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-body-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
      --_openui-text-block-body-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-heavy-font: var(
        --openui-text-body-default-heavy,
        560 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-heavy-spacing: var(
        --openui-text-body-default-heavy-letter-spacing,
        -0.01em
      );
      --_openui-text-block-heavy-variation: var(--openui-font-variation-medium, "wght" 560);
      --_openui-text-block-number-font: var(
        --openui-text-numbers-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-spacing: var(
        --openui-text-numbers-default-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-number-heavy-font: var(
        --openui-text-numbers-default-heavy,
        560 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-heavy-spacing: var(
        --openui-text-numbers-default-heavy-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-heavy-variation: var(--openui-font-variation-medium, "wght" 560);
      --_openui-text-block-number-only-font: var(
        --openui-text-numbers-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-only-spacing: var(
        --openui-text-numbers-default-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-only-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-highlight-number-font: var(
        --openui-text-numbers-default-heavy,
        560 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-highlight-number-spacing: var(
        --openui-text-numbers-default-heavy-letter-spacing,
        -0.01em
      );
      --_openui-text-block-highlight-number-variation: var(
        --openui-font-variation-medium,
        "wght" 560
      );
      --_openui-text-block-subtext-font: var(
        --openui-text-body-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-subtext-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
      --_openui-text-block-subtext-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-number-subtext-font: var(
        --openui-text-numbers-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-subtext-spacing: var(
        --openui-text-numbers-default-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-subtext-variation: var(
        --openui-font-variation-regular,
        "wght" 440
      );
      --_openui-text-block-highlight-subtext-font: var(
        --openui-text-body-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-highlight-subtext-spacing: var(
        --openui-text-body-default-letter-spacing,
        -0.01em
      );
      --_openui-text-block-highlight-subtext-variation: var(
        --openui-font-variation-regular,
        "wght" 440
      );
      --_openui-text-block-title-gap: var(--openui-space-xs, 6px);
      --_openui-text-block-highlight-gap: 0px;
    `,
    lg: css`
      --_openui-text-block-selected-plain-subtext-variation: var(
        --_openui-text-block-selected-text-subtext-variation
      );
      --_openui-text-block-selected-plain-subtext-spacing: var(
        --_openui-text-block-selected-text-subtext-spacing
      );
      --_openui-text-block-selected-plain-subtext-font: var(
        --_openui-text-block-selected-text-subtext-font
      );
      --_openui-text-block-heading-font: var(
        --openui-text-heading-lg,
        600 28px/1.1 "Inter",
        sans-serif
      );
      --_openui-text-block-heading-spacing: var(--openui-text-heading-lg-letter-spacing, -0.1px);
      --_openui-text-block-heading-variation: normal;
      --_openui-text-block-number-title-font: var(
        --openui-text-numbers-heading-lg,
        600 28px/1.1 "Inter",
        sans-serif
      );
      --_openui-text-block-number-title-spacing: var(
        --openui-text-numbers-heading-lg-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-title-variation: normal;
      --_openui-text-block-body-font: var(--openui-text-body-lg, 400 18px/1.5 "Inter", sans-serif);
      --_openui-text-block-body-spacing: var(--openui-text-body-lg-letter-spacing, -0.01em);
      --_openui-text-block-body-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-heavy-font: var(
        --openui-text-body-lg-heavy,
        560 18px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-heavy-spacing: var(--openui-text-body-lg-heavy-letter-spacing, -0.01em);
      --_openui-text-block-heavy-variation: var(--openui-font-variation-medium, "wght" 560);
      --_openui-text-block-number-font: var(
        --openui-text-numbers-lg,
        400 18px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-spacing: var(--openui-text-numbers-lg-letter-spacing, -0.01em);
      --_openui-text-block-number-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-number-heavy-font: var(
        --openui-text-numbers-lg-heavy,
        560 18px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-heavy-spacing: var(
        --openui-text-numbers-lg-heavy-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-heavy-variation: var(--openui-font-variation-medium, "wght" 560);
      --_openui-text-block-number-only-font: var(
        --openui-text-numbers-lg,
        400 18px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-only-spacing: var(
        --openui-text-numbers-lg-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-only-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-highlight-number-font: var(
        --openui-text-numbers-lg-heavy,
        560 18px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-highlight-number-spacing: var(
        --openui-text-numbers-lg-heavy-letter-spacing,
        -0.01em
      );
      --_openui-text-block-highlight-number-variation: var(
        --openui-font-variation-medium,
        "wght" 560
      );
      --_openui-text-block-subtext-font: var(
        --openui-text-body-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-subtext-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
      --_openui-text-block-subtext-variation: var(--openui-font-variation-regular, "wght" 440);
      --_openui-text-block-number-subtext-font: var(
        --openui-text-numbers-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-number-subtext-spacing: var(
        --openui-text-numbers-default-letter-spacing,
        -0.01em
      );
      --_openui-text-block-number-subtext-variation: var(
        --openui-font-variation-regular,
        "wght" 440
      );
      --_openui-text-block-highlight-subtext-font: var(
        --openui-text-body-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-text-block-highlight-subtext-spacing: var(
        --openui-text-body-default-letter-spacing,
        -0.01em
      );
      --_openui-text-block-highlight-subtext-variation: var(
        --openui-font-variation-regular,
        "wght" 440
      );
      --_openui-text-block-title-gap: var(--openui-space-xs, 6px);
      --_openui-text-block-highlight-gap: 0px;
    `,
  },
  type: {
    text: css`
      --_openui-text-block-selected-text-font: var(--_openui-text-block-body-font);
      --_openui-text-block-selected-text-spacing: var(--_openui-text-block-body-spacing);
      --_openui-text-block-selected-text-variation: var(--_openui-text-block-body-variation);
      --_openui-text-block-selected-text-heavy-font: var(--_openui-text-block-heavy-font);
      --_openui-text-block-selected-text-heavy-spacing: var(--_openui-text-block-heavy-spacing);
      --_openui-text-block-selected-text-heavy-variation: var(--_openui-text-block-heavy-variation);
      --_openui-text-block-selected-text-subtext-font: var(--_openui-text-block-subtext-font);
      --_openui-text-block-selected-text-subtext-spacing: var(--_openui-text-block-subtext-spacing);
      --_openui-text-block-selected-text-subtext-variation: var(
        --_openui-text-block-subtext-variation
      );
    `,
    textOnly: css`
      --_openui-text-block-selected-text-font: var(--_openui-text-block-body-font);
      --_openui-text-block-selected-text-spacing: var(--_openui-text-block-body-spacing);
      --_openui-text-block-selected-text-variation: var(--_openui-text-block-body-variation);
      --_openui-text-block-selected-text-heavy-font: var(--_openui-text-block-heavy-font);
      --_openui-text-block-selected-text-heavy-spacing: var(--_openui-text-block-heavy-spacing);
      --_openui-text-block-selected-text-heavy-variation: var(--_openui-text-block-heavy-variation);
      --_openui-text-block-selected-text-subtext-font: var(--_openui-text-block-subtext-font);
      --_openui-text-block-selected-text-subtext-spacing: var(--_openui-text-block-subtext-spacing);
      --_openui-text-block-selected-text-subtext-variation: var(
        --_openui-text-block-subtext-variation
      );
    `,
    number: css`
      --_openui-text-block-selected-text-font: var(--_openui-text-block-number-font);
      --_openui-text-block-selected-text-spacing: var(--_openui-text-block-number-spacing);
      --_openui-text-block-selected-text-variation: var(--_openui-text-block-number-variation);
      --_openui-text-block-selected-text-heavy-font: var(--_openui-text-block-number-heavy-font);
      --_openui-text-block-selected-text-heavy-spacing: var(
        --_openui-text-block-number-heavy-spacing
      );
      --_openui-text-block-selected-text-heavy-variation: var(
        --_openui-text-block-number-heavy-variation
      );
      --_openui-text-block-selected-text-subtext-font: var(
        --_openui-text-block-number-subtext-font
      );
      --_openui-text-block-selected-text-subtext-spacing: var(
        --_openui-text-block-number-subtext-spacing
      );
      --_openui-text-block-selected-text-subtext-variation: var(
        --_openui-text-block-number-subtext-variation
      );
    `,
  },
  variant: {
    "title-text": css`
      --_openui-text-block-primary-font: var(--_openui-text-block-heading-font);
      --_openui-text-block-primary-spacing: var(--_openui-text-block-heading-spacing);
      --_openui-text-block-primary-variation: var(--_openui-text-block-heading-variation);
      --_openui-text-block-secondary-font: var(--_openui-text-block-body-font);
      --_openui-text-block-secondary-spacing: var(--_openui-text-block-body-spacing);
      --_openui-text-block-secondary-variation: var(--_openui-text-block-body-variation);
      --_openui-text-block-gap: var(--_openui-text-block-title-gap);
    `,
    "number-title-text": css`
      --_openui-text-block-primary-font: var(--_openui-text-block-number-title-font);
      --_openui-text-block-primary-spacing: var(--_openui-text-block-number-title-spacing);
      --_openui-text-block-primary-variation: var(--_openui-text-block-number-title-variation);
      --_openui-text-block-secondary-font: var(--_openui-text-block-body-font);
      --_openui-text-block-secondary-spacing: var(--_openui-text-block-body-spacing);
      --_openui-text-block-secondary-variation: var(--_openui-text-block-body-variation);
      --_openui-text-block-gap: var(--_openui-text-block-title-gap);
    `,
    "text-subtext": css`
      --_openui-text-block-primary-font: var(--_openui-text-block-selected-text-font);
      --_openui-text-block-primary-spacing: var(--_openui-text-block-selected-text-spacing);
      --_openui-text-block-primary-variation: var(--_openui-text-block-selected-text-variation);
      --_openui-text-block-secondary-font: var(--_openui-text-block-selected-plain-subtext-font);
      --_openui-text-block-secondary-spacing: var(
        --_openui-text-block-selected-plain-subtext-spacing
      );
      --_openui-text-block-secondary-variation: var(
        --_openui-text-block-selected-plain-subtext-variation
      );
      --_openui-text-block-gap: 0px;
    `,
    "highlight-text-number-subtext": css`
      --_openui-text-block-primary-font: var(--_openui-text-block-selected-text-heavy-font);
      --_openui-text-block-primary-spacing: var(--_openui-text-block-selected-text-heavy-spacing);
      --_openui-text-block-primary-variation: var(
        --_openui-text-block-selected-text-heavy-variation
      );
      --_openui-text-block-secondary-font: var(--_openui-text-block-selected-text-subtext-font);
      --_openui-text-block-secondary-spacing: var(
        --_openui-text-block-selected-text-subtext-spacing
      );
      --_openui-text-block-secondary-variation: var(
        --_openui-text-block-selected-text-subtext-variation
      );
      --_openui-text-block-gap: 0px;
    `,
    text: css`
      --_openui-text-block-primary-font: var(--_openui-text-block-selected-text-font);
      --_openui-text-block-primary-spacing: var(--_openui-text-block-selected-text-spacing);
      --_openui-text-block-primary-variation: var(--_openui-text-block-selected-text-variation);
      --_openui-text-block-secondary-font: inherit;
      --_openui-text-block-secondary-spacing: inherit;
      --_openui-text-block-secondary-variation: inherit;
      --_openui-text-block-gap: var(--openui-space-3xs, 2px);
    `,
    "highlight-text": css`
      --_openui-text-block-primary-font: var(--_openui-text-block-heavy-font);
      --_openui-text-block-primary-spacing: var(--_openui-text-block-heavy-spacing);
      --_openui-text-block-primary-variation: var(--_openui-text-block-heavy-variation);
      --_openui-text-block-secondary-font: var(--_openui-text-block-highlight-subtext-font);
      --_openui-text-block-secondary-spacing: var(--_openui-text-block-highlight-subtext-spacing);
      --_openui-text-block-secondary-variation: var(
        --_openui-text-block-highlight-subtext-variation
      );
      --_openui-text-block-gap: var(--_openui-text-block-highlight-gap);
    `,
    number: css`
      --_openui-text-block-primary-font: var(--_openui-text-block-number-only-font);
      --_openui-text-block-primary-spacing: var(--_openui-text-block-number-only-spacing);
      --_openui-text-block-primary-variation: var(--_openui-text-block-number-only-variation);
      --_openui-text-block-secondary-font: inherit;
      --_openui-text-block-secondary-spacing: inherit;
      --_openui-text-block-secondary-variation: inherit;
      --_openui-text-block-gap: var(--openui-space-3xs, 2px);
    `,
    "highlight-number": css`
      --_openui-text-block-primary-font: var(--_openui-text-block-highlight-number-font);
      --_openui-text-block-primary-spacing: var(--_openui-text-block-highlight-number-spacing);
      --_openui-text-block-primary-variation: var(--_openui-text-block-highlight-number-variation);
      --_openui-text-block-secondary-font: inherit;
      --_openui-text-block-secondary-spacing: inherit;
      --_openui-text-block-secondary-variation: inherit;
      --_openui-text-block-gap: var(--openui-space-3xs, 2px);
    `,
  },
  align: {
    left: css`
      align-items: flex-start;
      text-align: left;
    `,
    center: css`
      align-items: center;
      text-align: center;
    `,
    right: css`
      align-items: flex-end;
      text-align: right;
    `,
  },
  // `wrap` is the default look, passed to opt out of a slot's truncation. `truncate` keeps a single
  // line per text that ends in an ellipsis, as SnippetCardBlock's slots show it.
  overflow: {
    wrap: "",
    truncate: css`
      min-width: 0px;
      max-width: 100%;
      overflow: hidden;
      --_openui-text-block-line-max-width: 100%;
      --_openui-text-block-line-overflow: hidden;
      --_openui-text-block-line-text-overflow: ellipsis;
      --_openui-text-block-line-white-space: nowrap;
    `,
  },
  width: {
    fill: css`
      width: 100%;
    `,
  },
};
