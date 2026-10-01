"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import "./sidebar.css";

export type SidebarNavProps = {
  /** Key of the active item; the slash slides whenever it changes. Null hides the slash. */
  active: string | null;
  children: ReactNode;
};

/**
 * Holds the nav items and one shared red slash that slides to whichever item is current.
 * The items' own static slash is turned off inside it.
 */
export function SidebarNav({ active, children }: SidebarNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const [slash, setSlash] = useState<{ y: number; h: number } | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const item = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    // Keep the last position while hidden, so it fades out in place and slides from there next time.
    if (item) setSlash({ y: item.offsetTop + 10, h: item.offsetHeight - 20 });
  }, [active]);

  // Place it once without motion, then let later moves animate.
  useLayoutEffect(() => {
    if (slash && !ready) requestAnimationFrame(() => setReady(true));
  }, [slash, ready]);

  return (
    <nav ref={navRef} className="f1-sidebar-nav f1-sidebar-nav--sliding">
      {slash && (
        <span
          aria-hidden
          className="f1-sidebar-nav__slash"
          data-ready={ready || undefined}
          data-hidden={active === null || undefined}
          style={{ height: slash.h, transform: `translateY(${slash.y}px) skewX(-12deg)` }}
        />
      )}
      {children}
    </nav>
  );
}
