"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "../../shared/style";
import { names as fieldNames, styles as fieldStyles } from "../Field/field.styles";
import { Button } from "../Button";

export interface TimerProps {
  /** Seconds left. The timer counts it down through onSecondsChange. */
  seconds: number;
  onSecondsChange: (seconds: number) => void;
  label?: string;
  /** Disables start and reset, e.g. while the answer is still streaming. */
  disabled?: boolean;
}

const clock = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
};

/** A countdown with start, pause and reset. */
export function Timer({ seconds, onSecondsChange, label, disabled }: TimerProps) {
  const left = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const [running, setRunning] = useState(false);
  // The ticking interval reads the latest value and setter, not the ones from when it started
  const live = useRef({ left, setValue: onSecondsChange });
  live.current = { left, setValue: onSecondsChange };
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
    if (startedAt !== null) onSecondsChange(startedAt);
    setStartedAt(null);
  };
  const done = left === 0 && startedAt !== null;

  return (
    <div className={cx("openui-intelligent-timer", running && "is-running", done && "is-done")} role="timer" aria-label={label || "Timer"}>
      <div className="openui-intelligent-timer-read">
        {label && <span className={cx(fieldStyles.label, fieldNames.label)}>{label}</span>}
        <span className="openui-intelligent-timer-time">{clock(left)}</span>
      </div>
      <div className="openui-intelligent-timer-actions">
        <Button variant="solid" size="sm" icon={running ? "pause" : "play"} disabled={disabled || left === 0} onClick={toggle}>
          {running ? "Pause" : startedAt === null || left === 0 ? "Start" : "Resume"}
        </Button>
        <Button variant="ghost" size="sm" icon="rotate-ccw" disabled={disabled || startedAt === null} onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
