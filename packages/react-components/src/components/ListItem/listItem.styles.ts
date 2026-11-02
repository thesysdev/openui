import { css } from "../../styles/css";

export const names = {
  root: "openui-list-item",
  item: "openui-list-item-row",
  indicator: "openui-list-item-indicator",
  indicatorNumber: "openui-list-item-indicator-number",
  indicatorImage: "openui-list-item-indicator-image",
  contentWrapper: "openui-list-item-content-wrapper",
  content: "openui-list-item-content",
  title: "openui-list-item-title",
  subtitle: "openui-list-item-subtitle",
  action: "openui-list-item-action",
  actionLabel: "openui-list-item-action-label",
  actionIcon: "openui-list-item-action-icon",
  image: "openui-list-item-image",
  variant: {
    number: "openui-list-item--variant-number",
    icon: "openui-list-item--variant-icon",
    image: "openui-list-item--variant-image",
  },
  size: { default: "openui-list-item--size-default", small: "openui-list-item--size-small" },
  listHasSubtitle: "openui-list-item--list-has-subtitle",
} as const;

export const listItemStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--_openui-list-item-gap);
    width: 100%;
    --_openui-list-item-indicator-size: var(--_openui-list-item-indicator-compact-size);
    --_openui-list-item-indicator-margin: 0px;
    --_openui-list-item-indicator-radius: var(--openui-radius-s, 6px);
    &[data-action="true"] {
      --_openui-list-item-action-scale: 1.1;
      --_openui-list-item-indicator-hover-bg: var(
        --openui-highlight-strong,
        oklch(0.097 0 0 / 0.08)
      );
      border-bottom: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      padding-bottom: var(--openui-space-m, 12px);
    }
    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    &:hover {
      --_openui-list-item-indicator-scale: var(--_openui-list-item-action-scale, 1);
    }
  `,
  item: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--_openui-list-item-row-gap);
    &[data-subtitle="true"] {
      align-items: flex-start;
    }
    &[data-action="true"] {
      cursor: pointer;
      --_openui-list-item-action-scale: 1.1;
    }
    &:hover {
      --_openui-list-item-indicator-bg: var(--_openui-list-item-indicator-hover-bg);
      --_openui-list-item-action-color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    }
    &:focus {
      --_openui-list-item-indicator-bg: var(--_openui-list-item-indicator-hover-bg);
      --_openui-list-item-action-color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    }
  `,
  indicator: css`
    margin-top: var(--_openui-list-item-indicator-margin);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--_openui-list-item-indicator-size);
    height: var(--_openui-list-item-indicator-size);
    background-color: var(
      --_openui-list-item-indicator-bg,
      var(--openui-sunk, oklch(0.097 0 0 / 0.04))
    );
    border-radius: var(--_openui-list-item-indicator-radius);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    overflow: hidden;
    transition: background-color 0.2s ease;
    flex-shrink: 0;
    scale: var(--_openui-list-item-indicator-scale, 1);
  `,
  indicatorNumber: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    font: var(--_openui-list-item-number-font);
    letter-spacing: var(--_openui-list-item-number-spacing);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  indicatorImage: css`
    border-radius: var(--openui-radius-s, 6px);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  `,
  contentWrapper: css`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
  `,
  content: css`
    display: flex;
    flex-direction: column;
    flex: 1;
  `,
  title: css`
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font: var(--_openui-list-item-row-font);
    letter-spacing: var(--_openui-list-item-row-letter-spacing);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  subtitle: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    font: var(--_openui-list-item-row-font);
    letter-spacing: var(--_openui-list-item-row-letter-spacing);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  action: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: var(--openui-space-2xs, 4px);
    flex-shrink: 0;
  `,
  actionLabel: css`
    color: var(
      --_openui-list-item-action-color,
      var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6))
    );
    font: var(--_openui-list-item-row-font);
    letter-spacing: var(--_openui-list-item-row-letter-spacing);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  actionIcon: css`
    color: var(
      --_openui-list-item-action-color,
      var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6))
    );
    font: var(--_openui-list-item-row-font);
    letter-spacing: var(--_openui-list-item-row-letter-spacing);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  image: css`
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  `,
  listHasSubtitle: css`
    --_openui-list-item-indicator-size: var(--_openui-list-item-indicator-full-size);
    --_openui-list-item-indicator-margin: var(--openui-space-2xs, 4px);
    --_openui-list-item-indicator-radius: var(--openui-radius-m, 8px);
  `,
  size: {
    default: css`
      --_openui-list-item-gap: var(--openui-space-m, 12px);
      --_openui-list-item-row-gap: var(--openui-space-m, 12px);
      --_openui-list-item-indicator-compact-size: 24px;
      --_openui-list-item-indicator-full-size: 40px;
      --_openui-list-item-row-font: var(
        --openui-text-body-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-list-item-row-letter-spacing: var(
        --openui-text-body-default-letter-spacing,
        -0.01em
      );
      --_openui-list-item-number-font: var(
        --openui-text-label-default,
        400 16px/1.25 "Inter",
        sans-serif
      );
      --_openui-list-item-number-spacing: var(--openui-text-label-default-letter-spacing, -0.01em);
    `,
    small: css`
      --_openui-list-item-gap: var(--openui-space-s, 8px);
      --_openui-list-item-row-gap: var(--openui-space-s-m, 10px);
      --_openui-list-item-indicator-compact-size: 20px;
      --_openui-list-item-indicator-full-size: 36px;
      --_openui-list-item-row-font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
      --_openui-list-item-row-letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
      --_openui-list-item-number-font: var(
        --openui-text-numbers-sm,
        400 14px/1.5 "Inter",
        sans-serif
      );
      --_openui-list-item-number-spacing: var(--openui-text-numbers-sm-letter-spacing, -0.01em);
    `,
  },
};
