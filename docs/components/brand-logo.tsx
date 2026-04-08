"use client";

import mascotSvgPaths from "@/imports/svg-kl5jpwq8km";
import mascotDarkSvgPaths from "@/imports/svg-mascot-dark";
import svgPaths from "@/imports/svg-urruvoh2be";
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
  const color = isDark ? "white" : "black";
  const textClass = isDark
    ? "font-['Geist',sans-serif] font-semibold text-[15px] text-white leading-6"
    : "font-['Geist',sans-serif] font-semibold text-[15px] text-black leading-6";

  return (
    <Link href="/" className="flex items-center gap-0.5 no-underline">
      {/* Shiro mascot */}
      <div className="relative shrink-0 size-8">
        {isDark ? (
          <svg
            className="absolute block"
            style={{ inset: "0" }}
            fill="none"
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 33 32"
          >
            <path d={mascotDarkSvgPaths.pBody} fill="white" />
            <path
              d={mascotDarkSvgPaths.pOutline}
              fill="#464646"
              stroke="#464646"
              strokeWidth="0.3"
            />
            <path d={mascotDarkSvgPaths.pMouth} fill="#464646" />
            <path
              d={mascotDarkSvgPaths.pEarLeft}
              fill="#464646"
              stroke="#464646"
              strokeWidth="0.3"
            />
            <path
              d={mascotDarkSvgPaths.pEarRight}
              fill="#464646"
              stroke="#464646"
              strokeWidth="0.3"
            />
            <path d={mascotDarkSvgPaths.pEyeLeft} fill="#464646" />
            <path d={mascotDarkSvgPaths.pEyeRight} fill="#464646" />
            <path
              d={mascotDarkSvgPaths.pHornLeft}
              fill="#464646"
              stroke="#464646"
              strokeWidth="0.3"
            />
            <path
              d={mascotDarkSvgPaths.pHornRight}
              fill="#464646"
              stroke="#464646"
              strokeWidth="0.3"
            />
          </svg>
        ) : (
          <svg
            className="absolute block"
            style={{ inset: "9.29% 0 10% 0" }}
            fill="none"
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 32.6 26.43"
          >
            <path d={mascotSvgPaths.p30a6b580} fill={color} stroke={color} strokeWidth="0.3" />
            <path d={mascotSvgPaths.p3c631dc0} fill={color} />
            <path d={mascotSvgPaths.p310be380} fill={color} stroke={color} strokeWidth="0.3" />
            <path d={mascotSvgPaths.p41b57c8} fill={color} stroke={color} strokeWidth="0.3" />
            <path d={mascotSvgPaths.p13c7e180} fill={color} />
            <path d={mascotSvgPaths.p2ab36c00} fill={color} />
            <path d={mascotSvgPaths.p1c9f7d00} fill={color} stroke={color} strokeWidth="0.3" />
          </svg>
        )}
      </div>
      <span className={textClass}>OpenUI</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// GitHub Star Button
// ---------------------------------------------------------------------------

export function useGitHubStarCount(repo: string) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`https://api.github.com/repos/${repo}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`GitHub star count fetch failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const target: unknown = data.stargazers_count;
        if (typeof target !== "number") return;
        if (!cancelled) {
          const startCount = Math.max(target - 50, 0);
          const startTime = performance.now();

          setCount(startCount);

          const tick = () => {
            if (cancelled) return;

            const progress = Math.min((performance.now() - startTime) / COUNT_UP_DURATION, 1);
            const nextCount = Math.round(startCount + (target - startCount) * progress);
            setCount(nextCount);

            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          };

          requestAnimationFrame(tick);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [repo]);

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
  const starCount = useGitHubStarCount(repo);

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
