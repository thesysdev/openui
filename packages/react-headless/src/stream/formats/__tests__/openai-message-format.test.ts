import { describe, expect, it } from "vitest";
import { openAIMessageFormat } from "../openai-message-format";

describe("openAIMessageFormat stored assistant refusals", () => {
  it.each([
    [null, "I can't help with that.", "I can't help with that."],
    ["", "I can't help with that.", "I can't help with that."],
    ["Answer. ", "Refusal.", "Answer. Refusal."],
    ["Answer.", null, "Answer."],
    ["", null, ""],
    [null, null, undefined],
  ])("restores content %j and refusal %j as %j", (content, refusal, expected) => {
    const [message] = openAIMessageFormat.fromApi([{ role: "assistant", content, refusal }]);
    expect(message).toMatchObject({ role: "assistant" });
    expect(message?.content).toBe(expected);
    if (expected) {
      const [reloaded] = openAIMessageFormat.fromApi(openAIMessageFormat.toApi([message!]));
      expect(reloaded?.content).toBe(expected);
    }
  });
});
