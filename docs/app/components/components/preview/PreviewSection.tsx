import type { HeadingLevel } from "@components/types";
import type { ReactNode } from "react";
import styles from "./PreviewLayout.module.css";
import PreviewSectionHeader from "./PreviewSectionHeader";

interface PreviewSectionProps {
  id?: string;
  title: string;
  description?: string;
  headingLevel?: HeadingLevel;
  children?: ReactNode;
}

export default function PreviewSection({
  id,
  title,
  description,
  headingLevel = "h2",
  children,
}: PreviewSectionProps) {
  return (
    <section id={id} className={styles.section}>
      <PreviewSectionHeader title={title} description={description} headingLevel={headingLevel} />
      {children}
    </section>
  );
}
