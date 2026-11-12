"use client";
import { useRef } from "react";
import { useReportFilter } from "../../../shared/filterRegistry";

/* ---------- SearchFilter: free-text search ---------- */

export interface SearchFilterProps {
  name: string;
  value?: string;
  onChange: (value: string) => void;
  streaming: boolean;
  placeholder?: string;
}

export function SearchFilter(props: SearchFilterProps) {
  const value = props.value ?? "";
  useReportFilter(props.name, value);
  const input = useRef<HTMLInputElement>(null);
  // At rest search is an icon button; focusing it (click or Tab) opens the
  // field, and it stays open while a query is applied. Escape on an empty
  // field closes it again.
  return (
    <div className="openui-dashboard-search" data-open={value ? "" : undefined}>
      <span className="openui-dashboard-search-icon" aria-hidden />
      <input
        ref={input}
        type="search"
        value={value}
        placeholder={props.placeholder ?? "Search"}
        aria-label={props.placeholder ?? "Search"}
        disabled={props.streaming}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !value) event.currentTarget.blur();
        }}
      />
      {/* The kit's own clear, the same in every browser; the native one is hidden. */}
      {value && !props.streaming ? (
        <button
          type="button"
          className="openui-dashboard-search-clear"
          aria-label="Clear search"
          onClick={() => {
            props.onChange("");
            input.current?.focus();
          }}
        >
          <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden>
            <path
              d="M2.5 2.5l5 5M7.5 2.5l-5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
