"use client";

export type SortToggleProps = { desc: boolean; onToggle: () => void };

/* ---------- Sort toggle ---------- */

/** The ranked-list sort control: one arrow that flips highest-first / lowest-first. */
export function SortToggle({ desc, onToggle }: SortToggleProps) {
  return (
    <button
      type="button"
      className="openui-dashboard-sort-toggle"
      data-asc={desc ? undefined : ""}
      aria-label={
        desc ? "Highest first. Switch to lowest first" : "Lowest first. Switch to highest first"
      }
      onClick={onToggle}
    >
      {/* A simple arrow: down for highest first, flipped up for lowest first. */}
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 5v14M7 14l5 5 5-5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
