import type { ReactNode } from "react";
import "./sidebar.css";

export type SidebarSectionLabelProps = {
  label: string;
  /** Shown right after the label. */
  icon?: ReactNode;
  /** A control pushed to the far right, e.g. the new-chat pill. */
  action?: ReactNode;
  /** Makes the whole row clickable (mouse convenience; keyboard users reach the action button, whose click bubbles here). */
  onClick?: () => void;
};

/** Heads a group in the sidebar: italic Saira with an optional icon after it. */
export function SidebarSectionLabel({ label, icon, action, onClick }: SidebarSectionLabelProps) {
  return (
    <div
      className={onClick ? "f1-sidebar-section-label f1-sidebar-section-label--clickable" : "f1-sidebar-section-label"}
      onClick={onClick}
    >
      {label}
      {icon}
      {action && <span className="f1-sidebar-section-label__action">{action}</span>}
    </div>
  );
}
