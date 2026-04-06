import mascotSvgPaths from "@/imports/svg-10waxq0xyc";
import { useId } from "react";
import styles from "./StackChip.module.css";

interface StackChipBase {
  name: string;
  badgeClassName?: string;
  isBlurred?: boolean;
}

interface ImageStackChip extends StackChipBase {
  iconKind: "image";
  slug?: string;
  localSrc?: string;
  iconColor: string;
}

interface VectorStackChip extends StackChipBase {
  iconKind: "vector";
  iconViewBox: string;
  iconPath: string;
  iconFill: string;
  clipId?: string;
  clipSize?: string;
}

interface MascotStackChip extends StackChipBase {
  iconKind: "mascot";
}

interface TextStackChip extends StackChipBase {
  iconKind: "text";
  iconText: string;
}

interface MoreStackChip extends StackChipBase {
  iconKind: "more";
}

export type StackChipItem =
  | ImageStackChip
  | VectorStackChip
  | MascotStackChip
  | TextStackChip
  | MoreStackChip;

function ChipIcon({ item }: { item: StackChipItem }) {
  const iconId = useId();

  switch (item.iconKind) {
    case "image": {
      const imgSrc = item.localSrc ?? `https://cdn.simpleicons.org/${item.slug}/${item.iconColor}`;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgSrc} alt="" width={16} height={16} className={styles.badgeImage} />
      );
    }
    case "vector": {
      const clipPathId = item.clipId ? `${item.clipId}-${iconId}` : undefined;

      return clipPathId ? (
        <svg className={styles.iconSvg} fill="none" viewBox={item.iconViewBox} aria-hidden="true">
          <g clipPath={`url(#${clipPathId})`}>
            <path d={item.iconPath} fill={item.iconFill} />
          </g>
          <defs>
            <clipPath id={clipPathId}>
              <rect fill="white" height={item.clipSize} width={item.clipSize} />
            </clipPath>
          </defs>
        </svg>
      ) : (
        <svg className={styles.iconSvg} fill="none" viewBox={item.iconViewBox} aria-hidden="true">
          <path d={item.iconPath} fill={item.iconFill} />
        </svg>
      );
    }
    case "mascot":
      return (
        <svg
          className={styles.mascotSvg}
          fill="none"
          viewBox="0 0 37.6937 30.558"
          aria-hidden="true"
        >
          <path
            d={mascotSvgPaths.p581fa00}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.346875"
          />
          <path d={mascotSvgPaths.p3ea20780} fill="currentColor" />
          <path
            d={mascotSvgPaths.pf52e280}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.346875"
          />
          <path
            d={mascotSvgPaths.pa685a00}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.346875"
          />
          <path d={mascotSvgPaths.p371d6000} fill="currentColor" />
          <path d={mascotSvgPaths.p1cace000} fill="currentColor" />
          <path
            d={mascotSvgPaths.p1d3dca00}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.346875"
          />
          <path
            d={mascotSvgPaths.p11103600}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.346875"
          />
        </svg>
      );
    case "text":
      return (
        <span className={styles.badgeText} aria-hidden="true">
          {item.iconText}
        </span>
      );
    case "more":
      return (
        <span className={styles.moreIcon} aria-hidden="true">
          +
        </span>
      );
  }
}

export function StackChip({ item }: { item: StackChipItem }) {
  const chipClassName = item.isBlurred ? `${styles.chip} ${styles.chipBlurred}` : styles.chip;

  return (
    <div className={chipClassName} aria-hidden={item.isBlurred || undefined}>
      <div className={`${styles.badge} ${item.badgeClassName ?? ""}`.trim()}>
        <ChipIcon item={item} />
      </div>
      <span className={styles.chipLabel}>{item.name}</span>
    </div>
  );
}

export { styles as stackChipStyles };
