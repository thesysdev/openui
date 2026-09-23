"use client";

import type { CSSProperties } from "react";
import { Dither, Shader, SineWave, SolidColor } from "shaders/react";

/* The "Faded Dither" preset from shaders.com, in two tones.
 *
 * Only the two output colours change between them. Dither paints colorB where
 * the wave's luminance clears the threshold and leaves the rest transparent, so
 * the SolidColor underneath shows through: the tone is that pair. Both keep the
 * same 18-step gap between base and stipple, so the texture reads equally
 * strongly either way, and both bases sit 14 steps from the ground behind them,
 * so neither fill is louder than the other.
 *
 * The dark base is neutral rather than the preset's #121217, whose blue channel
 * runs 5 above the others and shows as a cast.
 *
 * <Shader> renders a <canvas> with no size of its own, so it needs one from the
 * caller, usually inset:0 inside a positioned parent. It is WebGPU, so it must
 * not render on the server. Import it through FadedDither, which handles both
 * that and choosing the tone.
 */
/* The stages outline themselves in whichever base applies, through
   --ps-stage-stroke in ProductSection.module.css and the equivalent in
   CloudSection.module.css. Change a base here and change it there too. */
/* Desktop keeps the preset's wave. A phone shows so little of it that the same
   values read as one flat swell filling the stage, so phone-width screens get
   more cycles and a thinner line, not fewer and fatter. */
const WAVE = {
  wide: { frequency: 0.5, thickness: 0.4 },
  compact: { frequency: 1.8, thickness: 0.16 },
} as const;

const TONES = {
  dark: { base: "#0e0e0e", stipple: "#202020" },
  light: { base: "#f8f8f8", stipple: "#e6e6e6" },
} as const;

export function FadedDitherCanvas({
  tone = "dark",
  compact = false,
  className,
  style,
}: {
  tone?: keyof typeof TONES;
  /* Set when the viewport is phone width. */
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { base, stipple } = TONES[tone];
  const wave = WAVE[compact ? "compact" : "wide"];

  return (
    <Shader className={className} style={style}>
      <SolidColor color={base} />
      <Dither colorB={stipple} pattern="bayer8" threshold={0.41}>
        <SineWave
          angle={24}
          frequency={wave.frequency}
          position={{ x: 0.69, y: 0.7 }}
          softness={0.7}
          /* The preset ships 0.4. Three times that, still well under the
             component's -5..5 range. */
          speed={1.2}
          thickness={wave.thickness}
        />
      </Dither>
    </Shader>
  );
}
