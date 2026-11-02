"use client";

import type { ReactNode } from "react";
import { Svg as SvgView, useInSvg } from "../../components/Svg";

/**
 * A shape placed outside an Svg (straight in a Col, say) would be an unknown HTML element and draw
 * nothing. It draws in its own small drawing instead, on the 0 to 100 grid shapes usually use.
 */
export function Standalone({ children }: { children: ReactNode }) {
  return useInSvg() ? children : <SvgView viewBox="0 0 100 100" width={160}>{children}</SvgView>;
}
