import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const THUMB = "var(--_openui-intelligent-slider-thumb-size, 18px)";

export const names = {
  root: "openui-intelligent-slider",
  head: "openui-intelligent-slider-head",
  label: "openui-intelligent-slider-label",
  output: "openui-intelligent-slider-output",
  range: "openui-intelligent-slider-range",
  marks: "openui-intelligent-slider-marks",
  mark: "openui-intelligent-slider-mark",
} as const;

/** A 24px pill track with an 18px thumb inside a 40px hit area. */
export const styles = {
  root: css`
    --_openui-intelligent-slider-thumb-size: 18px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  `,
  head: css`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    line-height: 1.4;
  `,
  label: css`
    color: ${tokens.ink};
    overflow-wrap: anywhere;
  `,
  output: css`
    color: ${tokens.ink};
    font-size: 12px;
    font-weight: 560;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  `,
  range: css`
    appearance: none;
    -webkit-appearance: none;
    display: block;
    width: 100%;
    min-width: 0;
    height: 40px;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    &::-webkit-slider-runnable-track {
      height: 24px;
      border: 3px solid transparent;
      border-radius: 999px;
      background: ${tokens.rangeTrack};
    }
    &::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
      width: ${THUMB};
      height: ${THUMB};
      margin: 0;
      border: 0;
      border-radius: 50%;
      background: ${tokens.rangeThumb};
    }
    &::-moz-range-track {
      height: 24px;
      border-radius: 999px;
      background: ${tokens.rangeTrack};
    }
    &::-moz-range-thumb {
      width: ${THUMB};
      height: ${THUMB};
      border: 0;
      border-radius: 50%;
      background: ${tokens.rangeThumb};
    }
    &::-moz-range-progress {
      background: transparent;
    }
    &:focus-visible {
      outline: 2px solid ${tokens.focus};
      outline-offset: 2px;
      border-radius: 12px;
    }
  `,
  marks: css`
    position: relative;
    height: 18px;
    margin-top: -2px;
    color: ${tokens.muted};
    font-size: 11px;
    line-height: 18px;
  `,
  mark: css`
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    &[data-edge="start"] {
      transform: translateX(-9px);
    }
    &[data-edge="end"] {
      transform: translateX(calc(-100% + 9px));
    }
  `,
};
