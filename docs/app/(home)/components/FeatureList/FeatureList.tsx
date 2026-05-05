"use client";

import type { ReactNode } from "react";
import styles from "./FeatureList.module.css";

export interface FeatureListItem {
  title: string;
  description: string;
  icon: ReactNode;
}

interface FeatureListProps {
  items: FeatureListItem[];
}

function FeatureIcon({ icon }: { icon: ReactNode }) {
  return (
    <div className={styles.featureIcon}>
      <span className={styles.featureIconSvg}>{icon}</span>
    </div>
  );
}

function DesktopFeatureRow({ item }: { item: FeatureListItem }) {
  return (
    <div className={styles.desktopRow}>
      <div className={styles.desktopRowLead}>
        <div>
          <FeatureIcon icon={item.icon} />
        </div>
        <span className={styles.desktopTitle}>{item.title}</span>
      </div>
      <span className={styles.desktopDescription}>{item.description}</span>
    </div>
  );
}

function MobileFeatureRow({ item }: { item: FeatureListItem }) {
  return (
    <div className={styles.mobileRow}>
      <div className={styles.mobileCopy}>
        <span className={styles.mobileTitle}>{item.title}</span>
        <span className={styles.mobileDescription}>{item.description}</span>
      </div>
      <div>
        <FeatureIcon icon={item.icon} />
      </div>
    </div>
  );
}

function Divider({ className }: { className: string }) {
  return <div className={`${styles.divider} ${className}`.trim()} />;
}

export function FeatureList({ items }: FeatureListProps) {
  const lastItemIndex = items.length - 1;

  return (
    <>
      <div className={styles.desktopList}>
        {items.map((item, index) => (
          <div key={item.title}>
            <DesktopFeatureRow item={item} />
            {index < lastItemIndex && <Divider className={styles.desktopDivider} />}
          </div>
        ))}
      </div>

      <div className={styles.mobileList}>
        {items.map((item, index) => (
          <div key={item.title}>
            <MobileFeatureRow item={item} />
            {index < lastItemIndex && <Divider className={styles.mobileDivider} />}
          </div>
        ))}
      </div>
    </>
  );
}
