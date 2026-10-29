"use client";

import { defineComponent, useStateField } from "@openuidev/react-lang";
import { ButtonView } from "../Button";
import { optionList, useFieldName } from "../controlHelpers";
import { cx } from "../style";
import { SegmentedControlSchema } from "./schema";

export * from "./schema";

/** A pill track: a radiogroup whose options are the kit's buttons, the chosen one a raised pill. */
export const SegmentedControl = defineComponent({
  name: "SegmentedControl",
  props: SegmentedControlSchema,
  description: "2 to 4 short choices in a row.",
  component: function SegmentedView({ props, statementId }) {
    const field = useStateField(useFieldName(undefined, statementId), props.value);
    const value = field.value == null ? "" : String(field.value);
    return (
      <div className={cx("iui-segmented", props.block && "iui-block")} role="radiogroup">
        {optionList(props.options).map((o, i) => (
          <ButtonView
            key={`${o.value}-${i}`}
            variant="ghost"
            size="sm"
            role="radio"
            aria-checked={o.value === value}
            className={cx("iui-segment", o.value === value && "is-selected")}
            onClick={() => field.setValue(o.value)}
          >
            {o.label}
          </ButtonView>
        ))}
      </div>
    );
  },
});
