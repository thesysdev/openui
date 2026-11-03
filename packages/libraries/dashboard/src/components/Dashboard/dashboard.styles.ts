import { css } from "@openuidev/react-components";

export const names = { root: "openui-dashboard" } as const;

export const styles = {
  root: css`
    display: flex;
    gap: var(--openui-space-l, 18px);
    flex-direction: column;
  `,
};
