"use client";
import { useState } from "react";
import { RANGE, dayLabel, formatRange, presetRange } from "../dateRange";
import { Check, menuNav } from "../OptionList";
import type { Option } from "../options";
import { RangeCalendar } from "../RangeCalendar";
/** Presets on the left; the calendar shows the current range and takes a custom one. */
export function RangePanel({
  current,
  presets,
  today,
  onApply,
}: {
  current: string;
  presets: Option[];
  today: string;
  onApply: (value: string) => void;
}) {
  const custom = RANGE.exec(current);
  const initial = custom
    ? ([custom[1], custom[2]] as [string, string])
    : presetRange(current, today);
  const [from, setFrom] = useState<string | null>(initial?.[0] ?? null);
  const [to, setTo] = useState<string | null>(initial?.[1] ?? null);
  const pick = (day: string) => {
    if (!from || to || day < from) {
      setFrom(day);
      setTo(null);
    } else {
      setTo(day);
    }
  };
  const draft = from && to ? `${from}..${to}` : null;
  const readout =
    from && to
      ? formatRange(`${from}..${to}`)
      : from
        ? `${dayLabel(from, true)} – pick an end date`
        : "Pick a start date";
  const unchanged =
    draft === current || (!!initial && !custom && from === initial[0] && to === initial[1]);
  return (
    <div className="openui-dashboard-range">
      <div
        className="openui-dashboard-range-presets openui-dashboard-menu"
        role="listbox"
        aria-label="Presets"
        onKeyDown={menuNav}
      >
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            role="option"
            className="openui-dashboard-menu-item"
            aria-selected={preset.value === current}
            onClick={() => onApply(preset.value)}
          >
            {preset.label ?? preset.value}
            {preset.value === current ? <Check /> : null}
          </button>
        ))}
      </div>
      <div className="openui-dashboard-range-custom">
        <RangeCalendar from={from} to={to} today={today} onPick={pick} />
        <div className="openui-dashboard-range-foot">
          <span className="openui-dashboard-range-readout">{readout}</span>
          <button
            type="button"
            className="openui-dashboard-button-primary"
            disabled={!draft || unchanged}
            onClick={() => draft && onApply(draft)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
