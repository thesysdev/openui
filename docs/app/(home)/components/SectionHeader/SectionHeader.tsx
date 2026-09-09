import type { ReactElement, ReactNode } from "react";

import styles from "./SectionHeader.module.css";

export type SectionHeaderTone = "light" | "dark";

export interface SectionHeaderProps {
  /** h2 content. ReactNode so Cloud can pass the inline boxed-word span. */
  title: ReactNode;
  /**
   * Optional second line, rendered as <p class={styles.subtitle}>.
   * Used by FeatureGrid ("with 67% fewer tokens") and Cloud
   * ("Production-ready Generative UI").
   */
  subtitle?: ReactNode;
  /**
   * Optional small third line, rendered as <p class={styles.caption}>.
   * FeatureGrid only ("when compared to JSON-Render").
   */
  caption?: ReactNode;
  /**
   * light (default) | dark. dark = Cloud (white title /
   * rgba(255,255,255,0.45) subtitle with the same shared spacing).
   */
  tone?: SectionHeaderTone;
  /**
   * Forwarded to the <h2 id>. Reserved for future use (Compat); none of
   * the 4 in-scope consumers pass it this run.
   */
  titleId?: string;
  /**
   * CTA / stats / lead-description slot. Rendered verbatim AFTER caption,
   * with NO wrapper element, so each consumer's existing element stays a
   * DIRECT child of the section's own .header (preserving header flex gap /
   * margins).
   */
  children?: ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  caption,
  tone = "light",
  titleId,
  children,
}: SectionHeaderProps): ReactElement {
  const toneAttr = tone === "dark" ? "dark" : undefined;

  return (
    <>
      <h2 id={titleId} className={styles.title} data-tone={toneAttr}>
        {title}
      </h2>
      {subtitle != null && (
        <p className={styles.subtitle} data-tone={toneAttr}>
          {subtitle}
        </p>
      )}
      {caption != null && (
        <p className={styles.caption} data-tone={toneAttr}>
          {caption}
        </p>
      )}
      {children}
    </>
  );
}
