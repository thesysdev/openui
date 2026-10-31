import clsx from "clsx";
import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { names, styles } from "./field.styles";

/** A required field's marker after its label. */
export const RequiredMark = () => (
  <span className={clsx(styles.required, names.required)} aria-hidden="true">
    *
  </span>
);

/** A field's validation error, under the field. */
export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <span className={clsx(styles.error, names.error)} role="alert">
      <CircleAlert size={14} aria-hidden className={clsx(styles.errorIcon, names.errorIcon)} />
      {error}
    </span>
  );
}

export interface FieldProps {
  label?: string;
  /** Marks the label with an asterisk. */
  required?: boolean;
  /** Shown under the control. */
  error?: string;
  children: ReactNode;
}

/** Wraps a control in its label and error, or renders it bare when it has neither. */
export function Field({ label, required, error, children: content }: FieldProps) {
  if (!label && !error) return <>{content}</>;
  return (
    <label className={clsx(styles.root, names.root)}>
      {label ? (
        <span className={clsx(styles.label, names.label)}>
          {label}
          {required ? <RequiredMark /> : null}
        </span>
      ) : null}
      {content}
      <FieldError error={error} />
    </label>
  );
}
