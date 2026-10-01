import type { ReactNode } from "react";
import "./sidebar.css";

export type SidebarSectionLabelProps = {
  label: string;
  /** Shown right after the label. */
  icon?: ReactNode;
  /** A control pushed to the far right, e.g. the new-chat pill. */
  action?: ReactNode;
};

/** Heads a group in the sidebar: italic Saira with an optional icon after it. */
export function SidebarSectionLabel({ label, icon, action }: SidebarSectionLabelProps) {
  return (
    <div className="f1-sidebar-section-label">
      {label}
      {icon}
      {action && <span className="f1-sidebar-section-label__action">{action}</span>}
    </div>
  );
}
