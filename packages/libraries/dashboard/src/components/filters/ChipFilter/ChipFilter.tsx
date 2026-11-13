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
  const current = props.value ?? list[0]?.value;
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
      {list.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          className="openui-dashboard-chip"
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
