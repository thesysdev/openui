import { css } from "@openuidev/react-components";
import { typography } from "../../shared/typography";

export const names = {
  root: "openui-dashboard-section",
  title: "openui-dashboard-section-title",
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
  title: css`
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    ${typography("body", "large-heavy")}
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
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
