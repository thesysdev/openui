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
  ImageStackChip | VectorStackChip | MascotStackChip | TextStackChip | MoreStackChip;

function ChipIcon({ item, plain = false }: { item: StackChipItem; plain?: boolean }) {
  const iconId = useId();

  switch (item.iconKind) {
    case "image": {
      // Plain chips drop the badge colour, so the mark carries the brand
      // colour itself (simpleicons' default when no colour is given).
      const imgSrc =
        item.localSrc ??
        (plain
          ? `https://cdn.simpleicons.org/${item.slug}`
          : `https://cdn.simpleicons.org/${item.slug}/${item.iconColor}`);
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgSrc} alt={item.name} width={16} height={16} className={styles.badgeImage} />
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.mascotSvg}
          src="/shiro-logo.svg"
          alt="OpenUI"
          aria-hidden="true"
          style={{ objectFit: "contain" }}
        />
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

export function StackChip({
  item,
  dense = false,
  iconOnly = false,
  plain = false,
}: {
  item: StackChipItem;
  dense?: boolean;
  iconOnly?: boolean;
  /* "fine" is for plain chips drawn at their small size (the compatibility
     clusters draw at 50px and scale down, which already thins their edge). */
  plain?: boolean | "fine";
}) {
  const chipClassName = [
    styles.chip,
    dense ? styles.chipDense : "",
    iconOnly ? styles.chipIconOnly : "",
    item.isBlurred ? styles.chipBlurred : "",
  ]
    .filter(Boolean)
    .join(" ");
  const badgeClassName = [
    styles.badge,
    item.badgeClassName ?? "",
    plain ? styles.badgePlain : "",
    plain === "fine" ? styles.badgePlainFine : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={chipClassName} aria-hidden={item.isBlurred || undefined}>
      <div className={badgeClassName}>
        <ChipIcon item={item} plain={Boolean(plain)} />
      </div>
      <span className={styles.chipLabel}>{item.name}</span>
    </div>
  );
}

export { styles as stackChipStyles };
