import { css } from "@openuidev/react-components";

export const names = { root: "openui-intelligent-col" } as const;

export const colStyles = {
  root: css`
    font-variation-settings: normal;
    display: flex;
    flex-direction: column;
    min-width: 0;
  `,
};
