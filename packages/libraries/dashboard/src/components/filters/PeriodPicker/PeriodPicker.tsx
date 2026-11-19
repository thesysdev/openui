"use client";
import { radioKeys } from "../../shared/ViewSwitch";
import type { Option } from "../options";

/* ---------- PeriodPicker: the quick date-range filter ---------- */

export interface PeriodPickerProps {
  value?: string;
  onChange: (value: string) => void;
  streaming: boolean;
  options: Option[];
}

export function PeriodPicker(props: PeriodPickerProps) {
  const list = props.options;
  // The $variable's own value: with none, no option is selected.
  const current = props.value ?? undefined;
  // The Tab stop is the selected option, or the first while nothing is selected.
  const chosen = list.findIndex((option) => option.value === current);
  return (
    <div
      className="openui-dashboard-segmented"
      role="radiogroup"
      aria-label="Date range"
      onKeyDown={(event) => !props.streaming && radioKeys(event, list, current, props.onChange)}
    >
      {list.map((option, i) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === current}
          tabIndex={(chosen < 0 ? i === 0 : i === chosen) ? 0 : -1}
          disabled={props.streaming}
          onClick={() => props.onChange(option.value)}
        >
          {option.label ?? option.value}
        </button>
      ))}
    </div>
  );
}
