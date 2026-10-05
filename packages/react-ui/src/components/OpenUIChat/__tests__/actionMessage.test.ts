import { BuiltinActionType } from "@openuidev/react-lang";
import { describe, expect, it } from "vitest";
import { separateContentAndContext } from "../../../utils/sentinelParser";
import { buildActionUserMessage } from "../utils/actionMessage";

const contextOf = (params: Record<string, unknown>, formState?: Record<string, unknown>) =>
  JSON.parse(
    separateContentAndContext(
      buildActionUserMessage({
        type: BuiltinActionType.ContinueConversation,
        humanFriendlyMessage: "Save",
        params,
        formState,
      }),
    ).contextString ?? "null",
  );

describe("buildActionUserMessage", () => {
  it("adds the @ToAssistant context as the third element, holding the form slot", () => {
    expect(contextOf({ context: { ticket: "T-42" } }, { $status: "closed" })).toEqual([
      "User clicked: Save",
      { $status: "closed" },
      { ticket: "T-42" },
    ]);
    expect(contextOf({ context: 0 })).toEqual(["User clicked: Save", {}, 0]);
  });

  it("is unchanged without a context", () => {
    expect(contextOf({}, { $a: 1 })).toEqual(["User clicked: Save", { $a: 1 }]);
    expect(contextOf({})).toEqual(["User clicked: Save"]);
  });
});
