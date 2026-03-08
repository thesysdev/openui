"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
    <div className="bg-white rounded-[14px] lg:rounded-[18px] shrink-0 w-[240px] lg:w-[300px] relative">
      <div className="flex flex-col items-start overflow-hidden rounded-[inherit]">
        {img ? (
          <img
            src={img}
            alt={`${title} illustration`}
            className="w-full aspect-[5/4] rounded-t-[14px] lg:rounded-t-2xl object-cover"
            draggable={false}
          />
        ) : (
          <div className="bg-black/4 w-full aspect-[5/4] rounded-t-[14px] lg:rounded-t-2xl" />
        )}
        <div className="p-4 lg:p-6 w-full">
          <p className="font-['Inter',sans-serif] font-medium text-sm lg:font-['Inter_Display',sans-serif] lg:text-[22px] text-black leading-[1.4]">
            {title}
          </p>
        </div>
      </div>
      <div className="absolute inset-0 border border-black/8 rounded-[14px] lg:rounded-[18px] shadow-[0px_4px_8px_-4px_rgba(22,34,51,0.08),0px_16px_24px_0px_rgba(22,34,51,0.08)] pointer-events-none" />
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

  // ── Auto-scroll loop ──────────────────────────────────────────────────
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

  // ── Drag handlers ─────────────────────────────────────────────────────
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
    <div className="w-full">
      {/* Header */}
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
        <div className="mb-8">
          <h2 className="font-['Inter',sans-serif] font-semibold text-[22px] lg:text-[32px] text-black leading-[1.25] max-w-[673px]">
            Endless possibilities. Built in realtime.
          </h2>
        </div>
      </div>

      {/* Marquee track */}
      <div className="overflow-hidden py-8 -my-8">
        <div
          ref={scrollRef}
          className="flex gap-4 w-max pl-4 select-none"
          style={{ cursor: isDragging ? "grabbing" : "grab", willChange: "transform" }}
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
