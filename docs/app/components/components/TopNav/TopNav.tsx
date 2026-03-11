"use client";

import styles from "@components/layout.module.css";
import type { NavItem } from "@components/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TopNavProps {
  items: NavItem[];
}

const isItemActive = (pathname: string, href: string): boolean => {
  if (href === "/components/foundation/colors") {
    return pathname.startsWith("/components/foundation");
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
