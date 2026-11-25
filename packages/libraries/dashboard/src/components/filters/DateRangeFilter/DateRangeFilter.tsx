"use client";
import { formatRange, isoDay } from "../dateRange";
import type { Option } from "../options";
import { Popover } from "../Popover";
import { RangePanel } from "../RangePanel";

/* ---------- DateRangeFilter: presets plus a custom range ---------- */

const DEFAULT_PRESETS: Option[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
  { value: "ytd", label: "Year to date" },
];

const CalendarIcon = () => (
  <svg className="openui-dashboard-calendar" viewBox="0 0 14 14" aria-hidden>
    <rect
      x="1.75"
      y="2.75"
      width="10.5"
      height="9.5"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <path
      d="M1.75 5.75h10.5M4.75 1.5v2.5M9.25 1.5v2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

export interface DateRangeFilterProps {
  value?: string;
  onChange: (value: string) => void;
  streaming: boolean;
  label?: string;
  options: Option[];
}

export function DateRangeFilter(props: DateRangeFilterProps) {
  const presets = props.options.length ? props.options : DEFAULT_PRESETS;
  // The $variable's own value: with none, the button just names itself.
  const current = props.value ?? "";
  const today = isoDay(new Date());
  const text =
    presets.find((preset) => preset.value === current)?.label ?? formatRange(current) ?? current;
  return (
    <Popover
      width={432}
      disabled={props.streaming}
      label={
        <>
          <CalendarIcon />
          {!current ? (
            (props.label ?? "Date range")
          ) : (
            <>
              {props.label ? (
                <span className="openui-dashboard-select-prefix">{props.label}:</span>
              ) : null}
              {text}
            </>
          )}
        </>
      }
    >
      {(close) => (
        <RangePanel
          current={current}
          presets={presets}
          today={today}
          onApply={(value) => {
            props.onChange(value);
            close();
          }}
        />
      )}
    </Popover>
  );
}
