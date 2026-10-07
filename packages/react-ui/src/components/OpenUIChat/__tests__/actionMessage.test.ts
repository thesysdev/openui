import { BuiltinActionType, parseMessage } from "@openuidev/react-lang";
import { expect, it } from "vitest";
import { buildActionUserMessage } from "../utils/actionMessage";

const contextOf = (params: Record<string, unknown>, formState?: Record<string, unknown>) =>
  parseMessage(
    buildActionUserMessage({
      type: BuiltinActionType.ContinueConversation,
      humanFriendlyMessage: "Save",
      params,
      formState,
    }),
  ).context;

it("adds the @ToAssistant context as the third element, holding the form slot", () => {
  expect(contextOf({ context: 0 })).toEqual(["User clicked: Save", {}, 0]);
  expect(contextOf({}, { $a: 1 })).toEqual(["User clicked: Save", { $a: 1 }]);
});
