import type { ScaleBand, ScalePoint } from "d3-scale";
import React from "react";

import type { XAxisTickVariant } from "../../../types";
import { AngledXAxis } from "./AngledXAxis";
import { XAxis } from "./XAxis";

type CartesianXAxisScale = ScalePoint<string> | ScaleBand<string>;

interface CartesianXAxisProps {
  /** 'scroll' → the full multi-line <XAxis>; 'fit' → the condensed <AngledXAxis>. */
  mode: "scroll" | "fit";
  scale: CartesianXAxisScale;
  classPrefix: string;
  tickVariant: XAxisTickVariant;
  /**
   * Width of one category group, for point-scale charts (area/line). Band-scale
   * charts (bar) omit it — <XAxis> derives the width from `bandwidth()` and
   * ignores this entirely, so leaving it undefined is a no-op there.
   */
  widthOfGroup?: number;
  labelHeight: number;
  labelInterval?: number;
  angle: number;
}

/**
 * The scroll-vs-fit x-axis switch shared by the cartesian line charts
 * (area / line / bar). `scroll` mode renders the full <XAxis> (multi-line
 * ticks, group width, label interval); `fit` mode renders the condensed
 * <AngledXAxis>. Area and line were byte-identical here; bar differs only by
 * omitting `widthOfGroup`. Heatmap's x-axis is deliberately different (its own
 * single-line variant, no angled branch) and is NOT routed through this.
 */
export const CartesianXAxis: React.FC<CartesianXAxisProps> = ({
  mode,
  scale,
  classPrefix,
  tickVariant,
  widthOfGroup,
  labelHeight,
  labelInterval,
  angle,
}) =>
  mode === "scroll" ? (
    <XAxis
      scale={scale}
      tickVariant={tickVariant}
      widthOfGroup={widthOfGroup}
      labelHeight={labelHeight}
      labelInterval={labelInterval}
      classPrefix={classPrefix}
    />
  ) : (
    <AngledXAxis scale={scale} angle={angle} classPrefix={classPrefix} />
  );
