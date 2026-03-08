import type { HeadingLevel } from "@components/types";
import styles from "./PreviewLayout.module.css";

interface PreviewSectionHeaderProps {
  title?: string;
  description?: string;
  headingLevel?: HeadingLevel;
}

export default function PreviewSectionHeader({
  title,
  description,
  headingLevel = "h2",
}: PreviewSectionHeaderProps) {
  const HeadingTag = headingLevel as keyof React.JSX.IntrinsicElements;
  const sectionTitleClassName =
    headingLevel === "h1"
      ? `${styles.sectionTitle} ${styles.sectionTitlePage}`
      : `${styles.sectionTitle} ${styles.sectionTitleSection}`;

  if (!title && !description) return null;

  return (
    <div className={styles.sectionHeader}>
      {title ? <HeadingTag className={sectionTitleClassName}>{title}</HeadingTag> : null}
      {description ? <p className={styles.sectionDescription}>{description}</p> : null}
    </div>
  );
}
