import type { ReactNode } from "react";
import styles from "./BevelButton.module.css";

/**
 * Beveled pill CTA with a circular badge. Shared by the home content sections
 * (View benchmarks, View Documentation, Talk to our team) so the button lives
 * in one place.
 *
 * Three variants, each drawn for a light or a dark page: `primary` is black
 * and white, `secondary` a subtle fill of the page's own ink, and `tertiary`
 * no fill at all, just the hairline and the disc, for grey bands where a
 * fill would read as a second grey. On phones it becomes a full-width pill
 * to match the hero CTAs.
 */
export function BevelButton({
  href,
  label,
  badge,
  variant = "secondary",
  external = false,
  className = "",
}: {
  href: string;
  label: string;
  badge: ReactNode;
  variant?: "primary" | "secondary" | "tertiary";
  external?: boolean;
  className?: string;
}) {
  const variantClass = { primary: styles.primary, secondary: "", tertiary: styles.tertiary }[
    variant
  ];
  const classes = [styles.button, variantClass, className].filter(Boolean).join(" ");
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <a href={href} className={classes} {...externalProps}>
      <span className={styles.label}>{label}</span>
      <span className={styles.badge} aria-hidden="true">
        {badge}
      </span>
    </a>
  );
}
