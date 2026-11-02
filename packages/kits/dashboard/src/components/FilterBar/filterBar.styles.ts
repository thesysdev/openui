import { css } from "goober";
import { typography } from "../../shared/typography";

export const names = {
  root: "openui-dashboard-filter-bar",
  compact: "openui-dashboard-filter-bar--compact",
  side: "openui-dashboard-filter-bar-side",
  left: "openui-dashboard-filter-bar-side--left",
  right: "openui-dashboard-filter-bar-side--right",
} as const;

const GAP = "var(--_openui-dashboard-filter-bar-gap)";

export const styles = {
  root: css`
    --_openui-dashboard-filter-bar-gap: var(--openui-space-s, 8px);
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: ${GAP};
    width: 100%;
    min-width: 0;
    overflow: visible;
    /* Overrides of react-components' DatePicker: a wrapper class plus its stable classes. */
    & .openui-date-picker {
      width: 180px;
      align-self: flex-end;
    }
    & .openui-date-picker-trigger {
      height: 32px;
      padding: 0 var(--openui-space-s, 8px);
      border-color: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
      border-radius: var(--openui-radius-m, 8px);
      background: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
      box-shadow: none;
      ${typography("label", "small")}
    }
    & .openui-date-picker-trigger[data-placeholder] {
      color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    }
    & .openui-date-picker-text {
      font: inherit;
      letter-spacing: inherit;
    }
  `,
  compact: css`
    --_openui-dashboard-filter-bar-gap: var(--openui-space-xs, 6px);
  `,
  /* `& > *`: the filters in a side are the caller's, so they can't take a class from here. */
  side: css`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: ${GAP};
    min-width: 0;
    overflow: visible;
    & > * {
      flex: 0 0 auto;
    }
  `,
  left: css`
    flex: 1 1 auto;
  `,
  right: css`
    flex: 0 0 auto;
    justify-content: flex-end;
    margin-left: auto;
  `,
};
