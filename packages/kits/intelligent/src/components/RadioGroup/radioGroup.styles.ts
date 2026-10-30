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

/**
 * Short choices are pills. The list and the cards are react-components' RadioItem and OptionCards, so
 * their look goes by those stable classes.
 */
export const styles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;

    & .openui-radio-group {
      gap: 2px;
    }
    & .openui-radio-item-container {
      align-items: center;
      gap: 9px;
      min-height: 28px;
      padding: 0;
    }
    & .openui-radio-item {
      width: 17px;
      height: 17px;
      margin: 0;
      --_openui-radio-item-stroke: ${tokens.muted};
      --_openui-radio-item-fill: transparent;
      --_openui-radio-item-inner: transparent;
      --_openui-radio-item-hover-inner: ${tokens.hover};
    }
    & .openui-radio-item[data-state="checked"] {
      --_openui-radio-item-stroke: ${tokens.ink};
      --_openui-radio-item-fill: transparent;
      --_openui-radio-item-inner: ${tokens.ink};
      --_openui-radio-item-hover-inner: ${tokens.ink};
    }
    & .openui-radio-item-label {
      font: inherit;
      letter-spacing: inherit;
      color: ${tokens.ink};
    }

    & .openui-option-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
      gap: ${tokens.controlGap};
    }
    & .openui-option-cards-row {
      display: contents;
    }
    & .openui-option-cards-item[data-span] {
      grid-column: auto;
    }
    & .openui-option-cards-card {
      padding: 14px 16px;
      border-color: ${tokens.border};
    }
    & .openui-option-cards-card[aria-checked="true"] {
      border-color: ${tokens.ink};
      background-color: ${tokens.pressed};
      box-shadow: inset 0 0 0 1px ${tokens.ink};
    }
    & .openui-option-cards-title {
      color: ${tokens.ink};
      font-size: 15px;
      line-height: 22px;
      font-weight: 560;
    }
    & .openui-option-cards-subtitle {
      color: ${tokens.muted};
      font-size: 14px;
      line-height: 21px;
    }
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
