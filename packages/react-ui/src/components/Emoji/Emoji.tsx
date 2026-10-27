import clsx from "clsx";

export interface EmojiProps {
  /** The emoji character(s), e.g. "🎉". */
  emoji: string;
  /** Accessible label; omit for a purely decorative emoji. */
  label?: string;
  className?: string;
}

/**
 * A single emoji sized to the text line like an Icon, so it can lead a
 * LeadingText or a Callout.
 */
export const Emoji = ({ emoji, label, className }: EmojiProps) => (
  <span
    className={clsx("openui-emoji", className)}
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  >
    {emoji}
  </span>
);
