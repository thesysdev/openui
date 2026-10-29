import type { CSSProperties } from "react";
import { z } from "zod/v4";
import { space } from "./style";

export const align = z.enum(["start", "center", "end", "stretch"]);

export const justify = z.enum(["start", "center", "end", "between"]);

export const FLEX: Record<string, string> = { start: "flex-start", end: "flex-end", center: "center", stretch: "stretch", between: "space-between" };

export type FlexProps = { gap?: number; align?: string; justify?: string; wrap?: boolean };

export const flexStyle = (p: FlexProps, column = false): CSSProperties => ({
  gap: space(p.gap),
  alignItems: p.align ? FLEX[p.align] : undefined,
  justifyContent: p.justify ? FLEX[p.justify] : undefined,
  flexWrap: p.wrap ? "wrap" : undefined,
  // A centered column centers its wrapped lines too.
  textAlign: column && (p.align === "center" || p.align === "end") ? p.align : undefined,
});
