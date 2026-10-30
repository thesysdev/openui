import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = { root: "openui-intelligent-link", arrow: "openui-intelligent-link-arrow" } as const;

export const styles = {
  root: css`
    color: inherit;
    text-decoration: underline;
    text-decoration-color: ${tokens.borderStrong};
    text-underline-offset: 3px;
    &:hover {
      text-decoration-color: currentColor;
    }
    &:focus-visible {
      outline: 2px solid ${tokens.focus};
      outline-offset: 3px;
    }
  `,
  arrow: css`
    display: inline;
    width: 0.85em;
    height: 0.85em;
    margin-left: 2px;
    vertical-align: -0.05em;
  `,
};
