import { css } from "@openuidev/react-components";
import { typography } from "../../shared/typography";

export const names = {
  root: "openui-dashboard-date-field",
  label: "openui-dashboard-date-field-label",
} as const;

/* Matches FilterSelect's labelled column so a labelled DatePicker lines up with it. */
export const styles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-3xs, 2px);
    min-width: 0;
  `,
  label: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    ${typography("label", "small")}
  `,
};
