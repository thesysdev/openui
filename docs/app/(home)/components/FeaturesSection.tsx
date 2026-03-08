"use client";

import svgPaths from "@/imports/svg-urruvoh2be";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { BUTTON_SHADOW } from "./shared";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Feature {
  title: string;
  description: string;
  iconPath: string;
}

const FEATURES: Feature[] = [
  {
    title: "Performance Optimized",
    description: "2.1x faster rendering than json-render",
    iconPath: svgPaths.p7658f00,
  },
  {
    title: "Token efficient",
    description: "52% lesser tokens than json-render",
    iconPath: svgPaths.p2a8ddd80,
  },
  {
    title: "Native Types",
    description: "Performant and memory safe",
    iconPath: svgPaths.p10e86100,
  },
  {
    title: "Works across platforms",
    description: "JS Runtime. Native support for iOS & Android coming soon",
    iconPath: svgPaths.p2cbb5d00,
  },
  {
    title: "Streaming Native",
    description: "Streaming and partial responses",
    iconPath: svgPaths.p33780400,
  },
  {
    title: "Interactive",
    description: "Handles inputs and interactive flows",
    iconPath: svgPaths.p17c7f700,
  },
  {
    title: "Safe by Default",
    description: "No arbitrary code execution",
    iconPath: svgPaths.p16eec200,
  },
];

const LAST_FEATURE_INDEX = FEATURES.length - 1;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FeatureIcon({ path, index }: { path: string; index: number }) {
  const clipId = `clip_feat_${index}`;
  return (
    <div className="bg-white size-9 rounded-full border border-black/10 flex items-center justify-center shrink-0">
      <svg className="size-[18px]" fill="none" viewBox="0 0 18 18">
        <g clipPath={`url(#${clipId})`}>
          <path d={path} fill="black" />
        </g>
        <defs>
          <clipPath id={clipId}>
            <rect fill="white" height="18" width="18" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

// Stagger timing: each row starts after the previous; within a row, icon → title → description
const ROW_STAGGER = 0.12; // seconds between rows
const ELEMENT_STAGGER = 0.14; // seconds between icon, title, description within a row
const FADE_DURATION = 0.55;

function DesktopFeatureRow({ feature, index }: { feature: Feature; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rowRef, { once: true, margin: "-100px 0px" });

  const baseDelay = index * ROW_STAGGER;
  const iconDelay = baseDelay;
  const titleDelay = baseDelay + ELEMENT_STAGGER;
  const descDelay = baseDelay + ELEMENT_STAGGER * 2;

  return (
    <div ref={rowRef} className="flex items-center justify-between h-[72px]">
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: FADE_DURATION, delay: iconDelay, ease: "easeOut" }}
        >
          <FeatureIcon path={feature.iconPath} index={index} />
        </motion.div>
        <motion.span
          className="font-['Inter_Display',sans-serif] text-[22px] text-black leading-[1.4]"
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: FADE_DURATION, delay: titleDelay, ease: "easeOut" }}
        >
          {feature.title}
        </motion.span>
      </div>
      <motion.span
        className="font-['Inter_Display',sans-serif] text-[22px] text-black/40 leading-[1.4] text-right"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: FADE_DURATION, delay: descDelay, ease: "easeOut" }}
      >
        {feature.description}
      </motion.span>
    </div>
  );
}

function MobileFeatureRow({ feature, index }: { feature: Feature; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rowRef, { once: true, margin: "-60px 0px" });

  const baseDelay = index * ROW_STAGGER;
  const titleDelay = baseDelay;
  const descDelay = baseDelay + ELEMENT_STAGGER;
  const iconDelay = baseDelay + ELEMENT_STAGGER * 2;

  return (
    <div ref={rowRef} className="flex items-center gap-1.5 py-4">
      <div className="flex flex-col gap-1 flex-1">
        <motion.span
          className="font-['Inter',sans-serif] font-medium text-base text-black leading-[1.25]"
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: FADE_DURATION, delay: titleDelay, ease: "easeOut" }}
        >
          {feature.title}
        </motion.span>
        <motion.span
          className="font-['Inter',sans-serif] text-base text-black/40 leading-[1.4]"
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: FADE_DURATION, delay: descDelay, ease: "easeOut" }}
        >
          {feature.description}
        </motion.span>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: FADE_DURATION, delay: iconDelay, ease: "easeOut" }}
      >
        <FeatureIcon path={feature.iconPath} index={index + FEATURES.length} />
      </motion.div>
    </div>
  );
}

function Divider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-px ${className}`}
      style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FeaturesSection() {
  const lastRowDesktopRef = useRef<HTMLDivElement>(null);
  const lastRowMobileRef = useRef<HTMLDivElement>(null);
  const lastRowDesktopInView = useInView(lastRowDesktopRef, { once: true, margin: "-100px 0px" });
  const lastRowMobileInView = useInView(lastRowMobileRef, { once: true, margin: "-60px 0px" });

  const lastRowInView = lastRowDesktopInView || lastRowMobileInView;

  // Button appears after the last row's elements finish animating
  const lastRowTotalDelay =
    (FEATURES.length - 1) * ROW_STAGGER + ELEMENT_STAGGER * 2 + FADE_DURATION;
  const buttonDelay = lastRowTotalDelay * 0.6; // overlap slightly so it feels connected

  return (
    <div className="w-full px-5 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Desktop */}
        <div className="hidden lg:block">
          {FEATURES.map((f, i) => (
            <div key={f.title} ref={i === LAST_FEATURE_INDEX ? lastRowDesktopRef : undefined}>
              <DesktopFeatureRow feature={f} index={i} />
              {i < LAST_FEATURE_INDEX && <Divider className="bg-black/10" />}
            </div>
          ))}
        </div>

        {/* Mobile */}
        <div className="lg:hidden">
          {FEATURES.map((f, i) => (
            <div key={f.title} ref={i === LAST_FEATURE_INDEX ? lastRowMobileRef : undefined}>
              <MobileFeatureRow feature={f} index={i} />
              {i < LAST_FEATURE_INDEX && <Divider className="bg-black/8" />}
            </div>
          ))}
        </div>

        {/* CTA button */}
        <Link href="/docs/openui-lang/benchmarks">
          <div className="flex justify-center mt-10 lg:mt-20">
            <motion.button
              className="bg-white text-black rounded-full h-12 px-4 font-['Inter',sans-serif] font-medium text-base lg:text-lg leading-6 border-[1.25px] border-black/8 w-full max-w-[280px] lg:max-w-none lg:w-auto transition-all duration-200 hover:scale-105 cursor-pointer"
              style={{ boxShadow: BUTTON_SHADOW }}
              initial={{ opacity: 0, y: 12 }}
              animate={lastRowInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: FADE_DURATION, delay: buttonDelay, ease: "easeOut" }}
            >
              <span className="lg:hidden">Detailed comparison</span>
              <span className="hidden lg:inline">View Comparison</span>
            </motion.button>
          </div>
        </Link>
      </div>
    </div>
  );
}
