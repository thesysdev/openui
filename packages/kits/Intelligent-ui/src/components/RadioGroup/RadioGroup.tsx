"use client";

import { OptionCards, RadioGroup as RCRadioGroup, RadioItem } from "@openuidev/react-components";
import clsx from "clsx";
import { useId } from "react";
import { FieldError, RequiredMark } from "../Field";
import { names as fieldNames, styles as fieldStyles } from "../Field/field.styles";
import { names, styles } from "./radioGroup.styles";

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
      <div className={clsx(styles.track, names.track)}>
        {options.map((o, i) => (
          <label key={`${o.value}-${i}`} className={clsx(styles.option, names.option)} data-selected={o.value === value || undefined}>
            <input type="radio" className={clsx(styles.input, names.input)} name={name} checked={o.value === value} onChange={() => onChange(o.value)} />
            <span className={clsx(styles.text, names.text)}>
              <span>{o.label}</span>
              {o.description ? <span className={clsx(styles.description, names.description)}>{o.description}</span> : null}
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
    <fieldset className={clsx(styles.root, names.root, variant === "pills" && names.pills)}>
      {label ? (
        <legend className={clsx(fieldStyles.label, fieldNames.label, styles.legend, names.legend)}>
          {label}
          {required ? <RequiredMark /> : null}
        </legend>
      ) : null}
      {body}
      <FieldError error={error} />
    </fieldset>
  );
}
