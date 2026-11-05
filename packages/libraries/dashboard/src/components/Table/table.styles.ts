import { css } from "@openuidev/react-components";

export const names = { root: "openui-dashboard-table" } as const;

export const styles = {
  /* Tags are block-level, so one in a cell would otherwise stretch across it. */
  root: css`
    & .openui-tag {
      width: fit-content;
    }
  `,
};
