import { SidebarCollapseButton } from "./sidebar-collapse-button";
import { PanelIcon } from "./sidebar-icons";
import "./sidebar.css";

export type SidebarBrandProps = {
  collapsed?: boolean;
  /** Shows the collapse button on the far right, and makes the collapsed F1 expand the sidebar. */
  onToggleCollapsed?: () => void;
  /** Open only while hovered: the right-hand button then keeps it open instead of collapsing it. */
  peeking?: boolean;
};

/**
 * The header: "F1" in warm-white italic, with the collapse button on the right.
 * Collapsed, only F1 stays, in the same spot; hovering it swaps in the expand icon.
 */
export function SidebarBrand({ collapsed = false, onToggleCollapsed, peeking = false }: SidebarBrandProps) {
  const expandable = collapsed && onToggleCollapsed;
  const f1 = <span className="f1-sidebar-brand__f1">F1</span>;
  return (
    <div className="f1-sidebar-brand">
      {expandable ? (
        <button
          type="button"
          className="f1-sidebar-brand__mark f1-sidebar-brand__mark--expand"
          aria-label="Expand sidebar"
          aria-expanded={false}
          onClick={onToggleCollapsed}
        >
          {f1}
          <span className="f1-sidebar-brand__expand">
            <PanelIcon />
          </span>
        </button>
      ) : (
        <span className="f1-sidebar-brand__mark">{f1}</span>
      )}
      {/* Always mounted; CSS fades it out when collapsed so nothing pops. */}
      {onToggleCollapsed && (
        <SidebarCollapseButton collapsed={collapsed} label={peeking ? "Keep sidebar open" : undefined} onToggle={onToggleCollapsed} />
      )}
    </div>
  );
}
