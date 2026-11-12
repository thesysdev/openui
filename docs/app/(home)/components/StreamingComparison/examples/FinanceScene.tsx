"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { FinanceBoard, useLoop } from "../../../dashboards/HeroScenes";
import styles from "./FinanceScene.module.css";

/* Drawn wider than the hero draws it, so it lands scaled down here. */
const SCENE_WIDTH = 1600;

/* The Finance board from the Dashboards page hero, the same component on
   the same clock, scaled to whatever width the comparison gives it. It
   mounts when its block streams in, so it builds itself from the start. */
export function FinanceScene() {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(820);
  const T = useLoop("finance", host);

  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={host}
      className={styles.frame}
      style={{ aspectRatio: `${SCENE_WIDTH} / ${height}` } as CSSProperties}
      aria-hidden="true"
    >
      <div ref={scene} className={styles.scene}>
        <FinanceBoard T={T} />
      </div>
    </div>
  );
}
