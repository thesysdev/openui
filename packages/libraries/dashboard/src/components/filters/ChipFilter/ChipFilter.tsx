"use client";
import { useReportFilter } from "../../../shared/filterRegistry";
import { radioKeys } from "../../shared/ViewSwitch";
import type { Option } from "../options";

/* ---------- ChipFilter: quick filters as pills ---------- */

export interface ChipFilterProps {
  name: string;
  value?: string;
  onChange: (value: string) => void;
  streaming: boolean;
  options: Option[];
  label?: string;
}

export function ChipFilter(props: ChipFilterProps) {
  const list = props.options;
  // The $variable's own value: with none, no option is selected.
  const current = props.value ?? undefined;
  // The Tab stop is the selected option, or the first while nothing is selected.
  const chosen = list.findIndex((option) => option.value === current);
  useReportFilter(props.name, current);
  return (
    <div
      className="openui-dashboard-chips"
      role="radiogroup"
      aria-label={props.label ?? list.map((option) => option.label ?? option.value).join(", ")}
      onKeyDown={(event) => !props.streaming && radioKeys(event, list, current, props.onChange)}
    >
      {/* Labelled like the dropdowns: a muted "Label:" ahead of the value. */}
      {props.label ? (
        <span className="openui-dashboard-select-prefix" aria-hidden>
          {props.label}:
        </span>
      ) : null}
      {list.map((option, i) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          className="openui-dashboard-chip"
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
