import { css } from "../../styles/css";

/** TabsTrigger's stable classes. Active and inactive are `[data-state]` states, not classes. */
export const names = {
  root: "openui-tabs-trigger",
  image: "openui-tabs-trigger-image",
  img: "openui-tabs-trigger-img",
  icon: "openui-tabs-trigger-icon",
  content: "openui-tabs-trigger-content",
  text: "openui-tabs-trigger-text",
  subtext: "openui-tabs-trigger-subtext",
} as const;

const textNeutralPrimary = `var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1))`;
const textNeutralSecondary = `var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6))`;
const sunk = `var(--openui-sunk, oklch(0.097 0 0 / 0.04))`;
const ellipsis = `
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * Padding, alignment and icon/image geometry come from `--_openui-tabs-trigger-*` variables the
 * TabsList variant sets; the fallbacks are the `title` look. `[data-state="active"]` comes after
 * `:hover` and restates everything hover changes, so the active trigger ignores hover.
 */
export const tabsTriggerStyles = {
  root: css`
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: var(--_openui-tabs-trigger-align, center);
    justify-content: center;
    gap: var(--openui-space-s, 8px);
    box-sizing: border-box;
    padding: var(--_openui-tabs-trigger-padding, var(--openui-space-s, 8px) 0);
    border: 0px;
    border-radius: var(--openui-radius-none, 0px);
    min-width: 0;
    width: auto;
    flex-shrink: 0;
    background-color: transparent;
    color: ${textNeutralSecondary};
    font: var(--openui-text-label-default, 400 16px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    &:hover {
      color: ${textNeutralPrimary};
      border: 0px;
      background-color: transparent;
      box-shadow: var(
        --openui-shadow-s,
        0 1px 3px -2px oklch(0 0 0 / 0.02),
        0 2px 5px -2px oklch(0 0 0 / 0.04)
      );
    }
    &[data-state="active"] {
      color: ${textNeutralPrimary};
      border: 0px;
      background-color: transparent;
      box-shadow: none;
      font: var(--openui-text-label-default-heavy, 560 16px/1.25 "Inter", sans-serif);
      letter-spacing: var(--openui-text-label-default-heavy-letter-spacing, -0.01em);
      font-variation-settings: var(--openui-font-variation-medium, "wght" 560);
    }
  `,
  image: css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--_openui-tabs-trigger-image-size, 24px);
    height: var(--_openui-tabs-trigger-image-size, 24px);
    border-radius: var(--_openui-tabs-trigger-image-radius, 0);
    overflow: hidden;
    flex-shrink: 0;
  `,
  img: css`
    width: 100%;
    height: 100%;
    object-fit: cover;
  `,
  icon: css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--_openui-tabs-trigger-icon-size, 24px);
    height: var(--_openui-tabs-trigger-icon-size, 24px);
    border-radius: var(--_openui-tabs-trigger-icon-radius, 0);
    flex-shrink: 0;
    background: ${sunk};
    :where(&) {
      svg {
        width: var(--_openui-tabs-trigger-icon-svg-size, 14px);
        height: var(--_openui-tabs-trigger-icon-svg-size, 14px);
      }
    }
  `,
  content: css`
    display: flex;
    flex-direction: column;
    align-items: var(--_openui-tabs-trigger-content-align, center);
    gap: var(--openui-space-3xs, 2px);
    min-width: 0;
  `,
  text: css`
    width: auto;
    max-width: 232px;
    ${ellipsis}
  `,
  subtext: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: ${textNeutralSecondary};
    ${ellipsis}
    max-width: 232px;
  `,
};
