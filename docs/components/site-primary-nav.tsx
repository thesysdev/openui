"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./site-primary-nav.module.css";

export const PRIMARY_SITE_NAV_ITEMS = [
  { title: "Docs", href: "/docs", newTab: false },
  { title: "Playground", href: "/playground", newTab: false },
  { title: "Demo", href: "/demo/github", newTab: true },
  { title: "Blogs", href: "/blog", newTab: false },
  { title: "OpenClaw OS", href: "/openclaw-os", newTab: false, badge: "New" },
] as const;

export function SitePrimaryNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {PRIMARY_SITE_NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const badge = "badge" in item ? item.badge : undefined;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.link} ${isActive ? styles.linkActive : ""}`.trim()}
            {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {item.title}
            {badge && <span className={styles.badge}>{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
