import { css } from "goober";

export const names = {
  root: "openui-dashboard-section",
  filter: "openui-dashboard-section-filter",
  rows: "openui-dashboard-section-rows",
} as const;

export const styles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-xl, 24px);
    width: 100%;
  `,
  filter: css`
    width: 100%;
    max-width: 1440px;
    margin: 0 auto var(--openui-space-s, 8px);
  `,
  rows: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-xl, 24px);
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
  `,
};
