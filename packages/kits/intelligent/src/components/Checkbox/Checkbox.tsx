import { CheckBoxItem } from "@openuidev/react-components";
import { cx } from "../../shared/style";
import { FieldError } from "../Field";

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
  // CheckBoxItem has no lineThrough, so the kit's class still supplies the
  // strike-through that to-do lists in the prompt examples rely on.
  return (
    <span className={cx("iui-checkbox", lineThrough && checked && "iui-check is-done")}>
      <CheckBoxItem label={label} checked={checked} aria-required={required || undefined} aria-invalid={error ? true : undefined} onChange={onChange} />
      <FieldError error={error} />
    </span>
  );
}
