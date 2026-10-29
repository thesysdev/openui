"use client";

import { defineComponent, useStateField } from "@openuidev/react-lang";
import { optionList, useFieldName } from "../controlHelpers";
import { cx } from "../style";
import { SegmentedControlSchema } from "./schema";

export * from "./schema";

/** The kit's own pill track: a radiogroup of buttons, the chosen one a raised pill. */
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
          <button
            key={`${o.value}-${i}`}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className={cx(o.value === value && "is-selected")}
            onClick={() => field.setValue(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  },
});
