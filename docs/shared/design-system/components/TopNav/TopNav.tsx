"use client";

import styles from "@design-system/styles/layout.module.css";
import type { NavItem } from "@design-system/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TopNavProps {
  items: NavItem[];
}

const isItemActive = (pathname: string, href: string): boolean => {
  if (href.endsWith("/foundation/colors")) {
    return pathname.includes("/foundation");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function TopNav({ items }: TopNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.topNav} aria-label="Primary navigation">
      {items.map((item) => {
        const active = isItemActive(pathname, item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`${styles.topNavLink}${active ? ` ${styles.topNavLinkActive}` : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
