import { PanelIcon } from "./sidebar-icons";
import "./sidebar.css";

export type SidebarCollapseButtonProps = {
  collapsed?: boolean;
  /** Overrides the default Collapse / Expand wording. */
  label?: string;
  onToggle?: () => void;
};

/** Collapses the sidebar to its icon rail, or expands it back. Grey at rest, white on hover. */
export function SidebarCollapseButton({ collapsed = false, label: override, onToggle }: SidebarCollapseButtonProps) {
  const label = override ?? (collapsed ? "Expand sidebar" : "Collapse sidebar");
  return (
    <button
      type="button"
      className="f1-sidebar-collapse"
      aria-label={label}
      aria-expanded={!collapsed}
      onClick={onToggle}
    >
      <PanelIcon />
    </button>
  );
}
