"use client";

import { captureCreateCliCommandCopied } from "@/lib/analytics";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ClipboardCommandButton, PillLink } from "../../components/Button/Button";
import { DEFAULT_GITHUB_REPO_URL, GitHubButton } from "../../components/GitHubButton/GitHubButton";
import { PLATFORMS } from "../../components/PlatformLogos";
import styles from "./HeroSection.module.css";

function capturePrimaryHeroCliCopy(command: string) {
  captureCreateCliCommandCopied(command, { source: "homepage_hero", interaction: "primary" });
}

function captureDropdownHeroCliCopy(command: string) {
  captureCreateCliCommandCopied(command, { source: "homepage_hero", interaction: "dropdown" });
}

export const heroStyles = styles;

// CTAs
const primaryCTA = "pnpx @openuidev/cli@latest create";
const secondaryCTA = "Try Playground";
const openclawOsHref = "/openclaw-os";

// Package-manager runners for the desktop install-command dropdown. The pill
// copies pnpm (pnpx) by default; hovering reveals the same command for bun,
// yarn, and npm. Order matches the menu (pnpm, bun, yarn, npm).
const COMMAND_RUNNERS = [
  { id: "pnpm", prefix: "pnpx" },
  { id: "bun", prefix: "bunx" },
  { id: "yarn", prefix: "yarn dlx" },
  { id: "npm", prefix: "npx" },
] as const;

type CommandVariant = { id: string; command: string; runner: string };

// Rewrites a runner command (`pnpx <spec>`, `npx <spec>`, ...) into one row per
// package-manager runner. Returns [] when no known runner prefix matches, so the
// dropdown only appears where it fits. `runner` is the prefix rendered in bold.
function commandVariants(command: string): CommandVariant[] {
  const runner = COMMAND_RUNNERS.find(({ prefix }) => command.startsWith(`${prefix} `));
  if (!runner) return [];
  const spec = command.slice(runner.prefix.length + 1);
  return COMMAND_RUNNERS.map(({ id, prefix }) => ({
    id,
    command: `${prefix} ${spec}`,
    runner: prefix,
  }));
}

const DESKTOP_HERO_IMAGE = {
  light: "/homepage/hero-web.webp",
  dark: "/homepage/hero-web-dark.webp",
  width: 768,
  height: 454,
} as const;
const MOBILE_HERO_IMAGE = {
  light: "/homepage/mobile-hero-light.webp",
  dark: "/homepage/mobile-hero-dark.webp",
  width: 333,
  height: 440,
} as const;

type HeroTheme = "light" | "dark";
// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

function TrailingArrow() {
  return (
    <ArrowRight aria-hidden="true" className={styles.mobileCtaArrow} size={18} strokeWidth={2} />
  );
}

const COPY_TOAST_MS = 1800;

export function NpmButton({ className = "", command }: { className?: string; command: string }) {
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyChange = (copied: boolean) => {
    if (!copied) return;
    setShowToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, COPY_TOAST_MS);
  };

  return (
    <div className={styles.npmButtonWrapper}>
      <ClipboardCommandButton
        command={command}
        onCopySuccess={capturePrimaryHeroCliCopy}
        className={`${styles.npmButton} ${className}`.trim()}
        iconContainerClassName={styles.npmIconBadge}
        copyIconColor="currentColor"
        onCopyChange={handleCopyChange}
      >
        <span className={styles.npmDesktopLabel}>{command}</span>
        <span className={styles.npmMobileLabel}>
          <span className={styles.npmTicker}>
            <span className={styles.npmTickerText}>{command}</span>
            <span aria-hidden="true" className={styles.npmTickerText}>
              {command}
            </span>
          </span>
        </span>
      </ClipboardCommandButton>
      <div
        className={`${styles.copyToast} ${showToast ? styles.copyToastVisible : ""}`.trim()}
        role="status"
        aria-live="polite"
      >
        Copied. Paste in your terminal to install.
      </div>
    </div>
  );
}

// A command pill that reveals a dropdown of package-manager variants on hover or
// focus. Clicking the trigger or any row copies that command and closes the
// menu. Fully isolated (`.command*` classes), so it affects no other button.
function CommandDropdownButton({
  command,
  variants,
}: {
  command: string;
  variants: CommandVariant[];
}) {
  const [open, setOpen] = useState(false);
  const runner =
    COMMAND_RUNNERS.find(({ prefix }) => command.startsWith(`${prefix} `))?.prefix ?? "";

  return (
    <div
      className={`${styles.commandDropdown} ${open ? styles.commandDropdownOpen : ""}`.trim()}
      // Hover-controlled only: copying can briefly move focus, so a focus/blur
      // close would shut the menu on click. Mouse-leave is the sole close.
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <ClipboardCommandButton
        command={command}
        onCopySuccess={capturePrimaryHeroCliCopy}
        className={styles.commandTrigger}
        iconContainerClassName={styles.commandTriggerBadge}
        copyIconColor="currentColor"
      >
        <span className={styles.commandTriggerLabel}>
          <span className={styles.commandTriggerRunner}>{runner}</span>
          {command.slice(runner.length)}
        </span>
      </ClipboardCommandButton>
      <div className={`${styles.commandMenu} ${open ? styles.commandMenuOpen : ""}`.trim()}>
        <div
          className={styles.commandMenuCard}
          role="menu"
          aria-label="Copy the install command for another package manager"
        >
          <div className={styles.commandMenuHighlight} aria-hidden="true" />
          {variants.map((variant) => (
            <ClipboardCommandButton
              key={variant.id}
              command={variant.command}
              onCopySuccess={captureDropdownHeroCliCopy}
              className={styles.commandMenuItem}
              iconContainerClassName={styles.commandMenuItemIcon}
              copyIconColor="currentColor"
            >
              <span className={styles.commandMenuItemLabel}>
                <span className={styles.commandMenuItemRunner}>{variant.runner}</span>
                {variant.command.slice(variant.runner.length)}
              </span>
            </ClipboardCommandButton>
          ))}
        </div>
      </div>
    </div>
  );
}

type CommandPlatform = "macos" | "linux" | "windows";

function CommandTabs({
  platform,
  setPlatform,
  secondaryCommand,
}: {
  platform: CommandPlatform;
  setPlatform: (value: CommandPlatform) => void;
  secondaryCommand?: string;
}) {
  if (!secondaryCommand) return null;

  return (
    <div className={styles.commandTabs} role="tablist" aria-label="Install platform">
      {PLATFORMS.map(({ id, label, Logo }) => {
        const isActive = platform === id;
        return (
          <button
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={label}
            title={label}
            className={`${styles.commandTab} ${isActive ? styles.commandTabActive : ""}`.trim()}
            onClick={() => setPlatform(id)}
            key={id}
          >
            <Logo className={styles.commandTabIcon} />
          </button>
        );
      })}
    </div>
  );
}

function DesktopPlaygroundButton({ className = "" }: { className?: string }) {
  return (
    <PillLink
      href="/demos"
      className={`${styles.desktopPlaygroundButton} ${className}`.trim()}
      arrow={<TrailingArrow />}
    >
      <span>{secondaryCTA}</span>
    </PillLink>
  );
}

function MobilePlaygroundButton({ className = "" }: { className?: string }) {
  return (
    <PillLink
      href="/demo/github"
      className={`${styles.mobilePlaygroundButton} ${className}`.trim()}
      arrow={<TrailingArrow />}
    >
      <span className={styles.mobilePlaygroundLabel}>Try Demo</span>
    </PillLink>
  );
}

export function DesktopGithubButton({
  href,
  label = "Star us on GitHub",
  className = "",
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <GitHubButton
      variant="desktopPill"
      href={href}
      label={label}
      className={`${styles.desktopPlaygroundButton} ${className}`.trim()}
      classes={{ icon: styles.heroBannerIcon }}
      arrow={<TrailingArrow />}
    />
  );
}

function DesktopGithubStarButton({ href }: { href: string }) {
  return <GitHubButton variant="desktopGlow" href={href} />;
}

export function GitHubBanner({
  href = DEFAULT_GITHUB_REPO_URL,
  label,
  className = "",
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <GitHubButton
      variant="mobileBanner"
      href={href}
      label={label}
      className={`${styles.heroBanner} ${styles.mobileGithubButton} ${className}`.trim()}
      classes={{
        lead: styles.heroBannerLead,
        icon: styles.heroBannerIcon,
        count: styles.mobileGithubCount,
        stars: styles.mobileGithubStars,
      }}
      arrow={<TrailingArrow />}
    />
  );
}

// ---------------------------------------------------------------------------
// Desktop hero
// ---------------------------------------------------------------------------

function DesktopHero({
  title,
  subtitle,
  command,
  commandLabel,
  secondaryCommand,
  secondaryCommandLabel,
  commandSlot,
  commandTrailing,
  compact,
  align,
  smallSubtitle,
  tightDesktopSpacing,
  splitLockup,
  flushInnerInlinePadding,
  showCommand,
  showPlaygroundButton,
  githubRepoUrl,
  githubButtonLabel,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  command: string;
  commandLabel?: string;
  secondaryCommand?: string;
  secondaryCommandLabel?: string;
  commandSlot?: ReactNode;
  /* Rendered beside the command button, inside its row. */
  commandTrailing?: ReactNode;
  compact: boolean;
  align: "center" | "left";
  smallSubtitle: boolean;
  tightDesktopSpacing: boolean;
  splitLockup: boolean;
  flushInnerInlinePadding: boolean;
  showCommand: boolean;
  showPlaygroundButton: boolean;
  githubRepoUrl?: string;
  githubButtonLabel?: string;
}) {
  // The shadow-room class compensates for the absent secondary CTA — only
  // applied when both the playground button AND the GitHub button are off.
  const hasSecondaryCta = showPlaygroundButton || !!githubRepoUrl;
  const isLeft = align === "left";

  return (
    <div
      className={`${styles.desktopHero} ${tightDesktopSpacing ? styles.desktopHeroTight : ""}`.trim()}
    >
      <div
        className={`${styles.desktopHeroInner} ${isLeft ? styles.desktopHeroInnerLeft : ""} ${
          flushInnerInlinePadding ? styles.desktopHeroInnerFlushInline : ""
        }`.trim()}
      >
        <div
          className={`${styles.desktopHeroLockup} ${
            isLeft ? styles.desktopHeroLockupLeft : ""
          } ${splitLockup ? styles.desktopHeroLockupSplit : ""}`.trim()}
        >
          <h1
            className={`${styles.desktopTitle} ${compact ? styles.desktopTitleCompact : ""} ${
              isLeft ? styles.desktopTitleLeft : ""
            }`.trim()}
          >
            {title}
          </h1>
          <p
            className={`${styles.desktopSubtitle} ${
              isLeft ? styles.desktopSubtitleLeft : ""
            } ${smallSubtitle ? styles.desktopSubtitleSmall : ""}`.trim()}
          >
            {subtitle}
          </p>
        </div>

        <div
          className={`${styles.desktopCtaStack} ${
            !hasSecondaryCta ? styles.desktopCtaStackShadowRoom : ""
          } ${isLeft ? styles.desktopCtaStackLeft : ""}`.trim()}
        >
          {isLeft && githubRepoUrl && <DesktopGithubStarButton href={githubRepoUrl} />}
          {showCommand && (
            <div className={styles.commandGroup}>
              {commandSlot ? (
                commandSlot
              ) : (
                <div className={styles.commandItem}>
                  {commandVariants(command).length > 0 ? (
                    <CommandDropdownButton command={command} variants={commandVariants(command)} />
                  ) : (
                    <NpmButton command={command} />
                  )}
                </div>
              )}
              {/* Sits inside the command group so it lines up with the command
                  rather than with the CTA stack around it. */}
              {commandTrailing}
            </div>
          )}
          {showPlaygroundButton && <DesktopPlaygroundButton />}
          {!isLeft && githubRepoUrl && (
            <DesktopGithubButton href={githubRepoUrl} label={githubButtonLabel} />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile hero
// ---------------------------------------------------------------------------

function MobileHero({
  theme,
  title,
  subtitle,
  command,
  commandLabel,
  secondaryCommand,
  secondaryCommandLabel,
  commandSlot,
  commandTrailing,
  compact,
  smallSubtitle,
  showCommand,
  showPlaygroundButton,
  showGitHubBanner,
  githubRepoUrl,
  mobileImageOverride,
  mobileImageOverrideDark,
  mobileImageAlt,
  mobileImageWidth,
  mobileImageHeight,
  mobileImageCropTopPercent = 0,
  mobilePreviewSlot,
  showPreview,
}: {
  theme: HeroTheme;
  title: ReactNode;
  subtitle: ReactNode;
  command: string;
  commandLabel?: string;
  secondaryCommand?: string;
  secondaryCommandLabel?: string;
  commandSlot?: ReactNode;
  /* Rendered beside the command button, inside its row. */
  commandTrailing?: ReactNode;
  compact: boolean;
  smallSubtitle: boolean;
  showCommand: boolean;
  showPlaygroundButton: boolean;
  showGitHubBanner: boolean;
  githubRepoUrl?: string;
  mobileImageOverride?: string;
  mobileImageOverrideDark?: string;
  mobileImageAlt?: string;
  mobileImageWidth?: number;
  mobileImageHeight?: number;
  mobileImageCropTopPercent?: number;
  mobilePreviewSlot?: ReactNode;
  showPreview: boolean;
}) {
  const [platform, setPlatform] = useState<CommandPlatform>("macos");
  const activeCommand = platform === "windows" && secondaryCommand ? secondaryCommand : command;
  const mobileHeroImage = mobileImageOverride
    ? theme === "dark"
      ? (mobileImageOverrideDark ?? mobileImageOverride)
      : mobileImageOverride
    : theme === "dark"
      ? MOBILE_HERO_IMAGE.dark
      : MOBILE_HERO_IMAGE.light;

  const naturalWidth = mobileImageWidth ?? MOBILE_HERO_IMAGE.width;
  const naturalHeight = mobileImageHeight ?? MOBILE_HERO_IMAGE.height;
  const cropTop = Math.max(0, Math.min(100, mobileImageCropTopPercent));
  const cropped = cropTop > 0;
  const viewportStyle = cropped
    ? { aspectRatio: `${naturalWidth} / ${naturalHeight * (1 - cropTop / 100)}` }
    : undefined;
  const imageStyle = cropped
    ? ({ height: "100%", objectFit: "cover", objectPosition: "bottom" } as const)
    : undefined;

  return (
    <div className={styles.mobileHero}>
      <div className={styles.mobileHeroIntro}>
        <div className={styles.mobileHeroStack}>
          <div className={styles.mobileBrandGroup}>
            <p
              className={`${styles.mobileTitle} ${
                compact || smallSubtitle ? styles.mobileTitleCompact : ""
              }`.trim()}
            >
              {title}
            </p>
          </div>

          {/* Subtitle */}
          <p
            className={`${styles.mobileSubtitle} ${
              smallSubtitle ? styles.mobileSubtitleSmall : ""
            }`.trim()}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* CTA buttons */}
      <div className={styles.mobileCtaStack}>
        {showGitHubBanner && (
          <GitHubBanner href={githubRepoUrl} className={styles.mobileCtaButtonWidth} />
        )}
        {showCommand && (
          <div className={styles.commandGroup}>
            {commandSlot ? (
              commandSlot
            ) : (
              <>
                <CommandTabs
                  platform={platform}
                  setPlatform={setPlatform}
                  secondaryCommand={secondaryCommand}
                />
                <div className={styles.commandItem}>
                  <NpmButton className={styles.mobileCtaButtonWidth} command={activeCommand} />
                </div>
              </>
            )}
            {commandTrailing}
          </div>
        )}
        {showPlaygroundButton && <MobilePlaygroundButton className={styles.mobileCtaButtonWidth} />}
      </div>

      {/* Mobile hero image */}
      {showPreview && (
        <div
          className={`${styles.mobileIllustrationViewport} ${
            mobileImageOverride ? styles.mobileIllustrationViewportFramed : ""
          } ${mobilePreviewSlot ? styles.mobileIllustrationViewportSlot : ""}`.trim()}
          style={viewportStyle}
        >
          {mobilePreviewSlot ?? (
            <img
              src={mobileHeroImage}
              alt={mobileImageAlt ?? "OpenUI mobile hero preview"}
              width={naturalWidth}
              height={naturalHeight}
              className={styles.mobileIllustrationImage}
              style={imageStyle}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop preview image
// ---------------------------------------------------------------------------

function PreviewImage({
  theme,
  desktopImageOverride,
  desktopImageOverrideDark,
  desktopImageAlt,
  desktopImageWidth,
  desktopImageHeight,
  widePreview,
  desktopPreviewSlot,
}: {
  theme: HeroTheme;
  desktopImageOverride?: string;
  desktopImageOverrideDark?: string;
  desktopImageAlt?: string;
  desktopImageWidth?: number;
  desktopImageHeight?: number;
  widePreview?: boolean;
  desktopPreviewSlot?: ReactNode;
}) {
  const desktopHeroImage = desktopImageOverride
    ? theme === "dark"
      ? (desktopImageOverrideDark ?? desktopImageOverride)
      : desktopImageOverride
    : theme === "dark"
      ? DESKTOP_HERO_IMAGE.dark
      : DESKTOP_HERO_IMAGE.light;

  return (
    <div
      className={`${styles.previewSection} ${widePreview ? styles.previewSectionTight : ""}`.trim()}
    >
      <div className={styles.previewDesktopOnly}>
        <div
          className={`${styles.previewFrame} ${widePreview ? styles.previewFrameWide : ""} ${
            desktopImageOverride ? styles.previewFrameCustom : ""
          } ${desktopPreviewSlot ? styles.previewFrameSlot : ""}`.trim()}
        >
          {desktopPreviewSlot ?? (
            <img
              src={desktopHeroImage}
              alt={desktopImageAlt ?? "OpenUI desktop hero preview"}
              width={desktopImageWidth ?? DESKTOP_HERO_IMAGE.width}
              height={desktopImageHeight ?? DESKTOP_HERO_IMAGE.height}
              className={styles.previewImage}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tagline
// ---------------------------------------------------------------------------

export function Tagline({ children, compact }: { children?: ReactNode; compact?: boolean }) {
  return (
    <div className={styles.taglineSection}>
      <div className={styles.taglineContainer}>
        <p className={`${styles.tagline} ${compact ? styles.taglineCompact : ""}`.trim()}>
          {children ?? (
            <>
              An open source toolkit to make your <br className={styles.taglineBreak} />
              AI agents respond with your UI.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function HeroSection({
  title = "OpenUI",
  subtitle = "The Open Standard for Generative UI",
  command = primaryCTA,
  commandLabel,
  secondaryCommand,
  secondaryCommandLabel,
  commandSlot,
  commandTrailing,
  compact = false,
  align = "center",
  smallSubtitle = false,
  tightDesktopSpacing,
  splitLockup = false,
  flushInnerInlinePadding = false,
  showCommand = true,
  showPlaygroundButton = true,
  desktopPreviewImage,
  desktopPreviewImageDark,
  desktopPreviewImageAlt,
  desktopPreviewImageWidth,
  desktopPreviewImageHeight,
  desktopPreviewSlot,
  widePreview = false,
  showPreview = true,
  showTagline = true,
  tagline,
  taglineCompact = false,
  showGitHubBanner = true,
  githubRepoUrl,
  githubButtonLabel,
  mobilePreviewImage,
  mobilePreviewImageDark,
  mobilePreviewImageAlt,
  mobilePreviewImageWidth,
  mobilePreviewImageHeight,
  mobilePreviewImageCropTopPercent,
  mobilePreviewSlot,
  desktopFromTablet = false,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  command?: string;
  commandLabel?: string;
  secondaryCommand?: string;
  secondaryCommandLabel?: string;
  /** Replaces the default command pill with a custom node (e.g. the OpenClaw split button). */
  commandSlot?: ReactNode;
  /* Rendered beside the command button, inside its row. */
  commandTrailing?: ReactNode;
  compact?: boolean;
  /** Horizontal alignment of the desktop hero content (default "center"). */
  align?: "center" | "left";
  /** Render the subtitle at a smaller size (sub-product pages like /openclaw-os). */
  smallSubtitle?: boolean;
  /** Tighten the desktop hero's top spacing independently of subtitle size. */
  tightDesktopSpacing?: boolean;
  /** Place the title and subtitle in two desktop columns. */
  splitLockup?: boolean;
  /** Remove horizontal padding from the desktop hero's inner container. */
  flushInnerInlinePadding?: boolean;
  /** Hide the primary command area on editorial or text-only pages. */
  showCommand?: boolean;
  showPlaygroundButton?: boolean;
  desktopPreviewImage?: string;
  /** Dark-theme variant of the desktop preview image (falls back to the light one). */
  desktopPreviewImageDark?: string;
  desktopPreviewImageAlt?: string;
  desktopPreviewImageWidth?: number;
  desktopPreviewImageHeight?: number;
  /** Replaces the desktop hero screenshot with custom preview content. */
  desktopPreviewSlot?: ReactNode;
  widePreview?: boolean;
  /** Hide the illustration for text-only pages, such as pricing. */
  showPreview?: boolean;
  showTagline?: boolean;
  tagline?: ReactNode;
  taglineCompact?: boolean;
  showGitHubBanner?: boolean;
  /** When set, adds a desktop GitHub PillLink CTA pointing here AND uses
   *  this URL for the mobile GitHub banner (instead of the default openui
   *  repo). Useful for sub-product pages like /openclaw-os. */
  githubRepoUrl?: string;
  /** Optional override for the desktop GitHub button label (default: "Star on GitHub"). */
  githubButtonLabel?: string;
  mobilePreviewImage?: string;
  /** Dark-theme variant of the mobile hero image (falls back to the light one). */
  mobilePreviewImageDark?: string;
  mobilePreviewImageAlt?: string;
  mobilePreviewImageWidth?: number;
  mobilePreviewImageHeight?: number;
  mobilePreviewImageCropTopPercent?: number;
  /** Replaces the mobile hero screenshot with custom preview content. */
  mobilePreviewSlot?: ReactNode;
  /** Keep the desktop hero composition through the intermediate tablet range. */
  desktopFromTablet?: boolean;
} = {}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme: HeroTheme = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const resolvedTightDesktopSpacing = tightDesktopSpacing ?? smallSubtitle;

  return (
    <section
      className={`${styles.section} ${desktopFromTablet ? styles.desktopFromTablet : ""}`.trim()}
    >
      <DesktopHero
        title={title}
        subtitle={subtitle}
        command={command}
        commandLabel={commandLabel}
        secondaryCommand={secondaryCommand}
        secondaryCommandLabel={secondaryCommandLabel}
        commandSlot={commandSlot}
        commandTrailing={commandTrailing}
        compact={compact}
        align={align}
        smallSubtitle={smallSubtitle}
        tightDesktopSpacing={resolvedTightDesktopSpacing}
        splitLockup={splitLockup}
        flushInnerInlinePadding={flushInnerInlinePadding}
        showCommand={showCommand}
        showPlaygroundButton={showPlaygroundButton}
        githubRepoUrl={githubRepoUrl}
        githubButtonLabel={githubButtonLabel}
      />
      <MobileHero
        theme={theme}
        title={title}
        subtitle={subtitle}
        command={command}
        commandLabel={commandLabel}
        secondaryCommand={secondaryCommand}
        secondaryCommandLabel={secondaryCommandLabel}
        commandSlot={commandSlot}
        commandTrailing={commandTrailing}
        compact={compact}
        smallSubtitle={smallSubtitle}
        showCommand={showCommand}
        showPlaygroundButton={showPlaygroundButton}
        showGitHubBanner={showGitHubBanner}
        githubRepoUrl={githubRepoUrl}
        mobileImageOverride={mobilePreviewImage}
        mobileImageOverrideDark={mobilePreviewImageDark}
        mobileImageAlt={mobilePreviewImageAlt}
        mobileImageWidth={mobilePreviewImageWidth}
        mobileImageHeight={mobilePreviewImageHeight}
        mobileImageCropTopPercent={mobilePreviewImageCropTopPercent}
        mobilePreviewSlot={mobilePreviewSlot}
        showPreview={showPreview}
      />
      {showPreview && (
        <PreviewImage
          theme={theme}
          desktopImageOverride={desktopPreviewImage}
          desktopImageOverrideDark={desktopPreviewImageDark}
          desktopImageAlt={desktopPreviewImageAlt}
          desktopImageWidth={desktopPreviewImageWidth}
          desktopImageHeight={desktopPreviewImageHeight}
          widePreview={widePreview}
          desktopPreviewSlot={desktopPreviewSlot}
        />
      )}
      {showTagline && <Tagline compact={taglineCompact}>{tagline}</Tagline>}
    </section>
  );
}
