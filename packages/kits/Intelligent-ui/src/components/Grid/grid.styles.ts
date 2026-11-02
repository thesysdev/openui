import { css } from "@openuidev/react-components";
import { cardSizedType } from "../../shared/flow.styles";

export const names = { root: "openui-intelligent-grid" } as const;

export const gridStyles = {
  root: css`
    font-variation-settings: normal;
    display: grid;
    min-width: 0;
    & > * {
      min-width: 0;
    }
    ${cardSizedType("& > .openui-intelligent-flow")}
  `,
};
