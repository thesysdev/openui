"use client";

import SideNav from "@components/components/SideNav";
import { FOUNDATION_NAV_ITEMS } from "@components/config/navigation";
import type { ReactNode } from "react";
import styles from "./layout.module.css";

interface FoundationLayoutProps {
  children: ReactNode;
}

export default function FoundationLayout({ children }: FoundationLayoutProps) {
  return (
    <div className={styles.foundationLayout}>
      <SideNav sections={FOUNDATION_NAV_ITEMS} />
      <div className={styles.foundationContent}>{children}</div>
    </div>
  );
}
