import svgPaths from "@/imports/svg-urruvoh2be";
import styles from "./shared.module.css";

// ---------------------------------------------------------------------------
// Design tokens shared across multiple sections
// ---------------------------------------------------------------------------

export const BUTTON_SHADOW = "0px 1px 3px 0px rgba(22,34,51,0.08), 0px 12px 24px 0px rgba(22,34,51,0.04)";
export const CARD_SHADOW = "0px 1px 3px 0px rgba(22,34,51,0.08), 0px 12px 24px 0px rgba(22,34,51,0.04)";
export const COPY_FEEDBACK_MS = 3000;

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

/** Clipboard/copy icon used in CTA buttons across Hero, BuildChat, etc. */
export function CopyIcon({ color = "white" }: { color?: string }) {
  return (
    <svg className={styles.copyIcon} fill="none" viewBox="0 0 14.6667 14.6667">
      <path
        d={svgPaths.p102ea840}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.33333"
      />
    </svg>
  );
}

export function CheckIcon({ color = "white" }: { color?: string }) {
  return (
    <svg className={styles.copyIcon} fill="none" viewBox="0 0 14 14">
      <path
        d="M11.6667 3.5L5.25 9.91667L2.33334 7"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
