import { css } from "goober";
import { typography } from "../../shared/typography";
import { DROPDOWN } from "../../shared/zIndex";

export const names = {
  root: "openui-dashboard-filter-select",
  label: "openui-dashboard-filter-select-label",
  control: "openui-dashboard-filter-select-control",
  trigger: "openui-dashboard-filter-select-trigger",
  triggerSingle: "openui-dashboard-filter-select-trigger--single",
  triggerMulti: "openui-dashboard-filter-select-trigger--multi",
  value: "openui-dashboard-filter-select-value",
  summary: "openui-dashboard-filter-select-summary",
  summaryText: "openui-dashboard-filter-select-summary-text",
  placeholder: "openui-dashboard-filter-select-placeholder",
  count: "openui-dashboard-filter-select-count",
  chevron: "openui-dashboard-filter-select-chevron",
  popover: "openui-dashboard-filter-select-popover",
  radioPopover: "openui-dashboard-filter-select-popover--radio",
  checkboxPopover: "openui-dashboard-filter-select-popover--checkbox",
  options: "openui-dashboard-filter-select-options",
  option: "openui-dashboard-filter-select-option",
  radioOption: "openui-dashboard-filter-select-option--radio",
  radioInput: "openui-dashboard-filter-select-radio-input",
  radioLabel: "openui-dashboard-filter-select-radio-label",
} as const;

export const styles = {
  root: css`
    display: flex;
    flex-direction: column;
    width: 180px;
    gap: var(--openui-space-3xs, 2px);
    min-width: 0;
  `,
  label: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    ${typography("label", "small")}
  `,
  control: css`
    position: relative;
    width: 100%;
    min-width: 0;
  `,
  trigger: css`
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    width: 100%;
    gap: var(--openui-space-xs, 6px);
    border: 1px solid var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    border-radius: var(--openui-radius-m, 8px);
    background: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    cursor: pointer;
    ${typography("label", "small")}
    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    &[data-empty] {
      color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    }
  `,
  triggerSingle: css`
    justify-content: space-between;
    height: 32px;
    padding: 0 var(--openui-space-s, 8px);
  `,
  triggerMulti: css`
    min-height: 32px;
    padding: var(--openui-space-2xs, 4px) var(--openui-space-s, 8px);
  `,
  value: css`
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  summary: css`
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--openui-space-xs, 6px);
    min-width: 0;
  `,
  summaryText: css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  count: css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 var(--openui-space-2xs, 4px);
    border-radius: var(--openui-radius-full, 9999px);
    background: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    ${typography("label", "extra-small")}
  `,
  chevron: css`
    flex-shrink: 0;
    margin-left: auto;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    &[data-open] {
      transform: rotate(180deg);
    }
  `,
  popover: css`
    position: absolute;
    z-index: ${DROPDOWN};
    top: calc(100% + var(--openui-space-2xs, 4px));
    left: 0;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: max-content;
    min-width: 180px;
    max-width: min(320px, calc(100vw - 32px));
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-l, 10px);
    background: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    box-shadow: var(
      --openui-shadow-m,
      0 4px 6px -2px oklch(0 0 0 / 0.025),
      0 2px 2px -2px oklch(0 0 0 / 0.05)
    );
  `,
  radioPopover: css`
    gap: var(--openui-space-3xs, 2px);
    padding: var(--openui-space-2xs, 4px);
  `,
  checkboxPopover: css`
    max-height: 240px;
    overflow: hidden;
  `,
  options: css`
    overflow-y: auto;
    flex: 1;
    padding: var(--openui-space-2xs, 4px);
  `,
  option: css`
    box-sizing: border-box;
    width: 100%;
    padding: var(--openui-space-2xs, 4px) var(--openui-space-xs, 6px);
    border-radius: var(--openui-radius-s, 6px);
    cursor: pointer;
    transition: background-color 120ms ease;
    &:hover {
      background: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    }
  `,
  radioOption: css`
    display: flex;
    align-items: center;
    min-height: 32px;
    gap: var(--openui-space-s, 8px);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  radioInput: css`
    appearance: none;
    flex: 0 0 auto;
    box-sizing: border-box;
    width: 16px;
    height: 16px;
    margin: 0;
    border: 1px solid var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    border-radius: var(--openui-radius-full, 9999px);
    background: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    cursor: inherit;
    &:checked {
      border-color: var(--openui-border-interactive-selected, oklch(0.097 0 0 / 1));
      background:
        radial-gradient(
          circle,
          var(--openui-border-interactive-selected, oklch(0.097 0 0 / 1)) 0 4px,
          transparent 4.5px
        ),
        var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    }
    &:focus-visible {
      outline: 2px solid var(--openui-border-interactive-selected, oklch(0.097 0 0 / 1));
      outline-offset: 2px;
    }
  `,
  radioLabel: css`
    overflow: hidden;
    ${typography("label", "small")}
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
};
