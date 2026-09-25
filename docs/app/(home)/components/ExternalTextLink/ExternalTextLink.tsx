import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./ExternalTextLink.module.css";

export function ExternalTextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      className={[styles.link, className].filter(Boolean).join(" ")}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.label}>{children}</span>
      <ArrowUpRight className={styles.arrow} aria-hidden="true" size={14} strokeWidth={1.75} />
    </a>
  );
}
