import type { CSSProperties } from "react";
import type { ThemeTokens } from "../theme";

/**
 * Nested inspect rows must overwrite the same border longhands as the
 * standalone card. Mixing `borderWidth` / `borderTop` with `borderBottomWidth`
 * leaves a leftover box stroke in React (double border inside the group).
 */
export function nestedRowBox(t: ThemeTokens, last: boolean): CSSProperties {
  return {
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: last ? 0 : 1,
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: 0,
    boxShadow: "none",
    background: "transparent",
    padding: last ? "12px 12px 14px" : 12,
  };
}
