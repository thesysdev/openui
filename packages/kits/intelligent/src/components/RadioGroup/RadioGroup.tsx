"use client";

import { OptionCards, RadioGroup as RCRadioGroup, RadioItem } from "@openuidev/react-components";
import { useId } from "react";
import { cx } from "../../shared/style";
import { FieldError, RequiredMark } from "../Field";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  options: RadioOption[];
  /** The chosen option's value, or "" for none. */
  value: string;
  onChange: (value: string) => void;
  /** list (the default), cards for choices that need a description line, or pills for short choices. */
  variant?: "list" | "cards" | "pills";
  label?: string;
  required?: boolean;
  /** Shown under the options. */
  error?: string;
}

/**
 * One group, three renderings:
 *
 *   list   -> react-components' RadioGroup + RadioItem
 *   cards  -> react-components' OptionCards (its title/subtitle match label/description)
 *   pills  -> the kit's own markup, kept deliberately
 *
 * All three sit in one fieldset, so the label and any error show the same way.
 */
export function RadioGroup({ options, value, onChange, variant: variantProp, label, required, error }: RadioGroupProps) {
  const name = useId();
  const variant = variantProp ?? "list";
  let body;
  if (variant === "pills") {
    // The kit's pills, unchanged.
    body = (
      <div>
        {options.map((o, i) => (
          <label key={`${o.value}-${i}`} className={cx("openui-intelligent-choice", o.value === value && "is-selected")}>
            <input type="radio" name={name} checked={o.value === value} onChange={() => onChange(o.value)} />
            <span className="openui-intelligent-choice-text">
              <span>{o.label}</span>
              {o.description ? <span className="openui-intelligent-choice-description">{o.description}</span> : null}
            </span>
          </label>
        ))}
      </div>
    );
  } else if (variant === "cards") {
    body = (
      <OptionCards
        items={options.map((o) => ({ value: o.value, title: o.label, subtitle: o.description }))}
        selected={value ? [value] : []}
        type="single"
        onToggle={onChange}
      />
    );
  } else {
    body = (
      <RCRadioGroup value={value} onValueChange={onChange} aria-required={required || undefined} aria-invalid={error ? true : undefined}>
        {options.map((o, i) => (
          <RadioItem key={`${o.value}-${i}`} value={o.value} label={o.label} description={o.description} />
        ))}
      </RCRadioGroup>
    );
  }
  return (
    <fieldset className={cx("openui-intelligent-radio-group", variant === "pills" && "openui-intelligent-radio-pills")}>
      {label ? (
        <legend className="openui-intelligent-label">
          {label}
          {required ? <RequiredMark /> : null}
        </legend>
      ) : null}
      {body}
      <FieldError error={error} />
    </fieldset>
  );
}
