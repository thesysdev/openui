import { css } from "goober";

export const names = {
  root: "openui-dashboard-list",
  intro: "openui-dashboard-list-intro",
  heading: "openui-dashboard-list-heading",
  description: "openui-dashboard-list-description",
} as const;

export const styles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-l, 18px);
    width: 100%;
    padding: 16px 0;
  `,
  intro: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-3xs, 2px);
  `,
  heading: css`
    font-weight: 600;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  description: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
};
