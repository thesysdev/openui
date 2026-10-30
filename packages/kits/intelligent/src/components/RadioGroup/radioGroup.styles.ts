import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-radio-group",
  pills: "openui-intelligent-radio-group--pills",
  legend: "openui-intelligent-radio-group-legend",
  track: "openui-intelligent-radio-group-track",
  option: "openui-intelligent-radio-group-option",
  input: "openui-intelligent-radio-group-input",
  text: "openui-intelligent-radio-group-text",
  description: "openui-intelligent-radio-group-description",
} as const;

/** Short choices are pills (the cards style draws with react-components' OptionCards). */
export const styles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  `,
  legend: css`
    padding: 0;
    margin-bottom: 10px;
  `,
  track: css`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: ${tokens.controlGap};
  `,
  option: css`
    position: relative;
    display: flex;
    align-items: center;
    min-height: 42px;
    padding: 9px 16px;
    border: 1px solid ${tokens.border};
    border-radius: 999px;
    background: transparent;
    color: ${tokens.ink};
    font-size: 15px;
    line-height: 22px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    &:hover {
      background: ${tokens.hover};
    }
    &[data-selected] {
      border-color: ${tokens.ink};
      background: ${tokens.ink};
      color: ${tokens.onInk};
    }
    &:has(:focus-visible) {
      outline: 2px solid ${tokens.focus};
      outline-offset: 2px;
    }
  `,
  input: css`
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  `,
  text: css`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  description: css`
    color: ${tokens.muted};
    font-size: 14px;
    line-height: 21px;
  `,
};
