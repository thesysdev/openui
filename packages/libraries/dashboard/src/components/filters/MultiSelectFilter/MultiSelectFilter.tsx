"use client";
import { useReportFilter } from "../../../shared/filterRegistry";
import { ScrollArea } from "../../shared/ScrollArea";
import type { Option } from "../options";
import { Popover } from "../Popover";

/* ---------- MultiSelectFilter: pick several values ---------- */

export interface MultiSelectFilterProps {
  name: string;
  value?: string[];
  onChange: (value: string[]) => void;
  streaming: boolean;
  label: string;
  options: Option[];
}

export function MultiSelectFilter(props: MultiSelectFilterProps) {
  const list = props.options;
  const stored = Array.isArray(props.value) ? props.value : [];
  const chosen = list.filter((option) => stored.includes(option.value));
  // One encoding of "All": the empty array. Every box shows ticked then, and
  // ticking the last remaining box writes [] again rather than the full list.
  const all = chosen.length === 0 || chosen.length === list.length;
  useReportFilter(props.name, all ? [] : chosen.map((option) => option.value));
  const isChecked = (value: string) => all || chosen.some((option) => option.value === value);
  const names = chosen.map((option) => option.label ?? option.value);
  // All, the one value by name, or a count once there are several.
  const summary = all ? (
    "All"
  ) : names.length === 1 ? (
    names[0]
  ) : (
    <span
      className="openui-dashboard-filter-count"
      aria-label={`${names.length} selected: ${names.join(", ")}`}
    >
      {names.length}
    </span>
  );
  const toggle = (value: string) => {
    const base = all ? list.map((option) => option.value) : chosen.map((option) => option.value);
    const next = base.includes(value) ? base.filter((item) => item !== value) : [...base, value];
    if (!next.length) return;
    props.onChange(next.length === list.length ? [] : next);
  };
  return (
    <Popover
      active={!all}
      disabled={props.streaming}
      label={
        <>
          <span className="openui-dashboard-select-prefix">{props.label}:</span>
          {summary}
        </>
      }
    >
      {() => (
        <div className="openui-dashboard-multi">
          <ScrollArea maxHeight={260} label="Scroll the options" watch={list.length}>
            <div className="openui-dashboard-multi-list">
              {list.map((option) => {
                const checked = isChecked(option.value);
                // At least one value stays chosen: the last ticked box can't be cleared.
                const last = !all && checked && chosen.length === 1;
                return (
                  <label
                    key={option.value}
                    className="openui-dashboard-multi-option"
                    data-locked={last ? "" : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={last}
                      onChange={() => toggle(option.value)}
                    />
                    <span className="openui-dashboard-checkbox" aria-hidden>
                      <svg viewBox="0 0 10 10" width="8" height="8">
                        <path
                          d="M2 5.2 4.1 7.2 8 3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    {option.label ?? option.value}
                  </label>
                );
              })}
            </div>
          </ScrollArea>
          <div className="openui-dashboard-multi-foot">
            <button type="button" disabled={all} onClick={() => props.onChange([])}>
              Select all
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}
