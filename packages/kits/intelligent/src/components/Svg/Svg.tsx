import type { ReactNode } from "react";
import { size, type Length } from "../../shared/style";

export interface SvgProps {
  /** "minX minY width height", e.g. "0 0 240 160". */
  viewBox: string;
  /** Without one, the drawing fills its column, up to 1.5x the viewBox (at least 280px). */
  width?: Length;
  height?: Length;
  /** SVG shapes. */
  children?: ReactNode;
}

const VIEW_BOX = /^\s*[-\d.]+(\s*[\s,]\s*[-\d.]+){3}\s*$/;

/** A drawing that scales to its width. */
export function Svg({ viewBox: viewBoxProp, width, height, children }: SvgProps) {
  const viewBox = typeof viewBoxProp === "string" && viewBoxProp.length < 20000 && VIEW_BOX.test(viewBoxProp) ? viewBoxProp : "0 0 100 100";
  // Without a width it fills the column, up to 1.5x the viewBox (at least 280px), so text stays in scale.
  const natural = Number(viewBox.trim().split(/[\s,]+/)[2]);
  const maxWidth = width == null && natural > 0 ? `${Math.max(280, natural * 1.5)}px` : undefined;
  return (
    <svg className="iui-svg" viewBox={viewBox} style={{ width: size(width) ?? "100%", maxWidth, height: size(height) }} role="img" preserveAspectRatio="xMidYMid meet">
      {children}
    </svg>
  );
}
