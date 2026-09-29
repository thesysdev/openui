// A dependency-free spring primitive: a scalar value that eases toward a target,
// retargetable any time, driven by one shared rAF loop. Internal — not part of the
// public API. Used to make hover interactions (crosshair, dots, …) glide instead of
// snap.

export { useIsomorphicLayoutEffect } from "../../../hooks/core/useIsomorphicLayoutEffect";
export {
  advanceVector,
  createDataMorph,
  morphAimMode,
  retargetVector,
  vectorAtRest,
} from "./dataMorph";
export type { DataMorph, VectorSpringState } from "./dataMorph";
export { FadeFollower } from "./FadeFollower";
export { springPresets } from "./presets";
export { advance, createSpring, isAtRest } from "./spring";
export type { Spring, SpringConfig, SpringState } from "./spring";
export { activeTickCount } from "./ticker";
export { useDataMorph } from "./useDataMorph";
export type { DataMorphAim } from "./useDataMorph";
export { useSeededAim } from "./useSeededAim";
export { useSpring } from "./useSpring";
export type { SpringHandle } from "./useSpring";
export { useTranslate } from "./useTranslate";
export type { TranslateHandle } from "./useTranslate";
