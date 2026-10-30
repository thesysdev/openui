import { CheckBoxItem } from "@openuidev/react-components";
import clsx from "clsx";
import { FieldError } from "../Field";
import { names, styles } from "./checkbox.styles";

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Strikes the label through when checked, for to-do lists. */
  lineThrough?: boolean;
  required?: boolean;
  /** Shown under the checkbox. */
  error?: string;
}

/** react-components' CheckBoxItem, with the kit's strike-through and a field error. */
export function Checkbox({ label, checked, onChange, lineThrough, required, error }: CheckboxProps) {
  return (
    <span className={clsx(styles.root, names.root)} data-done={(lineThrough && checked) || undefined}>
      <CheckBoxItem label={label} checked={checked} aria-required={required || undefined} aria-invalid={error ? true : undefined} onChange={onChange} />
      <FieldError error={error} />
    </span>
  );
}
