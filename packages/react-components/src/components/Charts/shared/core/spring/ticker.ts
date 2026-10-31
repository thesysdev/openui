// One shared requestAnimationFrame loop for every active spring.
//
// A spring registers its tick fn when it starts moving; the loop removes it when
// the fn returns false (settled). So N springs share ONE rAF loop — a chart with
// 30 dots or 8 slices pays for one loop, not 30. The loop starts on first
// register and stops itself the moment nothing is active (no leaked loop).

export type TickFn = (dtSeconds: number) => boolean;

const active = new Set<TickFn>();
let rafId: number | null = null;
let lastTime = 0;

function frame(now: number) {
  const dt = lastTime === 0 ? 0 : (now - lastTime) / 1000;
  lastTime = now;

  // Snapshot so a tick that unregisters itself (or another) mid-iteration is safe.
  for (const tick of [...active]) {
    if (!tick(dt)) {
      active.delete(tick);
    }
  }

  if (active.size > 0) {
    rafId = requestAnimationFrame(frame);
  } else {
    rafId = null;
    lastTime = 0;
  }
}

export function registerTick(tick: TickFn): void {
  active.add(tick);
  if (rafId === null) {
    lastTime = 0;
    rafId = requestAnimationFrame(frame);
  }
}

export function unregisterTick(tick: TickFn): void {
  // Set.delete is a no-op if absent → unregister/stop is idempotent. The loop
  // notices the empty set on its next frame and halts itself.
  active.delete(tick);
}

/** Debug/verification only: number of active ticks (0 ⇒ the rAF loop is idle). */
export function activeTickCount(): number {
  return active.size;
}
