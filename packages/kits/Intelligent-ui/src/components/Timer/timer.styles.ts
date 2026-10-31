import { css } from "goober";
import { tokens } from "../../shared/tokens";

const TIME_COLOR = "--_openui-intelligent-timer-time-color";

export const names = {
  root: "openui-intelligent-timer",
  read: "openui-intelligent-timer-read",
  time: "openui-intelligent-timer-time",
  actions: "openui-intelligent-timer-actions",
} as const;

export const styles = {
  root: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    min-width: 0;
    padding: 12px 16px;
    border: 1px solid ${tokens.border};
    border-radius: ${tokens.radiusLg};
    &[data-state="running"] {
      ${TIME_COLOR}: ${tokens.ink};
    }
    &[data-state="done"] {
      ${TIME_COLOR}: ${tokens.success};
    }
  `,
  read: css`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  time: css`
    color: var(${TIME_COLOR}, inherit);
    font-size: 32px;
    line-height: 1.1;
    font-weight: 640;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
  `,
  actions: css`
    display: flex;
    gap: 8px;
  `,
};
