import { css } from "@openuidev/react-components";
import { easeOut, typography } from "../shared.styles";

/*
 * The Sources hover card, on react-ui's theme tokens. Goober splits selectors at commas and
 * mangles a pseudo-class right after ")" or parentheses inside parentheses: none here.
 *
 * Placement: with CSS anchor positioning, `anchored` places it (the anchor gets a matching
 * `anchor-name` from the component); without it, floating-ui sets `top` and `left` inline.
 * Either way `transform` is left to the entrance, so the card never flies in from 0,0.
 *
 * Motion: it grows in from the side nearest its anchor (from its centre when anchored, where the
 * side the browser picks isn't known), opacity plus scale 0.97 → 1 over 125ms on
 * the strong ease-out, once placed. The next card while one shows or just closed appears with no
 * motion, and every card leaves instantly. Reduced motion keeps a 150ms fade.
 */

const secondary = "var(--openui-text-neutral-secondary)";

const block = "openui-data-sources-hover-card";

/** Stable class names, to target from your own CSS. */
export const hoverCardNames = {
  root: block,
  kind: `${block}__kind`,
  name: `${block}__name`,
  code: `${block}__code`,
  result: `${block}__result`,
  queries: `${block}__queries`,
  more: `${block}__more`,
  hint: `${block}__hint`,
} as const;

export const hoverCardStyles = {
  root: css`
    box-sizing: border-box;
    z-index: 9999;
    width: max-content;
    min-width: 220px;
    max-width: min(320px, calc(100vw - 16px));
    padding: var(--openui-space-m);
    border-radius: var(--openui-radius-l);
    background: var(--openui-popover-background);
    box-shadow:
      0 0 0 1px var(--openui-border-interactive),
      var(--openui-shadow-xl);
    color: var(--openui-text-neutral-primary);
    pointer-events: none;
    ${typography("openui-text-body-sm", "regular")}
    opacity: 0;
    &[data-side="top"] {
      transform-origin: bottom center;
    }
    &[data-side="bottom"] {
      transform-origin: top center;
    }
    &[data-placed] {
      opacity: 1;
    }
    @media (prefers-reduced-motion: no-preference) {
      transform: scale(0.97);
      &[data-placed] {
        transform: none;
        transition:
          opacity 125ms ${easeOut},
          transform 125ms ${easeOut};
      }
    }
    @media (prefers-reduced-motion: reduce) {
      &[data-placed] {
        transition: opacity 150ms;
      }
    }
    &[data-placed][data-instant] {
      transition: none;
    }
  `,
  /**
   * Above its anchor and centred on it, 8px clear of it and of the viewport's edges; below it when
   * there's no room above, and aligned to one of its edges when centring would cross the viewport's
   * side. `position-anchor` is set inline, per card.
   */
  anchored: css`
    position: fixed;
    inset: auto;
    margin: 8px;
    position-area: block-start;
    position-try-fallbacks:
      flip-block,
      block-start span-inline-end,
      block-end span-inline-end,
      block-start span-inline-start,
      block-end span-inline-start;
    transform-origin: center;
  `,
  kind: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-xs);
    color: ${secondary};
    ${typography("openui-text-label-xs", "regular")}
    & svg {
      flex: none;
      width: 14px;
      height: 14px;
    }
  `,
  name: css`
    margin-left: auto;
    padding-left: var(--openui-space-s);
    ${typography("openui-text-code-sm", "regular")}
    color: ${secondary};
  `,
  code: css`
    margin: var(--openui-space-s) 0 0;
    padding: var(--openui-space-s);
    overflow: hidden;
    border-radius: var(--openui-radius-s);
    background: var(--openui-background);
    text-overflow: ellipsis;
    white-space: nowrap;
    ${typography("openui-text-code-sm", "regular")}
  `,
  result: css`
    margin-top: var(--openui-space-s);
    font-variant-numeric: tabular-nums;
  `,
  queries: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-2xs);
    margin: var(--openui-space-s) 0 0;
    padding: 0;
    list-style: none;
    & li {
      display: flex;
      align-items: center;
      gap: var(--openui-space-s);
      ${typography("openui-text-code-sm", "regular")}
    }
    & li > span {
      margin-left: auto;
      color: ${secondary};
      ${typography("openui-text-label-xs", "regular")}
    }
  `,
  more: css`
    margin-top: var(--openui-space-2xs);
    color: ${secondary};
    ${typography("openui-text-label-xs", "regular")}
  `,
  hint: css`
    margin-top: var(--openui-space-s);
    padding-top: var(--openui-space-s);
    border-top: 1px solid var(--openui-border-default);
    color: ${secondary};
    ${typography("openui-text-label-xs", "regular")}
  `,
};
