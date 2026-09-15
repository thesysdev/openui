import { ACTION_STEPS, BuiltinActionType, type ActionPlan } from "@openuidev/react-lang";
import { describe, expect, it } from "vitest";
import { withItemContext } from "../cardActionUtils";

const itemContext = { itemIndex: 1, itemId: "b", itemTitle: "Beta", itemValue: undefined };

describe("withItemContext", () => {
  it("returns a ContinueConversation action carrying the item context when action is undefined", () => {
    expect(withItemContext(undefined, itemContext)).toEqual({
      type: BuiltinActionType.ContinueConversation,
      params: { itemIndex: 1, itemId: "b", itemTitle: "Beta" },
    });
  });

  it("merges legacy { type, params } with item context winning on clash", () => {
    const result = withItemContext(
      { type: "custom", params: { source: "cards", itemId: "stale" } },
      itemContext,
    );
    expect(result).toEqual({
      type: "custom",
      params: { source: "cards", itemIndex: 1, itemId: "b", itemTitle: "Beta" },
    });
  });

  it("defaults a legacy action without a type to ContinueConversation", () => {
    expect(withItemContext({ params: { a: 1 } }, { itemIndex: 0 })).toEqual({
      type: BuiltinActionType.ContinueConversation,
      params: { a: 1, itemIndex: 0 },
    });
  });

  it("lifts legacy open_url / continue_conversation shapes into params", () => {
    expect(withItemContext({ type: "open_url", url: "https://x.test" }, { itemIndex: 2 })).toEqual({
      type: "open_url",
      params: { url: "https://x.test", itemIndex: 2 },
    });
    expect(
      withItemContext({ type: "continue_conversation", context: "more" }, { itemIndex: 2 }),
    ).toEqual({
      type: "continue_conversation",
      params: { context: "more", itemIndex: 2 },
    });
  });

  it("appends item context to ToAssistant step context in an ActionPlan and leaves other steps untouched", () => {
    const plan = {
      steps: [
        { type: ACTION_STEPS.ToAssistant, message: "Tell me more", context: "cards" },
        { type: ACTION_STEPS.ToAssistant, message: "No context" },
        { type: ACTION_STEPS.Run, statementId: "fetch", refType: "query" },
        { type: ACTION_STEPS.OpenUrl, url: "https://x.test" },
      ],
    } as unknown as ActionPlan;

    const result = withItemContext(plan, itemContext) as ActionPlan;
    const serialized = 'Selected item: {"itemIndex":1,"itemId":"b","itemTitle":"Beta"}';

    expect(result).not.toBe(plan);
    expect(result.steps).toEqual([
      { type: ACTION_STEPS.ToAssistant, message: "Tell me more", context: `cards\n${serialized}` },
      { type: ACTION_STEPS.ToAssistant, message: "No context", context: serialized },
      { type: ACTION_STEPS.Run, statementId: "fetch", refType: "query" },
      { type: ACTION_STEPS.OpenUrl, url: "https://x.test" },
    ]);
    expect((plan.steps[0] as { context?: string }).context).toBe("cards");
  });

  it("returns the same ActionPlan when there is no item context", () => {
    const plan = { steps: [{ type: ACTION_STEPS.OpenUrl, url: "https://x.test" }] } as ActionPlan;
    expect(withItemContext(plan, { itemId: undefined })).toBe(plan);
  });
});
