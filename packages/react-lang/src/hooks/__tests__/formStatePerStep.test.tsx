// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { mountProgram } from "./renderHelpers";

describe("form state is read when each step runs", () => {
  it("an earlier @Set in the same plan is visible in the event's form state", async () => {
    const p = mountProgram(
      [
        `root = Stack([b])`,
        `$x = 1`,
        `b = Btn("go", Action([@Set($x, 2), @ToAssistant("m")]))`,
      ].join("\n"),
    );
    await p.click("go");
    expect(p.events).toHaveLength(1);
    expect(p.events[0].formState).toMatchObject({ $x: 2 });
    p.unmount();
  });

  it("each event in a plan carries the state as of its own step", async () => {
    const p = mountProgram(
      [
        `root = Stack([b])`,
        `$x = 1`,
        `b = Btn("go", Action([@ToAssistant("first"), @Set($x, 2), @ToAssistant("second")]))`,
      ].join("\n"),
    );
    await p.click("go");
    expect(p.events.map((e) => (e.formState as Record<string, unknown>).$x)).toEqual([1, 2]);
    p.unmount();
  });
});
