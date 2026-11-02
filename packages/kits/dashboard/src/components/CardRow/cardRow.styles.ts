import { css } from "goober";

export const names = {
  root: "openui-dashboard-card-row",
  align: {
    start: "openui-dashboard-card-row--align-start",
    stretch: "openui-dashboard-card-row--align-stretch",
  },
  type: {
    small: "openui-dashboard-card-row--type-small",
    medium: "openui-dashboard-card-row--type-medium",
    "medium-large": "openui-dashboard-card-row--type-medium-large",
    large: "openui-dashboard-card-row--type-large",
  },
} as const;

const GAP = "var(--_openui-dashboard-card-row-gap)";
const SMALL = "--_openui-dashboard-card-row-small-flex";
const MEDIUM = "--_openui-dashboard-card-row-medium-flex";
const LARGE = "--_openui-dashboard-card-row-large-flex";

/* Phones stack every card. Each class repeats this last, so it wins over that class's widths. */
const stacked = `
  @media (max-width: 768px) {
    ${SMALL}: 1 1 100%;
    ${MEDIUM}: 1 1 100%;
    ${LARGE}: 1 1 100%;
  }
`;

/**
 * A row never reaches into its cards. It sets how each card size flexes in private variables,
 * and ShellCard reads them.
 */
export const styles = {
  root: css`
    --_openui-dashboard-card-row-gap: var(--openui-space-m-l, 16px);
    --_openui-dashboard-card-row-card-max-width: none;
    ${SMALL}: 1 1 0;
    ${MEDIUM}: 1 1 0;
    ${LARGE}: 1 1 0;
    display: flex;
    flex-wrap: wrap;
    gap: ${GAP};
    width: 100%;
    ${stacked}
  `,
  align: {
    start: css`
      align-items: flex-start;
    `,
    stretch: css`
      align-items: stretch;
    `,
  },
  type: {
    small: css`
      ${SMALL}: 1 1 220px;
      @media (min-width: 1080px) and (max-width: 1279px) {
        &[data-count="5"] {
          ${SMALL}: 1 1 calc((100% - ${GAP} - ${GAP}) / 3);
        }
        &[data-count="4"] {
          ${SMALL}: 1 1 calc((100% - ${GAP} - ${GAP} - ${GAP}) / 4);
        }
      }
      @media (max-width: 1079px) {
        ${SMALL}: 1 1 calc((100% - ${GAP}) / 2);
      }
      ${stacked}
    `,
    medium: css`
      ${MEDIUM}: 1 1 360px;
      @media (min-width: 1080px) and (max-width: 1279px) {
        ${MEDIUM}: 1 1 320px;
      }
      @media (max-width: 1079px) {
        ${MEDIUM}: 1 1 calc((100% - ${GAP}) / 2);
      }
      ${stacked}
    `,
    "medium-large": css`
      ${MEDIUM}: 1 1 360px;
      ${LARGE}: 2 1 832px;
      @media (min-width: 1080px) and (max-width: 1279px) {
        ${MEDIUM}: 1 1 320px;
        ${LARGE}: 2 1 720px;
      }
      @media (max-width: 1079px) {
        ${MEDIUM}: 1 1 100%;
        ${LARGE}: 2 1 100%;
      }
      ${stacked}
    `,
    large: css`
      ${LARGE}: 1 1 100%;
      ${stacked}
    `,
  },
};
