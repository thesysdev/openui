import { BuiltinActionType, parseMessage, type ActionEvent } from "@openuidev/react-lang";
import { expect, it, vi } from "vitest";
import { buildActionUserMessage, runChatAction } from "../utils/actionMessage";

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

it("sends continue_conversation itself and hands a custom action to onAction", () => {
  const send = vi.fn();
  const onAction = vi.fn();
  const event = (type: string): ActionEvent => ({ type, params: {}, humanFriendlyMessage: "Go" });
  runChatAction(event(BuiltinActionType.ContinueConversation), send, onAction);
  runChatAction(event("CopyToClipboard"), send, onAction);
  expect(send).toHaveBeenCalledTimes(1);
  expect(onAction.mock.calls.map(([e]) => e.type)).toEqual(["CopyToClipboard"]);
});

it("runChatAction opens http(s) @OpenUrl targets but never script schemes", () => {
  const open = vi.fn();
  vi.stubGlobal("window", { open });
  const openUrl = (url: string): ActionEvent => ({
    type: BuiltinActionType.OpenUrl,
    params: { url },
    humanFriendlyMessage: "",
  });
  runChatAction(openUrl("https://example.com/docs"), vi.fn());
  expect(open).toHaveBeenCalledWith("https://example.com/docs", "_blank", "noopener,noreferrer");
  open.mockClear();
  runChatAction(openUrl("javascript:alert(document.cookie)"), vi.fn());
  runChatAction(openUrl("java\tscript:alert(1)"), vi.fn());
  runChatAction(openUrl("data:text/html,<script>alert(1)</script>"), vi.fn());
  expect(open).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});
