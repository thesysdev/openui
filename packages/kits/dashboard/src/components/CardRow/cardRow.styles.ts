import { css } from "@openuidev/react-components";
import { whenRowWidth } from "../../shared/rowWidth";

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

const HALF = `calc((100% - ${GAP}) / 2)`;
const THIRD = `calc((100% - ${GAP} - ${GAP}) / 3)`;
const QUARTER = `calc((100% - ${GAP} - ${GAP} - ${GAP}) / 4)`;

/* Narrow rows stack every card, and rows under 1080px hold two cards unless a rule says otherwise. */
const stacked = (basis: string) => whenRowWidth("600px", "100%", basis);
const smallBasis = (from1080: string) =>
  stacked(whenRowWidth("1080px", HALF, whenRowWidth("1280px", from1080, "220px")));
const mediumBasis = stacked(whenRowWidth("1080px", HALF, whenRowWidth("1280px", "320px", "360px")));

/**
 * A row never reaches into its cards. It sets how each card size flexes in private variables,
 * and ShellCard reads them.
 */
export const styles = {
  root: css`
    --_openui-dashboard-card-row-gap: var(--openui-space-m-l, 16px);
    --_openui-dashboard-card-row-card-max-width: none;
    ${SMALL}: 1 1 ${stacked("0px")};
    ${MEDIUM}: 1 1 ${stacked("0px")};
    ${LARGE}: 1 1 ${stacked("0px")};
    display: flex;
    flex-wrap: wrap;
    gap: ${GAP};
    width: 100%;
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
      ${SMALL}: 1 1 ${smallBasis("220px")};
      &[data-count="3"] {
        ${SMALL}: 1 1 ${stacked(whenRowWidth("700px", HALF, whenRowWidth("800px", THIRD, whenRowWidth("1080px", HALF, "220px"))))};
      }
      &[data-count="4"] {
        ${SMALL}: 1 1 ${smallBasis(QUARTER)};
      }
      &[data-count="5"] {
        ${SMALL}: 1 1 ${smallBasis(THIRD)};
      }
    `,
    medium: css`
      ${MEDIUM}: 1 1 ${mediumBasis};
    `,
    "medium-large": css`
      ${MEDIUM}: 1 1 ${whenRowWidth("1080px", "100%", whenRowWidth("1280px", "320px", "360px"))};
      ${LARGE}: 2 1 ${whenRowWidth("1080px", "100%", whenRowWidth("1280px", "720px", "832px"))};
    `,
    large: css`
      ${LARGE}: 1 1 100%;
    `,
  },
};
