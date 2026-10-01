import type { ReactNode } from "react";
import "./sidebar.css";

export type SidebarThreadStatus = "standby" | "on-air";

export type SidebarThreadItemProps = {
  title: string;
  /** Second line, e.g. when the chat last moved. */
  meta?: string;
  /** Replaces the date line in the same spot: STANDBY (grey) or ON AIR (red, blinking light), like the RadioInput's light. */
  status?: SidebarThreadStatus;
  /** Shown before the title. */
  icon?: ReactNode;
  active?: boolean;
  onSelect?: () => void;
};

/** One chat thread: an optional icon, a single-line title that truncates, and a small date or status line. */
export function SidebarThreadItem({ title, meta, status, icon, active = false, onSelect }: SidebarThreadItemProps) {
  return (
    <button
      type="button"
      className="f1-sidebar-thread"
      aria-current={active ? "true" : undefined}
      title={title}
      onClick={onSelect}
    >
      {icon}
      <span className="f1-sidebar-thread__text">
        <span className="f1-sidebar-thread__title">{title}</span>
        {(meta || status) && (
          // Date and status share one grid cell and cross-fade, so the row never changes height.
          <span className="f1-sidebar-thread__line" data-status={status}>
            <span className="f1-sidebar-thread__meta">{meta}</span>
            <span className="f1-sidebar-thread__status" aria-hidden={!status}>
              <span className="f1-sidebar-thread__light" />
              {status === "on-air" ? "On air" : "Standby"}
            </span>
          </span>
        )}
      </span>
    </button>
  );
}
