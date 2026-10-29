"use client";

import { OptionCards, RadioGroup as RCRadioGroup, RadioItem } from "@openuidev/react-components";
import { defineComponent, useStateField } from "@openuidev/react-lang";
import { useId } from "react";
import { choiceList, FieldError, Required, useFieldName, useFieldRules } from "../controlHelpers";
import { cx } from "../style";
import { RadioGroupSchema } from "./schema";

export * from "./schema";

/**
 * One schema, three renderings, so this dispatches on variant rather than
 * mapping onto a single component:
 *
 *   list   -> RadioGroup + RadioItem
 *   cards  -> OptionCards (its title/subtitle match label/description)
 *   pills  -> the kit's own markup, kept deliberately
 *
 * All three sit in one fieldset, so the label and any error show the same way.
 */
export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: RadioGroupSchema,
  description: "pills for short choices; cards for choices that need a description line.",
  component: function RadioGroupView({ props, statementId }) {
    const fieldName = useFieldName(props.label, statementId);
    const field = useStateField(fieldName, props.value);
    const name = useId();
    const value = field.value == null ? "" : String(field.value);
    const rules = useFieldRules(fieldName, props.rules, value);
    const variant = props.variant ?? "list";
    const choices = choiceList(props.options);
    const choose = (next: string) => {
      rules.clear();
      field.setValue(next);
    };

    let body;
    if (variant === "pills") {
      // The kit's pills, unchanged.
      body = (
        <div>
          {choices.map((o, i) => (
            <label key={`${o.value}-${i}`} className={cx("iui-choice", o.value === value && "is-selected")}>
              <input type="radio" name={name} checked={o.value === value} onChange={() => choose(o.value)} />
              <span className="iui-choice-text">
                <span>{o.label}</span>
                {o.description ? <span className="iui-choice-description">{o.description}</span> : null}
              </span>
            </label>
          ))}
        </div>
      );
    } else if (variant === "cards") {
      body = (
        <OptionCards
          items={choices.map((o) => ({ value: o.value, title: o.label, subtitle: o.description }))}
          selected={value ? [value] : []}
          type="single"
          onToggle={choose}
        />
      );
    } else {
      body = (
        <RCRadioGroup
          value={value}
          onValueChange={choose}
          aria-required={rules.required || undefined}
          aria-invalid={rules.error ? true : undefined}
        >
          {choices.map((o, i) => (
            <RadioItem key={`${o.value}-${i}`} value={o.value} label={o.label} description={o.description} />
          ))}
        </RCRadioGroup>
      );
    }

    return (
      <fieldset className={cx("iui-radio-group", variant === "pills" && "iui-radio-pills")}>
        {props.label ? (
          <legend className="iui-label">
            {props.label}
            {rules.required ? <Required /> : null}
          </legend>
        ) : null}
        {body}
        <FieldError error={rules.error} />
      </fieldset>
    );
  },
});
