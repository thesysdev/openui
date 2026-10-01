import type { ReactNode } from "react";
import "./sidebar.css";

export type SidebarNavItemProps = {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  onSelect?: () => void;
};

/** A top-level destination. Grey at rest, white on hover, white with a slanted red block when active. */
export function SidebarNavItem({ label, icon, active = false, onSelect }: SidebarNavItemProps) {
  return (
    <button
      type="button"
      className="f1-sidebar-nav-item"
      aria-current={active ? "page" : undefined}
      aria-label={label}
      onClick={onSelect}
    >
      {icon}
      <span className="f1-sidebar-nav-item__label">{label}</span>
    </button>
  );
}
