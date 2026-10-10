import { BuiltinActionType } from "@openuidev/react-lang";
import { expect, it } from "vitest";
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

it("adds the @ToAssistant context as the third element, holding the form slot", () => {
  expect(contextOf({ context: 0 })).toEqual(["User clicked: Save", {}, 0]);
  expect(contextOf({}, { $a: 1 })).toEqual(["User clicked: Save", { $a: 1 }]);
});
