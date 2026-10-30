"use client";

import { defineComponent, useStateField } from "@openuidev/react-lang";
import { SegmentedControl as SegmentedControlView } from "../../components/SegmentedControl";
import { optionList, useFieldName } from "../controlHelpers";
import { SegmentedControlSchema } from "./schema";

export * from "./schema";

export const SegmentedControl = defineComponent({
  name: "SegmentedControl",
  props: SegmentedControlSchema,
  description: "2 to 4 short choices in a row.",
  component: function SegmentedControlBinding({ props, statementId }) {
    const field = useStateField(useFieldName(undefined, statementId), props.value);
    return (
      <SegmentedControlView
        options={optionList(props.options)}
        value={field.value == null ? "" : String(field.value)}
        onChange={(value) => field.setValue(value)}
        block={props.block}
      />
    );
  },
});
