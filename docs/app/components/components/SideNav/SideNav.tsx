"use client";

import StarIcon from "@components/components/StarIcon";
import type { NavSection, NestedNavItem } from "@components/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SideNav.module.css";

interface SideNavProps {
  title?: string;
  sections: NavSection[];
}

const isActive = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

const isGroupedSection = (
  section: NavSection,
): section is NavSection & { items: NestedNavItem[] } =>
  Array.isArray((section as NavSection & { items?: NestedNavItem[] }).items);

const hasChildren = (item: NestedNavItem): boolean =>
  Array.isArray(item.items) && item.items.length > 0;

const isItemActive = (pathname: string, item: NestedNavItem): boolean => {
  const selfActive = item.href ? isActive(pathname, item.href) : false;
  if (!hasChildren(item)) {
    return selfActive;
  }

  return selfActive || (item.items ?? []).some((child) => isItemActive(pathname, child));
};

export default function SideNav({ title, sections }: SideNavProps) {
  const pathname = usePathname();
  const navLabel = title ? `${title} navigation` : "Side navigation";

  const renderNavItem = (item: NestedNavItem, depth = 0) => {
    const active = isItemActive(pathname, item);
    const nested = hasChildren(item);

    return (
      <li
        key={item.id}
        className={`${styles.item}${depth > 0 ? ` ${styles.nestedItem}` : ""}${
          nested ? ` ${styles.parentItem}` : ""
        }`}
      >
        {item.href ? (
          <Link
            href={item.href}
            className={`${styles.link}${depth > 0 ? ` ${styles.nestedLink}` : ""}${
              active ? ` ${styles.linkActive}` : ""
            }${nested ? ` ${styles.linkParent}` : ""}`}
            aria-current={active && !nested ? "page" : undefined}
          >
            <span>{item.label}</span>
            {(item.badgeText || item.isPro) && (
              <span className={styles.linkMeta}>
                {item.badgeText ? (
                  <span className={styles.alertBadge}>{item.badgeText}</span>
                ) : null}
                {item.isPro ? (
                  <StarIcon
                    className={styles.proIcon}
                    aria-label={`${item.label} is available in Pro`}
                    size={14}
                  />
                ) : null}
              </span>
            )}
          </Link>
        ) : (
          <p className={`${styles.linkLabel}${depth > 0 ? ` ${styles.nestedLink}` : ""}`}>
            {item.label}
          </p>
        )}
        {nested ? (
          <ul className={`${styles.groupList} ${styles.nestedList}`}>
            {(item.items ?? []).map((child) => renderNavItem(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <aside className={styles.sidePanel} aria-label={navLabel}>
      {title ? <p className={styles.title}>{title}</p> : null}
      <ul className={styles.list}>
        {sections.map((section) => {
          if (isGroupedSection(section)) {
            return (
              <li key={section.id} className={`${styles.item} ${styles.group}`}>
                {section.label ? <p className={styles.groupTitle}>{section.label}</p> : null}
                <ul className={styles.groupList}>
                  {(section as NavSection & { items: NestedNavItem[] }).items.map((item) =>
                    renderNavItem(item),
                  )}
                </ul>
              </li>
            );
          }

          return renderNavItem(section as NestedNavItem);
        })}
      </ul>
    </aside>
  );
}
