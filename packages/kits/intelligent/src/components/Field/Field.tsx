import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

/** A required field's marker after its label. */
export const RequiredMark = () => (
  <span className="iui-required" aria-hidden="true">
    *
  </span>
);

/** A field's validation error, under the field. */
export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <span className="iui-field-error" role="alert">
      <CircleAlert size={14} aria-hidden />
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
    <label className="iui-field">
      {label ? (
        <span className="iui-label">
          {label}
          {required ? <RequiredMark /> : null}
        </span>
      ) : null}
      {content}
      <FieldError error={error} />
    </label>
  );
}
