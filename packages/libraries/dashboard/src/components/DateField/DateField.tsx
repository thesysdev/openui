import clsx from "clsx";
import type { ReactNode } from "react";
import { names, styles } from "./dateField.styles";

export interface DateFieldProps {
  label?: string;
  children: ReactNode;
}

/** A date picker with an optional label above it, laid out like FilterSelect. */
export function DateField({ label, children }: DateFieldProps) {
  if (!label) return <>{children}</>;
  return (
    <div className={clsx(styles.root, names.root)}>
      <span className={clsx(styles.label, names.label)}>{label}</span>
      {children}
    </div>
  );
}
