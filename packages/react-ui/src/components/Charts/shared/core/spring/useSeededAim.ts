import { useRef } from "react";
import { useIsomorphicLayoutEffect } from "../../../hooks/core/useIsomorphicLayoutEffect";

/**
 * The follower protocol shared by every always-mounted hover follower: while
 * `visible`, aim the spring(s) before paint — JUMP on the first show of a
 * hover session (so a newly-shown follower never glides in from stale
 * coordinates), GLIDE on every aim after that, and reset the session when
 * `visible` goes false. The consumer owns its spring(s); `aim(first)` decides
 * what jumping/gliding means (translate, arc-length, a band's x+width pair…).
 *
 * `aim` may return `false` to skip seeding — e.g. the target geometry isn't
 * ready yet — so a session that has never seeded still jumps on its first
 * successful aim. (It never UN-seeds: only `visible` going false resets.)
 *
 * Deliberate non-consumers (do not migrate them onto this): pie's `Slice`
 * (rest IS home — it never seeds) and `ChartTooltip` (mount-per-session;
 * its remount is the reset).
 */
export function useSeededAim(
  visible: boolean,
  deps: readonly unknown[],
  aim: (first: boolean) => boolean | void,
): void {
  const seeded = useRef(false);
  // Protocol hook: the consumer supplies its own dep list via `deps`.
  useIsomorphicLayoutEffect(() => {
    if (!visible) {
      seeded.current = false;
      return;
    }
    if (aim(!seeded.current) !== false) {
      seeded.current = true;
    }
  }, [visible, ...deps]);
}
