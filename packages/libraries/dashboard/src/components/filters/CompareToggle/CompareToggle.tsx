"use client";
import { useEffect } from "react";
import { useCompare } from "../../../shared/compare";
import { Check, menuNav } from "../OptionList";
import type { Option } from "../options";
import { Popover } from "../Popover";

/* ---------- CompareToggle: previous-period overlays ---------- */

const COMPARE_OFF = "off";

export interface CompareToggleProps {
  value?: string;
  onChange: (value: string) => void;
  streaming: boolean;
  label?: string;
  defaultOn?: boolean;
  options: Option[];
}

export function CompareToggle(props: CompareToggleProps) {
  const compare = useCompare();
  const given = props.options;
  const list = given.length
    ? given
    : [{ value: "previous", label: props.label || "Previous period" }];
  const stored = props.value;
  // Off (None) by default; defaultOn starts on the first choice. A choice
  // that no longer exists falls back to the first one.
  const current =
    stored === COMPARE_OFF || (stored === undefined && !props.defaultOn)
      ? COMPARE_OFF
      : (list.find((option) => option.value === stored) ?? list[0]!).value;
  const chosen = list.find((option) => option.value === current);
  const chosenLabel = chosen ? (chosen.label ?? chosen.value) : null;
  // While off, deltas still read against the "off" data, which is the first
  // comparison's — so they are named after it, never after a stale choice.
  const deltaLabel = chosenLabel ?? list[0]!.label ?? list[0]!.value;
  const { setLabel, setEnabled } = compare;
  useEffect(() => {
    setEnabled(current !== COMPARE_OFF);
    setLabel(deltaLabel);
  }, [current, deltaLabel, setEnabled, setLabel]);
  const choices = [{ value: COMPARE_OFF, label: "None" }, ...list];
  return (
    <Popover
      width={220}
      active={current !== COMPARE_OFF}
      disabled={props.streaming}
      label={
        // Nothing chosen: the button just names itself.
        chosenLabel ? (
          <>
            <span className="openui-dashboard-select-prefix">Compare:</span>
            {chosenLabel}
          </>
        ) : (
          "Compare"
        )
      }
    >
      {(close) => (
        <div
          className="openui-dashboard-menu"
          role="listbox"
          aria-label="Compare to"
          onKeyDown={menuNav}
        >
          {choices.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              className="openui-dashboard-menu-item"
              aria-selected={option.value === current}
              onClick={() => {
                props.onChange(option.value);
                close();
              }}
            >
              {option.label ?? option.value}
              {option.value === current ? <Check /> : null}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
