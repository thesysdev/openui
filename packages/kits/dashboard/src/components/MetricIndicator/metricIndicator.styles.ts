import { css } from "goober";
import { typography } from "../../shared/typography";

export const names = { root: "openui-dashboard-metric-indicator" } as const;

/**
 * Only what differs from react-components' MetricIndicator, as a wrapper class plus its stable
 * classes: dashboards show a larger value, baseline-aligned, with body-sized subtext and trend.
 */
export const metricOverrides = `
  & .openui-metric-indicator-row {
    align-items: baseline;
  }
  & .openui-metric-indicator-main-value {
    ${typography("number", "heading-medium")}
  }
  & .openui-metric-indicator-subtext {
    ${typography("body", "default")}
  }
  & .openui-metric-indicator-trend {
    margin-bottom: 0;
    ${typography("number", "default")}
  }
`;

export const styles = {
  root: css`
    min-width: 0;
    ${metricOverrides}
  `,
};
