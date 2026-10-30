"use client";

import { defineComponent, useIsStreaming, useStateField } from "@openuidev/react-lang";
import { Timer as TimerView } from "../../components/Timer";
import { useFieldName } from "../controlHelpers";
import { TimerSchema } from "./schema";

export * from "./schema";

export const Timer = defineComponent({
  name: "Timer",
  props: TimerSchema,
  description: "Countdown with start, pause and reset. It counts the bound seconds down to 0, so other statements can react, e.g. $left == 0.",
  component: function TimerBinding({ props, statementId }) {
    const field = useStateField(useFieldName(props.label, statementId), props.seconds);
    const streaming = useIsStreaming();
    return (
      <TimerView
        seconds={typeof field.value === "number" ? field.value : Number(field.value)}
        onSecondsChange={field.setValue}
        label={props.label}
        disabled={streaming}
      />
    );
  },
});
