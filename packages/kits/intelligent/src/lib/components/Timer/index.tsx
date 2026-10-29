"use client";

import { defineComponent, useIsStreaming, useStateField } from "@openuidev/react-lang";
import { useEffect, useRef, useState } from "react";
import { ButtonView } from "../Button";
import { useFieldName } from "../controlHelpers";
import { cx } from "../style";
import { TimerSchema } from "./schema";

export * from "./schema";

const clock = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
};

export const Timer = defineComponent({
  name: "Timer",
  props: TimerSchema,
  description: "Countdown with start, pause and reset. It counts the bound seconds down to 0, so other statements can react, e.g. $left == 0.",
  component: function TimerView({ props, statementId }) {
    const field = useStateField(useFieldName(props.label, statementId), props.seconds);
    const streaming = useIsStreaming();
    const raw = typeof field.value === "number" ? field.value : Number(field.value);
    const left = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
    const [running, setRunning] = useState(false);
    // The ticking interval reads the latest value and setter, not the ones from when it started
    const live = useRef({ left, setValue: field.setValue });
    live.current = { left, setValue: field.setValue };
    // What Reset goes back to: the value when the countdown first started
    const [startedAt, setStartedAt] = useState<number | null>(null);

    useEffect(() => {
      if (!running) return;
      const id = setInterval(() => {
        const next = Math.max(0, live.current.left - 1);
        live.current.left = next;
        live.current.setValue(next);
        if (next === 0) setRunning(false);
      }, 1000);
      return () => clearInterval(id);
    }, [running]);

    const toggle = () => {
      if (!running && startedAt === null) setStartedAt(left);
      setRunning(!running);
    };
    const reset = () => {
      setRunning(false);
      if (startedAt !== null) field.setValue(startedAt);
      setStartedAt(null);
    };
    const done = left === 0 && startedAt !== null;
    return (
      <div className={cx("iui-timer", running && "is-running", done && "is-done")} role="timer" aria-label={props.label || "Timer"}>
        <div className="iui-timer-read">
          {props.label && <span className="iui-label">{props.label}</span>}
          <span className="iui-timer-time">{clock(left)}</span>
        </div>
        <div className="iui-timer-actions">
          <ButtonView variant="solid" size="sm" icon={running ? "pause" : "play"} disabled={streaming || left === 0} onClick={toggle}>
            {running ? "Pause" : startedAt === null || left === 0 ? "Start" : "Resume"}
          </ButtonView>
          <ButtonView variant="ghost" size="sm" icon="rotate-ccw" disabled={streaming || startedAt === null} onClick={reset}>
            Reset
          </ButtonView>
        </div>
      </div>
    );
  },
});
