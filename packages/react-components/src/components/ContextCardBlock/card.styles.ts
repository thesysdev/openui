import { css } from "../../styles/css";

export const names = {
  card: "openui-context-card",
  root: "openui-context-card-block",
  vertical: "openui-context-card-vertical",
  top: "openui-context-card-top",
  bottom: "openui-context-card-bottom",
  title: "openui-context-card-title-text",
  body: "openui-context-card-body-text",
  chevron: "openui-context-card-chevron",
  tagWrapper: "openui-context-card-tag-wrapper",
  tag: "openui-context-card-tag",
  chevronIcon: "openui-context-card-chevron-icon",
  clickable: {
    true: "openui-context-card--clickable",
  },
  bgColor: {
    default: "openui-context-card--bg-color-default",
    gray: "openui-context-card--bg-color-gray",
    info: "openui-context-card--bg-color-info",
    success: "openui-context-card--bg-color-success",
    warning: "openui-context-card--bg-color-warning",
    danger: "openui-context-card--bg-color-danger",
  },
} as const;

export const contextCardStyles = {
  card: css`
    --_openui-context-card-image: initial;
    --_openui-context-card-background: initial;
    --_openui-context-card-clickable-background: initial;
    --_openui-context-card-color: initial;
    --_openui-context-card-title-color: initial;
    --_openui-context-card-title-opacity: 1;
    --_openui-context-card-tag-background: initial;
    --_openui-context-card-overlay-content: initial;
    --_openui-context-card-vertical-position: initial;
    --_openui-context-card-vertical-z-index: initial;

    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
    min-width: 196px;
    padding: var(--openui-space-m, 12px);
    border: none;
    border-radius: var(--openui-radius-xl, 12px);
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
    transition:
      background-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;

    background-color: var(
      --_openui-context-card-background,
      var(
        --_openui-context-card-clickable-background,
        var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02))
      )
    );
    box-shadow: none;
    color: var(--_openui-context-card-color, inherit);
    background-image: var(--_openui-context-card-image, none);
    &[data-background-image="true"] {
      background-position: center;
      background-size: cover;
      --_openui-context-card-background: var(
        --_openui-context-card-clickable-background,
        var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02))
      );
      --_openui-context-card-color: var(--openui-text-white, oklch(1 0 89.876 / 1));
      --_openui-context-card-title-color: var(--openui-text-white, oklch(1 0 89.876 / 1));
      --_openui-context-card-title-opacity: 0.6;
      --_openui-context-card-overlay-content: "";
      --_openui-context-card-vertical-position: relative;
      --_openui-context-card-vertical-z-index: 2;
    }
    &::before {
      content: var(--_openui-context-card-overlay-content, none);
      position: absolute;
      inset: 0;
      background: var(--openui-overlay, oklch(0 0 0 / 0.4));
      z-index: 1;
    }
  `,
  clickable: {
    true: css`
      --_openui-context-card-clickable-background: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
      cursor: pointer;
      &:hover {
        transform: scale(0.995);
      }
      &:focus-visible {
        outline: 2px solid var(--openui-border-accent, oklch(0.546 0.215 262.881 / 0.08));
        outline-offset: 2px;
      }
    `,
  },
  bgColor: {
    default: css`
      --_openui-context-card-color: initial;
      --_openui-context-card-title-opacity: 1;
    `,
    gray: css`
      --_openui-context-card-background: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
      --_openui-context-card-color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    `,
    info: css`
      --_openui-context-card-background: var(
        --openui-info-background,
        oklch(0.623 0.188 259.815 / 0.12)
      );
      --_openui-context-card-color: var(--openui-text-info-primary, oklch(0.424 0.181 265.638 / 1));
      --_openui-context-card-title-color: var(--_openui-context-card-color);
      --_openui-context-card-title-opacity: 0.8;
      --_openui-context-card-tag-background: var(--openui-elevated, oklch(0.097 0 0 / 0.08));
    `,
    success: css`
      --_openui-context-card-background: var(
        --openui-success-background,
        oklch(0.627 0.17 149.214 / 0.12)
      );
      --_openui-context-card-color: var(
        --openui-text-success-primary,
        oklch(0.448 0.108 151.328 / 1)
      );
      --_openui-context-card-title-color: var(--_openui-context-card-color);
      --_openui-context-card-title-opacity: 0.8;
      --_openui-context-card-tag-background: var(--openui-elevated, oklch(0.097 0 0 / 0.08));
    `,
    warning: css`
      --_openui-context-card-background: var(
        --openui-alert-background,
        oklch(0.795 0.162 86.047 / 0.16)
      );
      --_openui-context-card-color: var(--openui-text-alert-primary, oklch(0.476 0.103 61.907 / 1));
      --_openui-context-card-title-color: var(--_openui-context-card-color);
      --_openui-context-card-title-opacity: 0.8;
      --_openui-context-card-tag-background: var(--openui-elevated, oklch(0.097 0 0 / 0.08));
    `,
    danger: css`
      --_openui-context-card-background: var(
        --openui-danger-background,
        oklch(0.577 0.215 27.325 / 0.12)
      );
      --_openui-context-card-color: var(--openui-text-danger-primary, oklch(0.505 0.19 27.518 / 1));
      --_openui-context-card-title-color: var(--_openui-context-card-color);
      --_openui-context-card-title-opacity: 0.8;
      --_openui-context-card-tag-background: var(--openui-elevated, oklch(0.097 0 0 / 0.08));
    `,
  },
  vertical: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    height: 100%;
    gap: var(--openui-space-l, 18px);
    position: var(--_openui-context-card-vertical-position, static);
    z-index: var(--_openui-context-card-vertical-z-index, auto);
  `,
  top: css`
    width: 100%;
    border-radius: var(--openui-radius-m, 8px);

    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--openui-space-s, 8px);
    min-height: var(--openui-space-xl, 24px);
  `,
  bottom: css`
    width: 100%;
    border-radius: var(--openui-radius-m, 8px);

    display: flex;
    flex-direction: column;
    gap: var(--openui-space-2xs, 4px);
  `,
  title: css`
    font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(
      --_openui-context-card-title-color,
      var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6))
    );
    opacity: var(--_openui-context-card-title-opacity, 1);
  `,
  body: css`
    font: var(--openui-text-body-default-heavy, 560 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-heavy-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-medium, "wght" 560);
  `,
  chevron: css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: currentColor;
    opacity: 0.7;
  `,
  tagWrapper: css`
    display: flex;
    align-items: center;
    width: 100%;
    pointer-events: none;
  `,
  tag: css`
    border: none;
    background-color: var(--_openui-context-card-tag-background, transparent);
  `,
  chevronIcon: css`
    width: 16px;
    height: 16px;
  `,
};
