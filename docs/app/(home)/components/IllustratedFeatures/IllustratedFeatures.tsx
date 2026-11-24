import type { ReactNode } from "react";
import { FadedDither } from "../FadedDither/FadedDither";
import styles from "./IllustratedFeatures.module.css";

/* The six-column grid the cards sit in: two "half" cards or three "third"
   cards make a row, and a "full" card takes one to itself. */
export function IllustratedFeatures({ children }: { children: ReactNode }) {
  return <div className={styles.features}>{children}</div>;
}

export function IllustratedFeature({
  span,
  shader = true,
  title,
  description,
  children,
}: {
  span: "half" | "full" | "third";
  /* false leaves the stage a flat fill in the shader's base tone */
  shader?: boolean;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className={styles.feature} data-span={span}>
      <div className={styles.stage} data-flat={shader ? undefined : true}>
        {shader && <FadedDither band="light" className={styles.stageShader} />}
        <div className={styles.stageArt}>{children}</div>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </article>
  );
}
