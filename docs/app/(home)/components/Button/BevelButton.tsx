import type { ReactNode } from "react";
import styles from "./BevelButton.module.css";

/**
 * Beveled pill CTA with a circular badge. Shared by the home content sections
 * (View benchmarks, View Documentation, Talk to our team) so the button lives
 * in one place.
 *
 * Theme-independent variants: `light` (always white) sits on white sections,
 * `dark` (always black) on the black cloud band.
 * Theme-adaptive variants: `primary` is high-contrast/inverted (black on light
 * pages, white on dark pages); `secondary` matches the surface (light bevel on
 * light pages, dark bevel on dark pages).
 * On phones it becomes a full-width pill to match the hero CTAs.
 */
export function BevelButton({
  href,
  label,
  badge,
  variant = "light",
  external = false,
  className = "",
}: {
  href: string;
  label: string;
  badge: ReactNode;
  variant?: "light" | "dark" | "primary" | "secondary";
  external?: boolean;
  className?: string;
}) {
  const variantClass = {
    light: "",
    dark: styles.dark,
    primary: styles.primary,
    secondary: styles.secondary,
  }[variant];
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
