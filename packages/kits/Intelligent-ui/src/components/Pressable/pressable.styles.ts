import { css } from "goober";
import { tokens } from "../../shared/tokens";

const WASH = "--_openui-intelligent-pressable-wash";
const CHECK = "--_openui-intelligent-pressable-check";
const ROW = ".openui-intelligent-row";

export const names = { root: "openui-intelligent-pressable" } as const;

/**
 * An ink wash on hover (5%) and press (8%) with a small scale; a selected tile keeps a light wash, a
 * hairline ring and a check badge instead of a heavy outline. A row (a checklist line) shows its own
 * check icon, so selected adds no fill, ring or badge, and it keeps still: the wash alone shows hover
 * and press. Whether it holds a Row, or a struck-through Text, is not flat: those are the model's.
 * The wash and the check are set on every tile, so a nested tile does not inherit them.
 */
export const styles = {
  root: css`
    ${WASH}: 0;
    ${CHECK}: "";
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    border-radius: ${tokens.radiusLg};
    cursor: pointer;
    outline: none;
    transition: transform 120ms ease-out, box-shadow 120ms ease-out;
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: ${tokens.ink};
      opacity: var(${WASH}, 0);
      pointer-events: none;
      transition: opacity 120ms ease-out;
    }
    &[aria-pressed="true"] {
      ${WASH}: 0.06;
      box-shadow: inset 0 0 0 1px color-mix(in srgb, ${tokens.ink} 20%, transparent);
    }
    &[aria-pressed="true"]::before {
      content: var(${CHECK}, "");
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: ${tokens.ink} var(--_openui-intelligent-pressable-check-icon, none) center / 12px no-repeat;
    }
    &:hover:not([aria-disabled="true"]) {
      ${WASH}: 0.05;
      transform: scale(1.01);
    }
    &:active:not([aria-disabled="true"]) {
      ${WASH}: 0.08;
      transform: scale(0.98);
    }
    &[aria-pressed="true"]:has(> ${ROW}) {
      ${WASH}: 0;
      ${CHECK}: none;
      box-shadow: none;
    }
    &:hover:has(> ${ROW}),
    &:active:has(> ${ROW}) {
      transform: none;
    }
    & .openui-intelligent-text[style*="line-through"] {
      color: ${tokens.muted};
    }
    &[aria-disabled="true"] {
      cursor: default;
    }
    &:focus-visible {
      outline: 2px solid ${tokens.focus};
      outline-offset: 3px;
    }
    @media (prefers-reduced-motion: reduce) {
      transition: none;
      &::after {
        transition: none;
      }
      &:hover:not([aria-disabled="true"]),
      &:active:not([aria-disabled="true"]) {
        transform: none;
      }
    }
  `,
};
