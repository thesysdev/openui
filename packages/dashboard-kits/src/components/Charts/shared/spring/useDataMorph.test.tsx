// @vitest-environment jsdom
import { useLayoutEffect, useRef } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { installDom, mount, runFrames } from "../../testDom";
import { createDataMorph } from "./dataMorph";
import { springPresets } from "./presets";
import { activeTickCount } from "./ticker";
import { useDataMorph } from "./useDataMorph";

beforeAll(() => installDom());

/** The charts' aim discipline: the first aim snaps, later data changes glide. */
function Morphing(props: { targets: number[]; animated: boolean; onUpdate: (v: number) => void }) {
  const aim = useDataMorph(springPresets.dataMorph, (values) => props.onUpdate(values[0]!));
  const mounted = useRef(false);
  useLayoutEffect(() => {
    const snap = !props.animated || !mounted.current;
    mounted.current = true;
    aim(props.targets, snap, props.animated);
  }, [props.targets, props.animated, aim]);
  return null;
}

describe("useDataMorph", () => {
  it("glides the FIRST data change after mount", () => {
    const seen: number[] = [];
    const onUpdate = (v: number) => seen.push(v);
    const view = mount(Morphing, { targets: [0], animated: true, onUpdate });
    runFrames();
    view.rerender({ targets: [100], animated: true, onUpdate });
    expect(activeTickCount()).toBe(1);
    const ran = runFrames();
    expect(ran).toBeGreaterThan(5);
    expect(activeTickCount()).toBe(0);
    // Passed through in-between values on the way, then landed on the target.
    expect(seen.some((v) => v > 0 && v < 100)).toBe(true);
    expect(seen.at(-1)).toBe(100);
    view.unmount();
  });

  it("creates no morph while animation is off", () => {
    const seen: number[] = [];
    const onUpdate = (v: number) => seen.push(v);
    const view = mount(Morphing, { targets: [0], animated: false, onUpdate });
    view.rerender({ targets: [100], animated: false, onUpdate });
    expect(runFrames()).toBe(0);
    expect(seen).toEqual([]);
    view.unmount();
  });
});

describe("createDataMorph", () => {
  it("settles a morph carrying NaN within a bounded number of frames", () => {
    const morph = createDataMorph(springPresets.dataMorph, () => {});
    morph.aim([10, Number.NaN, 20], true);
    morph.aim([60, Number.NaN, 80]);
    expect(activeTickCount()).toBe(1);
    expect(runFrames(500)).toBeLessThan(500);
    expect(activeTickCount()).toBe(0);
    // A gap opening mid-glide snaps open and still lets the loop stop.
    morph.aim([10, 5, 20]);
    morph.aim([60, Number.NaN, 80]);
    expect(runFrames(500)).toBeLessThan(500);
    expect(activeTickCount()).toBe(0);
    morph.stop();
  });
});
