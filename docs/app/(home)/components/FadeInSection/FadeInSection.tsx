"use client";

import type { ReactNode } from "react";
import styles from "./FadeInSection.module.css";

interface FadeInSectionProps {
  children: ReactNode;
  className?: string;
}

export function FadeInSection({ children, className = "" }: FadeInSectionProps) {
  return <div className={`${styles.root} ${className}`.trim()}>{children}</div>;
}
