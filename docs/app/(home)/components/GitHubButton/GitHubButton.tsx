"use client";

import { GitHubIcon, useGitHubStarCount } from "@/components/brand-logo";
import { GITHUB_STAR_FALLBACK } from "@/lib/github-stars";
import type { JSX, ReactNode } from "react";
import { PillLink } from "../Button/Button";
import styles from "./GitHubButton.module.css";

// ---------------------------------------------------------------------------
// Single source of truth for the duplicated GitHub-button logic
// ---------------------------------------------------------------------------

/** Default OpenUI repo URL — was duplicated as a GitHubBanner default. */
export const DEFAULT_GITHUB_REPO_URL = "https://github.com/thesysdev/openui";

/** Strip the `https://github.com/` prefix to get `owner/repo`. */
export function parseRepoFromUrl(href: string): string {
  return href.replace(/^https?:\/\/github\.com\//, "");
}

/**
 * Canonical animated star-count hook. Wraps brand-logo's `useGitHubStarCount`
 * (count-up via requestAnimationFrame) and folds in the repo-parse + fallback
 * that Hero duplicated in two places.
 */
export function useGitHubStars(hrefOrRepo: string, options?: { fallback?: number }): number {
  const repo = hrefOrRepo.includes("github.com/") ? parseRepoFromUrl(hrefOrRepo) : hrefOrRepo;
  const count = useGitHubStarCount(repo);
  return count ?? options?.fallback ?? GITHUB_STAR_FALLBACK;
}

/** Shared GitHub octicon mark (was inlined in the glow button and the TweetWall stats). */
export function GitHubMark({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// GitHubButton
// ---------------------------------------------------------------------------

export type GitHubButtonVariant = "desktopPill" | "desktopGlow" | "mobileBanner";

export interface GitHubButtonProps {
  /** Repo URL (default DEFAULT_GITHUB_REPO_URL). */
  href?: string;
  variant: GitHubButtonVariant;
  /**
   * desktopPill default "Star us on GitHub".
   * mobileBanner: present => show label; absent => count + "stars".
   * (desktopGlow ignores label.)
   */
  label?: string;
  /** Merged onto the root element so callers can pass their layout classes. */
  className?: string;
  /** Optional trailing arrow node; rendered after content by pill/banner. */
  arrow?: ReactNode;
  /** className bag for variants that reuse caller-owned (hero) classes. */
  classes?: { icon?: string; lead?: string; count?: string; stars?: string };
  /** desktopGlow only: render at the compact site-header height instead of the hero height. */
  compact?: boolean;
  /** desktopGlow only: keep the black pill appearance in dark mode (skip the white flip). */
  keepBlack?: boolean;
}

function cx(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ").trim();
}

export function GitHubButton({
  href = DEFAULT_GITHUB_REPO_URL,
  variant,
  label,
  className,
  arrow,
  classes,
  compact,
  keepBlack,
}: GitHubButtonProps): JSX.Element {
  if (variant === "desktopPill") {
    return <DesktopPillVariant href={href} label={label} className={className} arrow={arrow} classes={classes} />;
  }
  if (variant === "desktopGlow") {
    return <DesktopGlowVariant href={href} className={className} compact={compact} keepBlack={keepBlack} arrow={arrow} />;
  }
  return <MobileBannerVariant href={href} label={label} className={className} arrow={arrow} classes={classes} />;
}

// --- desktopPill (= HeroSection's DesktopGithubButton) ----------------------
function DesktopPillVariant({
  href,
  label = "Star us on GitHub",
  className,
  arrow,
  classes,
}: {
  href: string;
  label?: string;
  className?: string;
  arrow?: ReactNode;
  classes?: GitHubButtonProps["classes"];
}): JSX.Element {
  return (
    <PillLink href={href} external className={cx(className)} arrow={arrow}>
      <span aria-hidden="true" className={classes?.icon}>
        <GitHubIcon />
      </span>
      <span>{label}</span>
    </PillLink>
  );
}

// --- desktopGlow (= HeroSection's DesktopGithubStarButton) -------------------
function DesktopGlowVariant({
  href,
  className,
  compact,
  keepBlack,
  arrow,
}: {
  href: string;
  className?: string;
  compact?: boolean;
  keepBlack?: boolean;
  arrow?: ReactNode;
}): JSX.Element {
  const count = useGitHubStars(href);
  const label = String(count);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        styles.glowBtn,
        compact ? styles.glowBtnCompact : undefined,
        keepBlack ? styles.glowBtnKeepBlack : undefined,
        className,
      )}
      aria-label={`Star us on GitHub — ${label} stars`}
    >
      <GitHubMark className={styles.glowSvg} />
      <span className={styles.glowCount} aria-hidden="true">
        {label}
      </span>
      <span className={styles.glowStars} aria-hidden="true">
        stars
      </span>
      {arrow}
    </a>
  );
}

// --- mobileBanner (= HeroSection's GitHubBanner) ----------------------------
function MobileBannerVariant({
  href,
  label,
  className,
  arrow,
  classes,
}: {
  href: string;
  label?: string;
  className?: string;
  arrow?: ReactNode;
  classes?: GitHubButtonProps["classes"];
}): JSX.Element {
  const count = useGitHubStars(href);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cx(className)}>
      <span className={classes?.lead}>
        <span aria-hidden="true" className={classes?.icon}>
          <GitHubIcon />
        </span>
        <span className={classes?.count}>{count.toLocaleString()}</span>
        {/* No label (home) mirrors the desktop star button: count + "stars". */}
        {label ? <span>{label}</span> : <span className={classes?.stars}>stars</span>}
      </span>
      {arrow}
    </a>
  );
}
