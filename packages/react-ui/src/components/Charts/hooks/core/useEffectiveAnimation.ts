import { usePrintContext } from "./usePrintContext";

/**
 * The single source of "should entrance animations run":
 * `isAnimationActive ∧ ¬printing`. Every chart entry folds its public prop
 * through this once and hands parts ONE pre-folded boolean — parts never see
 * isPrinting. This is also the seam where a future global entrance policy
 * (e.g. a reduced-motion gate, decision D-3) would live.
 */
export function useEffectiveAnimation(isAnimationActive: boolean): boolean {
  const isPrinting = usePrintContext();
  return isAnimationActive && !isPrinting;
}
