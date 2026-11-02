import { css } from "goober";
import { typography } from "../../shared/typography";

export const names = {
  root: "openui-dashboard-card-header",
  main: "openui-dashboard-card-header-main",
  content: "openui-dashboard-card-header-content",
  controls: "openui-dashboard-card-header-controls",
  title: "openui-dashboard-card-header-title",
} as const;

const titleBlock = `
  &.openui-text-block {
    gap: var(--openui-space-3xs, 2px);
  }
  & .openui-text-block-secondary {
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    ${typography("body", "default")}
  }
`;

export const styles = {
  root: css`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
    min-width: 0;
    gap: var(--openui-space-m, 12px);
  `,
  main: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
  `,
  content: css`
    min-width: 0;
    display: flex;
    flex-direction: column;
  `,
  controls: css`
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--openui-space-2xs, 4px);
  `,
  /* Overrides of react-components' TextBlockView: a wrapper class plus its stable classes. */
  textTitle: css`
    ${titleBlock}
    & .openui-text-block-primary {
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
      ${typography("body", "large-heavy")}
    }
  `,
  numberTitle: css`
    ${titleBlock}
    & .openui-text-block-primary {
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
      ${typography("number", "heading-medium")}
    }
  `,
};
