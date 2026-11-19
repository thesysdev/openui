"use client";
import { useReportFilter } from "../../../shared/filterRegistry";
import { ScrollArea } from "../../shared/ScrollArea";
import { Check, menuNav } from "../OptionList";
import type { Option } from "../options";
import { Popover } from "../Popover";

/* ---------- SelectFilter: a dropdown for longer lists ---------- */

export interface SelectFilterProps {
  name: string;
  value?: string;
  onChange: (value: string) => void;
  streaming: boolean;
  options: Option[];
  label: string;
}

export function SelectFilter(props: SelectFilterProps) {
  const list = props.options;
  // The $variable's own value: with none, the button just names itself.
  const current = props.value ?? undefined;
  const currentLabel = list.find((option) => option.value === current)?.label ?? current;
  useReportFilter(props.name, current);
  return (
    <Popover
      width={200}
      active={list.length > 1 && current !== undefined && current !== list[0]?.value}
      disabled={props.streaming}
      label={
        current === undefined ? (
          props.label
        ) : (
          <>
            <span className="openui-dashboard-select-prefix">{props.label}:</span>
            {currentLabel}
          </>
        )
      }
    >
      {(close) => (
        <ScrollArea maxHeight={280} label="Scroll the options" watch={list.length}>
          <div
            className="openui-dashboard-menu"
            role="listbox"
            aria-label={props.label}
            onKeyDown={menuNav}
          >
            {list.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                className="openui-dashboard-menu-item"
                aria-selected={option.value === current}
                disabled={props.streaming}
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
        </ScrollArea>
      )}
    </Popover>
  );
}
