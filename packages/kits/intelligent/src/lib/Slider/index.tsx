"use client";

import { defineComponent, useStateField } from "@openuidev/react-lang";
import { Slider as SliderView } from "../../components/Slider";
import { useFieldName } from "../controlHelpers";
import { SliderSchema } from "./schema";

export * from "./schema";

export const Slider = defineComponent({
  name: "Slider",
  props: SliderSchema,
  description: 'Shows label and value; unit like "%" or "$" formats the value.',
  component: function SliderBinding({ props, statementId }) {
    const field = useStateField(useFieldName(props.label, statementId), props.value);
    return (
      <SliderView
        value={typeof field.value === "number" ? field.value : Number(field.value)}
        onChange={(value) => field.setValue(value)}
        min={props.min}
        max={props.max}
        step={props.step}
        label={props.label}
        unit={props.unit}
        marks={props.marks}
      />
    );
  },
});
