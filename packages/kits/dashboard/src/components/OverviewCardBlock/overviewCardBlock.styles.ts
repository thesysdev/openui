import { css } from "goober";
import { metricOverrides } from "../MetricIndicator/metricIndicator.styles";

export const names = { root: "openui-dashboard-overview-card-block" } as const;

/**
 * react-components' card declares content-box with width: 100%, padding and a border, so it
 * overflows its grid cell by padding + border. Drop this once react-components fixes it.
 */
export const styles = {
  root: css`
    & .openui-overview-card-block-card {
      box-sizing: border-box;
    }
    ${metricOverrides}
  `,
};
