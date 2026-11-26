import { css, keyframes } from "@openuidev/react-components";
import { easeOut, typography } from "../shared.styles";

/*
 * The All sources menu, on react-ui's theme tokens: a 480×520 card under the Sources split
 * button, right-aligned to it. floating-ui places it through `top` and `left`, so `transform` is
 * free for its motion: it drops 4px and grows from 97% out of its top-right corner, 250ms in and
 * 150ms out. With reduced motion it only fades.
 */

const primary = "var(--openui-text-neutral-primary)";
const secondary = "var(--openui-text-neutral-secondary)";
const focusRing = "2px solid var(--openui-interactive-accent-default)";

const block = "openui-sources-menu";

/** Stable class names, to target from your own CSS. */
export const menuNames = {
  root: block,
  header: `${block}__header`,
  label: `${block}__label`,
  back: `${block}__back`,
  meta: `${block}__meta`,
  close: `${block}__close`,
  divider: `${block}__divider`,
  body: `${block}__body`,
  view: `${block}__view`,
  custom: `${block}__custom`,
} as const;

const enter = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.97);
  }
`;
const leave = keyframes`
  to {
    opacity: 0;
    transform: translateY(-4px) scale(0.97);
  }
`;
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
`;
const fadeOut = keyframes`
  to {
    opacity: 0;
  }
`;

const headerButton = `
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: ${primary};
  ${typography("openui-text-label-sm-heavy", "medium")}
  font-weight: 500;
  & svg {
    width: 16px;
    height: 16px;
  }
`;

export const menuStyles = {
  root: css`
    box-sizing: border-box;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    width: min(480px, calc(100vw - 16px));
    max-height: min(520px, calc(100dvh - 16px));
    overflow: hidden;
    border-radius: 16px;
    background: var(--openui-popover-background);
    box-shadow:
      0 0 0 0.5px var(--openui-border-interactive-emphasis),
      0 24px 48px var(--openui-sources-menu-drop, rgb(0 0 0 / 0.16));
    color: ${primary};
    transform-origin: top right;
    ${typography("openui-text-body-sm", "regular")}
    &:focus {
      outline: none;
    }
    &[data-state="closed"] {
      pointer-events: none;
    }
    @media (prefers-reduced-motion: no-preference) {
      &[data-state="open"] {
        animation: ${enter} 250ms ${easeOut};
      }
      &[data-state="closed"] {
        animation: ${leave} 150ms ${easeOut} forwards;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      &[data-state="open"] {
        animation: ${fadeIn} 250ms ease;
      }
      &[data-state="closed"] {
        animation: ${fadeOut} 150ms ease forwards;
      }
    }
  `,
  /** Without a button to open under, e.g. opened from code: the content's top-right corner. */
  unanchored: css`
    position: fixed;
    top: 16px;
    right: 16px;
  `,
  header: css`
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--openui-space-s);
    min-width: 0;
    padding: 4px 4px 4px 4px;
  `,
  label: css`
    ${headerButton}
  `,
  back: css`
    ${headerButton}
    cursor: pointer;
    @media (prefers-reduced-motion: no-preference) {
      transition:
        background-color 120ms ease,
        transform 160ms ${easeOut};
      &:active {
        transform: scale(0.97);
      }
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
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${secondary};
    font-variant-numeric: tabular-nums;
    ${typography("openui-text-label-sm", "regular")}
  `,
  close: css`
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: ${secondary};
    cursor: pointer;
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
        color: ${primary};
      }
    }
  `,
  divider: css`
    flex: none;
    height: 1px;
    margin: 0;
    border: 0;
    background: var(--openui-border-default);
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
