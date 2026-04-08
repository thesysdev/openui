"use client";

import styles from "./FeatureList.module.css";

export interface FeatureListItem {
  title: string;
  description: string;
  iconPath: string;
}

interface FeatureListProps {
  items: FeatureListItem[];
}

function FeatureIcon({ path, index }: { path: string; index: number }) {
  const clipId = `clip_feat_${index}`;

  return (
    <div className={styles.featureIcon}>
      <svg className={styles.featureIconSvg} fill="none" viewBox="0 0 18 18">
        <g clipPath={`url(#${clipId})`}>
          <path d={path} fill="currentColor" />
        </g>
        <defs>
          <clipPath id={clipId}>
            <rect fill="white" height="18" width="18" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function DesktopFeatureRow({ item, index }: { item: FeatureListItem; index: number }) {
  return (
    <div className={styles.desktopRow}>
      <div className={styles.desktopRowLead}>
        <div>
          <FeatureIcon path={item.iconPath} index={index} />
        </div>
        <span className={styles.desktopTitle}>{item.title}</span>
      </div>
      <span className={styles.desktopDescription}>{item.description}</span>
    </div>
  );
}

function MobileFeatureRow({
  item,
  index,
  iconIndexOffset,
}: {
  item: FeatureListItem;
  index: number;
  iconIndexOffset: number;
}) {
  return (
    <div className={styles.mobileRow}>
      <div className={styles.mobileCopy}>
        <span className={styles.mobileTitle}>{item.title}</span>
        <span className={styles.mobileDescription}>{item.description}</span>
      </div>
      <div>
        <FeatureIcon path={item.iconPath} index={index + iconIndexOffset} />
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
            <DesktopFeatureRow item={item} index={index} />
            {index < lastItemIndex && <Divider className={styles.desktopDivider} />}
          </div>
        ))}
      </div>

      <div className={styles.mobileList}>
        {items.map((item, index) => (
          <div key={item.title}>
            <MobileFeatureRow item={item} index={index} iconIndexOffset={items.length} />
            {index < lastItemIndex && <Divider className={styles.mobileDivider} />}
          </div>
        ))}
      </div>
    </>
  );
}
