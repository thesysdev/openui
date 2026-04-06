"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./PossibilitiesSection.module.css";

const listCardImg = "/images/home/0ea99cfd72e99c55c9511d4e0c3fbb08d37fbafd.png";
const chartsCardImg = "/images/home/9fbf5ad1316183d81279510b9fceb2bd1b538523.png";
const formsCardImg = "/images/home/8ae798233176b4d64e44605bb283d7a9886fed7a.png";
const cardsCardImg = "/images/home/f380a0bc9e6bc51606848a52165d0b85e68cdc94.png";
const tablesCardImg = "/images/home/6529ac618f10178dc5029ec6ecc15836aebf61d3.png";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CARD_TITLES = ["Charts", "Forms", "Cards", "Tables", "List"] as const;
const MARQUEE_COPIES = 3;
const SCROLL_SPEED = 0.5; // px per frame

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const IMAGE_MAP: Record<string, string> = {
  List: listCardImg,
  Charts: chartsCardImg,
  Forms: formsCardImg,
  Cards: cardsCardImg,
  Tables: tablesCardImg,
};

function Card({ title }: { title: string }) {
  const img = IMAGE_MAP[title];
  return (
    <div className={styles.card}>
      <div className={styles.cardInner}>
        {img ? (
          <img
            src={img}
            alt={`${title} illustration`}
            className={styles.cardImage}
            draggable={false}
          />
        ) : (
          <div className={styles.cardImagePlaceholder} />
        )}
        <div className={styles.cardBody}>
          <p className={styles.cardTitle}>{title}</p>
        </div>
      </div>
      <div className={styles.cardOverlay} />
    </div>
  );
}

// Pre-build the repeated card list so it's not re-created on every render
const MARQUEE_CARDS = Array.from({ length: MARQUEE_COPIES }, (_, copy) =>
  CARD_TITLES.map((title) => ({ title, key: `${title}-${copy}` })),
).flat();

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PossibilitiesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);
  const isPausedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);

  // Auto-scroll loop
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const singleSetWidth = () => el.scrollWidth / MARQUEE_COPIES;

    function tick() {
      if (!isPausedRef.current && !isDraggingRef.current) {
        offsetRef.current -= SCROLL_SPEED;
      }

      const totalWidth = singleSetWidth();
      if (totalWidth > 0) {
        // Seamless wrap in both directions
        if (offsetRef.current < -totalWidth) offsetRef.current += totalWidth;
        if (offsetRef.current > 0) offsetRef.current -= totalWidth;
      }

      el!.style.transform = `translateX(${offsetRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    offsetRef.current = dragStartOffsetRef.current + (e.clientX - dragStartXRef.current);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!isDraggingRef.current || !el) return;

    el.releasePointerCapture(e.pointerId);
    isDraggingRef.current = false;
    setIsDragging(false);

    // Normalize offset for seamless loop
    const totalWidth = el.scrollWidth / MARQUEE_COPIES;
    if (totalWidth > 0) {
      while (offsetRef.current > 0) offsetRef.current -= totalWidth;
      while (offsetRef.current < -totalWidth) offsetRef.current += totalWidth;
    }
  }, []);

  const pauseScroll = useCallback(() => {
    isPausedRef.current = true;
  }, []);
  const resumeScroll = useCallback(() => {
    isPausedRef.current = false;
  }, []);

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.headerContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Endless possibilities. Built in realtime.</h2>
        </div>
      </div>

      {/* Marquee track */}
      <div className={styles.trackViewport}>
        <div
          ref={scrollRef}
          className={`${styles.track} ${isDragging ? styles.trackDragging : styles.trackIdle}`}
          onMouseEnter={pauseScroll}
          onMouseLeave={resumeScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {MARQUEE_CARDS.map(({ title, key }) => (
            <Card key={key} title={title} />
          ))}
        </div>
      </div>
    </div>
  );
}
