import { css } from "@openuidev/react-components";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-field",
  label: "openui-intelligent-field-label",
  required: "openui-intelligent-field-required",
  error: "openui-intelligent-field-error",
  errorIcon: "openui-intelligent-field-error-icon",
  control: "openui-intelligent-field-control",
} as const;

const subtle = "var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02))";
const highlight = "var(--openui-highlight, oklch(0.097 0 0 / 0.04))";
const interactive = "var(--openui-border-interactive, oklch(0.097 0 0 / 0.12))";
const pad = "calc(var(--openui-space-s, 8px) - 1px) var(--openui-space-m, 12px)";

export const styles = {
  /*
   * One look for every field, taken from react-components' large Input. Select, TextArea and
   * DatePicker each draw their own, so beside an Input they came out taller, rounder or darker.
   * Hover, focus, open and error states keep react-components' own borders.
   */
  control: css`
    &.openui-select-trigger,
    & .openui-date-picker-trigger {
      padding: ${pad};
      border-radius: var(--openui-radius-l, 10px);
    }
    &.openui-select-trigger:not(:hover):not([data-state="open"]):not([aria-invalid="true"]),
    & .openui-date-picker-trigger:not(:hover):not([data-state="open"]) {
      border-color: ${interactive};
    }
    & .openui-date-picker-trigger {
      background-color: ${subtle};
      box-shadow: none;
    }
    & .openui-date-picker-trigger:hover,
    & .openui-date-picker-trigger[data-state="open"] {
      background-color: ${highlight};
    }
    &.openui-text-area {
      padding: ${pad};
      border-radius: var(--openui-radius-l, 10px);
    }
  `,
  root: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  `,
  label: css`
    color: ${tokens.ink};
    font-size: 14px;
    line-height: 1.4;
    font-weight: 560;
  `,
  required: css`
    margin-left: 2px;
  `,
  error: css`
    display: flex;
    align-items: center;
    gap: 6px;
    color: ${tokens.danger};
    font-size: 13px;
    line-height: 18px;
  `,
  errorIcon: css`
    flex: none;
  `,
};
