import { css } from "goober";
import { typography } from "../../shared/typography";

export const names = {
  root: "openui-dashboard-header",
  content: "openui-dashboard-header-content",
  title: "openui-dashboard-header-title",
  subtitle: "openui-dashboard-header-subtitle",
  controls: "openui-dashboard-header-controls",
} as const;

export const styles = {
  root: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--openui-space-l, 18px);
    width: 100%;
    max-width: 1440px;
    padding: var(--openui-space-l, 18px) 0 var(--openui-space-m, 12px);
    margin: 0 auto;
    @media (max-width: 768px) {
      flex-direction: column;
    }
  `,
  content: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: var(--openui-space-m, 12px);
  `,
  title: css`
    ${typography("heading", "large")}
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  subtitle: css`
    ${typography("body", "default")}
    max-width: 720px;
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  controls: css`
    display: flex;
    flex-wrap: wrap;
    flex-shrink: 0;
    align-items: center;
    justify-content: flex-end;
    gap: var(--openui-space-m, 12px);
    @media (max-width: 768px) {
      justify-content: flex-start;
      width: 100%;
      padding-top: 0;
    }
  `,
};
