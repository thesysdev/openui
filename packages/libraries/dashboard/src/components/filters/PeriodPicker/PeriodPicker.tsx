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
  const current = props.value ?? list[0]?.value;
  return (
    <div
      className="openui-dashboard-segmented"
      role="radiogroup"
      aria-label="Date range"
      onKeyDown={(event) => !props.streaming && radioKeys(event, list, current, props.onChange)}
    >
      {list.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === current}
          tabIndex={option.value === current ? 0 : -1}
          disabled={props.streaming}
          onClick={() => props.onChange(option.value)}
        >
          {option.label ?? option.value}
        </button>
      ))}
    </div>
  );
}
