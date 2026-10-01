import type { PointerEventHandler, ReactNode } from "react";
import { Texture } from "../texture";
import "./sidebar.css";

export type SidebarShellProps = {
  /** Pin the panel flush to the top, left and bottom of its positioned parent. */
  floating?: boolean;
  /** Lay a very faint printed-paper Texture over the carbon. */
  textured?: boolean;
  /** Narrow to the icon rail. */
  collapsed?: boolean;
  /** Slide in from the left once, on mount. */
  enter?: boolean;
  onPointerEnter?: PointerEventHandler<HTMLElement>;
  onPointerLeave?: PointerEventHandler<HTMLElement>;
  children: ReactNode;
};

/** The carbon panel: square edges, an angled bottom-right corner, no shadow. */
export function SidebarShell({
  floating = false,
  textured = false,
  collapsed = false,
  enter = false,
  onPointerEnter,
  onPointerLeave,
  children,
}: SidebarShellProps) {
  const className = ["f1-sidebar", floating && "f1-sidebar--floating", collapsed && "f1-sidebar--collapsed", enter && "f1-sidebar--enter"]
    .filter(Boolean)
    .join(" ");
  return (
    <aside className={className} aria-label="Main" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      {textured && <Texture opacity={0.12} />}
      {children}
    </aside>
  );
}
