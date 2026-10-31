import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-field",
  label: "openui-intelligent-field-label",
  required: "openui-intelligent-field-required",
  error: "openui-intelligent-field-error",
  errorIcon: "openui-intelligent-field-error-icon",
} as const;

export const styles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  `,
  label: css`
    color: ${tokens.ink};
    font-size: 14px;
    line-height: 1.4;
    font-weight: 560;
  `,
  required: css`
    margin-left: 2px;
  `,
  error: css`
    display: flex;
    align-items: center;
    gap: 6px;
    color: ${tokens.danger};
    font-size: 13px;
    line-height: 18px;
  `,
  errorIcon: css`
    flex: none;
  `,
};
