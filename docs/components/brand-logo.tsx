"use client";

import svgPaths from "@/imports/svg-urruvoh2be";
import { GITHUB_STAR_FALLBACK, type GitHubStarsResponse } from "@/lib/github-stars";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./brand-logo.module.css";

const COUNT_UP_DURATION = 1500;

const LOGO_SPRING = { type: "spring", stiffness: 400, damping: 15 } as const;
const LOGO_COLOR_TRANSITION = { duration: 0.25 } as const;
const GLOW_TRANSITION = { duration: 0.2 } as const;

export type LogoVariant = "light" | "dark";

function cx(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function ThesysLogo({
  isHovered,
  onHoverChange,
  variant = "light",
}: {
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  variant?: LogoVariant;
}) {
  const isDark = variant === "dark";

  const rectIdleColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.04)";
  const rectHoveredColor = isDark ? "#ffffff" : "#000000";
  const pathIdleColor = isDark ? "#ffffff" : "#000000";
  const pathHoveredColor = isDark ? "#000000" : "#ffffff";
  const glowClass = isDark
    ? "absolute -inset-1 rounded-lg bg-white/10"
    : "absolute -inset-1 rounded-lg bg-black/5";

  return (
    <a
      href="https://thesys.dev"
      target="_blank"
      rel="noopener noreferrer"
      className="relative shrink-0 size-6 cursor-pointer"
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <motion.svg
        className="absolute block size-full"
        fill="none"
        viewBox="0 0 24 24"
        animate={isHovered ? { scale: 1.15, rotate: 8 } : { scale: 1, rotate: 0 }}
        transition={LOGO_SPRING}
      >
        <motion.rect
          height="24"
          rx="4"
          width="24"
          animate={{ fill: isHovered ? rectHoveredColor : rectIdleColor }}
          transition={LOGO_COLOR_TRANSITION}
        />
        <motion.path
          d={svgPaths.p24ce2f00}
          animate={{ fill: isHovered ? pathHoveredColor : pathIdleColor }}
          transition={LOGO_COLOR_TRANSITION}
        />
      </motion.svg>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            className={glowClass}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={GLOW_TRANSITION}
          />
        )}
      </AnimatePresence>
    </a>
  );
}

export function OpenUILogo({ variant = "light" }: { variant?: LogoVariant }) {
  const isDark = variant === "dark";
  const textClass = isDark
    ? "font-['Geist',sans-serif] font-semibold text-[15px] text-white leading-6"
    : "font-['Geist',sans-serif] font-semibold text-[15px] text-black leading-6";

  return (
    <Link href="/" className="flex items-center gap-0.5 no-underline">
      {/* Shiro mascot */}
      <div className="relative shrink-0 size-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/shiro-logo.svg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 block size-full object-contain"
        />
      </div>
      <span className={textClass}>OpenUI</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// GitHub Star Button
// ---------------------------------------------------------------------------

// Module-level cache + in-flight dedup for OpenUI's star count. Every
// star button on the page (header, hero, tweet-wall stats) shares one request.
// The same-origin endpoint adds server/CDN caching so visitors do not spend
// GitHub's unauthenticated API allowance individually.
let starCountCache: number | null = null;
let starCountInflight: Promise<number | null> | null = null;

function fetchGitHubStarCount(): Promise<number | null> {
  if (starCountCache !== null) return Promise.resolve(starCountCache);

  if (!starCountInflight) {
    starCountInflight = fetch("/api/github-stars")
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub star count fetch failed: ${res.status}`);
        return res.json() as Promise<GitHubStarsResponse>;
      })
      .then((data): number | null => {
        const target = data.stars;
        if (typeof target !== "number" || !Number.isFinite(target) || target < 0) return null;
        starCountCache = target;
        return target;
      })
      .catch(() => null)
      .finally(() => {
        starCountInflight = null;
      });
  }
  return starCountInflight;
}

export function useGitHubStarCount() {
  const [count, setCount] = useState<number | null>(GITHUB_STAR_FALLBACK);

  useEffect(() => {
    let cancelled = false;

    void fetchGitHubStarCount().then((target) => {
      if (cancelled || target === null) return;
      const startCount = Math.max(target - 50, 0);
      const startTime = performance.now();

      setCount(startCount);

      const tick = () => {
        if (cancelled) return;
        const progress = Math.min((performance.now() - startTime) / COUNT_UP_DURATION, 1);
        setCount(Math.round(startCount + (target - startCount) * progress));
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}

export function GitHubIcon() {
  return (
    <div className={styles.githubIcon}>
      <div className={styles.githubIconInner}>
        <svg
          className="absolute block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 19.3333 18.8561"
        >
          <path d={svgPaths.p294daf00} fill="currentColor" stroke="currentColor" />
        </svg>
      </div>
    </div>
  );
}

export function StarCountBadge({
  count,
  isHighlighted,
}: {
  count: number | null;
  isHighlighted: boolean;
}) {
  return (
    <div className={cx(styles.starBadge, isHighlighted && styles.starBadgeHighlighted)}>
      <span
        className={cx(styles.starCount, isHighlighted && styles.starCountHighlighted)}
        aria-hidden={count === null}
      >
        <span
          className={cx(
            styles.starCountValue,
            count === null ? styles.starCountHidden : styles.starCountVisible,
          )}
        >
          {count ?? "0000"}
        </span>
      </span>
    </div>
  );
}

/**
 * Self-contained GitHub star button. Manages its own hover and star count state.
 * Pass `isScrolled` to suppress the drop shadow when the page has scrolled.
 */
export function GitHubStarButton({
  repo,
  isScrolled = false,
}: {
  repo: string;
  isScrolled?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const starCount = useGitHubStarCount();

  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.githubButton}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        aria-hidden="true"
        className={cx(
          styles.githubButtonOverlay,
          (isScrolled || isHovered) && styles.githubButtonOverlayFlat,
        )}
      />
      <GitHubIcon />
      <StarCountBadge count={starCount} isHighlighted={isHovered} />
    </a>
  );
}
