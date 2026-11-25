/** Style values the cloud components share. */

/** A typography token from react-ui's theme: its font, tracking and weight axis. */
export const typography = (token: string, variation: "regular" | "medium") => `
  font: var(--${token});
  letter-spacing: var(--${token}-letter-spacing);
  font-variation-settings: var(--openui-font-variation-${variation});
`;

/** The animate skill's curves: strong ease-out for UI, the iOS drawer curve for panels. */
export const easeOut = "cubic-bezier(0.23, 1, 0.32, 1)";
export const easeDrawer = "cubic-bezier(0.32, 0.72, 0, 1)";

/** Phones: the Sources dialog becomes a bottom sheet, and controls get 44px targets. */
export const phone = "(max-width: 639px)";
