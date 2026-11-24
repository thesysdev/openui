"use client";

import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { AnimatedLabel } from "./AnimatedLabel";
import { styles as artifactStyles, names } from "./cloudArtifact.styles";
import { pendingLoaderNames, pendingLoaderStyles as styles } from "./pendingLoader.styles";
import { startPendingLoader } from "./pendingLoaderEngine";

export interface PendingLoaderProps {
  /**
   * Text for the note. A new label drifts in. Without it, `Pending` shows the renderer's status,
   * as the preview card and the bar do, such as "Calling list orders…".
   */
  label?: string;
  /** The color the cards are tinted from, as any CSS color. Defaults to the text color. */
  color?: string;
  /** The cards' shapes: title bars, charts and numbers. Defaults to `color` at 8%. */
  shapeColor?: string;
  /** The cards' background. Defaults to `color` at 3%. */
  cardColor?: string;
  /** The cards' border. Defaults to `color` at 10%. */
  borderColor?: string;
  /**
   * Columns in the grid the cards sit on. With `rows`, it fixes the grid and so the drawing's
   * shape, which scales to fit. Without both, a portrait, square or landscape grid is picked to
   * suit the space. Rounded, from 2 to 24.
   */
  cols?: number;
  /** Rows in the grid the cards sit on. See `cols`. */
  rows?: number;
}

/** `Pending`'s default: skeleton dashboard cards that rearrange under a note. */
export function PendingLoader({
  label,
  color,
  shapeColor,
  cardColor,
  borderColor,
  cols,
  rows,
}: PendingLoaderProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    return startPendingLoader(
      stage,
      cols !== undefined && rows !== undefined ? { cols, rows } : undefined,
    );
  }, [cols, rows]);

  // Only the colors given: the others are mixed from `color` in CSS.
  const style = {
    "--openui-pending-color": color,
    "--openui-pending-shape": shapeColor,
    "--openui-pending-card": cardColor,
    "--openui-pending-border": borderColor,
  } as CSSProperties;

  return (
    <div className={clsx(styles.root, names.pending)} style={style} role="status">
      <span className={styles.srOnly}>{label ?? "Preparing…"}</span>
      <div
        ref={stageRef}
        className={clsx(styles.stage, pendingLoaderNames.stage)}
        aria-hidden="true"
      />
      <div className={styles.overlay} aria-hidden="true">
        <div className={clsx(styles.note, pendingLoaderNames.note)}>
          <LoaderCircle
            className={clsx(artifactStyles.spinner, names.spinner)}
            size={14}
            aria-hidden
          />
          <AnimatedLabel
            text={label ?? "Preparing…"}
            className={clsx(artifactStyles.shimmer, artifactStyles.loaderText, names.loaderText)}
          />
        </div>
      </div>
    </div>
  );
}
