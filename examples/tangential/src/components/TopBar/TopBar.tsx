"use client";

import { ArrowUpDown, Filter, Search } from "lucide-react";

const tabs = ["All Issues", "Active", "Backlog", "My Marketing Board"];

export const TopBar = () => {
  return (
    <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--panel)]/95 px-5 py-3 backdrop-blur">
      <div className="mb-3 flex items-center justify-between text-xs text-[var(--muted)]">
        <div className="flex items-center gap-2">
          <span>All Issues</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg bg-[var(--panel-2)] p-1">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              className={[
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                index === 0
                  ? "bg-[var(--hover)] text-white"
                  : "text-[var(--muted)] hover:text-white",
              ].join(" ")}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--panel-2)] px-2.5 py-1.5 text-xs text-[var(--muted)] hover:text-white"
          >
            <Filter className="size-3.5" />
            Filter
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--panel-2)] px-2.5 py-1.5 text-xs text-[var(--muted)] hover:text-white"
          >
            <ArrowUpDown className="size-3.5" />
            Sort
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--panel-2)] px-2.5 py-1.5 text-xs text-[var(--muted)] hover:text-white"
          >
            <Search className="size-3.5" />
            Search
          </button>
        </div>
      </div>
    </div>
  );
};
