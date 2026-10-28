"use client";

import { OptionCards, RadioGroup as RCRadioGroup, RadioItem } from "@openuidev/react-components";
import { defineComponent, useStateField } from "@openuidev/react-lang";
import { useId } from "react";
import { choiceList, useFieldName } from "../controlHelpers";
import { cx } from "../style";
import { RadioGroupSchema } from "./schema";

export * from "./schema";

/**
 * One schema, three renderings — so this dispatches on variant rather than
 * mapping onto a single component:
 *
 *   list   -> RadioGroup + RadioItem
 *   cards  -> OptionCards (its title/subtitle match label/description)
 *   pills  -> the kit's own markup, kept deliberately
 */
export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: RadioGroupSchema,
  description: "pills for short choices; cards for choices that need a description line.",
  component: function RadioGroupView({ props, statementId }) {
    const field = useStateField(useFieldName(props.label, statementId), props.value);
    const name = useId();
    const value = field.value == null ? "" : String(field.value);
    const variant = props.variant ?? "list";
    const choices = choiceList(props.options);

    if (variant === "pills") {
      // The kit's pills, unchanged.
      return (
        <fieldset className={cx("iui-radio-group", "iui-radio-pills")}>
          {props.label ? <legend className="iui-label">{props.label}</legend> : null}
          <div>
            {choices.map((o, i) => (
              <label key={`${o.value}-${i}`} className={cx("iui-choice", o.value === value && "is-selected")}>
                <input type="radio" name={name} checked={o.value === value} onChange={() => field.setValue(o.value)} />
                <span className="iui-choice-text">
                  <span>{o.label}</span>
                  {o.description ? <span className="iui-choice-description">{o.description}</span> : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    if (variant === "cards") {
      return (
        <OptionCards
          items={choices.map((o) => ({ value: o.value, title: o.label, subtitle: o.description }))}
          selected={value ? [value] : []}
          type="single"
          onToggle={(next: string) => field.setValue(next)}
        />
      );
    }

    return (
      <RCRadioGroup
        value={value}
        onValueChange={(next: string) => field.setValue(next)}
        aria-label={props.label}
      >
        {choices.map((o, i) => (
          <RadioItem key={`${o.value}-${i}`} value={o.value} label={o.label} description={o.description} />
        ))}
      </RCRadioGroup>
    );
  },
});
