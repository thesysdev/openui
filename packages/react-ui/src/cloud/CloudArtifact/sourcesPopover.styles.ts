import { css, keyframes } from "@openuidev/react-components";
import { easeOut, press, typography } from "../shared.styles";

/*
 * An item's Sources popover, on react-ui's theme tokens. Goober splits selectors at commas and
 * mangles a pseudo-class right after ")" or parentheses inside parentheses: none here.
 *
 * Placement: with CSS anchor positioning, `anchored` places it (the anchor gets a matching
 * `anchor-name` from the component); without it, floating-ui sets `top` and `left` inline.
 * Its motion uses only `clip-path`, `transform` and `opacity`, never its box.
 *
 * Motion, from the design's "Sources as a popover" note:
 * - Open: the chip fades in and scales from 0.96 in 150ms; the card grows out of the chip in
 *   250ms (a clip-path from the chip's box, which the component sets as custom properties);
 *   the header's label and value, the divider and the list fade in over 200ms after 80ms.
 * - Close: the content fades out in 100ms while the card shrinks back into the chip in 200ms.
 * - List to source and back: the view slides 12px in 200ms the way it went; the chip's icon and
 *   label swap in 200ms.
 * With reduced motion nothing grows, scales or slides: everything only fades.
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
  chipFace: `${block}__chip-face`,
  meta: `${block}__meta`,
  divider: `${block}__divider`,
  body: `${block}__body`,
  view: `${block}__view`,
  custom: `${block}__custom`,
} as const;

// ── Motion ──

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

/** The chip's box in the card, set inline by the component; a Sources chip until it measures. */
const chipBox = [
  "var(--openui-sources-chip-y, 4px)",
  "calc(100% - var(--openui-sources-chip-x, 4px) - var(--openui-sources-chip-width, 88px))",
  "calc(100% - var(--openui-sources-chip-y, 4px) - var(--openui-sources-chip-height, 32px))",
  "var(--openui-sources-chip-x, 4px)",
].join(" ");
const asChip = `inset(${chipBox} round 10px)`;
/** Past the card's edges, so its shadow shows while it grows (no clip-path at all once open). */
const asCard = "inset(-32px round 48px)";

const grow = keyframes`
  from {
    clip-path: ${asChip};
  }
  to {
    clip-path: ${asCard};
  }
`;
const shrink = keyframes`
  from {
    clip-path: ${asCard};
  }
  75% {
    opacity: 1;
  }
  to {
    clip-path: ${asChip};
    opacity: 0;
  }
`;
const chipIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.96);
  }
`;
const slideFromEnd = keyframes`
  from {
    opacity: 0;
    transform: translateX(12px);
  }
`;
const slideFromStart = keyframes`
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
`;

/** The card's contents, besides its chip: they fade in after the card starts to grow. */
const contents = `
  @media (prefers-reduced-motion: no-preference) {
    animation: ${fadeIn} 200ms ease-out 80ms both;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: ${fadeIn} 200ms ease-out both;
  }
`;

/** The same contents fade out first when the card closes: set from the card, by stable name. */
const closingContents = [popoverNames.meta, popoverNames.divider, popoverNames.body]
  .map(
    (name) => `
  &[data-state="closed"] .${name} {
    animation: ${fadeOut} 100ms ease-out both;
  }`,
  )
  .join("");

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
    /* Closed, it stays for its exit: it takes no pointer, and it unmounts when the exit ends. */
    &[data-state="closed"] {
      pointer-events: none;
    }
    @media (prefers-reduced-motion: no-preference) {
      animation: ${grow} 250ms ${easeOut};
      &[data-state="closed"] {
        animation: ${shrink} 200ms ${easeOut} both;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      animation: ${fadeIn} 200ms ease-out;
      &[data-state="closed"] {
        animation: ${fadeOut} 200ms ease-out both;
      }
    }
    ${closingContents}
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
    @media (prefers-reduced-motion: no-preference) {
      animation: ${chipIn} 150ms ${easeOut};
    }
    @media (prefers-reduced-motion: reduce) {
      animation: ${fadeIn} 150ms ease-out;
    }
  `,
  /** The chip's icon and label: swapped for the back arrow and "All sources" in a source. */
  chipFace: css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    &[data-swapped] {
      @media (prefers-reduced-motion: no-preference) {
        animation: ${chipIn} 200ms ${easeOut};
      }
      @media (prefers-reduced-motion: reduce) {
        animation: ${fadeIn} 200ms ease-out;
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
    ${contents}
  `,
  divider: css`
    flex: none;
    height: 1px;
    margin: 0;
    border: 0;
    background: ${border};
    ${contents}
  `,
  body: css`
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: var(--openui-space-xs);
    overscroll-behavior: contain;
    scrollbar-width: thin;
    ${contents}
  `,
  /** Going into a source it comes in from the end; back to the list, from the start. */
  view: css`
    &:focus {
      outline: none;
    }
    @media (prefers-reduced-motion: no-preference) {
      &[data-direction="forward"] {
        animation: ${slideFromEnd} 200ms ${easeOut};
      }
      &[data-direction="back"] {
        animation: ${slideFromStart} 200ms ${easeOut};
      }
    }
    @media (prefers-reduced-motion: reduce) {
      &[data-direction] {
        animation: ${fadeIn} 200ms ease-out;
      }
    }
  `,
  custom: css`
    padding: var(--openui-space-s);
  `,
};
