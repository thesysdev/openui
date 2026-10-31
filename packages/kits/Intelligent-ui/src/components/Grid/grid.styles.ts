import { css } from "goober";
import { cardSizedType } from "../../shared/flow.styles";

export const names = { root: "openui-intelligent-grid" } as const;

export const styles = {
  root: css`
    display: grid;
    min-width: 0;
    & > * {
      min-width: 0;
    }
    ${cardSizedType("& > .openui-intelligent-flow")}
  `,
};
