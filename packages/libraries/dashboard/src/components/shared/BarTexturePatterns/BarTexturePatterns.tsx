"use client";

import { seriesColor } from "../../../shared/chartHelpers";
import { TextureTile } from "../TextureTile/TextureTile";

export type BarTexturePatternsProps = {
  id: string;
  count: number;
  colors?: string[];
};

/** Per-series bar textures, cycling through TEXTURES as dark ink over the solid series fill. */
export function BarTexturePatterns({ id, count, colors }: BarTexturePatternsProps) {
  return (
    <>
      {Array.from({ length: colors?.length ?? count }, (_, i) => (
        <TextureTile
          key={i}
          id={`${id}-tex-${i}`}
          index={i}
          base={colors?.[i] ?? seriesColor(i)}
          ink="black"
          opacity="var(--openui-dashboard-bar-ink)"
        />
      ))}
    </>
  );
}
