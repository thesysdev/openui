import { css } from "@openuidev/react-components";
import { press, typography } from "../shared.styles";

/*
 * An item's Sources popover, on react-ui's theme tokens. Goober splits selectors at commas and
 * mangles a pseudo-class right after ")" or parentheses inside parentheses: none here.
 *
 * Placement: with CSS anchor positioning, `anchored` places it (the anchor gets a matching
 * `anchor-name` from the component); without it, floating-ui sets `top` and `left` inline.
 * `transform` and `clip-path` are left free for its motion (a later change): the card is meant
 * to grow out of its chip, at its top-left corner.
 */

const primary = "var(--openui-text-neutral-primary)";
const secondary = "var(--openui-text-neutral-secondary)";
const border = "var(--openui-border-default)";
const focusRing = "2px solid var(--openui-interactive-accent-default)";

const block = "openui-sources-popover";

/** Stable class names, to target from your own CSS. */
export const popoverNames = {
  root: block,
  header: `${block}__header`,
  chip: `${block}__chip`,
  meta: `${block}__meta`,
  divider: `${block}__divider`,
  body: `${block}__body`,
  view: `${block}__view`,
  custom: `${block}__custom`,
} as const;

export const popoverStyles = {
  root: css`
    box-sizing: border-box;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    width: min(440px, calc(100vw - 16px));
    max-height: min(400px, calc(100dvh - 16px));
    overflow: hidden;
    border-radius: 16px;
    background: var(--openui-popover-background);
    box-shadow:
      0 0 0 0.5px var(--openui-border-interactive-emphasis),
      0 10px 24px var(--openui-sources-popover-drop, rgb(0 0 0 / 0.12));
    color: ${primary};
    ${typography("openui-text-body-sm", "regular")}
    &:focus {
      outline: none;
    }
    &[data-state="closed"] {
      visibility: hidden;
      pointer-events: none;
    }
  `,
  /**
   * Above its anchor, from its left edge, 8px clear of it; right-aligned to it when that would
   * cross the viewport's right side, and below it when there's no room above.
   * `position-anchor` is set inline, per popover.
   */
  anchored: css`
    position: fixed;
    inset: auto;
    margin: 8px 0;
    position-area: block-start span-inline-end;
    position-try-fallbacks:
      block-start span-inline-start,
      block-end span-inline-end,
      block-end span-inline-start;
  `,
  header: css`
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--openui-space-s);
    min-width: 0;
    padding: 4px var(--openui-space-m) 4px 4px;
  `,
  // The Sources chip: where the card grows from, and its way back (or out).
  chip: css`
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 6px;
    padding: 8px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: ${primary};
    cursor: pointer;
    ${typography("openui-text-label-sm-heavy", "medium")}
    font-weight: 500;
    ${press(0.97)}
    & svg {
      width: 16px;
      height: 16px;
    }
    &:focus-visible {
      outline: ${focusRing};
      outline-offset: -2px;
    }
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: var(--openui-highlight);
      }
    }
  `,
  meta: css`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${secondary};
    font-variant-numeric: tabular-nums;
    ${typography("openui-text-label-sm", "regular")}
    & b {
      color: ${primary};
      font-weight: 500;
    }
  `,
  divider: css`
    flex: none;
    height: 1px;
    margin: 0;
    border: 0;
    background: ${border};
  `,
  body: css`
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: var(--openui-space-xs);
    overscroll-behavior: contain;
    scrollbar-width: thin;
  `,
  view: css`
    &:focus {
      outline: none;
    }
  `,
  custom: css`
    padding: var(--openui-space-s);
  `,
};
